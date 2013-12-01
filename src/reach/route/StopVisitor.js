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

goog.provide('reach.route.StopVisitor');
goog.require('gis.Obj');
goog.require('reach.route.Visitor');
goog.require('reach.route.TripVisitor');
goog.require('reach.trans.Stop');

/** @constructor
  * @extends {reach.route.Visitor} */
reach.route.StopVisitor=function() {
	reach.route.Visitor.call(this);

	/** @type {reach.trans.Stop} */
	this.stop;

	/** @type {reach.route.StopVisitor} */
	this.next;
};

gis.inherit(reach.route.StopVisitor,reach.route.Visitor);

/** @type {reach.route.StopVisitor} */
reach.route.StopVisitor.freeItem=null;

/** @param {reach.route.Dijkstra} dijkstra
  * @param {reach.trans.Stop} stop
  * @param {number} cost
  * @param {number} time
  * @param {number} src
  * @return {reach.route.StopVisitor} */
reach.route.StopVisitor.create=function(dijkstra,stop,cost,time,src) {
	var self;

	self=reach.route.StopVisitor.freeItem;
	if(self) reach.route.StopVisitor.freeItem=self.next;
	else {
		self=new reach.route.StopVisitor();
	}

	self.stop=stop;
	self.cost=cost;
	self.time=time;
	self.src=src;

	return(self);
};

reach.route.StopVisitor.prototype.free=function() {
	this.next=reach.route.StopVisitor.freeItem;
	reach.route.StopVisitor.freeItem=this;
	return(reach.route.Visitor.State.OK);
};

/** @param {reach.route.Dijkstra} dijkstra */
reach.route.StopVisitor.prototype.visit=function(dijkstra) {
	var stop;
	var cost,costDelta;
	var time,timeQuery,timeWait;
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

	if(dijkstra.costList[dataPtr] && dijkstra.costList[dataPtr]<=cost) return(this.free());

	console.log(cost+'\t'+gis.Q.formatTime(time)+'\t'+stop.name);
//console.log(cost);

	dijkstra.costList[dataPtr]=cost;
	dijkstra.timeList[dataPtr]=time;
	dijkstra.srcList[dataPtr]=this.src;
	src=dataPtr;

	posList=stop.posList;
	seqList=stop.seqList;
	seqCount=seqList.length;

	conf=dijkstra.conf;
	// Minimum transfer time 3 minutes.
	timeQuery=time+3*60000;

	for(seqNum=0;seqNum<seqCount;seqNum++) {
		seq=seqList[seqNum];
		if(!seq.tripList.length) continue;

		pos=posList[seqNum];
		tripNum=seq.findNextTime(timeQuery,pos,1);
		trip=seq.tripList[tripNum];
		depart=seq.stampList[tripNum]+trip.timeList[pos]*1000;
		if(depart<timeQuery) continue;

//		console.log('*\t\t'+gis.Q.formatTime(depart)+'\t'+trip.key.shortCode+'\t'+trip.key.sign);

		costDelta=(depart-time)*conf.waitCostPerMS;
		if(costDelta<1) costDelta=1;
		dijkstra.found(reach.route.TripVisitor.create(dijkstra,seq,tripNum,pos,cost+costDelta,depart,src));
	}

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

	return(this.free());
};
