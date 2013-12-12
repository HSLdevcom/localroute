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

goog.provide('gis.osm.Way');
goog.require('gis.Obj');
goog.require('gis.osm.WayProfile');
goog.require('gis.osm.Node');
goog.require('gis.geom.BB');
goog.require('gis.MU');

/** @constructor */
gis.osm.Way=function() {
	/** @type {gis.geom.BB} Bounding box. */
	this.bb;
	/** @type {Array.<number|gis.osm.Node>} List of points, either node objects or pairs of coordinates packed into numbers. */
	this.ptList;
	/** @type {Array.<number>} */
	this.distList;
	/** @type {number} Index of first point in ptList, if points have been deleted from the beginning. */
	this.ptStart=0;

	/** @type {Array.<gis.osm.Node>} List of nodes, they define intersections while bends are irrelevant to routing. */
	this.nodeList;
	/** @type {Array.<number>} Cumulative distance along way to each node. */
	this.nodeDistList;

	/** @type {string} Street name. */
	this.name;
	/** @type {gis.osm.WayProfile} Road classification, access rights and other characteristics. */
	this.profile;

	/** @type {gis.osm.Way} Next part of the way if it's split, for example partially outside loaded grid. */
	this.next;

	/** @type {boolean} */
	this.deleted;
	/** @type {boolean} */
	this.important;

	/** @type {number} Temporary ID used in various traversals, for example during data export. */
	this.iterId=0;
	/** @type {number} Index to data table with a slot for each node along each way. */
	this.dataPtr;
	/** @type {number} Way unique ID. */
	this.id;

	/** @type {gis.osm.WayChain} Chain of ways used to link split ways of similar type. */
	this.chain;

	/** @type {Array.<gis.osm.Way>} Other nearby ways. */
	this.nearWayList;
	/** @type {Array.<number>} */
	this.nearPosList;

	/** @type {Array.<number|gis.osm.Node>} Other points not on the way but nearby along it. */
	this.extraPtList;
	/** @type {Array.<number>} Positions of the other points as fractional values between way points. */
	this.extraPosList;
};

/** @typedef {{way:gis.osm.Way,sqDist:number,pos:number,posNext:number,lat:number,lon:number}} */
gis.osm.Way.Near;

/** @enum {number} */
gis.osm.Way.Src={
	HDR:0,
	NEW1:1,
	NEW:2,
	MISS:3,
	HIT:4,
	REF:5,
	NAMEREF:6
};

/** @enum {number} Encoding prefixes for special features, still some left for the future. */
gis.osm.Way.Code={
	UNUSED1:0,
	NAMEREF:2,
	UNUSED2:4,
	UNUSED3:6,
	REF:8
}

/** Convert point at pos represented as a number into a node object.
  * @param {number} pos
  * @param {gis.osm.NodeSet} nodeSet
  * @return {gis.osm.Node} */
gis.osm.Way.prototype.promoteNode=function(pos,nodeSet) {
	var pt;
	var node;

	pt=this.ptList[pos];
	if(typeof(pt)=='number') {
		node=nodeSet.createNode(gis.MU.fromNum(pt),false);
		node.addWay(this,pos);
		this.ptList[pos]=node;
	} else node=pt;

	return(node);
};

/** Convert node at pos into a number.
  * @param {number} pos
  * @return {number} */
gis.osm.Way.prototype.demoteNode=function(pos) {
	var node;
	var num;

	node=this.ptList[pos];
	if(typeof(node)=='number') return(node);
	num=node.ll.toNum();
	this.ptList[pos]=num;

	return(num);
};

/** @param {number} pos
  * @return {gis.MU} */
/*
gis.osm.Way.prototype.getLL=function(pos) {
	var pt;

	pt=this.ptList[pos];
	// Don't use gis.MU.ll.fromNum(pt) here because caller might not expect previously returned value to change after new call.
	if(typeof(pt)=='number') return(gis.MU.fromNum(pt));
	else return(pt.ll);
};
*/

