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

goog.provide('gis.osm.QuadTile');
goog.require('gis.Obj');

/** @constructor
  * @param {gis.geom.BB} bb */
gis.osm.QuadTile=function(bb) {
	/** @type {gis.geom.BB} */
	this.bb=bb;
	/** @type {number} */
	this.latSplit=bb.lat1+((bb.lat2-bb.lat1)>>>1);
	/** @type {number} */
	this.lonSplit=bb.lon1+((bb.lon2-bb.lon1)>>>1);

	/** @type {Array.<gis.osm.QuadTile>} 4 sub-quads at tree branches. */
	this.quadList;

	/** @type {Array.<gis.osm.Way>} */
	this.wayList=[];
	/** @type {Array.<number>} */
	this.firstList=[];
	/** @type {Array.<number>} */
	this.lastList=[];

	/** @type {Array.<gis.MU>} */
	this.probeList=[];
	/** @type {Array.<number>} */
	this.probeWayList=[];
	/** @type {Array.<number>} */
	this.probePosList=[];

	/** @type {number} */
	this.ptCount=0;
};

/** @enum {number} */
gis.osm.QuadTile.Pos={
	SW:0,
	SE:1,
	NW:2,
	NE:3
};

/** @param {number} lat
  * @param {number} lon
  * @param {boolean} create
  * @return {gis.osm.QuadTile} */
gis.osm.QuadTile.prototype.getNext=function(lat,lon,create) {
	var latSplit,lonSplit;
	var quadNum;
	var tile;
	var bb;

	if(!this.quadList) return(null);

	latSplit=this.latSplit;
	lonSplit=this.lonSplit;

	if(lat>=latSplit) quadNum=gis.osm.QuadTile.Pos.NW;
	else quadNum=gis.osm.QuadTile.Pos.SW;

	if(lon>=lonSplit) quadNum+=gis.osm.QuadTile.Pos.SE-gis.osm.QuadTile.Pos.SW;

	tile=this.quadList[quadNum];
	if(!tile && create) {
		bb=this.bb;
		bb=new gis.geom.BB(bb.lat1,bb.lon1,bb.lat2,bb.lon2);

		if(lat>=latSplit) bb.lat1=latSplit;
		else bb.lat2=latSplit;

		if(lon>=lonSplit) bb.lon1=lonSplit;
		else bb.lon2=lonSplit;

		tile=new gis.osm.QuadTile(bb);

		this.quadList[quadNum]=tile;
	}

	return(tile);
};

/** Try to insert part of way between posFirst and posLast into tile, stop if a point is outside tile
  * (but insert way up to and including that point).
  * @param {gis.osm.Way} way
  * @param {number} posFirst
  * @param {number} posLast
  * @return {number} Position of last point that fit in tile, plus one. */
gis.osm.QuadTile.prototype.insertWayLeaf=function(way,posFirst,posLast) {
	var pos;
	var ptList;
	var pt;
	var ll;
	var lat,lat1,lat2;
	var lon,lon1,lon2;

	ptList=way.ptList;

	lat1=this.bb.lat1;
	lon1=this.bb.lon1;
	lat2=this.bb.lat2;
	lon2=this.bb.lon2;

	for(pos=posFirst;pos<=posLast;pos++) {
		pt=ptList[pos];
		if(!pt) continue;

		if(typeof(pt)=='number') ll=gis.MU.ll.fromNum(pt);
		else ll=pt.ll;

		lat=ll.llat;
		lon=ll.llon;

		if(lat<lat1 || lat>=lat2 || lon<lon1 || lon>=lon2) break;
	}

	if(pos<posLast) posLast=pos;

	this.wayList.push(way);
	this.firstList.push(posFirst);
	this.lastList.push(posLast);

	this.ptCount+=posLast-posFirst+1;

	return(pos);
};

// TODO: make this handle branches as well as leaves.
/** @param {number} lat
  * @param {number} lon
  * @param {gis.osm.Way} way
  * @param {number} posFirst
  * @param {number} posLast */
