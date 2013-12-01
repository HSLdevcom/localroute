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

goog.provide('gis.osm.WaySet');
goog.require('gis.Obj');
goog.require('gis.Q');
goog.require('gis.geom.BB');
goog.require('gis.osm.Way');
goog.require('gis.osm.WayChain');
goog.require('gis.osm.QuadTree');
goog.require('gis.enc.NameSet');

/** Set of ways, detects shared nodes to create topology for routing.
  * @constructor */
gis.osm.WaySet=function() {
	/** @type {Array.<gis.osm.Way>} List of ways in set. */
	this.list=[];
	/** @type {Object.<number,number|gis.osm.Way>} */
	this.tbl={};
	/** @type {number} Number of ways in set. */
	this.count=0;
	/** @type {gis.osm.QuadTree} */
	this.tree;

	/** @type {number} */
	this.detail;
};

/** @type {number} */
gis.osm.WaySet.detail=5;
/** @type {number} */
gis.osm.WaySet.tileSize=12;

/** @return {gis.osm.Way} */
gis.osm.WaySet.prototype.createWay=function() {
	var way;

	way=new gis.osm.Way();
	way.iterId=this.count;
	this.list[this.count++]=way;

	return(way);
};

/** Create a way from list of node IDs.
  * @param {Array.<number>} ptList
  * @param {gis.osm.WayProfile} profile
  * @param {string} name
  * @param {gis.osm.NodeSet} nodeSet
  * @return {gis.osm.Way} */
gis.osm.WaySet.prototype.insertNodes=function(ptList,profile,name,nodeSet) {
	var pos,ptCount;
	var pt;
	var way;
	var wayId;

	way=this.createWay();
	wayId=this.count-1;

	way.profile=profile;
	way.name=name;
	way.ptList=ptList;

	ptCount=ptList.length;
	for(pos=0;pos<ptCount;pos++) {
		pt=nodeSet.bindWay(ptList[pos],way,wayId,pos,this,false);
		ptList[pos]=pt;
	}

	way.update();

	return(way);
};

/** @param {function(gis.osm.Way)} handler */
gis.osm.WaySet.prototype.forWays=function(handler) {
	var wayList;
	var wayNum,wayCount;
	var way;

	wayList=this.list;
	wayCount=this.count;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		if(way.deleted) continue;

		handler(way);
	}
};

/** Add distance information to all ways. */
gis.osm.WaySet.prototype.calcDist=function() {
	var wayList;
	var wayNum,wayCount;
	var way;

	wayList=this.list;
	wayCount=this.count;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		if(way.deleted) continue;

		way.calcDist();
	}
};

/** Find ways with same name and type ending at the same node, and join them.
  * @param {gis.osm.ProfileSet} profileSet */
gis.osm.WaySet.prototype.linkChains=function(profileSet) {
	var wayList;
	var wayNum,wayCount;
	var way;
	var name;
    var chainList;
    var chainNum,chainCount;
    var chain;
	var ptList;
	var ptNum,ptCount,ptStart;
	var node;
	var otherWayList,posList;
	var otherNum,otherCount;
	var other;
	var pos;
    var profile;

	chainList=/** @type {Array.<gis.osm.WayChain>} */ ([]);

	wayList=this.list;
	wayCount=this.count;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		if(way.deleted) continue;
		name=way.name;

		ptList=way.ptList;
		ptCount=ptList.length;
		ptStart=way.ptStart;

        for(ptNum=ptStart;ptNum<ptCount;ptNum+=ptCount-ptStart-1) {
			node=ptList[ptNum];
			if(typeof(node)=='number') continue;

			otherWayList=node.wayList;
			posList=node.posList;

			otherCount=otherWayList.length;
			if(otherCount<2) continue;

			// Find other ways sharing the same node.
			for(otherNum=0;otherNum<otherCount;otherNum++) {
				other=otherWayList[otherNum];
				// Skip ways with different names if either way is named.
				if(other.deleted || other==way || (name && other.name!=name)) continue;

				// Make sure the node is an endpoint of the other way.
				pos=posList[otherNum];
				if(pos!=other.ptStart && pos!=other.ptList.length-1) continue;

				// Attempt to match way profiles.
				profile=profileSet.matchWays(way.profile,other.profile,false);
				if(profile) {
					// Ways are compatible, add them to the same chain or merge existing chains.
					if(way.chain) {
						if(other.chain) {
							other.chain=way.chain.merge(other.chain);
						} else other.chain=way.chain.insert(other);
					} else {
						if(other.chain) way.chain=other.chain.insert(way);
						else {
							// Neither way is in a chain yet, create a new chain.
							chain=new gis.osm.WayChain(way,other);
							way.chain=chain;
							other.chain=chain;
							chainList.push(chain);
						}
					}

					way.profile=profile;
					other.profile=profile;
				}
			}
		}
	}

	// Merge ways connected in chains.
	chainCount=chainList.length;
	console.log(chainCount+' links.');

	for(chainNum=0;chainNum<chainCount;chainNum++) {
		chain=chainList[chainNum];
		if(!chain.deleted) chain.catenateWays();
	}
};

