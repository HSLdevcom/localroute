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

goog.provide('reach.route.TripVisitor');
goog.require('gis.Obj');
goog.require('reach.route.Visitor');
goog.require('reach.trans.Stop');

/** @constructor
  * @extends {reach.route.Visitor} */
reach.route.TripVisitor=function() {
	reach.route.Visitor.call(this);

	/** @type {reach.trans.Seq} */
	this.seq;
	/** @type {number} */
	this.tripNum;
	/** @type {number} */
	this.pos;
	/** @type {number} */
	this.enter;

	/** @type {reach.route.TripVisitor} */
	this.next;
};

gis.inherit(reach.route.TripVisitor,reach.route.Visitor);

/** @type {reach.route.TripVisitor} */
reach.route.TripVisitor.freeItem=null;

/** @param {reach.route.Dijkstra} dijkstra
  * @param {reach.trans.Seq} seq
  * @param {number} tripNum
  * @param {number} pos
  * @param {number} cost
  * @param {number} time
  * @param {number} src
  * @return {reach.route.TripVisitor} */
reach.route.TripVisitor.create=function(dijkstra,seq,tripNum,pos,cost,time,src) {
	var self;

	self=reach.route.TripVisitor.freeItem;
	if(self) reach.route.TripVisitor.freeItem=self.next;
	else {
		self=new reach.route.TripVisitor();
	}

	self.seq=seq;
	self.tripNum=tripNum;
	self.pos=pos;
	self.cost=cost;
	self.time=time;
	self.src=src;
	self.enter=pos;

	return(self);
};

reach.route.TripVisitor.prototype.free=function() {
	this.next=reach.route.TripVisitor.freeItem;
	reach.route.TripVisitor.freeItem=this;
	return(reach.route.Visitor.State.OK);
};

/** @param {reach.route.Dijkstra} dijkstra
  * @param {reach.route.Result} result
  * @return {reach.route.Visitor.State} */
reach.route.TripVisitor.prototype.visit=function(dijkstra,result) {
	var seq;
	var pos;
	var cost,costDelta;
	var time;
	var src;
	var tripNum;
	var trip;
	var conf;
	var stamp;
	var stop;
	var src;

	seq=this.seq;
	pos=this.pos;
	cost=this.cost;
	dataPtr=seq.dataPtr+pos;

	if(result.costList[dataPtr] && result.costList[dataPtr]<=cost) return(this.free());

	result.costList[dataPtr]=cost;

	pos++;
	if(pos>=seq.stopList.length) return(this.free());

	tripNum=this.tripNum;
	trip=seq.tripList[tripNum];

	conf=dijkstra.conf;
	stamp=seq.stampList[tripNum]+trip.timeList[pos]*1000;
	costDelta=(stamp-this.time)*conf.transCostPerMS;
	if(costDelta<1) costDelta=1;

	cost+=costDelta;
	time=stamp;

	stop=seq.stopList[pos];
	// 25 bits for trip number, 24 bits for stop sequence index per stop.
	src=tripNum*0x10000000+seq.posList[pos]*0x10+reach.route.Visitor.Src.TRIP;
	dijkstra.found(reach.route.StopVisitor.create(dijkstra,stop,cost+1.5*60*conf.timeDiv,time,src,this.enter));

	this.pos=pos;
	this.cost=cost;
	this.time=time;

	dijkstra.found(this);

	return(reach.route.Visitor.State.OK);
};
