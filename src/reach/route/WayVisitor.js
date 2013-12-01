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

goog.provide('reach.route.WayVisitor');
goog.require('gis.Obj');
goog.require('reach.route.Visitor');
goog.require('reach.route.StopVisitor');
goog.require('gis.osm.Way');

/** @constructor
  * @extends {reach.route.Visitor} */
reach.route.WayVisitor=function() {
	reach.route.Visitor.call(this);

	/** @type {gis.osm.Way} */
	this.way;
	/** @type {number} */
	this.pos;
	/** @type {number} */
	this.access;

	/** @type {reach.route.WayVisitor} */
	this.next;
};

gis.inherit(reach.route.WayVisitor,reach.route.Visitor);

/** @type {reach.route.WayVisitor} */
reach.route.WayVisitor.freeItem=null;

/** @param {reach.route.Dijkstra} dijkstra
  * @param {gis.osm.Way} way
  * @param {number} pos
  * @param {number} delta
  * @param {number} cost
  * @param {number} time
  * @param {number} src
  * @return {reach.route.WayVisitor} */
reach.route.WayVisitor.create=function(dijkstra,way,pos,delta,cost,time,src) {
	var self;

	self=reach.route.WayVisitor.freeItem;
	if(self) reach.route.WayVisitor.freeItem=self.next;
	else {
		self=new reach.route.WayVisitor();
	}

	self.way=way;
	self.pos=pos;
	self.delta=delta;
	self.cost=cost;
	self.time=time;
	self.src=src;
	self.access=dijkstra.conf.profileAccessList[way.profile.id];

	return(self);
};

reach.route.WayVisitor.prototype.free=function() {
	this.next=reach.route.WayVisitor.freeItem;
	reach.route.WayVisitor.freeItem=this;
	return(reach.route.Visitor.State.OK);
};

/** @param {reach.route.Dijkstra} dijkstra */
reach.route.WayVisitor.prototype.visit=function(dijkstra) {
	var way,other;
	var pos,posOther;
	var cost,costDelta,time;
	var src;
	var dataPtr;
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
	time=this.time;
	dataPtr=way.dataPtr+pos;

	if(dijkstra.costList[dataPtr] && dijkstra.costList[dataPtr]<=cost) return(this.free());
//globalFoo++;
//if(way.name) console.log(way.name);
//console.log(cost);

	src=this.src;
	dijkstra.costList[dataPtr]=cost;
	dijkstra.timeList[dataPtr]=time;
	dijkstra.srcList[dataPtr]=src;

	conf=dijkstra.conf;

	// Stay to explore node where way was entered, if source is not another way.
	if(src<conf.firstWayPtr || src>conf.lastWayPtr) dist=0;
	else if(this.delta>0) {
		pos++;
		if(pos>=way.nodeList.length) return(this.free());
		dist=way.nodeDistList[pos]-way.nodeDistList[pos-1];
	} else {
		pos--;
		if(pos<0) return(this.free());
		dist=way.nodeDistList[pos+1]-way.nodeDistList[pos];
	}

	src=dataPtr;

	costDelta=dist*conf.walkCostPerM/this.access;
	if(costDelta<1) costDelta=1;
	cost+=costDelta;
	time+=dist*conf.walkTimePerM;

	node=way.nodeList[pos];
	posList=node.posList;
	wayList=node.wayList;
	wayCount=wayList.length;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		other=wayList[wayNum];
		posOther=posList[wayNum];
		access=conf.profileAccessList[other.profile.id];
		if(other==way && posOther==pos || !access) continue;

		dijkstra.found(reach.route.WayVisitor.create(dijkstra,other,posOther,-1,cost,time,src));
		dijkstra.found(reach.route.WayVisitor.create(dijkstra,other,posOther,1,cost,time,src));
	}

	stopRefList=node.stopRefList;
	if(stopRefList) {
		refCount=stopRefList.length;
		for(refNum=0;refNum<refCount;refNum++) {
			ref=stopRefList[refNum];
//console.log(ref.stop.name+' '+ref.dist+' '+(time+ref.dist*conf.walkTimePerM)+' '+time+' '+ref.dist+' '+conf.walkTimePerM);
			costDelta=ref.dist*conf.walkCostPerM;
			if(costDelta<1) costDelta=1;
			dijkstra.found(reach.route.StopVisitor.create(dijkstra,ref.stop,cost+costDelta,time+ref.dist*conf.walkTimePerM,src));
//			if(feature.getVisitor) dijkstra.found(feature.getVisitor(dijkstra,cost,time,src));
		}
	}

	this.pos=pos;
	this.cost=cost;
	this.time=time;
	this.src=src;

	dijkstra.found(this);

	return(reach.route.Visitor.State.OK);
};
