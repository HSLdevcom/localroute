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

goog.provide('gis.osm.WayChain');
goog.require('gis.Obj');
goog.require('gis.osm.Way');

/** @constructor
  * @param {gis.osm.Way} way1
  * @param {gis.osm.Way} way2 */
gis.osm.WayChain=function(way1,way2) {
	/** @type {Array.<gis.osm.Way>} */
	this.wayList=[way1,way2];
	/** @type {boolean} */
	this.deleted;
};

/** @param {gis.osm.Way} way
  * @return {gis.osm.WayChain} */
gis.osm.WayChain.prototype.insert=function(way) {
	this.wayList.push(way);
	return(this);
};

/** @param {gis.osm.WayChain} other
  * @return {gis.osm.WayChain} */
gis.osm.WayChain.prototype.merge=function(other) {
	var wayList;
	var wayNum,wayCount;

	if(other==this) return(this);
//	Array.prototype.push.apply(this.wayList,other.wayList);
	this.wayList=this.wayList.concat(other.wayList);

	wayList=other.wayList;
	wayCount=wayList.length;
	for(wayNum=0;wayNum<wayCount;wayNum++) wayList[wayNum].chain=this;

	other.deleted=true;
	return(this);
};

gis.osm.WayChain.prototype.catenateWays=function() {
	var wayList;
	var wayNum,wayCount,otherNum;
	var way,other;
	var first,last,otherFirst,otherLast;

	wayList=this.wayList;
	wayCount=wayList.length;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		way=wayList[wayNum];
		way.chain=null;
		if(way.deleted) continue;

		first=way.ptList[way.ptStart];
		last=way.ptList[way.ptList.length-1];

		if(typeof(first)=='number') first=null;
		if(typeof(last)=='number') last=null;

		for(otherNum=wayNum+1;otherNum<wayCount;otherNum++) {
			other=wayList[otherNum];
			if(other.deleted || other==way) continue;
			otherFirst=other.ptList[other.ptStart];
			otherLast=other.ptList[other.ptList.length-1];

			if(typeof(otherFirst)=='number') otherFirst=null;
			if(typeof(otherLast)=='number') otherLast=null;

			if(otherFirst==last && last) {
				way.merge(other);
				last=otherLast;
				continue;
			}

			if(otherLast==first && first) {
				other.merge(way);
				way=other;
				first=otherFirst;
				continue;
			}

			if(!way.profile.oneway) {
				if(otherLast==last && last) {
					other.reverse();
					way.merge(other);
					last=otherFirst;
					continue;
				}

				if(otherFirst==first && first) {
					other.reverse();
					other.merge(way);
					way=other;
					first=otherLast;
					continue;
				}
			}
		}
	}
};
