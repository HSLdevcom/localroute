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

goog.provide('gis.osm.MetaSet');
goog.require('gis.Obj');
goog.require('gis.osm.Meta');
goog.require('gis.osm.TagTable');

/** @constructor */
gis.osm.MetaSet=function() {
	/** @type {Array.<gis.osm.Meta>} */
	this.list=[];
};

/** @param {gis.osm.TagTable} tagTbl
  * @return {gis.osm.Meta} */
gis.osm.MetaSet.prototype.parseNode=function(tagTbl) {
/*
	var stop;
	var roadType;
	var transType;

	roadType=tagTbl.getString('highway');
	transType=tagTbl.getString('public_transport');

	if(roadType) roadType=gis.Q.trim(roadType.toLowerCase());
	if(transType) transType=gis.Q.trim(transType.toLowerCase());

	if(roadType=='bus_stop' || transType=='stop_position' || transType=='platform') {
		// Public transit stop.
		stop=new gis.osm.trans.Stop();
		stop.name=tagTbl.getString('name');
		stop.ref=tagTbl.getString('ref');

		this.list.push(stop);
		return(stop);
	}
*/

	return(null);
};

/** @param {gis.osm.TagTable} tagTbl
  * @return {gis.osm.Meta} */
gis.osm.MetaSet.prototype.parseRel=function(tagTbl) {
	var type;

	type=tagTbl.getString('type');
	if(!type) return(null);
	type=type.toLowerCase();

/*
	if(type=='route') {
// Public transit route types: bus trolleybus ferry train subway tram
			type=gis.Q.trim(tagTbl.getString('route').toLowerCase());
			if(type=='bus') {


				var memberNum;
				var stopCount;

				stopCount=0;

				for(memberNum=0;memberNum<memberCount;memberNum++) {
					if(roleList[memberNum]=='nstop') stopCount++;
					if(roleList[memberNum]=='wforward' || roleList[memberNum]=='wbackward') {
						if(!globalWayRef) globalWayRef=[];
					}
				}

				if(stopCount>1) console.log(tagTbl.getString('ref')+'\t'+tagTbl.getString('name')+'\t'+stopCount);


			}
		}

		} else if(type=='route_master' && tagTbl['route_master']) {
//console.log(tagTbl);
		} else if(type=='access') {
//console.log(tagTbl);
		} else if(type=='boundary') {
//console.log(tagTbl);
		} else if(type=='enforcement') {
//console.log(tagTbl);
		} else if(type=='restriction') {
//console.log(tagTbl);
		} else if(type=='multipolygon') {
//console.log(tagTbl);
		} else if(type=='destinationsign') {
//console.log(tagTbl);
		} else if(type=='associatedstreet') {
//console.log(tagTbl);
		} else if(type=='surveillance') {
//console.log(tagTbl);
		} else if(type=='bridge') {
//console.log(tagTbl);
		} else if(type=='tunnel') {
//console.log(tagTbl);
		} else if(type=='site' && tagTbl['site']=='bus_stop') {
//console.log(tagTbl);
		} else if(type=='public_transport' && tagTbl['public_transport']=='stop_area') {
//console.log(tagTbl);
	} else console.log(tagTbl);
*/

	return(null);
};

/** @param {gis.io.PackStream} stream */
gis.osm.MetaSet.prototype.exportPack=function(stream,nodeSet) {
/*
	var featureList;
	var featureNum,featureCount;
	var feature;
	var node;

	featureList=this.list;
	featureCount=featureList.length;

	for(featureNum=0;featureNum<featureCount;featureNum++) {
		feature=featureList[featureNum];
		node=feature.nodeList[0];

		if(!node.iterId) {
			console.log(feature.ref+'\t'+feature.name);
			console.log(node.posList);
		}
	}
*/
};
