/*
	OSM Squeezer

	Copyright (c) "2013, by Aalto University, Finland;
	             Contributors: Juha Järvi <juha.jarvi@aalto.fi>;
	             Affiliation: Helsinki Institute for Information Technology HIIT;
	             Project: CultAR;
	             Task manager: Antti Nurminen <andy@iki.fi>;
	             URL: http://www.hiit.fi
	                  http://www.cultar.eu

	             The research leading to these results has received funding from the European Union
	             Seventh Framework Programme (FP7/2007-2013) under grant agreement no 601139"

	All rights reserved.

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met:

	1. Redistributions of source code must retain the above copyright notice, this
	   list of conditions and the following disclaimer.
	2. Redistributions in binary form must reproduce the above copyright notice,
	   this list of conditions and the following disclaimer in the documentation
	   and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
	ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
	WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
	ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
	SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

goog.provide('gis.osm.ProfileSet');
goog.require('gis.Obj');
goog.require('gis.osm.WayProfile');
goog.require('gis.osm.TagTable');

/** @constructor */
gis.osm.ProfileSet=function() {
	var t=gis.osm.WayProfile.Type;
	var roadTypes,railTypes,transTypes;
	var typeTagList;
	var tagList;
	var tagNum,tagCount;
	var typeListList;
	var typeListNum;
	var typeList;
	var typeNum,typeCount;
	var wayClassTbl;
	var wayTypeTbl;
	var accessCodeTbl;
	var accessTbl,limitTbl;
	var accessList;
	var accessNum,accessCount;
	var access;
	var pos;
	var flag;

	/** @type {Object.<string,gis.osm.WayProfile>} */
	this.wayProfileTbl={};
	/** @type {Array.<gis.osm.WayProfile>} */
	this.wayProfileList=[];
	/** @type {number} */
	this.wayProfileCount=0;

	roadTypes=[
		t.HIGHWAY, 'motorway trunk',
		t.HIGHLINK,'motorway_link trunk_link',
		t.FASTCARS,'primary primary_link',
		t.FASTCARS,'secondary secondary_link',
		t.SLOWCARS,'tertiary tertiary_link',
		t.BUS,     'bus_guideway',
		t.SLOWCARS,'residential unclassified road',
		t.CARPATH, 'service access track',
		t.HOMEZONE,'living_street pedestrian',
		t.CYCLEWAY,'cycleway',
		t.FOOTWAY, 'footway bus_stop platform',
		t.FOOTWAY, 'crossing',
		t.PATH,    'path bridleway',
		t.STAIRS,  'steps escalator',	// TODO: these should have different cost, walking on stairs is less fun.
		t.PARKING, 'services'
	];

	railTypes=[
		t.RAIL,    'rail light_rail narrow_gauge',
		t.RAIL,    'subway',
		t.RAIL,    'tram miniature',
//		t.TRANSIT, 'disused preserved dismantled abandoned',
		t.AIR,     'funicular monorail',
		t.PLATFORM,'platform'
	];

	transTypes=[
		t.PLATFORM,'platform'
	];

	accessCodeTbl={
		't':gis.osm.ProfileSet.access.TRANSIT,
		'c':gis.osm.ProfileSet.access.CAR,
		'b':gis.osm.ProfileSet.access.BIKE,
		'f':gis.osm.ProfileSet.access.FOOT,
		'w':gis.osm.ProfileSet.access.WHEEL
	};

	// Modes for transport allowed by default for each way type.
	// c=car, b=bike, f=foot, w=wheelchair. Capitals mean more suitable.
	accessList=/** @type {Array.<gis.osm.WayProfile.Type|string>} */ ([			// TODO: these should be integers on a scale 0-8.
		t.HIGHWAY, 'TC',
		t.HIGHLINK,'TC',
		t.FASTCARS,'TCb',	// TODO: it's possible to go on foot on roadside if no other way exists, so allow with high penalty.
		t.SLOWCARS,'TCBf',
		t.BUS,     'T',
		t.RAIL,    '',
		t.AIR,     '',
		t.CARPATH, 'tcBf',
		t.HOMEZONE,'tcBFW',
		t.CYCLEWAY,  'Bf',
		t.FOOTWAY,    'FW',
		t.PLATFORM,   'FW',
		t.PATH,      'BF',	// TODO: wheelchair is OK for certain surfaces (paved, asphalt, sett, concrete, concrete:lanes, concrete:plates, paving_stones:*, compacted, fine_gravel, tartan).
		t.STAIRS,     'F',	// TODO: stairs should have a penalty, especially for wheelchairs even if wheelchair=yes. Escalators have lower penalty and are oneway?
		t.PARKING ,'tcBfw'
    ]);

	wayClassTbl={};
	wayTypeTbl={};

	typeTagList=['highway','public_transport','railway'];
	typeListList=/** @type {Array.<Array.<gis.osm.WayProfile.Type|string>>} */ ([roadTypes,transTypes,railTypes]);
	for(typeListNum=0;typeListNum<typeListList.length;typeListNum++) {
		typeList=typeListList[typeListNum];
		typeCount=typeList.length;
		for(typeNum=0;typeNum<typeCount;typeNum+=2) {
			tagList=typeList[typeNum+1].split(' ');
			tagCount=tagList.length;
			for(tagNum=0;tagNum<tagCount;tagNum++) {
				wayClassTbl[tagList[tagNum]]=typeList[typeNum];
			}
			if(!wayTypeTbl[typeList[typeNum]]) wayTypeTbl[typeList[typeNum]]={key:typeTagList[typeListNum],val:tagList[0]};
		}
	}

	/** @type {Object.<string,gis.osm.WayProfile.Type>} For OSM import. */
	this.wayClassTbl=wayClassTbl;
	/** @type {Object.<gis.osm.WayProfile.Type,{key:string,val:string}>} For OSM export. */
	this.wayTypeTbl=wayTypeTbl;

	limitTbl={};
	accessTbl={};
	accessCount=accessList.length;
	for(accessNum=0;accessNum<accessCount;accessNum+=2) {
		access=accessList[accessNum+1];

		flag=0;
		for(pos=access.length;pos--;) flag|=accessCodeTbl[access.charAt(pos)];
		limitTbl[accessList[accessNum]]=flag;

		access=access.toLowerCase();

		flag=0;
		for(pos=access.length;pos--;) flag|=accessCodeTbl[access.charAt(pos)];
		accessTbl[accessList[accessNum]]=flag;
	}

	/** @type {Object.<gis.osm.WayProfile.Type,number>} */
	this.limitTbl=limitTbl;
	/** @type {Object.<gis.osm.WayProfile.Type,number>} */
	this.accessTbl=accessTbl;
};