gis.osm.QuadTile.prototype.insertWaySub=function(lat,lon,way,posFirst,posLast) {
	var tile;

	tile=this.getNext(lat,lon,true);
	tile.wayList.push(way);
	tile.firstList.push(posFirst);
	tile.lastList.push(posLast);
	tile.ptCount+=posLast-posFirst+1;
};

/** @param {number} lat
  * @param {number} lon
  * @param {number} latPrev
  * @param {number} lonPrev
  * @param {boolean} latSide
  * @param {boolean} lonSide
  * @param {boolean} latSidePrev
  * @param {boolean} lonSidePrev
  * @return {boolean} */
gis.osm.QuadTile.prototype.splitBoxTest=function(lat,lon,latPrev,lonPrev,latSide,lonSide,latSidePrev,lonSidePrev) {
	var latTest,lonTest;

	if(lonSide!=lonSidePrev && (latPrev<this.bb.lat1 || latPrev>=this.bb.lat2)) {
		// Entered bounding box from north or south crossing between east and west so need to check if previous quad was entered at all.
		if(latPrev<this.bb.lat1) latTest=this.bb.lat1;
		else latTest=this.bb.lat2;
		lonTest=(lon-lonPrev)*(latTest-latPrev)/(lat-latPrev)+lonPrev;
		if((lonTest>=this.lonSplit)==lonSide) return(false);
	}

	if(latSide!=latSidePrev && (lonPrev<this.bb.lon1 || lonPrev>=this.bb.lon2)) {
		// Entered bounding box from east or west crossing between north and south so need to check if previous quad was entered at all.
		if(lonPrev<this.bb.lon1) lonTest=this.bb.lon1;
		else lonTest=this.bb.lon2;
		latTest=(lat-latPrev)*(lonTest-lonPrev)/(lon-lonPrev)+latPrev;
		if((latTest>=this.latSplit)==latSide) return(false);
	}

	return(true);
};

/** Split way into sub-quads.
  * @param {gis.osm.Way} way
  * @param {number} posFirst
  * @param {number} posLast
  * @param {number} latSplit
  * @param {number} lonSplit */
gis.osm.QuadTile.prototype.splitWay=function(way,posFirst,posLast,latSplit,lonSplit) {
	var pos,posPrev,posSplit;
	var ptList;
	var pt;
	var ll;
	var lat,lon,latPrev,lonPrev,lonTest;
	var latSide,lonSide,latSidePrev,lonSidePrev;
	var ptCount;

	ptList=way.ptList;
	ptCount=0;

	posSplit=posFirst;
	// Initialize variables to keep Closure Compiler happy.
	lat=0;latPrev=0;latSide=false;latSidePrev=false;
	lon=0;lonPrev=0;lonSide=false;lonSidePrev=false;
	posPrev=-1;

	for(pos=posFirst;pos<=posLast;pos++) {
		pt=ptList[pos];
		if(!pt) continue;

		latPrev=lat;
		lonPrev=lon;
		latSidePrev=latSide;
		lonSidePrev=lonSide;

		if(typeof(pt)=='number') ll=gis.MU.ll.fromNum(pt);
		else ll=pt.ll;

		lat=ll.llat;
		lon=ll.llon;
		latSide=lat>=latSplit;
		lonSide=lon>=lonSplit;

		// Do nothing for first point or while staying in the same quad.
		if(!ptCount++ || (latSide==latSidePrev && lonSide==lonSidePrev)) {
			posPrev=pos;
			continue;
		}

		// Check if crossing quads diagonally.
		if(latSide!=latSidePrev && lonSide!=lonSidePrev) {
			// Check which adjacent quad was visited.
			lonTest=(lon-lonPrev)*(latSplit-latPrev)/(lat-latPrev)+lonPrev;
			// Test which side of lonSplit the way crosses the latSplit line.
			// Check whether it's the same side as the quad where the way went
			// to or came from, find the quad on the other side of latSplit
			// from that quad and add the way there.
			if((lonTest>=this.lonSplit)==lonSide) {
				// Here -0.5 is because lon>=lonSplit needs to flip also when lon==lonSplit.
				this.insertWaySub(latSplit+(latSplit-lat)-0.5,lon,way,posPrev,pos);
			} else {
				this.insertWaySub(latSplit+(latSplit-latPrev)-0.5,lonPrev,way,posPrev,pos);
			}
		}

		// Check if bounding box was entered from outside passing over a sub-quad.
		if(ptCount==2 && !this.splitBoxTest(lat,lon,latPrev,lonPrev,latSide,lonSide,latSidePrev,lonSidePrev)) continue;

		// Split way crossing to another quad.
		this.insertWaySub(latPrev,lonPrev,way,posSplit,pos);

		posSplit=posPrev;
		posPrev=pos;
	}

	// Check if bounding box was exited passing over a sub-quad.
	if(posSplit==posPrev && !this.splitBoxTest(latPrev,lonPrev,lat,lon,latSidePrev,lonSidePrev,latSide,lonSide)) return;

	this.insertWaySub(lat,lon,way,posSplit,posLast);
};