/** @return {gis.geom.BB} */
gis.osm.Way.prototype.getBB=function() {
	var ptList;
	var ptNum,ptCount;
	var pt;
	var ll;
	var lat,lon;
	var boundS,boundW;
	var boundN,boundE;

	if(this.bb) return(this.bb);

	boundS=gis.MU.range;
	boundW=gis.MU.range;
	boundN=0;
	boundE=0;

	ptList=this.ptList;
	ptCount=ptList.length;

	for(ptNum=this.ptStart;ptNum<ptCount;) {
		pt=ptList[ptNum++];
		if(!pt) continue;

		if(typeof(pt)=='number') ll=gis.MU.ll.fromNum(pt);
		else ll=pt.ll;

		lat=ll.llat;
		lon=ll.llon;
		if(lat<boundS) boundS=lat;
		if(lat>boundN) boundN=lat;
		if(lon<boundW) boundW=lon;
		if(lon>boundE) boundE=lon;
	}

	this.bb=new gis.geom.BB(boundS,boundW,boundN,boundE);
	return(this.bb);
};

/** @param {number} pos1
  * @param {number} lat1
  * @param {number} lon1
  * @param {number} pos2
  * @param {number} lat2
  * @param {number} lon2
  * @param {number} minDist */
gis.osm.Way.prototype.douglasPeucker=function(pos1,lat1,lon1,pos2,lat2,lon2,minDist) {
	var ptList;
	var dlat,dlon,len,dx,dy;
	var pos;
	var ll;
	var u;
	var dist,maxDist;
	var posSplit;
	var latSplit,lonSplit;

	dlat=lat2-lat1;
	dlon=lon2-lon1;
	len=dlat*dlat+dlon*dlon;

	// Initialize variables to keep Closure Compiler happy.
	latSplit=0;
	lonSplit=0;

	ptList=this.ptList;
	maxDist=0;

	for(pos=pos1;pos<=pos2;pos++) {
		if(!ptList[pos]) continue;
		ll=gis.MU.ll.fromNum(/** @type {number} */ (ptList[pos]));

		u=(ll.llat-lat1)*dlat+(ll.llon-lon1)*dlon;
        
		if(len) u/=len;
		if(u<0) u=0;
		if(u>1) u=1;

		dx=ll.llat-(lat1+dlat*u);
		dy=ll.llon-(lon1+dlon*u);

		dist=dx*dx+dy*dy;
		if(dist>maxDist) {
			maxDist=dist;
			posSplit=pos;
			latSplit=ll.llat;
			lonSplit=ll.llon;
		}
	}

	if(maxDist>minDist) {
		if(pos1<posSplit-1) this.douglasPeucker(pos1,lat1,lon1,posSplit-1,latSplit,lonSplit,minDist);
		if(posSplit+1<pos2) this.douglasPeucker(posSplit+1,latSplit,lonSplit,pos2,lat2,lon2,minDist);
	} else {
		for(pos=pos1;pos<=pos2;pos++) {
			ptList[pos]=0;
		}
	}
};

/** @param {number} tolerance Max perpendicular displacement error in meters. */
gis.osm.Way.prototype.simplify=function(tolerance) {
	var ptList;
	var ptNum,ptCount;
	var pt;
	var first;
	var scale;
	var minDist;
	var bb;

	bb=this.getBB();
	scale=gis.MU.getScale(bb.lat1+((bb.lat2-bb.lat1)>>>1)).north;
	minDist=tolerance/scale;
	minDist*=minDist;

	ptList=this.ptList;
	ptCount=ptList.length;
	first=-1;

	for(ptNum=this.ptStart;ptNum<ptCount;ptNum++) {
		pt=ptList[ptNum];
		if(typeof(pt)!='number') {
			if(first>=0 && ptNum-first>2) this.douglasPeucker(first+1,ptList[first].ll.llat,ptList[first].ll.llon,ptNum-1,pt.ll.llat,pt.ll.llon,minDist);
			first=ptNum;
		}
	}
};

/** Append another way to this way.
  * @param {gis.osm.Way} other */
