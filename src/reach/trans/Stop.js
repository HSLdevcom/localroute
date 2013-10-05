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
//goog.require('reach.road.Node');
//goog.require('reach.util');
goog.require('gis.MU');
//goog.require('reach.data.QuadTreeItem');

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
	/** @type {Array.<reach.road.Node>} Street network node that led to this stop. */
	this.srcNodeList;
	/** @type {Array.<reach.trans.Trip>} Trip along a transit line that led to this stop. */
	this.srcTripList;
	/** @type {Array.<number>} Offset of this stop along source trip. */
	this.srcPosList;

	// For backtracking.
	/** @type {number} */
	this.lastVisitTime;
	/** @type {Array.<number>} */
	this.lastTimeList;
	/** @type {Array.<reach.trans.Trip>} */
	this.lastTripList;
	/** @type {Array.<{time:number,cost:number,trip:reach.trans.Trip}>} */
	this.reverseDataList;
	/** @type {reach.route.result.LegRef} */
//	this.endWalk;

	// Links connecting stop to road network.
	/** @type {reach.road.Node} Nearest fast road graph node. */
	this.node;

	// Time table statistics used when compressing and decompressing.
	/** @type {Object.<number,number>} */
	this.followerTbl;
	/** @type {Array.<reach.trans.Stop>} */
	this.followerList;
	/** @type {number} */
	this.followerCount;
	/** @type {Array.<number>} */
	this.packNumList;
	/** @type {number} */
	this.packCount;

	/** @type {Array.<Array.<number>>} */
	this.durationsTo;
	/** @type {Array.<{mean:number,variance:number}>} */
	this.statsTo;

	/** @type {reach.loc.Location} */
	this.loc;

	/** @type {number} Number of departures around search start time, to evaluate stop niceness. */
	this.departureCount;

	/** @type {boolean} */
	this.disabled;
};

/** @param {reach.trans.Stop} next
  * @param {number} duration */
/*
reach.trans.Stop.prototype.addFollower=function(next,duration) {
	var followerNum;

*/
//	if(!this.durationsTo) this.durationsTo=/** @type {Array.<Array.<number>>} */ [];
/*
	followerNum=this.followerTbl[next.id];
	if(!followerNum && followerNum!==0) {
//		followerNum=this.followerList.length;
		followerNum=this.followerCount++;
		this.followerTbl[next.id]=followerNum;
//		this.followerList.push(next);
*/
//		this.durationsTo.push(/** @type {Array.<number>} */ ([duration]));
/*
	} else {
		this.durationsTo[followerNum].push(duration);
	}
};
*/

// This is only used for compressing data.
/** @param {number} statMul */
reach.trans.Stop.prototype.calcStats=function(statMul) {
	var followerNum,followerCount;
	var sampleNum,sampleCount;
	var stats;
	var mean,stdDev;
	var duration,err;
	var durationList,filteredList;

	followerCount=this.durationsTo.length;

	for(followerNum=0;followerNum<followerCount;followerNum++) {
		durationList=this.durationsTo[followerNum];
		stats=gis.Q.getStats(durationList);

		// Try to find errors if variance is over 1 minute.
		if(stats.variance>1) {
			sampleCount=durationList.length;
			stdDev=Math.sqrt(stats.variance);
			mean=stats.mean;

			filteredList=[];

			for(sampleNum=0;sampleNum<sampleCount;sampleNum++) {
				duration=durationList[sampleNum];
				err=(duration-mean)/stdDev;

				// If difference from mean is 3 sigma or less, accept data point.
				if(err>=-3 && err<=3) filteredList.push(duration);
				//else console.log(this.name+' -> '+this.followerList[followerNum].name+' mean '+mean+' dev '+stdDev+' sample '+duration+' error '+err);
			}

			stats=gis.Q.getStats(filteredList);
		}

//console.log(stats.variance);
		stats.mean=~~(stats.mean+0.5);
		stats.variance=~~(stats.variance+0.5);

		this.statsTo[followerNum]=stats;
	}
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