/** Remove nameless ways (or their parts) that don't help in getting from any street address to another.
  * Keep calling until no changes happen to remove more data.
  * @return {number} Number of changes made. */
gis.osm.WaySet.prototype.optimize=function() {
	var wayList;
	var wayNum,wayCount;
	var way;
	var otherWayList;
	var otherNum,otherCount;
	var ptList;
	var ptNum,ptCount;
	var nodeCount;
	var node,nodePrev;
	var chg;
	var posFirst,posLast;

	chg=0;

	// Process all ways.
	wayList=this.list;
	wayCount=this.count;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		if(way.deleted) continue;

		posFirst=-1;
		posLast=0;
		nodeCount=0;
		ptList=way.ptList;
		ptCount=ptList.length;
		nodePrev=0;

		// Loop through points, convert or count nodes.
		for(ptNum=way.ptStart;ptNum<ptCount;ptNum++) {
			node=ptList[ptNum];
			if(typeof(node)=='number') continue;
			if(node==nodePrev) {
				node.removeWay(way,ptNum);
				ptList[ptNum]=0;
				continue;
			}
			nodePrev=node;

			otherWayList=node.wayList;
			otherCount=otherWayList.length;

			// Count how many ways share the node, exclude deleted ways.
			for(otherNum=otherCount;otherNum--;) {
				if(otherWayList[otherNum].deleted) otherCount--;
			}

			if(otherCount<2 && !node.important) {
				// Convert node to plain coordinate pair if no other way uses it.
				way.demoteNode(ptNum);
				chg++;
			} else {
				// Include node in count, update position of first and last node along way.
				nodeCount++;
				posLast=ptNum;
				if(posFirst<0) posFirst=ptNum;
			}
		}

		// Trim ways not needed for routing.
		if(!way.important) {
			if(nodeCount<2) {
				// Remove ways with just one node since they don't lead anywhere.
				way.deleted=true;
				chg++;
			} else {
				// Cut tails of ways so they start and end at a node.
				if(posFirst>0 || posLast+1<ptCount) {
//					way.ptList=way.ptList.slice(posFirst,posLast+1);
					way.ptStart=posFirst;
					way.ptList.length=posLast+1;
				}
			}
		}
	}

	console.log(chg+' changes.');

	return(chg);
};

/** @param {gis.osm.Node} node
  * @param {number} maxDist
  * @param {number} iterId
  * @param {gis.osm.Node} newNode
  * @param {gis.osm.ProfileSet} profileSet
  * @return {number} */
