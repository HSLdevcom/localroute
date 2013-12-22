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
goog.require('gis.osm.meta.Stop');
goog.require('gis.osm.TagTable');

/** @constructor */
gis.osm.MetaSet=function() {
	/** @type {Array.<gis.osm.Meta>} */
	this.list=[];
	/** @type {Object.<number,gis.osm.Meta>} */
	this.tbl={};

	/** @type {Array.<gis.osm.Node>} */
	this.nodeList=[];
};

/** @param {gis.osm.TagTable} tagTbl
  * @return {gis.osm.Meta} */
gis.osm.MetaSet.prototype.parse=function(tagTbl,type) {
	var stop;
	var roadType;
	var transType;

	roadType=tagTbl.getString('highway');
	transType=tagTbl.getString('public_transport');

	if(roadType) roadType=gis.Q.trim(roadType.toLowerCase());
	if(transType) transType=gis.Q.trim(transType.toLowerCase());

	if(roadType=='bus_stop' || transType=='stop_position' || transType=='platform') {
		// Public transit stop.
		stop=new gis.osm.meta.Stop();
		stop.name=tagTbl.getString('name');
		stop.ref=tagTbl.getString('ref');

		this.list.push(stop);
		return(stop);
	}

	return(null);
};

/** @param {gis.osm.Node} node */
gis.osm.MetaSet.prototype.insertNode=function(node) {
	this.nodeList.push(node);
};

/** @param {gis.osm.TagTable} tagTbl
  * @param {Array.<string>} roleList
  * @param {Array.<gis.osm.Node|gis.osm.Way|number>} memberList
  * @return {gis.osm.Meta} */
gis.osm.MetaSet.prototype.parseRel=function(tagTbl,roleList,memberList) {
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

gis.osm.MetaSet.prototype.forMetas=function(handler) {
	var metaList;
	var metaNum,metaCount;

	metaList=this.list;
	metaCount=metaList.length;

	for(metaNum=0;metaNum<metaCount;metaNum++) {
		handler(metaList[metaNum]);
	}
};

/** @param {gis.enc.NameSet} nameSet */
gis.osm.MetaSet.prototype.getNames=function(nameSet) {
	this.forMetas(function(meta) {
		meta.getNames(nameSet);
	});
};

/** Update reference counts to metadata. */
gis.osm.MetaSet.prototype.countRefs=function() {
	var nodeList;
	var nodeNum,nodeCount;
	var meta;

	this.forMetas(function(meta) {
		meta.count=0;
	});

	nodeList=this.nodeList;
	nodeCount=nodeList.length;

	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		meta=nodeList[nodeNum].meta;
		if(meta) meta.count++;
	}
};

/** @param {gis.io.PackStream} stream
  * @param {gis.enc.NameSet} nameSet */
/*
gis.osm.MetaSet.prototype.exportPack=function(stream,nameSet) {
	var metaList;

	this.countRefs();

	metaList=this.list;
	metaList.sort(function(a,b) {return(b.count-a.count);});

	metaCount=metalist.length;
	stream.writeLong([metaCount]);

	for(metaNum=0;metaNum<metaCount;metaNum++) {
		metaList[metaNum].exportPack(stream,nameSet);
	}
};
*/

/** @param {gis.io.PackStream} stream */
gis.osm.MetaSet.prototype.exportBindPack=function(stream,nameSet) {
	var nodeList;
	var nodeNum,nodeCount;
	var id,idPrev,idMeta;
	var nodeRefList;
	var nodeRefNum,nodeRefCount;
	var meta;
	var outList;

	nodeList=this.nodeList;

	nodeList.sort(
		/** @param {gis.osm.Node} a
		  * @param {gis.osm.Node} b */
		function(a,b) {return(a.iterId-b.iterId);}
	);

	nodeCount=nodeList.length;
	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		meta=nodeList[nodeNum].meta;
		if(!meta) continue;

		if(!meta.nodeList) meta.nodeList=[];
		meta.nodeList.push(nodeList[nodeNum]);
	}

	idMeta=0;

	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		meta=nodeList[nodeNum].meta;
		if(!meta) continue;

		nodeRefList=meta.nodeList;
		nodeRefCount=nodeRefList.length;

		outList=[nodeRefCount];
		meta.exportPack(stream,nameSet);

		idPrev=idMeta;
		for(nodeRefNum=0;nodeRefNum<nodeRefCount;nodeRefNum++) {
			id=nodeRefList[nodeRefNum].iterId;
			outList.push(id-idPrev);
			idPrev=id;
		}
		idMeta=nodeRefList[0].iterId;

		stream.writeLong(outList);
	}

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
