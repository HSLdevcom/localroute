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
};

gis.inherit(reach.loc.Outdoor,reach.loc.Location);

reach.loc.Outdoor.prototype.getNodes=function(conf) {
	var attempt;
	var iterId;
	var nearest;
	var way;
	var posPrev,posNext;
	var nodePrev,nodeNext;
	var nodeNum;
	var ptList;
	var ptNum,ptCount;
	var ll;
	var lat,lon;
	var offset;
	var distPrev,distNext,distTo,distAlong;
	var dist;
	var refList;

for(attempt=0;attempt<3;attempt++) {
	iterId=this.mapSet.iterId++;
	// TODO: Clearly this function takes too many parameters, root and 0,0,0 are useless here.
	nearest=this.mapSet.waySet.tree.findWay(this.ll.llat,this.ll.llon,null,conf.snapDist,this.mapSet.waySet.tree.root,0,0,0,function(way) {
		var accessPenalty;
		var flag;

		if(way.iterId==iterId) return(0);
		flag=conf.profileAccessList[way.profile.id];
		if(!flag) return(0);

		// Arbitrary magic number added to distance if accessibility is 0.5.
		accessPenalty=10;
		return(accessPenalty/flag-accessPenalty+1);
	});

	way=nearest.way;
	refList=[];

//if(!way) console.log('HMM');
	if(!way) return(refList);

	way.iterId=iterId;

	posPrev=nearest.pos;
	posNext=nearest.posNext;
	distAlong=way.distList[posNext]-way.distList[posPrev];
	nodePrev=null;
	nodeNext=null;

	nodeNum=-1;
	ptList=way.ptList;
	ptCount=ptList.length;

	// Find number of previous node before point nearest this location along way.
	for(ptNum=way.ptStart;ptNum<=posPrev;ptNum++) {
		pt=ptList[ptNum];
		if(!pt) continue;

		if(typeof(pt)!='number') {
			distPrev=way.distList[ptNum];
			nodePrev=pt;
			nodeNum++;
		}
	}

	if(nodePrev) {
		distPrev=way.distList[posPrev]-distPrev;
		posPrev=nodeNum;
	}
//else console.log('p '+posPrev);

	// Find number of next node.
	for(;ptNum<ptCount;ptNum++) {
		pt=ptList[ptNum];
		if(!pt) continue;

		if(typeof(pt)!='number') {
			nodeNext=pt;
			nodeNum++;
			break;
		}
	}

	if(nodeNext) {
		distNext=way.distList[ptNum]-way.distList[posNext];
		posNext=nodeNum;
	}
//else console.log('n '+posNext+' '+ptCount+' '+nodeNum);

	// ??? Assert: way.ptList[ptNum]==way.nodeList[posNext] && ptNum>=nearest.posNext

	ll=new gis.MU(nearest.lat,nearest.lon);
	distTo=this.ll.distTo(ll);
	offset=nearest.offset;

	distPrev+=distTo+distAlong*offset;
//	visitorList.push(reach.route.WayVisitor.create(dijkstra,way,posPrev,-1,cost+dist*conf.walkCostPerM,time+dist*conf.walkTimePerM));

	distNext=distTo+distAlong*(1-offset);
//	visitorList.push(reach.route.WayVisitor.create(dijkstra,way,posNext,1,cost+dist*conf.walkCostPerM,time+dist*conf.walkTimePerM));

	if(nodePrev) refList.push({way:way,pos:posPrev,dist:distPrev,node:nodePrev,delta:-1});
	if(nodeNext) refList.push({way:way,pos:posNext,dist:distNext,node:nodeNext,delta:1});
if(nodePrev || nodeNext) break;
};

	return(refList);

//	console.log(nearest.pos);
//	console.log(nearest.posNext);
//	console.log(nearest.way.name);
//	console.log(nearest.way.ptList[nearest.pos].nameRefList.map(function(way) {return(way.name);}).join(' '));
//	console.log(nearest.way.ptList[nearest.posNext].nameRefList.map(function(way) {return(way.name);}).join(' '));

//	return(visitorList);
};

/** @param {reach.route.Dijkstra} dijkstra
  * @param {reach.route.Conf} conf
  * @param {number} cost
  * @param {number} time
  * @return {Array.<reach.route.Visitor>} */
reach.loc.Outdoor.prototype.getVisitors=function(dijkstra,conf,cost,time) {
	var visitorList;
	var refList;
	var refNum,refCount;
	var ref;
	var node;

	visitorList=[];
	refList=this.getNodes(conf);
	refCount=refList.length;

	for(refNum=0;refNum<refCount;refNum++) {
		ref=refList[refNum];
		dist=ref.dist;
		node=ref.way.nodeList[ref.pos];
		visitorList.push(reach.route.WayVisitor.create(dijkstra,ref.way,ref.pos,ref.delta,cost+dist*conf.walkCostPerM,time+dist*conf.walkTimePerM,0));
	}

	return(visitorList);
};
