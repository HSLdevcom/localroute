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

goog.provide('reach.route.Dijkstra');
goog.require('gis.Obj');
goog.require('reach.route.Conf');
goog.require('reach.route.Visitor');
goog.require('reach.route.Result');
goog.require('reach.loc.Location');
goog.require('gis.data.RadixHeap');

/** Dijkstra's algorithm, the core of the reachability analysis.
  * @constructor */
reach.route.Dijkstra=function() {
    /** @type {reach.route.Conf} */
    this.conf=null;
	/** @type {gis.data.RadixHeap} */
	this.queue=null;
	/** @type {number} */
	this.runId=0;

	/** @type {reach.route.Dijkstra.Dir} Direction of time as cost increases, boolean enum. */
	this.dir=reach.route.Dijkstra.Dir.FORWARD;
	/** @type {number} Direction of time as cost increases, multiplication factor 1 or -1. */
	this.timeDelta=1;

	/** @type {number} */
	this.maxCost;

	/** @type {Array.<number>} */
//	this.costList;
	/** @type {Array.<number>} */
//	this.timeList;
	/** @type {Array.<number>} */
//	this.srcList;

	/** @type {reach.route.Result} */
	this.result;
};

/** @enum {boolean} */
reach.route.Dijkstra.Dir={
    FORWARD:true,
    BACKWARD:false
};

/** @param {Array.<reach.loc.Location>} locList
  * @param {reach.route.Conf} conf */
reach.route.Dijkstra.prototype.start=function(locList,conf,time) {
	var locNum,locCount;
	var loc;
	var visitorList;
	var visitorNum,visitorCount;
	var visitor;

	this.runId++;
	this.conf=conf;

	conf.init();
	this.maxCost=conf.maxCost;
	this.queue=new gis.data.RadixHeap(this.maxCost);

//	this.costList=[];
//	this.timeList=[];
//	this.srcList=[];
	this.result=new reach.route.Result(conf);

	// Get all visitor objects for all start locations and insert them into the priority queue.
	locCount=locList.length;
	for(locNum=0;locNum<locCount;locNum++) {
		loc=locList[locNum];

		visitorList=loc.getVisitors(this,conf,1,time);
		visitorCount=visitorList.length;

		for(visitorNum=0;visitorNum<visitorCount;visitorNum++) {
			visitor=visitorList[visitorNum];
			this.queue.insert(visitor,~~(visitor.cost+0.5));
		}
	}
};

/** Stop Dijkstra execution immediately. */
reach.route.Dijkstra.prototype.stop=function() {
	this.maxCost=1;
};

/** @param {reach.route.Visitor} visitor */
reach.route.Dijkstra.prototype.found=function(visitor) {
	this.queue.insert(visitor,visitor.cost);
	return(true);
};

/** Advance Dijkstra's algorithm by one step, visiting one stop.
  * @return {number} 0 means the function can be called again, 1 means search is done. */
reach.route.Dijkstra.prototype.step=function() {
	var visitor;
	var ret;

	visitor=/** @type {reach.route.Visitor} */ (this.queue.extractMin());
//console.log('d '+visitor.cost);
	// Stop search if maxCost is reached.
	if(!visitor || (visitor.cost>this.maxCost && this.maxCost>0)) {
		// Save memory by allowing the heap to be garbage collected.
		this.queue=null;
		return(1);
	}

	ret=visitor.visit(this,this.result);

	return(0);
};