gis.osm.Way.prototype.merge=function(other) {
	var ptList;
	var ptNum,ptCount,ptStart;
	var pt;
	var otherStart;
	var off;
	var node;
	var wayList;
	var wayNum,wayCount;

	if(this.bb) this.bb.merge(other.bb);
//	this.getBB().merge(other.getBB());
	otherStart=other.ptStart;
	other.deleted=true;

	ptStart=this.ptStart;
    ptList=this.ptList;
    off=ptList.length;
    ptNum=off-1;

	if(ptList[ptNum]==other.ptList[otherStart]) {
		other.ptList[otherStart].removeWay(other,otherStart);
		ptList=/** @type {Array.<number|gis.osm.Node>} */ (ptList.concat(other.ptList.slice(otherStart+1)));
		off--;
	} else ptList=/** @tyoe {Array.<number|gis.osm.Node>} */ (ptList.concat(other.ptList.slice(otherStart)));
	off-=otherStart;

	this.ptList=ptList;

	ptCount=ptList.length;
	for(;ptNum<ptCount;ptNum++) {
		pt=ptList[ptNum];
		if(typeof(pt)=='number') continue;
		node=/** @type {gis.osm.Node} */ (pt);

		wayList=node.wayList;
		wayCount=wayList.length;
		for(wayNum=0;wayNum<wayCount;wayNum++) {
			if(wayList[wayNum]==other) {
				wayList[wayNum]=this;
				node.posList[wayNum]+=off;
			}
		}
	}
};

/** Reverse all points along way. */
gis.osm.Way.prototype.reverse=function() {
	var ptList;
	var ptNum,ptCount,ptStart;
	var node;
	var wayList;
	var wayNum,wayCount;

	ptList=this.ptList;
	ptCount=ptList.length;
	ptStart=this.ptStart;

	for(ptNum=ptStart;ptNum<ptCount;ptNum++) {
		node=ptList[ptNum];
		if(typeof(node)=='number') continue;

		wayList=node.wayList;
		wayCount=wayList.length;
		for(wayNum=0;wayNum<wayCount;wayNum++) {
			if(wayList[wayNum]==this && node.posList[wayNum]==ptNum) node.posList[wayNum]=ptCount-ptNum-1;
		}
	}

	ptList.reverse();
	ptList.length-=ptStart;
	this.ptStart=0;
};

/** @param {gis.io.PackStream} stream
  * @param {Object.<string,number>} exportTbl
  * @param {gis.osm.WaySet.ExportState} state
  * @param {Array.<number>} outList
  * @param {number} nameId */
