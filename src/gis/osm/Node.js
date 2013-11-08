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

goog.provide('gis.osm.Node');
goog.require('gis.Obj');
goog.require('gis.MU');

/** @constructor
  * @param {gis.MU} ll */
gis.osm.Node=function(ll) {
	/** @type {gis.MU} */
	this.ll=ll;
	/** @type {Array.<gis.osm.Way>} List of ways passing through this node. */
	this.wayList=[];
	/** @type {Array.<number>} Node position along each way passing through it. */
	this.posList=[];
	/** @type {number} ID used as temporary value in various searches. */
	this.iterId;

	/** @type {Object.<string,string>} */
	this.tagTbl;
};

/** @param {gis.osm.Way} way
  * @param {number} pos */
gis.osm.Node.prototype.addWay=function(way,pos) {
	this.wayList.push(way);
	this.posList.push(pos);
};

/** @param {gis.osm.Way} way
  * @param {number} pos */
gis.osm.Node.prototype.removeWay=function(way,pos) {
	var wayList;
	var wayNum,wayCount;
	var posList;

	wayList=this.wayList;
	wayCount=wayList.length;
	if(wayCount<2) {
		if(wayCount==1 && wayList[0]!=way) console.log('ERROR removeWay');
		this.wayList=[];
		this.posList=[];
		return;
	}

	posList=this.posList;

	for(wayNum=wayCount;wayNum--;) {
		if(wayList[wayNum]==way && posList[wayNum]==pos) {
			wayList.splice(wayNum,1);
			posList.splice(wayNum,1);
			return;
		}
	}
};

gis.osm.Node.prototype.check=function(msg) {
	var posList;
	var wayList;
	var wayNum,wayCount;

	posList=this.posList;
	wayList=this.wayList;
	wayCount=wayList.length;

	for(wayNum=wayCount;wayNum--;) {
		if(posList[wayNum]>=wayList[wayNum].ptList.length) console.log('ERROR '+msg);
	}
};