gis.osm.WaySet.prototype.walk=function(node,maxDist,iterId,newNode,profileSet) {
	/** @type {Array.<{way:gis.osm.Way,pos:number,dist:number}>} */
	var fifo;
	var posIn,posOut;
	var way;
	var pos;
	var item;
	var dist,distEnter,distAlong;
	var ptList;
	var ptNum,ptCount;
	var pt;
	var posList;
	var wayList;
	var wayNum,wayCount;
	var nodeCount;

	/** @param {gis.osm.Node} node
	  * @param {number} dist
	  * @param {gis.osm.WayProfile} profile */
	function getWays(node,dist,profile) {
		var way;
		var pos;
		var item;

		posList=node.posList;
		wayList=node.wayList;
		wayCount=wayList.length;

		for(wayNum=0;wayNum<wayCount;wayNum++) {
			way=wayList[wayNum];
			if(way.deleted) continue;

			if(way.important) return;
		}

		if(newNode && !node.replacement) node.replacement=newNode;
		nodeCount++;

		for(wayNum=0;wayNum<wayCount;wayNum++) {
			way=wayList[wayNum];
			if(way.deleted || way.iterId==iterId) continue;

			pos=posList[wayNum];
			way.iterId=iterId;

			if(profile && !profileSet.matchWays(way.profile,profile,true)) continue;

			item={way:way,pos:pos,dist:dist};
			fifo[posIn++]=item;
		}
	}

	nodeCount=0;

	fifo=/** @type {Array.<{way:gis.osm.Way,pos:number,dist:number}>} */ ([]);
	posOut=0;
	posIn=0;

	getWays(node,0,null);

	while(posOut<posIn) {
		item=fifo[posOut++];

		way=item.way;
		pos=item.pos;
		distEnter=item.dist;
		distAlong=way.distList[pos];

		ptList=way.ptList;
		ptCount=ptList.length;

		for(ptNum=pos;ptNum--;) {
			pt=ptList[ptNum];
			dist=distEnter+distAlong-way.distList[ptNum];
			if(dist>maxDist) break;

//if(typeof(pt)=='undefined') {console.log(ptList);console.log(pos+' '+ptNum+' '+ptCount);}
			if(typeof(pt)=='number') {
				if(newNode) ptList[ptNum]=0;
if(pt) nodeCount++;
				continue;
			} else if(!pt.important) getWays(pt,dist,way.profile);
		}

		for(ptNum=pos;ptNum<ptCount;ptNum++) {
			pt=ptList[ptNum];
			dist=distEnter+way.distList[ptNum]-distAlong;
			if(dist>maxDist) break;

//if(typeof(pt)=='undefined') {console.log(ptList);console.log(pos+' '+ptNum+' '+ptCount);}
			if(typeof(pt)=='number') {
				if(newNode) ptList[ptNum]=0;
if(pt) nodeCount++;
				continue;
			} else if(!pt.important) getWays(pt,dist,way.profile);
		}
	}

	return(nodeCount);
};

/** Join nearby nodes according to distance along road network.
  * @param {number} maxDist
  * @param {gis.osm.ProfileSet} profileSet */
gis.osm.WaySet.prototype.cluster=function(maxDist,profileSet) {
	var posList;
	var wayList;
	var wayNum,wayCount;
	var way;
	var ptList;
	var ptNum,ptCount;
	var sizeList;
	var nodeList;
	var nodeNum,nodeCount;
	var node;
	var iterId;

	this.clearMarks();

	sizeList=/** @type {Array.<number>} */ ([]);
	nodeList=/** @type {Array.<gis.osm.Node>} */ ([]);
	nodeCount=0;

	wayList=this.list;
	wayCount=this.count;

	iterId=1;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		if(way.deleted) continue;

		ptList=way.ptList;
		ptCount=ptList.length;

		for(ptNum=way.ptStart;ptNum<ptCount;ptNum++) {
			node=ptList[ptNum];
			if(typeof(node)=='number' || node.iterId || node.important) continue;

			sizeList[nodeCount]=this.walk(node,maxDist,iterId++,null,profileSet);
			nodeList[nodeCount++]=node;
			node.iterId=nodeCount;
		}
	}

	nodeList.sort(function(a,b) {
		return(sizeList[a.iterId-1]-sizeList[b.iterId-1]);
	});

	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		node=nodeList[nodeNum];
		if(sizeList[node.iterId]>1) this.walk(node,maxDist,iterId++,node,profileSet);
		node.iterId=0;
	}

var chg=0;
	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		node=nodeList[nodeNum];
		if(!node.replacement || node==node.replacement) continue;