gis.osm.Way.prototype.exportPack=function(stream,exportTbl,state,outList) {
	var lat,latPrev,dlat,dlat2,latExtra,keyLat,keyLatPrev;
	var lon,lonPrev,dlon,dlon2,lonExtra,keyLon,keyLonPrev;
	var ptList;
	var ptNum,ptCount,ptStart,outCount;
	var pt;
	var ll;
	var node;
	var detail,tileSize;
	var roundOff,tileOff;
	var key;
	var quad;
	var off;

	var extraPosList,extraPtList;
	var extraNum,extraCount;
	var extraPos,extraScale;

	function writeRef(node,lat,lon,latPrev,lonPrev) {
		keyLatPrev=(latPrev+tileOff)>>tileSize;
		keyLonPrev=(lonPrev+tileOff)>>tileSize;
		keyLat=lat>>tileSize;
		keyLon=lon>>tileSize;

		quad=0;
		if(keyLat==keyLatPrev-1) quad|=1;
		else if(keyLat!=keyLatPrev) quad=4;

		if(keyLon==keyLonPrev-1) quad|=2;
		else if(keyLon!=keyLonPrev) quad=4;

		if(quad>=4) {
			// The following leaves code 8 unused.
			// Cache miss, store node ID.
			outList.push((state.exportId-node.iterId)*10+8);
		} else {
			// Cache hit, store node index within nearby rectangular area.
			// The following leaves codes 0, 2, 4 and 6 unused.
			outList.push((exportTbl[keyLat+' '+keyLon]-node.exportKey)*10+quad*2);
		}
	}

	ptList=this.ptList;
	ptCount=ptList.length;
	ptStart=this.ptStart;

	extraPosList=this.extraPosList;
	if(extraPosList) {
		extraPtList=this.extraPtList;
		extraCount=extraPosList.length;
		extraNum=0;
	}

	detail=state.detail;
	tileSize=state.tileSize;
	roundOff=state.roundOff;
	tileOff=state.tileOff;

	lat=state.lat;
	lon=state.lon;
	dlat=0;
	dlon=0;
	outCount=0;

	for(ptNum=ptStart;ptNum<ptCount;ptNum++) {
		pt=ptList[ptNum];
		if(!pt) continue;

		if(outCount++>1) {
			dlat=lat-latPrev;
			dlon=lon-lonPrev;
		}

		if(typeof(pt)=='number') {
//			if(!needGeometry || !pt) continue;
			node=null;
			ll=gis.MU.ll.fromNum(pt);
		} else {
			node=pt;
			ll=node.ll;
		}

		latPrev=lat;
		lonPrev=lon;
		lat=(ll.llat+roundOff)>>detail;
		lon=(ll.llon+roundOff)>>detail;

		if(!node || !node.iterId) {
//			pair[0]=gis.Q.fromSigned(lat-(latPrev+dlat))*2+1;
//			pair[1]=gis.Q.fromSigned(lon-(lonPrev+dlon))*2+!!node;
			// New point, have to store lat/lon deltas.
			outList.push(gis.Q.fromSigned(lat-(latPrev+dlat))*2+1,gis.Q.fromSigned(lon-(lonPrev+dlon))*2+!!node);

//			state.newLen+=stream.writeLong(pair);
			state.newCount++;

			if(node) {
				keyLat=lat>>tileSize;
				keyLon=lon>>tileSize;

				key=keyLat+' '+keyLon;
				if(!exportTbl[key]) {
					exportTbl[key]=1;
					state.tileCount++;
				}
				node.iterId=state.exportId++;
				node.exportKey=exportTbl[key]++;
			}
		} else {
			writeRef(node,lat,lon,latPrev,lonPrev);
		}

		if(extraPosList) {
			dlat2=lat-latPrev;
			dlon2=lon-lonPrev;

			extraScale=(dlat2<0?-dlat2:dlat2)+(dlon2<0?-dlon2:dlon2);
			while(extraNum<extraCount && (extraPos=extraPosList[extraNum])<ptNum) {
				node=extraPtList[extraNum];
				if(typeof(node)!='number' && !node.iterId) {
					outCount++;
extraScale=1024;
off=~~((extraPos-~~extraPos)*extraScale);
					outList.push(gis.osm.Way.Code.REF,off);
off/=extraScale;
latExtra=~~((lat<<detail)+(dlat2*off-dlat2)*(1<<detail)+roundOff*0)>>detail;
lonExtra=~~((lon<<detail)+(dlon2*off-dlon2)*(1<<detail)+roundOff*0)>>detail;
node.ll=new gis.MU(latExtra<<detail,lonExtra<<detail);

					keyLat=latExtra>>tileSize;
					keyLon=lonExtra>>tileSize;
					key=keyLat+' '+keyLon;

					if(!exportTbl[key]) {
						exportTbl[key]=1;
						state.tileCount++;
					}

					node.iterId=state.exportId++;
					node.exportKey=exportTbl[key]++;
				} else if(node.iterId) {
					// TODO: this would be unnecessary with a better data model for merged lanes.
					outCount++;
					outList.push(gis.osm.Way.Code.NAMEREF);
					writeRef(node,(node.ll.llat+roundOff)>>detail,(node.ll.llon+roundOff)>>detail,lat,lon);
				}

				extraNum++;
			}
		}
	}

	outList[0]=outCount;
	stream.writeLong(outList);

	state.lat=lat;
	state.lon=lon;
};

/** @param {gis.io.PackStream} stream
  * @param {Object.<string,Array.<gis.osm.Node>>} importTbl
  * @param {gis.osm.NodeSet} nodeSet
  * @param {gis.osm.WaySet.ImportState} state
  * @param {gis.osm.ProfileSet} profileSet
  * @param {gis.enc.NameSet} nameSet
  * @param {boolean} getStats Set to true to get compression statistics. */