gis.osm.ProfileSet.access={
	TRANSIT:1,
	CAR:2,
	BIKE:4,
	FOOT:8,
	WHEEL:16
};

/** @param {gis.osm.TagTable} tagTbl
  * @param {gis.io.PackStream} stream
  * @return {gis.osm.WayProfile} */
gis.osm.ProfileSet.prototype.insertWay=function(tagTbl,stream) {
	var t=gis.osm.WayProfile.Type;
	var profile,oldProfile;
	var key;
	var wayType;
	var access,limit;
	var accessFlag;

	wayType=null;
	// Abandoned railways may also be cycleways (highway tag more important) but railway platforms may be also tagged as footways (then railway is more important).
	wayType=this.wayClassTbl[tagTbl.getString('railway')];
	if(!wayType) wayType=this.wayClassTbl[tagTbl.getString('highway')];
	if(!wayType) wayType=this.wayClassTbl[tagTbl.getString('public_transport')];
	if(!wayType) return(null);

	if(tagTbl.getBool('disused',0,0) || tagTbl.getBool('abandoned',0,0)) return(null);

	profile=new gis.osm.WayProfile();
	profile.type=wayType;

	access=this.accessTbl[wayType];
	limit=this.limitTbl[wayType];

	profile.oneway=tagTbl.getBool('oneway',null,1);
	if(profile.oneway==gis.osm.TagTable.REVERSE) profile.oneway=-1;
	// TODO: handle oneway:bicycle=no, cycleway=opposite, cycleway:left=opposite_lane, psv=opposite_lane...

	// TODO: lane number guessing should be done after linking way chains.
	profile.lanes=tagTbl.getNum('lanes',null,null);
	if(profile.lanes===null || profile.lanes<0) {
		if(profile.oneway) profile.lanes=(wayType==t.HIGHWAY)?2:1;
		else profile.lanes=(wayType==t.HIGHWAY || wayType==t.HIGHLINK || wayType==t.FASTCARS || wayType==t.SLOWCARS)?2:1;
	}
	profile.layer=tagTbl.getNum('layer',null,null);
	if(profile.layer===null) profile.layer=tagTbl.getNum('level',null,null);

	profile.tunnel=tagTbl.getBool('tunnel',null,1);
	profile.bridge=tagTbl.getBool('bridge',null,1);
	if(profile.tunnel==gis.osm.TagTable.DENY || profile.bridge==gis.osm.TagTable.DENY) return(null);

	accessFlag=tagTbl.getBool('access',1,1);
	if(!accessFlag) access=0;

	/** @param {number} flag */
	/** @param {number} mask */
	function setAccess(flag,mask) {
		if(flag===0) access&=~mask;
		if(flag==0.5) limit|=mask;
		if(flag) access|=mask;
	}

	setAccess(tagTbl.getBool('car',null,1),gis.osm.ProfileSet.access.CAR);
	setAccess(tagTbl.getBool('bike',null,1),gis.osm.ProfileSet.access.BIKE);
	setAccess(tagTbl.getBool('foot',null,1),gis.osm.ProfileSet.access.FOOT);
	setAccess(tagTbl.getBool('wheelchair',null,1),gis.osm.ProfileSet.access.WHEEL);
	setAccess(tagTbl.getBool('bus',null,1),gis.osm.ProfileSet.access.TRANSIT);
	setAccess(tagTbl.getBool('psv',null,1),gis.osm.ProfileSet.access.TRANSIT);

	if(accessFlag==0.5) limit=access;

	profile.access=access;
	profile.limit=limit || null;

	profile.lit=tagTbl.getBool('lit',null,1);

	key=profile.toKey(stream);
	oldProfile=this.wayProfileTbl[key];
	if(!oldProfile) {
		this.wayProfileTbl[key]=profile;
		this.wayProfileList.push(profile);
	} else profile=oldProfile;

	return(profile);
};

