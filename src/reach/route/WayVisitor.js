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

/** @fileoverview Visitor for following roads in Dijkstra-style routing.
  * Dijkstra's algorithm has been modified to store visitors
  * instead of graph nodes in its priority queue. */

goog.provide('reach.route.WayVisitor');
goog.require('gis.Obj');
goog.require('reach.route.Visitor');
goog.require('reach.route.StopVisitor');
goog.require('gis.osm.Way');

/** @constructor
  * @extends {reach.route.Visitor} */
reach.route.WayVisitor=function() {
	reach.route.Visitor.call(this);

	/** @type {gis.osm.Way} Road to follow. */
	this.way;
	/** @type {number} Position along road. */
	this.pos;
	/** @type {number} Direction to advance pos, -1 or 1. */
	this.delta;
	/** @type {number} Road accessibility factor 0-1, lower number increases cost. */
	this.access;
	/** @type {number} Place where road network was entered. */
	this.enter;

	/** @type {reach.route.WayVisitor} Next item for linked list of free visitors. */
	this.next;
};

gis.inherit(reach.route.WayVisitor,reach.route.Visitor);

/** @type {reach.route.WayVisitor} Linked list of free visitors. */
reach.route.WayVisitor.freeItem=null;

/** Allocate and populate a new visitor.
  * @param {reach.route.Dijkstra} dijkstra
  * @param {gis.osm.Way} way Road to follow.
  * @param {number} pos Position along road.
  * @param {number} delta Direction to advance pos, -1 or 1.
  * @param {number} cost Cost of the route so far in 1/timeDiv seconds.
  * @param {number} time Time when road is reached.
  * @param {number} src ID of location road was reached from.
  * @param {number=} enter Place where road network was entered. Leave undefined when calling from other classes.
  * @return {reach.route.WayVisitor} */
reach.route.WayVisitor.create=function(dijkstra,way,pos,delta,cost,time,src,enter) {
	var self;

	// Get visitor from free list or allocate new object.
	self=reach.route.WayVisitor.freeItem;
	if(self) reach.route.WayVisitor.freeItem=self.next;
	else self=new reach.route.WayVisitor();

	// 25 bits for way ID, 24 bits for position along way.
	if(!enter) enter=way.id*0x10000000+pos*0x10+reach.route.Visitor.Src.WAY;

	self.way=way;
	self.pos=pos;
	self.delta=delta;
	self.cost=cost;
	self.time=time;
	self.src=src;
	// Accessibility factor is precalculated from road type.
	self.access=dijkstra.conf.profileAccessList[way.profile.id];
	self.enter=enter;

	return(self);
};

/** Put visitor in free list to recycle it.
  * @return {reach.route.Visitor.State} */
reach.route.WayVisitor.prototype.free=function() {
	this.next=reach.route.WayVisitor.freeItem;
	reach.route.WayVisitor.freeItem=this;

	return(reach.route.Visitor.State.OK);
};

/** Visit the current position along a road and check what other places are reachable.
  * @param {reach.route.Dijkstra} dijkstra
  * @param {reach.route.Result} result
  * @return {reach.route.Visitor.State} */
reach.route.WayVisitor.prototype.visit=function(dijkstra,result) {
	var way,other;
	var pos,posOther;
	var cost,costDelta,time;
	var dataPtr;
	var enter;
	var src;
	var dist;
	var conf;
	var node;
	var posList;
	var wayList;
	var wayNum,wayCount;
	var stopRefList;
	var refNum,refCount;
	var ref;
	var access;

	way=this.way;
	pos=this.pos;
	cost=this.cost;
	// Position to update in result arrays.
	dataPtr=way.dataPtr+pos;

	// Exit and recycle visitor if this location has already been reached.
	if(result.costList[dataPtr] && result.costList[dataPtr]<=cost) return(this.free());

	time=this.time;
	enter=this.enter;

	result.costList[dataPtr]=cost;
	result.timeList[dataPtr]=time;
	result.srcList[dataPtr]=this.src;

	// 25 bits for way ID, 24 bits for position along way.
	src=way.id*0x10000000+pos*0x10+reach.route.Visitor.Src.WAY;
	conf=dijkstra.conf;

	if(this.delta==0) {
		if(pos>0) {
			dist=way.nodeDistList[pos]-way.nodeDistList[pos-1];
			dijkstra.found(reach.route.WayVisitor.create(dijkstra,way,pos-1,-1,cost+dist*conf.walkCostPerM/this.access+1,time+dist*conf.walkTimePerM,src,enter));
		}

		this.delta=1;
	} else {
		node=way.nodeList[pos];
		posList=node.posList;
		wayList=node.wayList;
		wayCount=wayList.length;

		// Find other ways connected to node.
		for(wayNum=0;wayNum<wayCount;wayNum++) {
			other=wayList[wayNum];
			posOther=posList[wayNum];
			access=conf.profileAccessList[other.profile.id];
			if((other==way && posOther==pos) || !access) continue;

			// Create visitor along other way for exploring it in both directions.
			dijkstra.found(reach.route.WayVisitor.create(dijkstra,other,posOther,0,cost+1,time,src,enter));
		}

		if(conf.transCostPerMS) {
			// Find stops connected to node.
			stopRefList=node.stopRefList;
			if(stopRefList) {
				refCount=stopRefList.length;
				for(refNum=0;refNum<refCount;refNum++) {
					ref=stopRefList[refNum];

					costDelta=ref.dist*conf.walkCostPerM;
					if(costDelta<1) costDelta=1;

					// Create visitor for stop found.
					dijkstra.found(reach.route.StopVisitor.create(dijkstra,ref.stop,cost+costDelta,time+ref.dist*conf.walkTimePerM,src,enter));
				}
			}
		}
	}

	if(this.delta>0) {
		// Advance towards the end of the road, exit and recycle visitor if past it.
		pos++;
		if(pos>=way.nodeList.length) return(this.free());
		// Get distance to next node reached.
		dist=way.nodeDistList[pos]-way.nodeDistList[pos-1];
	} else {
		// Advance towards the beginning of the road, exit and recycle visitor if past it.
		pos--;
		if(pos<0) return(this.free());
		// Get distance to next node reached.
		dist=way.nodeDistList[pos+1]-way.nodeDistList[pos];
	}

	// Calculate cost between current and next node.
	costDelta=dist*conf.walkCostPerM/this.access;
	// Cost must be 1 or more to ensure algorithm works correctly.
	if(costDelta<1) costDelta=1;
	cost+=costDelta;
	// Time at next node.
	time+=dist*conf.walkTimePerM;

	// Update visitor to point to next node with new cost and time.
	this.pos=pos;
	this.cost=cost;
	this.time=time;
	this.src=src;

	dijkstra.found(this);

	return(reach.route.Visitor.State.OK);
};