gis.osm.Way.prototype.importPack=function(stream,importTbl,nodeSet,state,profileSet,nameSet,getStats) {
	var ptList;
	var ptNum,ptCount;
	var lat,dlat,latExtra;
	var lon,dlon,lonExtra;
	var code,quad,off;
	var keyLat,keyLon;
	var key;
	var group;
	var ll;
	var tmp;
	var nodeList;
	var node,node2;
	var detail,tileSize;
	var roundOff,tileOff;
	var dec;
	var src;
	var pos;

	/** @param {number} code */
	function parseRef(code) {
		var quad,off;
		var keyLat,keyLon;
		var key;
		var group;
		var node;

		quad=(code>>1)%5;
		off=~~(code/10);

		if(quad<4) {
			src=gis.osm.Way.Src.HIT;

			keyLat=((lat+tileOff)>>tileSize)-(quad&1);
			keyLon=((lon+tileOff)>>tileSize)-(quad>>1);

			key=keyLat+' '+keyLon;
			group=importTbl[key];
if(!group) console.log(lat+' '+lon+' '+keyLat+' '+keyLon);

//			node=group[group.length-off-1];
			node=group[group.length-off];
		} else {
			src=gis.osm.Way.Src.MISS;

//			node=nodeList[nodeSet.count-off-1];
			node=nodeList[nodeSet.count-off];
		}

		return(node);
	}

	pos=stream.pos;
	src=gis.osm.Way.Src.HDR;

	dec=/** @type {Array.<number>} */ ([]);
	if(nameSet) {
		stream.readLong(dec,3);
		state.nameId+=gis.Q.toSigned(dec[2]);
		this.name=nameSet.list[state.nameId];
	} else stream.readLong(dec,2);
	this.profile=profileSet.wayProfileList[dec[1]];
if(!this.profile) console.log('Missing profile '+dec[1]+' / '+profileSet.wayProfileList.length);

	nodeList=nodeSet.list;
	ptList=[];
	ptCount=dec[0];

	detail=state.detail;
	tileSize=state.tileSize;
	roundOff=state.roundOff;
	tileOff=state.tileOff;

	lat=state.lat;
	lon=state.lon;
	dlat=0;
	dlon=0;
	node=null;

	for(ptNum=0;ptNum<ptCount;ptNum++) {
		if(getStats) {
			state.typeLen[src]+=stream.pos-pos;
			state.typeCount[src]++;
			pos=stream.pos;
		}

		stream.readLong(dec,1);
		code=dec[0];

		if(code&1) {
			// New node defined by lat/lon delta.
			src=ptNum?gis.osm.Way.Src.NEW:gis.osm.Way.Src.NEW1;

			if(node) {
				ptList[ptNum-1]=node;
				node.addWay(this,ptNum-1);
			}

			dlat+=gis.Q.toSigned(code>>1);
			stream.readLong(dec,1);
			dlon+=gis.Q.toSigned(dec[0]>>1);

			lat+=dlat;
			lon+=dlon;

			if(!ptNum) {
				dlat=0;
				dlon=0;
			}

			ll=new gis.MU((lat<<detail)+roundOff,(lon<<detail)+roundOff);
			if(dec[0]&1) {
				node=nodeSet.createNode(ll,true);

				keyLat=lat>>tileSize;
				keyLon=lon>>tileSize;
				key=keyLat+' '+keyLon;

				group=importTbl[key];
				if(!group) importTbl[key]=[node];
				else group.push(node);
			} else {
				node=null;
				ptList[ptNum]=ll.toNum();
				continue;
			}
		} else if(code==gis.osm.Way.Code.REF) {
			if(!node) tmp=ptList[ptNum-1];
			// New node defined by position along latest road segment, belonging to a sidewalk or similar.
			src=gis.osm.Way.Src.REF;
//lat2=lat;
//lon2=lon;
//console.log('FOO '+lat+' '+lon+' '+ll.llat+' '+ll.llon);
//			stream.readLong(dec,3);
			stream.readLong(dec,1);
//console.log(dlat+'\t'+gis.Q.toSigned(dec[1])+'\t'+dlon+'\t'+gis.Q.toSigned(dec[2]));
//			off=dec[0]/((dlat<0?-dlat:dlon)+(dlon<0?-dlon:dlon));
//dlat2=dlat;
//dlon2=dlon;
//			extraScale=(dlat2<0?-dlat2:dlat2)+(dlon2<0?-dlon2:dlon2);
var extraScale=1024;
off=dec[0]/extraScale;

latExtra=~~((lat<<detail)+(dlat*off-dlat)*(1<<detail)+roundOff*0)>>detail;
lonExtra=~~((lon<<detail)+(dlon*off-dlon)*(1<<detail)+roundOff*0)>>detail;
//console.log('FOO '+lat2+' '+lon2+' '+lat+' '+lon+' '+dlat2+' '+dlon2+' '+off);
//dlat+=lat-lat2;
//dlon+=lon-lon2;
//			ll=new gis.MU((lat<<detail)+~~((dlat*off-dlat)*(1<<detail))+roundOff,(lon<<detail)+~~((dlon*off-dlon)*(1<<detail))+roundOff);
//ll=new gis.MU((lat<<detail)+roundOff,(lon<<detail)+roundOff);
ll=new gis.MU(latExtra<<detail,lonExtra<<detail);
//lat=ll.llat>>detail;
//lon=ll.llon>>detail;
			node2=nodeSet.createNode(ll,true);

			keyLat=latExtra>>tileSize;
			keyLon=lonExtra>>tileSize;
			key=keyLat+' '+keyLon;

			group=importTbl[key];
			if(!group) importTbl[key]=[node2];
			else group.push(node2);

			ptList[ptNum-1]=node2;
			node2.addWay(this,ptNum-1);

			// TODO: this would be unnecessary with a better data model for merged lanes.
			if(!node2.nameRefList) node2.nameRefList=[];
			node2.nameRefList.push(this);
//lat=lat2;
//lon=lon2;
			if(!node) ptList[ptNum]=tmp;
		} else if(code==gis.osm.Way.Code.NAMEREF) {
			// Node on a sidewalk or similar that should be associated to this street.
			// TODO: this would be unnecessary with a better data model for merged lanes.
			stream.readLong(dec,1);

			node2=parseRef(dec[0]);

			if(!node2.nameRefList) node2.nameRefList=[];
			node2.nameRefList.push(this);

			src=gis.osm.Way.Src.NAMEREF;
			// The reference doesn't add anything to current way's geometry so disregard this point.
			ptNum--;
			ptCount--;
		} else {
			// Reference to a previously stored node.
			if(node) {
				ptList[ptNum-1]=node;
				node.addWay(this,ptNum-1);
			}

			node=parseRef(code);

			dlat=(node.ll.llat>>detail)-lat;
			dlon=(node.ll.llon>>detail)-lon;
			lat=node.ll.llat>>detail;
			lon=node.ll.llon>>detail;

			if(!ptNum) {
				dlat=0;
				dlon=0;
			}
		}
	}

	if(node) {
		ptList[ptNum-1]=node;
		node.addWay(this,ptNum-1);
	}

	if(getStats) {
		state.typeLen[src]+=stream.pos-pos;
		state.typeCount[src]++;
	}

	state.lat=lat;
	state.lon=lon;

	this.ptList=ptList;

	this.update();
};