chg++;

		posList=node.posList;
		wayList=node.wayList;
		wayCount=wayList.length;

		for(wayNum=0;wayNum<wayCount;wayNum++) {
			wayList[wayNum].ptList[posList[wayNum]]=node.replacement;
		}

		node.replacement.wayList=node.replacement.wayList.concat(node.wayList);
		node.replacement.posList=node.replacement.posList.concat(node.posList);
	}

console.log(chg+' clustered nodes.');
};

/** Reorganize way list, grouping ways into tiles according to the midpoint of their bounding box.
  * @param {number} groupSize Exponent (base=2) of tile size.
  * @return {Array.<gis.osm.Way>} Reordered list. */
gis.osm.WaySet.prototype.getGrouped=function(groupSize) {
	var groupTbl;
	var groupList;
	var groupNum,groupCount;
	var group;
	var wayList;
	var wayNum,wayCount;
	var way;
	var bb;
	var lat,lon;
	var key;

	groupTbl=/** @type {Object.<string,Array.<gis.osm.Way>>} */ ({});
	groupList=/** @type {Array.<Array.<gis.osm.Way>>} */ ([]);

	wayList=this.list;
	wayCount=this.count;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		// Don't save inaccessible ways unless used for public transit.
		if(way.deleted || (!way.profile.access && !way.important)) continue;

		bb=way.getBB();

		lat=bb.lat1+((bb.lat2-bb.lat1)>>>1);
		lon=bb.lon1+((bb.lon2-bb.lon1)>>>1);

		key=(lat>>groupSize)+' '+(lon>>groupSize);
		group=groupTbl[key];
		if(!group) {
			group=/** @type {Array.<gis.osm.Way>} */ ([]);
			groupTbl[key]=group;
			groupList.push(group);
		}

		group.push(way);
	}

	// Sort nearby ways by name so delta encoded references to name list would be shorter.
	groupCount=groupList.length;
	for(groupNum=0;groupNum<groupCount;groupNum++) {
		groupList[groupNum].sort(
			/** @param {gis.osm.Way} a
			  * @param {gis.osm.Way} b */
			function(a,b) {
				return(a.name-b.name);
			}
		);
	}

	return(Array.prototype.concat.apply([],groupList));
};

/** Count how many ways fit each profile. */
gis.osm.WaySet.prototype.markProfiles=function() {
	var wayList;
	var wayNum,wayCount;

	wayList=this.list;
	wayCount=wayList.length;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		wayList[wayNum].profile.count++;
	}
};

/** @param {gis.enc.NameSet} nameSet */
gis.osm.WaySet.prototype.getNames=function(nameSet) {
	var wayList;
	var wayNum,wayCount;
	var way;

	wayList=this.list;
	wayCount=this.count;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		if(way.deleted) continue;

		nameSet.insert(way.name);
	}
};

/** @param {number} errNamed Maximum displacement for named ways.
  * @param {number} errOther For unnamed ways. */
gis.osm.WaySet.prototype.simplify=function(errNamed,errOther) {
	var wayList;
	var wayNum,wayCount;
	var way;

	wayList=this.list;
	wayCount=wayList.length;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];

		if(way.name) way.simplify(errNamed);
		else way.simplify(errOther);
	}
};

/** @typedef {{detail:number,tileSize:number,roundOff:number,tileOff:number,lat:number,lon:number,exportId:number,tileCount:number,newCount:number,hitCount:number,missCount:number,hdrLen:number,newLen:number,hitLen:number,missLen:number}} */
gis.osm.WaySet.ExportState;

/** Compress ways into a stream.
  * @param {gis.io.PackStream} stream
  * @param {gis.enc.NameSet} nameSet */
