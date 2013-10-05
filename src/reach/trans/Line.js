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

goog.provide('reach.trans.Line');
goog.require('reach.trans.Stop');
//goog.require('reach.trans.Trip');
//goog.require('reach.util');

/** @constructor */
reach.trans.Line=function() {
	/** @type {number} */
	this.id=0;

	/** @type {Array.<reach.trans.Stop>} */
	this.stopList=[];
	/** @type {Array.<reach.trans.Trip>} */
	this.tripList=[];
	/** @type {Array.<number>} */
	this.distList=[];
	/** @type {Array.<number>} */
	this.followerList;
	/** @type {number} */
	this.tripCount=0;
	this.deltaStopList;

	/** @type {Array.<number>} Average time in minutes from first stop to reach each stop along the line. */
	this.arriveMean=[0];
	/** @type {Array.<number>} */
	this.arriveVariance=[0];
	this.duration;

	/** @type {Object.<number,number>} Used to filter out line if none of its trips use an allowed mode of transportation. */
	this.transModeTbl={};

	/** @type {number} */
	this.runId=0;
	/** @type {number} */
	this.firstPos=0;
	/** @type {Array.<number>} */
	this.costList=[];
	/** @type {Array.<number>} */
	this.timeList=[];

	/** @type {number} Number of departures around search start time, to evaluate line niceness. */
	this.departureCount=0;
};

reach.trans.Line.prototype.calcStats=function() {
	var followerList;
	var stopList;
	var stopNum,stopCount;
	var stop;
	var stats;
	var arriveMean;
	var arriveVariance;
	var deltaStopList;
	var deltaCount;
	var duration;
	var varianceSum;

	followerList=this.followerList;
	stopList=this.stopList;
	stopCount=stopList.length;
	arriveMean=[];
	arriveVariance=[];
	deltaStopList=[];
	deltaCount=0;
	duration=0;
	varianceSum=0;

	for(stopNum=0;stopNum<stopCount-1;stopNum++) {
		stop=stopList[stopNum];
		stats=stop.statsTo[followerList[stopNum]];
		duration+=stats.mean;
		varianceSum+=stats.variance;
		arriveMean[stopNum]=duration;
		arriveVariance[stopNum]=varianceSum;

		if(!stats.variance) continue;

		deltaStopList[deltaCount++]=stopNum+1;
	}

	this.arriveMean=arriveMean;
	this.arriveVariance=arriveVariance;
	this.deltaStopList=deltaStopList;
	this.duration=duration;

	stopCount--;
	if(deltaCount) deltaCount--;
};

/** @param {number} departTime Unit: minutes from midnight.
  * @return {number} */
/*
reach.trans.Line.prototype.findDeparture=function(departTime) {
	var first,last,mid;
	var trip;

	mid=0;
	first=0;
	last=this.tripList.length-1;
	// Binary search to find when the next bus of this line arrives.
	while(first<=last) {
		mid=(first+last)>>1;
		trip=this.tripList[mid];
		if(trip.startTime<departTime) first=mid+1;
		else if(trip.startTime>departTime) last=mid-1;
		else break;
	}

	return(mid);
};
*/

/** @param {number} time
  * @param {number} stopNum
  * @param {number} tripNum
  * @param {number} arrivalTime
  * @param {number} delta
  * @param {number} last
  * @return {Array.<number>} */
/*
reach.trans.Line.prototype.nextArrival=function(time,stopNum,tripNum,arrivalTime,delta,last,conf) {
	var prevTime;
	var prevNum;
	var trip;
	var transferTime;

	prevNum=tripNum;
	prevTime=arrivalTime;
	tripNum+=delta;

	for(;tripNum>=0 && tripNum<=last;tripNum+=delta) {
		trip=this.tripList[tripNum];
		if(!trip.getTransitCost(conf)) continue;
		transferTime=trip.getTransferTime(conf.forward,conf);

		arrivalTime=trip.guessArrival(stopNum)*60*conf.timeDiv;
		if((time+transferTime-arrivalTime)*delta>0) {
			prevNum=tripNum;
			prevTime=arrivalTime;
		} else return([tripNum,arrivalTime,prevNum,prevTime]);
	}

	return([tripNum,arrivalTime,prevNum,prevTime]);
}
*/

/** @param {number} stopNum   
  * @param {number} time   
  * @return {?{trip:reach.trans.Trip,time:number}} */
/*
reach.trans.Line.prototype.guessArrival=function(stopNum,time,conf) {
	type {reach.trans.Line}
	var self=this;
	var departTime,arrivalTime,prevTime;
	var trip;
	var tripNum,last;
	var forward;
	var transitCost;
	var transferTime;
	var prevNum;
	var near;

	if(this.tripList.length==0) return(null);

	forward=conf.forward;
	departTime=time/(60*conf.timeDiv)-this.meanDuration[stopNum]/this.lineSet.city.statMul;

	tripNum=this.findDeparture(departTime);
	trip=this.tripList[tripNum];
	// These crazy variables are here because technically different trips on the same could have different modes of transport...
	// Should get rid of them and split the line to two different ones if something that insane happens in the data.
	transitCost=trip.getTransitCost(conf);
	transferTime=trip.getTransferTime(forward,conf);

	arrivalTime=trip.guessArrival(stopNum)*60*conf.timeDiv;
	last=this.tripList.length-1;

	prevNum=tripNum;
	prevTime=arrivalTime;

	if((forward && arrivalTime>time+transferTime) || (!forward && arrivalTime<time+transferTime) || !transitCost) {
		// Check if there's an even earlier arrival.
		near=this.nextArrival(time+transferTime,stopNum,tripNum,prevTime,forward?-1:1,last,conf);
		tripNum=near[2];
		arrivalTime=near[3];

		trip=this.tripList[tripNum];
		transitCost=trip.getTransitCost(conf);
		transferTime=trip.getTransferTime(forward,conf);
	}

	if((forward && arrivalTime<time+transferTime) || (!forward && arrivalTime>time+transferTime) || !transitCost) {
		// The transport went already so find a later arrival.
		near=this.nextArrival(time+transferTime,stopNum,tripNum,prevTime,forward?1:-1,last,conf);
		tripNum=near[0];
		arrivalTime=near[1];
		if(tripNum<0 || tripNum>last) return(null);

		trip=this.tripList[tripNum];
		transitCost=trip.getTransitCost(conf);
		transferTime=trip.getTransferTime(forward,conf);
	}

	if((forward && arrivalTime<time+transferTime) || (!forward && arrivalTime>time+transferTime) || !transitCost) return(null);

	return({trip:trip,time:arrivalTime,tripNum:tripNum});
};
*/