gis.osm.Way.prototype.calcDist=function() {
	var distList;
	var dist;
	var llNum;
	var ll,llPrev;
	var ptList;
	var ptNum,ptCount;
	var pt;

	dist=0;
	distList=[dist];
	llNum=/** @type {Array.<gis.MU>} */ ([new gis.MU(0,0),new gis.MU(0,0)]);
	ll=null;

	ptList=this.ptList;
	ptCount=ptList.length;

	for(ptNum=this.ptStart;ptNum<ptCount;ptNum++) {
		pt=ptList[ptNum];
		if(!pt) continue;

		llPrev=ll;
		if(typeof(pt)=='number') {
			// Switch between two gis.MU objects to avoid creating one for every point.
			ll=llNum[ptNum&1].fromNum(pt);
		} else ll=pt.ll;

		if(llPrev) {
			dist+=llPrev.distTo(ll);
			distList[ptNum]=dist;
		}
	}

	this.distList=distList;
};

gis.osm.Way.prototype.getNodes=function() {
	var nodeList;
	var nodeCount;
	var nodeDistList;
	var distList;
	var ptList;
	var ptNum,ptCount;
	var pt;
	var posList;
	var wayList;
	var wayNum,wayCount;

	nodeList=[];
	nodeCount=0;

	nodeDistList=[];
	distList=this.distList;

	ptList=this.ptList;
	ptCount=ptList.length;

	for(ptNum=this.ptStart;ptNum<ptCount;ptNum++) {
		pt=ptList[ptNum];
		if(!pt || typeof(pt)=='number') continue;

		posList=pt.posList;
		wayList=pt.wayList;
		wayCount=wayList.length;

		for(wayNum=0;wayNum<wayCount;wayNum++) {
			if(wayList[wayNum]==this && posList[wayNum]==ptNum) posList[wayNum]=nodeCount;
		}

		nodeDistList[nodeCount]=distList[ptNum];
		nodeList[nodeCount++]=pt;
	}

	this.nodeList=nodeList;
	this.nodeDistList=nodeDistList;
};