gis.osm.WaySet.prototype.exportPack=function(stream,nameSet) {
	var wayList;
	var wayNum,wayCount;
	var way;
	var exportTbl;
	var detail,tileSize;
	var roundOff,tileOff;
	var namedList,anonList;
	var nameId,nameIdPrev;
	var state;

	detail=this.detail;
	if(!detail) detail=gis.osm.WaySet.detail;
	tileSize=gis.osm.WaySet.tileSize-detail;
	roundOff=((1<<detail)-1)>>1;
	tileOff=(1<<tileSize)>>1;

	exportTbl={};

	state={
		detail:detail,
		tileSize:tileSize,
		roundOff:roundOff,
		tileOff:tileOff,

		lat:0,
		lon:0,
		exportId:1,

		tileCount:0,
		newCount:0,
		hitCount:0,
		missCount:0,

		hdrLen:0,
		newLen:0,
		hitLen:0,
		missLen:0
	};

	wayList=this.getGrouped(detail+tileSize);
	wayCount=wayList.length;
	console.log(wayCount+' ways.');

	namedList=/** @type {Array.<gis.osm.Way>} */ ([]);
	anonList=/** @type {Array.<gis.osm.Way>} */ ([]);

	// Separate named and unnamed ways.
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];

		if(way.name) namedList.push(way);
		else anonList.push(way);
	}

	wayCount=namedList.length;
	stream.writeLong([wayCount,detail]);

	nameId=0;
	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=namedList[wayNum];

		nameIdPrev=nameId;
		nameId=nameSet.getId(way.name);

		way.exportPack(stream,exportTbl,state,[0,way.profile.id,gis.Q.fromSigned(nameId-nameIdPrev)]);
	}

	wayCount=anonList.length;
	stream.writeLong([wayCount]);

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=anonList[wayNum];
		way.exportPack(stream,exportTbl,state,[0,way.profile.id]);
	}

	console.log('Headers '+state.hdrLen);
	console.log(state.tileCount+' tiles, '+state.newCount+' new ('+(state.newLen/state.newCount)+'), '+state.hitCount+' hits ('+(state.hitLen/state.hitCount)+'), '+state.missCount+' misses ('+(state.missLen/state.missCount)+').');
};

/** @typedef {{detail:number,tileSize:number,roundOff:number,tileOff:number,nameId:number,lat:number,lon:number,tileCount:number,typeLen:Array.<number>,typeCount:Array.<number>}} */
gis.osm.WaySet.ImportState;

/** Decompress ways from a stream.
  * @param {gis.io.PackStream} stream
  * @param {gis.osm.NodeSet} nodeSet
  * @param {gis.osm.ProfileSet} profileSet
  * @param {gis.enc.NameSet} nameSet
  * @param {boolean} getStats Set to true to get compression statistics. */
gis.osm.WaySet.prototype.importPack=function(stream,nodeSet,profileSet,nameSet,getStats) {
	var wayNum,wayCount;
	var way;
	var importTbl;
	var detail,tileSize;
	var state;
	var dec;

	importTbl={};
	dec=/** @type {Array.<number>} */ ([]);

	stream.readLong(dec,2);
	wayCount=dec[0];
	console.log(''+wayCount);

	detail=dec[1];
	tileSize=gis.osm.WaySet.tileSize-detail;

	state={
		detail:detail,
		tileSize:tileSize,
		roundOff:((1<<detail)-1)>>1,
		tileOff:(1<<tileSize)>>1,

		nameId:0,
		lat:0,
		lon:0,

		tileCount:0,

		typeLen:[0,0,0,0,0,0,0],
		typeCount:[0,0,0,0,0,0,0]
	};

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=this.createWay();
		way.importPack(stream,importTbl,nodeSet,state,profileSet,nameSet,getStats);
	}

	stream.readLong(dec,1);
	wayCount=dec[0];
	console.log(''+wayCount);

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=this.createWay();
		way.importPack(stream,importTbl,nodeSet,state,profileSet,null,getStats);
	}

	if(getStats) {
		console.log('Compression:');
		for(var i=0;i<state.typeLen.length;i++) {
			console.log(state.typeLen[i]+' / '+state.typeCount[i]+' = '+(state.typeLen[i]/state.typeCount[i]));
		}
	}
};