/** Clear counts of how many ways use each profile. */
gis.osm.ProfileSet.prototype.clearCounts=function() {
	var profileList;
	var profileNum,profileCount;

	profileList=this.wayProfileList;
	profileCount=profileList.length;

	for(profileNum=0;profileNum<profileCount;profileNum++) {
		profileList[profileNum].count=0;
	}
};

/** Sort profiles by decreasing popularity. */
gis.osm.ProfileSet.prototype.sortProfiles=function() {
	var profileList;
	var profileNum,profileCount;

	profileList=this.wayProfileList;
	profileList.sort(function(a,b) {return(b.count-a.count);});
	profileCount=profileList.length;

	for(profileNum=0;profileNum<profileCount;profileNum++) {
		profileList[profileNum].id=profileNum;
	}
};

/** Get fuzzy match for profiles, return null if they don't combine.
  * @param {gis.osm.WayProfile} p
  * @param {gis.osm.WayProfile} q
  * @param {boolean} testOnly
  * @return {gis.osm.WayProfile|null} */
gis.osm.ProfileSet.prototype.matchWays=function(p,q,testOnly) {
	var testList;
	var testNum,testCount;
	var merged;
	var compromise;
	var pVal,qVal;
	var key;

	merged=null;
	compromise=false;

	// List of values requiring exact match.
	testList=[
		p.type,q.type,
		p.oneway,q.oneway,
		p.tunnel,q.tunnel,
		p.bridge,q.bridge,
		p.access,q.access,
		p.limit,q.limit
	];

	testCount=testList.length;
	for(testNum=0;testNum<testCount;testNum+=2) {
		if(testList[testNum]!=testList[testNum+1]) return(null);
	}

	// List of values allowing fuzzy match (one may be null).
	testList=/** @type {Array.<number>} */ ([
		p.lanes,q.lanes,
		p.layer,q.layer,
		p.lit,q.lit
	]);

	testCount=testList.length;
	for(testNum=0;testNum<testCount;testNum+=2) {
		pVal=testList[testNum];
		qVal=testList[testNum+1];

		if(pVal===null && qVal!==null) {
			if(!merged) merged=q;
			else if(merged==p) compromise=true;
		} else if(pVal!==null && qVal===null) {
			if(!merged) merged=p;
			else if(merged==q) compromise=true;
		} else if(pVal!=qVal) return(null);
	}

//console.log(compromise);
	if(!merged) merged=p;
	if(!compromise || testOnly) return(merged);

	// Neither profile had all combined values so create a new profile.
	merged=new gis.osm.WayProfile();
	merged.type=p.type;
	merged.oneway=p.oneway;
	merged.lanes=(p.lanes!==null)?p.lanes:q.lanes;
	merged.layer=(p.layer!==null)?p.layer:q.layer;
	merged.tunnel=p.tunnel;
	merged.bridge=p.bridge;
	merged.access=p.access;
	merged.limit=p.limit;
	merged.lit=(p.lit!==null)?p.lit:q.lit;

	// Check if new profile is equal to an existing one.
	key=merged.toKey(new gis.io.PackStream(null,null));
	p=this.wayProfileTbl[key];
	if(p) return(p);

	this.wayProfileTbl[key]=merged;
	this.wayProfileList.push(merged);
	return(merged);
};