/** @param {number} maxNodes
  * @param {number=} depth */
gis.osm.QuadTile.prototype.split=function(maxNodes,depth) {
	var latSplit,lonSplit;
	var quadNum;
	var wayList;
	var wayNum,wayCount;
	var way;
	var bb;
//	var probeList;
//	var probeNum,probeCount;
	var firstList,lastList;
	var posFirst,posLast;
	var tile;

//	console.log('\t'+this.ptCount+' tile nodes.');
	if(this.ptCount<=maxNodes) return;

	if(!depth) depth=0;

	this.quadList=/** @type {Array.<gis.osm.QuadTile>} */ ([]);

	wayList=this.wayList;
	firstList=this.firstList;
	lastList=this.lastList;

	this.wayList=null;
	this.firstList=null;
	this.lastList=null;

	latSplit=this.latSplit;
	lonSplit=this.lonSplit;

	wayCount=wayList.length;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		posFirst=firstList[wayNum];
		posLast=lastList[wayNum];

		bb=way.getBB();
		if((bb.lat2<latSplit || bb.lat1>=latSplit) && (bb.lon2<lonSplit || bb.lon1>=lonSplit)) {
			// Way's bounding box is inside a sub-quad's bounding box so it goes entirely inside.
			this.insertWaySub(bb.lat1,bb.lon1,way,posFirst,posLast);
		} else {
			// Way may need splitting to several sub-quads.
			this.splitWay(way,posFirst,posLast,latSplit,lonSplit);
		}
	}

	this.wayList=null;
	this.firstList=null;
	this.lastList=null;

	if(depth>30) return;

	for(quadNum=0;quadNum<4;quadNum++) {
		tile=this.quadList[quadNum];
		if(tile) tile.split(maxNodes,depth+1);
	}
};

/** Find way closest to a point.
  * @param {number} lat
  * @param {number} lon
  * @param {string} name
  * @param {gis.osm.Way.Near} nearest
  * @param {number} dlatSrc
  * @param {number} dlonSrc
  * @param {number} angleWeight
  * @param {number} scale
  * @param {function(gis.osm.Way):number} checker
  * @return {gis.osm.Way.Near} */
gis.osm.QuadTile.prototype.findWay=function(lat,lon,name,nearest,dlatSrc,dlonSrc,angleWeight,scale,checker) {
	var firstList,lastList;
	var accept;
	var wayList;
	var wayNum,wayCount;
	var way;

	firstList=this.firstList;
	lastList=this.lastList;
	accept=0;

	wayList=this.wayList;
	wayCount=wayList.length;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		if(way.deleted) continue;
		if(name && !way.matchName(name)) continue;
		if(checker) {
			accept=checker(way);
			if(!accept) continue;
			accept=(accept-1)/scale;
		}

		way.findNearest(lat,lon,firstList[wayNum],lastList[wayNum],nearest,dlatSrc,dlonSrc,angleWeight,accept);
	}

	return(nearest);
};