/** @param {function(string)} write */
gis.osm.WaySet.prototype.exportKML=function(write) {
	var wayList;
	var wayNum,wayCount;
	var way;
	var txt;
	var ptList;
	var ptNum,ptCount;
	var pt;
	var deg;

	txt='<?xml version="1.0" encoding="utf-8" ?>\n'+
		'<kml xmlns="http://www.opengis.net/kml/2.2">\n'+
		'<Document>\n'+
		'<Style id="red"><LineStyle><color>ff0000ff</color><width>3</width></LineStyle></Style>\n';
	write(txt);

//	wayList=this.getGrouped(gis.osm.WaySet.tileSize);
	wayList=this.list;
	wayCount=wayList.length;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		if(way.deleted) continue;

		txt='<Placemark>\n'+
			'<name>'+(way.name||'')+'</name>\n'+
			(way.name?'<styleUrl>'+'red'+'</styleUrl>\n':'')+
			'<MultiGeometry>\n'+
			'<LineString>\n'+
			'<coordinates>\n';
		write(txt);

		ptList=way.ptList;
		ptCount=ptList.length;

		txt='';
		for(ptNum=way.ptStart;ptNum<ptCount;ptNum++) {
			pt=ptList[ptNum];
			if(!pt) continue;

			if(typeof(pt)=='number') deg=gis.MU.ll.fromNum(pt).toDeg();
			else deg=pt.ll.toDeg();

			txt+=deg.llon+','+deg.llat+',0\n';
		}
		write(txt);

		txt='</coordinates>\n'+
			'</LineString>\n'+
			'</MultiGeometry>\n'+
			'</Placemark>\n';
		write(txt);
	}

	txt='</Document>\n'+
		'</kml>\n';
	write(txt);
};

/** @param {function(string)} write
  * @param {gis.osm.ProfileSet} profileSet */
gis.osm.WaySet.prototype.exportOSM=function(write,profileSet) {
	var nodeId,wayId,id;
	var wayList;
	var wayNum,wayCount;
	var way;
	var txt;
	var ptList;
	var ptNum,ptCount;
	var pt;
	var deg;

	this.clearMarks();

	txt='<?xml version="1.0" encoding="UTF-8"?>\n'+
		'<osm version="0.6" generator="OSM Squeeze">\n';
	write(txt);

	nodeId=1;
//	wayList=this.getGrouped(gis.osm.WaySet.tileSize);
	wayList=this.list;
	wayCount=wayList.length;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		if(way.deleted) continue;

		ptList=way.ptList;
		ptCount=ptList.length;

		txt='';
		for(ptNum=way.ptStart;ptNum<ptCount;ptNum++) {
			pt=ptList[ptNum];
			if(!pt) continue;

			if(typeof(pt)=='number') deg=gis.MU.ll.fromNum(pt).toDeg();
			else if(pt.iterId) {
				continue;
			} else {
				deg=pt.ll.toDeg();
				pt.iterId=nodeId;
			}

			txt+='<node id="'+nodeId+'" lat="'+deg.llat+'" lon="'+deg.llon+'" version="1" />\n';
			nodeId++;
		}
		write(txt);
	}

	nodeId=1;
	wayId=1;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		if(way.deleted) continue;

		ptList=way.ptList;
		ptCount=ptList.length;

		txt='<way id="'+wayId+'" version="1">\n';
		for(ptNum=way.ptStart;ptNum<ptCount;ptNum++) {
			pt=ptList[ptNum];
			if(!pt) continue;

			if(typeof(pt)=='number') id=nodeId++;
			else {
				id=pt.iterId;
				if(id==nodeId) nodeId++;
			}

			txt+='<nd ref="'+id+'" />\n';
		}
		if(way.name) txt+='<tag k="name" v="'+way.name+'" />\n';
		txt+=profileSet.exportOSM(way.profile);
		txt+='</way>\n';
		write(txt);
		wayId++;
	}

	txt='</osm>\n';
	write(txt);
};

gis.osm.WaySet.prototype.clearMarks=function() {
	var wayList;
	var wayNum,wayCount;
	var way;
	var ptList;
	var ptNum,ptCount;
	var pt;

	wayList=this.list;
	wayCount=wayList.length;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];

		way.iterId=0;
		ptList=way.ptList;
		ptCount=ptList.length;

		for(ptNum=way.ptStart;ptNum<ptCount;ptNum++) {
			pt=ptList[ptNum];
			if(!pt) continue;

			if(typeof(pt)!='number') pt.iterId=0;
		}
	}
};