/** @param {number} latSrc
  * @param {number} lonSrc
  * @param {number} pos
  * @param {number} posLast
  * @param {gis.osm.Way.Near} nearest
  * @param {number} dlatSrc
  * @param {number} dlonSrc
  * @param {number} angleWeight
  * @param {number} distExtra
  * @return {gis.osm.Way.Near} */
gis.osm.Way.prototype.findNearest=function(latSrc,lonSrc,pos,posLast,nearest,dlatSrc,dlonSrc,angleWeight,distExtra) {
	var ptList;
	var pt;
	var ll;
	var posPrev;
	var lat,latPrev,dlat,dlat2;
	var lon,lonPrev,dlon,dlon2;
	var dist;
	var offset;
	var dot,cross;

	posPrev=-1;
	ptList=this.ptList;

	for(;pos<=posLast;pos++) {
		pt=ptList[pos];
		if(!pt) continue;

		if(typeof(pt)=='number') ll=gis.MU.ll.fromNum(pt);
		else ll=pt.ll;

		latPrev=lat;
		lonPrev=lon;
		lat=ll.llat;
		lon=ll.llon;

		if(posPrev<0) {
			posPrev=pos;
			continue;
		}

		dlat=lat-latPrev;
		dlon=lon-lonPrev;
		dist=dlat*dlat+dlon*dlon;

		if(!dist) {
			posPrev=pos;
			continue;
		}

		// Project point (latSrc,lonSrc) to line segment
		// (Find position between (latPrev,lonPrev)-(lat,lon) closest to the point).
		offset=((latSrc-latPrev)*dlat+(lonSrc-lonPrev)*dlon)/dist;
		// If the position lies outside the line segment, move it to one of the end points.
		if(offset<0) offset=0;
		if(offset>1) offset=1;

		// Calculate distance from projected point to (latSrc,lonSrc).
		dlat2=(latPrev+dlat*offset)-latSrc;
		dlon2=(lonPrev+dlon*offset)-lonSrc;

		if(angleWeight) {
			// TODO: maybe dlat and dlon should be across a larger distance (3 points) if offset==0 or offset==1.
			dot=dlat*dlatSrc+dlon*dlonSrc;
			// Never consider perpendicular lines to be nearby.
			if(!dot) continue;

			cross=dlat*dlonSrc-dlon*dlatSrc;
			// Tangent*weight.
			distExtra=cross/dot*angleWeight;
		}

//		if(distExtra) {
//			if(dlat2<0) dlat2-=distExtra;else dlat2+=distExtra;
//			if(dlon2<0) dlon2-=distExtra;else dlon2+=distExtra;
//		}

		dist=dlat2*dlat2+dlon2*dlon2+distExtra*distExtra;

		if(dist<nearest.sqDist) {
			nearest.way=this;
			nearest.sqDist=dist;
			nearest.pos=posPrev;
			nearest.posNext=pos;
			nearest.offset=offset;

			nearest.lat=dlat2+latSrc;
			nearest.lon=dlon2+lonSrc;
        }

		posPrev=pos;
	}
};

/** @param {string} name
  * @return {string} Name in lowercase without punctuation or whitespace. */
gis.osm.Way.trimName=function(name) {
	return(name.toLowerCase().replace(/ [0-9]+ *[A-Za-z]{0,2}$/,'').replace(/[-.' ]/g,''));
};

/** @param {string} name
  * @return {boolean} */
gis.osm.Way.prototype.matchName=function(name) {
	return(gis.osm.Way.trimName(this.name)==name);
};

gis.osm.Way.prototype.update=function() {
	this.important=this.profile.getImportant(this.name);
};
