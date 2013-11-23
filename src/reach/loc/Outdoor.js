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

goog.provide('reach.loc.Outdoor');
goog.require('gis.Obj');
goog.require('reach.loc.Location');
goog.require('reach.route.WayVisitor');
goog.require('gis.osm.MapSet');

/** @constructor
  * @extends {reach.loc.Location}
  * @param {gis.MU} ll
  * @param {gis.osm.MapSet} mapSet */
reach.loc.Outdoor=function(ll,mapSet) {
	reach.loc.Location.call(this);
	this.ll=ll;

	/** @type {gis.osm.MapSet} */
	this.mapSet=mapSet;

	/** @type {gis.osm.Way} */
	this.way;
	/** @type {number} */
	this.pos;

	/** @type {number} How many nearby stops have been found. */
	this.stopCount=0;
	/** @type {reach.route.result.WalkLeg} */
	this.srcLeg=null;
};

gis.inherit(reach.loc.Outdoor,reach.loc.Location);

/** @param {reach.route.Dijkstra} dijkstra
  * @param {reach.route.Conf} conf
  * @param {number} cost
  * @param {number} time
  * @return {Array.<reach.route.Visitor>} */
reach.loc.Outdoor.prototype.getVisitors=function(dijkstra,conf,cost,time) {
	var visitorList;
	var nearest;
	var way;
	var posPrev,posNext;
	var nodeNum;
	var ptList;
	var ptNum,ptCount;
	var ll;
	var lat,lon;
	var offset;
	var distPrev,distNext,distTo,distAlong;
	var dist;

	visitorList=[];

	// TODO: Clearly this function takes too many parameters, root and 0,0,0 are useless here.
	nearest=this.mapSet.waySet.tree.findWay(this.ll.llat,this.ll.llon,null,conf.snapDist,this.mapSet.waySet.tree.root,0,0,0,function(way) {
		var flag;
		flag=conf.profileAccessList[way.profile.id];
		if(!flag) return(0);

		// Arbitrary magic number: add 20 meters to distance if accessibility is 0.5.
		return(20/flag-20+1);
	});

	way=nearest.way;

	if(way) {
		posPrev=nearest.pos;
		posNext=nearest.posNext;

		distNext=way.distList[posNext];
		distPrev=way.distList[posPrev];

		nodeNum=-1;
		ptList=way.ptList;
		ptCount=ptList.length;

		// Find number of previous node before point nearest this location along way.
		for(ptNum=way.ptStart;ptNum<ptCount;ptNum++) {
			pt=ptList[ptNum];
			if(!pt) continue;

			if(typeof(pt)!='number') nodeNum++;

			if(ptNum==posPrev) {
				posPrev=nodeNum;
				ptNum++;
				break;
			}
		}

		// Find number of next node.
		for(;ptNum<ptCount;ptNum++) {
			pt=ptList[ptNum];
			if(!pt) continue;

			if(typeof(pt)!='number') {
				nodeNum++;
				posNext=nodeNum;
				break;
			}
		}

		if(ptNum==ptCount) return(visitorList);

		// Assert: way.ptList[ptNum]==way.nodeList[posNext] && ptNum>=nearest.posNext

		ll=new gis.MU(nearest.lat,nearest.lon);
		distTo=this.ll.distTo(ll);
		distAlong=distNext-distPrev;
		offset=nearest.offset;

		dist=distTo+distAlong*offset+(distPrev-way.nodeDistList[posPrev]);
		visitorList.push(reach.route.WayVisitor.create(dijkstra,way,posPrev,-1,cost+dist*conf.walkCostPerM,time+dist*conf.walkTimePerM));

		dist=distTo+distAlong*(1-offset)+(way.nodeDistList[posNext]-distNext);
		visitorList.push(reach.route.WayVisitor.create(dijkstra,way,posNext,1,cost+dist*conf.walkCostPerM,time+dist*conf.walkTimePerM));
	}

	console.log(nearest.pos);
	console.log(nearest.posNext);
//	console.log(nearest.way.name);
//	console.log(nearest.way.ptList[nearest.pos].nameRefList.map(function(way) {return(way.name);}).join(' '));
//	console.log(nearest.way.ptList[nearest.posNext].nameRefList.map(function(way) {return(way.name);}).join(' '));

	return(visitorList);
};