gis.osm.WaySet.prototype.prepareTree=function() {
	var tree;
	var wayList;
	var wayNum,wayCount;
	var way;

	tree=new gis.osm.QuadTree(new gis.geom.BB(0,0,gis.MU.range,gis.MU.range));

	wayList=this.list;
	wayCount=wayList.length;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		if(way.deleted) continue;

	    tree.insertWay(way);
	}

	tree.root.split(32);
	this.tree=tree;
};

/** Match unnamed ways like sidewalks to a nearby parallel named street, by checking all nodes.
  * @param {number} maxDist Maximum distance between matching ways.
  * @param {number} angleWeight Distance penalty for ways off by 45 degrees. Multiplied by tangent so parallel ways get zero penalty. */
gis.osm.WaySet.prototype.findLanes=function(maxDist,angleWeight) {
	var tree;
	var wayList;
	var wayNum,wayCount;
	/** @type {gis.osm.Way} */
	var way;
	var other;
	var bb;
	var off;
	var tile;
	var validCount;
	var ptList;
	var ptNum,ptCount,ptNumPrev;
	var pt;
	var ll;
	var lat,lon,latPrev,lonPrev,latNext,lonNext;
	var near;
	var pos;
	var offset;

	tree=this.tree;
	wayList=this.list;
	wayCount=wayList.length;

	// Initialize variables to keep Closure Compiler happy.
	lat=0;latNext=0;
	lon=0;lonNext=0;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		if(way.deleted || way.name) continue;

		bb=way.getBB();
		way.nearWayList=[];
		way.nearPosList=[];

		off=maxDist/gis.MU.getScale(bb.lat1+((bb.lat2-bb.lat1)>>>1)).north;  // Adjust scale for Mercator distortion.
		// Look for nearby ways in the quadtree as far from the root as possible for speed.
		// Start from a tile containing the entire way to match, expanded with a maxDist-sized buffer.
		tile=tree.findEnclosing(new gis.geom.BB(bb.lat1-off,bb.lon1-off,bb.lat2+off,bb.lon2+off));

		validCount=0;
		ptList=way.ptList;
		ptCount=ptList.length;

		for(ptNum=way.ptStart;ptNum<=ptCount;ptNum++) {
			if(ptNum<ptCount) {
				pt=ptList[ptNum];
				if(!pt) continue;

				if(typeof(pt)=='number') ll=gis.MU.ll.fromNum(pt);
				else ll=pt.ll;

				latNext=ll.llat;
				lonNext=ll.llon;
			}

			if(validCount) {
				if(validCount==1) {
					latPrev=lat;
					lonPrev=lon;
				}

				near=tree.findWay(lat,lon,'',maxDist,tile,latNext-latPrev,lonNext-lonPrev,angleWeight,
					/** @param {gis.osm.Way} other */
					function(other) {
						// Match unnamed ways only to named ways on the same layer (tunnel/bridge etc.)
						return(+(other.name && other.profile.matchLayer(way.profile)));
					}
				);
				other=near.way;

				if(other) {
					near={way:null,sqDist:off*off,pos:0,posNext:0,offset:0};
					other.findNearest(lat,lon,other.ptStart,other.ptList.length-1,near,0,0,0,0);
					pos=near.pos;
					offset=near.offset;
/*
					if(offset<1/1024) offset=0;
					if(offset>1023/1024) {
						pos=near.posNext;
						offset=0;
					}
*/
					if(offset==1) {
						pos=near.posNext;
						offset=0;
					}

					way.nearWayList[ptNumPrev]=other;
					way.nearPosList[ptNumPrev]=pos+offset;
				}
			}

			latPrev=lat;
			lonPrev=lon;
			lat=latNext;
			lon=lonNext;
			ptNumPrev=ptNum;

			validCount++;
		}
		if(wayNum%100==0) console.log(''+wayNum);
	}
};

