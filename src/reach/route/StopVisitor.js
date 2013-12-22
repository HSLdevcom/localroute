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

/** @fileoverview Visitor for entering vehicles and road network
  * from public transit stops in Dijkstra-style routing.
  * Dijkstra's algorithm has been modified to store visitors
  * instead of graph nodes in its priority queue. */

goog.provide('reach.route.StopVisitor');
goog.require('gis.Obj');
goog.require('reach.route.Visitor');
goog.require('reach.route.TripVisitor');
goog.require('reach.trans.Stop');

/** @constructor
  * @extends {reach.route.Visitor} */
reach.route.StopVisitor=function() {
	reach.route.Visitor.call(this);

	/** @type {reach.trans.Stop} Stop to visit. */
	this.stop;

	/** @type {reach.route.StopVisitor} Next item for linked list of free visitors. */
	this.next;
};

gis.inherit(reach.route.StopVisitor,reach.route.Visitor);

/** @type {reach.route.StopVisitor} Linked list of free visitors. */
reach.route.StopVisitor.freeItem=null;

/** Allocate and populate a new visitor.
  * @param {reach.route.Dijkstra} dijkstra
  * @param {reach.trans.Stop} stop Stop to visit.
  * @param {number} cost Cost of the route so far in 1/timeDiv seconds.
  * @param {number} time Time when stop is reached.
  * @param {number} src ID of location stop was reached from.
  * @param {number} enter Optional position or location ID where previous trip leg started.
  * @return {reach.route.StopVisitor} */
reach.route.StopVisitor.create=function(dijkstra,stop,cost,time,src,enter) {
	var self;

	self=reach.route.StopVisitor.freeItem;
	if(self) reach.route.StopVisitor.freeItem=self.next;
	else self=new reach.route.StopVisitor();

	self.stop=stop;
	self.cost=cost;
	self.time=time;
	self.src=src;
	self.enter=enter;

	return(self);
};

/** Put visitor in free list to recycle it.
  * @return {reach.route.Visitor.State} */
reach.route.StopVisitor.prototype.free=function() {
	this.next=reach.route.StopVisitor.freeItem;
	reach.route.StopVisitor.freeItem=this;

	return(reach.route.Visitor.State.OK);
};

/** Visit the current stop and check what roads and transit lines are reachable.
  * @param {reach.route.Dijkstra} dijkstra
  * @param {reach.route.Result} result
  * @return {reach.route.Visitor.State} */
reach.route.StopVisitor.prototype.visit=function(dijkstra,result) {
	var stop;
	var cost,costDelta;
	var time,timeQuery,timeWait;
	var srcList;
	var src;
	var posList;
	var pos;
	var seqList;
	var seqNum,seqCount;
	var seq;
	var conf;
	var tripNum;
	var trip;
	var nodeRefList;
	var refNum,refCount;
	var ref;

	stop=this.stop;
	cost=this.cost;
	time=this.time;
	dataPtr=stop.dataPtr;
	conf=dijkstra.conf;

	if(result.costList[dataPtr] && result.costList[dataPtr]<=cost) {
		// The stop has already been visited so no need to check where to go next.
		if(time<result.timeList[dataPtr]+conf.altRouteSpan) {
			// If the stop was reached in a new way not long after the earliest possible arrival,
			// store the new source in case it allows leaving later with same final arrival time.
			srcList=result.stopSrcList[stop.id];
			// Store also walk or transit ride origin to save time when finding overall shortest route.
			enterList=result.stopEnterList[stop.id];

			if(!srcList) {
				// Initialize lists of multiple arrival methods if necessary.
				srcList=[];
				enterList=[];
				result.stopSrcList[stop.id]=srcList;
				result.stopEnterList[stop.id]=enterList;
			}

			srcList.push(this.src);
			enterList.push(this.enter);

/*
src=this.src&0xffffffff;
if(src>=conf.ptrSeqFirst && src<=conf.ptrSeqLast) {
seqList=stop.seqList;
seqCount=seqList.length;
for(seqNum=0;seqNum<seqCount;seqNum++) {
	seq=seqList[seqNum];
	if(src>=seq.dataPtr && src<seq.dataPtr+seq.stopList.length) break;
}
if(seqNum<seqCount) {
	pos=stop.posList[seqNum];
	trip=seq.tripList[~~(this.src/0x100000000)];
	console.log(stop.origId+'\t'+stop.name+'\t'+trip.key.shortCode+'\t'+src+'\t'+seq.dataPtr+'\t'+trip.timeList[0]+'\t'+seq.stopList.length);
}
}
*/
		}

		// Done visiting this stop, exit and recycle visitor.
		return(this.free());
	}

	// Store earliest arrival to this stop.
	result.costList[dataPtr]=cost;
	result.timeList[dataPtr]=time;
	result.srcList[dataPtr]=this.src;
	result.enterList[stop.id]=this.enter;
	// Set current stop as source when exploring connected roads and transit lines.
	src=stop.id*0x10+reach.route.Visitor.Src.STOP;

	posList=stop.posList;
	seqList=stop.seqList;
	seqCount=seqList.length;

	// Minimum transfer time 3 minutes.
	timeQuery=time+3*60000;

	// Explore available stop sequences which include current stop.
	for(seqNum=0;seqNum<seqCount;seqNum++) {
		// Get next sequence with trips.
		seq=seqList[seqNum];
		if(!seq.tripList.length) continue;

		pos=posList[seqNum];
		// Find trip departing soonest.
		tripNum=seq.findNextTime(timeQuery,pos,1);
		trip=seq.tripList[tripNum];
		// Get departure time and verify it's reachable.
		depart=seq.stampList[tripNum]+trip.timeList[pos]*1000;
		if(depart<timeQuery) continue;

		// Calculate cost of waiting.
		costDelta=(depart-time)*conf.waitCostPerMS+1.5*60*conf.timeDiv;
		// Cost should be at least 1 or Dijkstra may fail.
		if(costDelta<1) costDelta=1;
		dijkstra.found(reach.route.TripVisitor.create(dijkstra,seq,tripNum,pos,cost+costDelta,depart,src));
	}

	// Check reachable roads.
	nodeRefList=stop.nodeRefList;
	if(nodeRefList) {
		refCount=nodeRefList.length;
		for(refNum=0;refNum<refCount;refNum++) {
			ref=nodeRefList[refNum];
			costDelta=ref.dist*conf.walkCostPerM;
			if(costDelta<1) costDelta=1;
			dijkstra.found(reach.route.WayVisitor.create(dijkstra,ref.way,ref.pos,ref.delta,cost+costDelta,time+ref.dist*conf.walkTimePerM,src));
		}
	}

	// Done visiting this stop, exit and recycle visitor.
	return(this.free());
};
