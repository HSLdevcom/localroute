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

goog.provide('gis.osm.QuadTree');
goog.require('gis.Obj');
goog.require('gis.osm.QuadTile');

/** @constructor
  * @param {gis.geom.BB} bb */
gis.osm.QuadTree=function(bb) {
	/** @type {gis.osm.QuadTile} */
	this.root=new gis.osm.QuadTile(bb);

	/** @type {gis.osm.QuadTile} */
	this.top=this.root;

	/** @type {gis.geom.BB} */
	this.bb=bb;
};

/** Find lowest quadtree tile completely containing bounding box.
  * @param {gis.geom.BB} bb
  * @return {gis.osm.QuadTile} */
gis.osm.QuadTree.prototype.findEnclosing=function(bb) {
	var latSplit,lonSplit;
	var tile,next;
	var lat1,lon1,lat2,lon2;

	lat1=bb.lat1;
	lon1=bb.lon1;
	lat2=bb.lat2;
	lon2=bb.lon2;

	// This is always a valid tile.
	next=this.top;
	if(lat1<next.bb.lat1 || lat2>=next.bb.lat2 || lon1<next.bb.lon1 || lon2>=next.bb.lon2) next=this.root;

	do {
		tile=next;
		latSplit=tile.latSplit;
		lonSplit=tile.lonSplit;

		// If tile's center meridian or circle of latitude crosses the bounding box, tile is the innermost tile containing the box.
		if((lat1<latSplit && lat2>=latSplit) || (lon1<lonSplit && lon2>=lonSplit)) return(tile);

		next=tile.getNext(lat1,lon1,false);
    } while(next);

    return(tile);
};

/** @param {gis.osm.Way} way */
gis.osm.QuadTree.prototype.insertWay=function(way) {
	var tile;

	tile=this.findEnclosing(way.getBB());

	if(tile.quadList) {/* TODO */}
	else tile.insertWayLeaf(way,0,way.ptList.length-1);
};

/** @param {number} lat
  * @param {number} lon
  * @param {string} name
  * @param {number} snapDist
  * @param {gis.osm.QuadTile} root
  * @param {number} dlatSrc
  * @param {number} dlonSrc
  * @param {number} angleWeight
  * @param {function(gis.osm.Way):number} checker
  * @return {gis.osm.Way.Near} */
gis.osm.QuadTree.prototype.findWay=function(lat,lon,name,snapDist,root,dlatSrc,dlonSrc,angleWeight,checker) {
	var scale;
	/** @type {Array.<gis.osm.QuadTile>} */
	var tileStack;
	var stackPos;
	var nearest,sentinel;

	scale=gis.MU.getScale(lat).north;
	snapDist/=scale;
	angleWeight/=scale;
//	scale*=Math.sqrt(2);

	tileStack=/** @type {Array.<gis.osm.QuadTile>} */ ([root]);
	stackPos=1;
	sentinel=/** @type {gis.osm.Way.Near} */ ({way:null,sqDist:snapDist*snapDist,pos:0,posNext:0,offset:0});
	nearest=sentinel;
	if(name) name=gis.osm.Way.trimName(name);

	/** @return {gis.osm.Way.Near} */
	function advance() {
		var quadList;
		var quadNum;
		var tile,next;
		var sqDist;

		while(stackPos>0) {
			tile=tileStack[--stackPos];
			sqDist=tile.bb.sqDistTo(lat,lon);
			if(sqDist>nearest.sqDist) continue;

			quadList=tile.quadList;
			if(!quadList) {
				nearest=tile.findWay(lat,lon,name,nearest,dlatSrc,dlonSrc,angleWeight,scale,checker);
				continue;
			}

			next=tile.getNext(lat,lon,false);

			for(quadNum=0;quadNum<4;quadNum++) {
				tile=quadList[quadNum];
				if(tile && tile!=next) tileStack[stackPos++]=tile;
			}

			if(next) tileStack[stackPos++]=next;
		}

		return(nearest);
	}

	return(advance());
};

/** For debugging. Do not remove, this will be useful later!
  * @param {function(string)} write */
gis.osm.QuadTree.prototype.exportKML=function(write) {
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
		'<Style id="redPoly"><LineStyle><color>ffc0c000</color><width>1</width></LineStyle><PolyStyle><color>80000080</color><width>3</width></PolyStyle></Style>\n'+
		'<Style id="yellowPoly"><LineStyle><color>ffc0c000</color><width>1</width></LineStyle><PolyStyle><color>80008080</color><width>3</width></PolyStyle></Style>\n';
	write(txt);

	/** @param {gis.osm.QuadTile} tile */
	function rec(tile) {
		var quadList;
		var quadNum;
		var sw,ne;
		var firstList;
		var lastList;

		quadList=tile.quadList;
		if(quadList) {
			for(quadNum=0;quadNum<4;quadNum++) {
				tile=quadList[quadNum];
				if(tile) rec(tile);
			}
			return;
		}

		sw=new gis.MU(tile.bb.lat1,tile.bb.lon1).toDeg();
		ne=new gis.MU(tile.bb.lat2,tile.bb.lon2).toDeg();

		if(sw.llat<60.168 || ne.llat>60.179 || sw.llon<24.930 || ne.llon>24.951) return;

		wayList=tile.wayList;
		firstList=tile.firstList;
		lastList=tile.lastList;

		txt='<Folder>\n'+
			'<name>'+tile.bb+'</name>\n'+
			'<Placemark>\n'+
			'<Polygon><outerBoundaryIs><LinearRing>\n'+
			'<coordinates>\n'+
			sw.llon+','+sw.llat+',0\n'+
			ne.llon+','+sw.llat+',0\n'+
			ne.llon+','+ne.llat+',0\n'+
			sw.llon+','+ne.llat+',0\n'+
			'</coordinates>\n'+
			'</LinearRing></outerBoundaryIs></Polygon>\n'+
//			'<styleUrl>'+(debug?'yellowPoly':'redPoly')+'</styleUrl>\n'+
			'</Placemark>\n';
		write(txt);

		wayCount=wayList.length;

		for(wayNum=0;wayNum<wayCount;wayNum++) {
			way=wayList[wayNum];

			txt='<Placemark>\n'+
				'<name>'+(way.name||'')+'</name>\n'+
				'<MultiGeometry>\n'+
				'<LineString>\n'+
				'<coordinates>\n';
			write(txt);

			ptList=way.ptList;
			ptCount=ptList.length;

			txt='';
			for(ptNum=firstList[wayNum];ptNum<=lastList[wayNum];ptNum++) {
				pt=ptList[ptNum];
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

		txt='</Folder>\n';
		write(txt);
	}

	rec(this.root);

	txt='</Document>\n'+
		'</kml>\n';
	write(txt);
};