/** @param {gis.osm.NodeSet} nodeSet */
gis.osm.WaySet.prototype.mergeLanes=function(nodeSet) {
	var wayList;
	var wayNum,wayCount;
	var way;
	var ptList;
	var ptNum,ptCount,ptNumPrev,ptNumLast;
	var pt,ptPrev;
	var other,otherPrev;
	var pos,posPrev;
	var dir,dirPrev;
	var extraList;
	var extraNum,extraCount;
	var len;

	wayList=this.list;
	wayCount=wayList.length;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		if(way.deleted || way.name) continue;

		len=0;
		dirPrev=0;
		posPrev=0;
		otherPrev=null;
		ptNumPrev=0;
		ptList=way.ptList;
		ptCount=ptList.length;

		for(ptNumLast=ptCount;ptNumLast--;) {
			pt=ptList[ptNum];
			if(pt) break;
		}

		for(ptNum=way.ptStart;ptNum<=ptCount;ptNum++) {
			pt=ptList[ptNum];
			if(!pt) continue;

			other=way.nearWayList[ptNum];
			pos=way.nearPosList[ptNum];
			dir=pos-posPrev;

			if(other && other==otherPrev && ((dir>=0 && dirPrev>=0) || (dir<=0 && dirPrev<=0)) && ptNum<ptNumLast) {
				if(!len) {
					if(!other.extraPosList) {
						other.extraPosList=[];
						other.extraPtList=[];
					}

					if(typeof(ptPrev)=='number') {
						ptPrev=way.promoteNode(ptNumPrev,nodeSet);
					}

					other.extraPosList.push(posPrev);
					other.extraPtList.push(ptPrev);
					ptPrev.important=true;
				}
				if(typeof(pt)!='number') {
					// TODO: detect nodes close to intersections, remove them here and add back in decompression.
//if(1) {
					other.extraPosList.push(pos);
					other.extraPtList.push(pt);
					ptPrev.important=true;
/*
} else {
ptList[ptNum].removeWay(way,ptNum);
ptList[ptNum]=0;
posPrev=pos;
dirPrev=dir;
continue;
}
*/
				} else {
					ptList[ptNum]=0;
					posPrev=pos;
					dirPrev=dir;
					continue;
				}

				len++;
			} else {
				if(len) {
					if(typeof(ptPrev)=='number') {
						ptPrev=way.promoteNode(ptNumPrev,nodeSet);
						ptPrev.important=true;
					}

					otherPrev.extraPosList.push(posPrev);
					otherPrev.extraPtList.push(ptPrev);
				}

				dir=0;
				len=0;
			}

			ptPrev=pt;
			ptNumPrev=ptNum;
			otherPrev=other;
			posPrev=pos;
			dirPrev=dir;
		}
	}

	extraList=/** @type {Array.<{pos:number,pt:(number|gis.osm.Node)}>} */ ([]);

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		if(way.deleted || !way.name || !way.extraPosList) continue;

		extraCount=way.extraPosList.length;

		extraList.length=extraCount;
		for(extraNum=0;extraNum<extraCount;extraNum++) {
			extraList[extraNum]={pos:way.extraPosList[extraNum],pt:way.extraPtList[extraNum]};
		}

		extraList.sort(
			/** @param {{pos:number,pt:(number|gis.osm.Node)}} a
			  * @param {{pos:number,pt:(number|gis.osm.Node)}} b */
			function(a,b) {return(a.pos-b.pos);}
		);

		for(extraNum=0;extraNum<extraCount;extraNum++) {
			way.extraPosList[extraNum]=extraList[extraNum].pos;
			way.extraPtList[extraNum]=extraList[extraNum].pt;
		}
/*
		var ptListNew;

		ptListNew=[];
		ptList=way.ptList;
		ptCount=ptList.length;
		extraNum=0;

		for(ptNum=way.ptStart;ptNum<ptCount;ptNum++) {
			pt=ptList[ptNum];
			if(!pt) continue;

			while(extraNum<extraCount && extraList[extraNum].pos<ptNum) {
				ptListNew.push(extraList[extraNum++].pt);
			}

			ptListNew.push(pt);
			if(typeof(pt)=='number') continue;

			ptWayList=pt.wayList;
			ptWayCount=ptWayList.length;

			for(ptWayNum=0;ptWayNum<ptWayCount;ptWayNum++) {
				other=ptWayList[ptWayNum];
				if(other!=way) continue;

				if(pt.posList[ptWayNum]==ptNum) pt.posList[ptWayNum]=ptListNew.length-1;
			}
		}

		way.ptList=ptListNew;
*/
	}
};
