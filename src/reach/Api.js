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

goog.provide('reach.Api');
goog.require('gis.Obj');
goog.require('reach.trans.TransSet');
goog.require('gis.osm.MapSet');
goog.require('reach.route.Batch');
goog.require('reach.route.GeoCoder');
goog.require('gis.control.Dispatch');

/** @constructor */
reach.Api=function() {
	var mapSet;
	var transSet;
	var geoCoder;
	var batch;
	var conf;
	var dispatch;
	var ready;

	var getTrans;
	var getMap;

	console.log('REACH INIT...');

	mapSet=new gis.osm.MapSet();
	transSet=new reach.trans.TransSet();

	geoCoder=new reach.route.GeoCoder(mapSet,transSet);
	batch=new reach.route.Batch(mapSet,geoCoder,transSet);
	conf=new reach.route.Conf();

	this.mapSet=mapSet;
	this.transSet=transSet;
	this.geoCoder=geoCoder;
	this.batch=batch;
	this.conf=conf;

	dispatch=new gis.control.Dispatch();
	ready=dispatch.wait();

	this.dispatch=dispatch;
	this.ready=ready;

	getTrans=dispatch.fetch('static/helsinki/trans.txt').then(
		function(task,data) {
//console.log('TRANS LOADED');
			return(transSet.importPack(new gis.io.PackStream(data,null)));
		}
	);

	getMap=dispatch.fetch('static/helsinki/map.txt').then(
		function(task,data) {
//console.log('MAP LOADED');
			return(mapSet.importPack(new gis.io.PackStream(data,null)));
		}
	);

	getTrans.and(getMap).then(
		function() {
			batch.prepareAccess(conf);
			mapSet.waySet.prepareTree();
			mapSet.waySet.forWays(function(way) {
				way.calcDist();
			});
			batch.bindStops(transSet.stopSet,conf);
			batch.prepareRefs(transSet,conf);
		}
	).then(function() {
		console.log('REACH INIT DONE');
		ready.success();
	});
};

/** @export */
reach.Api.init=function() {
	return(new reach.Api());
};

/** @export */
reach.Api.prototype.initConf=function() {
	this.conf=new reach.route.Conf();
	this.batch.prepareAccess(this.conf);
};

/** @export */
reach.Api.prototype.preCalc=function(addrFrom,time) {
	var locFrom;

    locFrom=this.geoCoder.find(addrFrom);

	return(this.batch.preCalc(locFrom,this.conf,time));
};

/** @export */
reach.Api.prototype.find=function(src,dst,callback) {
	var ll;
	var loc;
	var route;
	var time;

	time=new Date().getTime();

	ll=new gis.Deg(src['lat'],src['lng']).toMU();
	if(!this.srcReady || ll.llat!=this.srcReady.llat || ll.llon!=this.srcReady.llon || !this.srcTime || time>this.srcTime+30*1000) {
		loc=new reach.loc.Outdoor(ll,this.mapSet);

//		this.result=this.batch.preCalc(loc,this.conf,1382245200000-2*24*60*60*1000);
		this.result=this.batch.preCalc(loc,this.conf,time);
		this.srcReady=ll;
		this.srcTime=time;
	}

	ll=new gis.Deg(dst['lat'],dst['lng']).toMU();
	loc=new reach.loc.Outdoor(ll,this.mapSet);

	route=this.batch.getRoute(loc,this.conf,this.result);

	console.log(route);

	if(typeof(callback)=='function') callback(route);
};
