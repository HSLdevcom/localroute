/*
	This file is part of LocalRoute.js.

	Copyright (C) 2012, 2013 BusFaster Oy

	LocalRoute.js is free software: you can redistribute it and/or modify it
	under the terms of the GNU Lesser General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	LocalRoute.js is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Lesser General Public License for more details.

	You should have received a copy of the GNU Lesser General Public License
	along with LocalRoute.js.  If not, see <http://www.gnu.org/licenses/>.
*/

goog.provide('reach.trans.Stop');
goog.require('gis.MU');

/** @constructor
  * @param {string} origId
  * @param {string} name
  * @param {gis.MU} ll */
reach.trans.Stop=function(origId,name,ll) {
	/** @type {number} */
	this.id=0;
	/** @type {string} */
	this.origId=origId;
	/** @type {string} */
	this.name=name;
	/** @type {gis.MU} */
	this.ll=ll;

	// Links connecting stop to transit network.
	/** @type {Array.<reach.trans.Line>} Transit lines passing by this stop. */
	this.lineList=[];
	/** @type {Array.<number>} How many stops are passed along each transit line before reaching this stop. */
	this.posList=[];

    /** @type {Object.<reach.trans.Trip.Mode,boolean>} */
    this.transModeTbl;

	// Routing data to store how stop was reached etc.
	/** @type {number} */
	this.runId;
	/** @type {number} */
	this.cost;
	/** @type {number} */
	this.time;

	// Time table statistics used when compressing and decompressing.
	/** @type {Object.<number,number>} */
	this.followerTbl;
	/** @type {Array.<reach.trans.Stop>} */
	this.followerList;
	/** @type {number} */
	this.followerCount;
	/** @type {Object.<number,number>} */
	this.packNumTbl;
	/** @type {number} */
	this.packCount;

	/** @type {number} Number of departures around search start time, to evaluate stop niceness. */
	this.departureCount;

	/** @type {boolean} */
	this.disabled;
};

/** @return {Array.<{time:number,trip:reach.trans.Trip}>} */
reach.trans.Stop.prototype.getArrivals=function() {
	var lineList;
	var lineNum,lineCount;
	var line;
	var posList;
	var pos;
	var tripList;
	var tripNum,tripCount;
	var trip;
	var outList;

	outList=/** @type {Array.<{time:number,trip:reach.trans.Trip}>} */ ([]);
	posList=this.posList;

	lineList=this.lineList;
	lineCount=lineList.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=lineList[lineNum];
		pos=posList[lineNum];

		tripList=line.tripList;
		tripCount=tripList.length;
		for(tripNum=0;tripNum<tripCount;tripNum++) {
			trip=tripList[tripNum];

			outList.push({'time':trip.getArrival(pos),'trip':trip});
		}
	}

	outList.sort(function(a,b) {return(a.time-b.time);});

	return(outList);
};