/** @param {gis.io.PackStream} stream */
gis.osm.ProfileSet.prototype.exportPack=function(stream) {
	var profileList;
	var profileNum,profileCount;

	profileList=this.wayProfileList;
	profileCount=profileList.length;

	for(profileNum=0;profileNum<profileCount;profileNum++) {
		if(!profileList[profileNum].count) break;
	}

console.log('Last profile '+profileNum+' / '+profileCount);

	profileCount=profileNum;
	stream.writeLong([profileCount]);

	for(profileNum=0;profileNum<profileCount;profileNum++) {
		stream.writeRaw(profileList[profileNum].toKey(stream));
	}
};

/** @param {gis.io.PackStream} stream */
gis.osm.ProfileSet.prototype.importPack=function(stream) {
	var profileNum,profileCount;
	var profile;
	var dec;

	dec=/** @type {Array.<number>} */ ([]);
	stream.readLong(dec,1);
	profileCount=dec[0];
console.log(profileCount+' way profiles.');

	this.wayProfileCount=profileCount;

	for(profileNum=0;profileNum<profileCount;profileNum++) {
		profile=new gis.osm.WayProfile();
		profile.importPack(stream);

		this.wayProfileTbl[profile.toKey(stream)]=profile;
		this.wayProfileList.push(profile);
	}
};

/** @param {gis.osm.WayProfile} profile
  * @return {string} */
gis.osm.ProfileSet.prototype.exportOSM=function(profile) {
	var txt;

	txt='<tag k="'+this.wayTypeTbl[profile.type].key+'" v="'+this.wayTypeTbl[profile.type].val+'" />\n';
	if(profile.lanes) txt+='<tag k="lanes" v="'+profile.lanes+'" />\n';
	if(profile.oneway) txt+='<tag k="oneway" v="'+profile.oneway+'" />\n';
	if(profile.layer) txt+='<tag k="layer" v="'+profile.layer+'" />\n';
	if(profile.tunnel) txt+='<tag k="tunnel" v="yes" />\n';
	if(profile.bridge) txt+='<tag k="bridge" v="yes" />\n';
	if(profile.lit) txt+='<tag k="lit" v="yes" />\n';

	return(txt);
};
