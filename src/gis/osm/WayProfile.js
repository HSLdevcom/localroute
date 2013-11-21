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

goog.provide('gis.osm.WayProfile');
goog.require('gis.Obj');

/** @constructor */
gis.osm.WayProfile=function() {
	/** @type {gis.osm.WayProfile.Type} */
	this.type;
	/** @type {number|null} */
	this.oneway;
	/** @type {number} */
	this.lanes;
	/** @type {number|null} */
	this.layer;
	/** @type {number|null} */
	this.tunnel;
	/** @type {number|null} */
	this.bridge;
	/** @type {number} */
	this.access;
	/** @type {number|null} */
	this.limit;
	/** @type {number|null} */
	this.lit;

	/** @type {number} */
	this.id;
	/** @type {number} Number of ways fitting this profile. */
	this.count;
};

/** @enum {number} */
gis.osm.WayProfile.Type={
	NONE:0,
	HIGHWAY:1,
	HIGHLINK:2,
	FASTCARS:3,
	SLOWCARS:4,
	PARKING:5,
	HOMEZONE:6,
	CARPATH:7,
	CYCLEWAY:8,
	FOOTWAY:9,
	PLATFORM:10,
	PATH:11,
	STAIRS:12,
	BUS:13,
	RAIL:14,
	AIR:15
};

/** @param {gis.io.PackStream} stream
  * @return {string} */
gis.osm.WayProfile.prototype.toKey=function(stream) {
	var key;
	var optList;
	var optNum,optCount;

	key=[0,this.type,this.lanes,this.access];
	optList=[this.oneway,this.layer,this.tunnel,this.bridge,this.limit,this.lit];
	optCount=optList.length;
	for(optNum=0;optNum<optCount;optNum++) {
		if(optList[optNum]!==null) key.push(optNum,gis.Q.fromSigned(optList[optNum]));
	}
	key[0]=(key.length-4)/2;

	return(stream.encodeShort(key));
};

/** @param {gis.io.PackStream} stream */
gis.osm.WayProfile.prototype.importPack=function(stream) {
	var optNum,optCount;
	var dec;
	var key,val;

	dec=/** @type {Array.<number>} */ ([]);
	stream.readShort(dec,1);
	optCount=dec[0]*2;

	stream.readShort(dec,optCount+3);
	this.type=dec[0];
	this.lanes=dec[1];
	this.access=dec[2];

	for(optNum=0;optNum<optCount;optNum+=2) {
		key=dec[optNum+3];
		val=gis.Q.toSigned(dec[optNum+4]);

		switch(key) {
			case 0:this.oneway=val;break;
			case 1:this.layer=val;break;
			case 2:this.tunnel=val;break;
			case 3:this.bridge=val;break;
			case 4:this.limit=val;break;
			case 5:this.lit=val;break;
			default:console.log('ERROR WayProfile.importPack');
		}
	}
};

/** @param {string} name
  * @return {boolean} */
gis.osm.WayProfile.prototype.getImportant=function(name) {
	return((name && this.access) ||
		this.type==gis.osm.WayProfile.Type.RAIL ||
		this.type==gis.osm.WayProfile.Type.PLATFORM);
};

/** @param {gis.osm.WayProfile} other
  * @return {boolean} */
gis.osm.WayProfile.prototype.matchLayer=function(other) {
	return(this.layer==other.layer && this.tunnel==other.tunnel && this.bridge==other.bridge);
};
