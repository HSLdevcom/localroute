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

goog.provide('reach.route.Batch');
goog.require('gis.Obj');
goog.require('reach.route.GeoCoder');
goog.require('reach.route.Conf');
goog.require('reach.route.Dijkstra');

/** @constructor
  * @param {gis.osm.MapSet} mapSet */
reach.route.Batch=function(mapSet,geoCoder) {
    /** @type {gis.osm.MapSet} */
    this.mapSet=mapSet;

	/** @type {reach.route.GeoCoder} */
	this.geoCoder=geoCoder;

	/** @type {reach.route.Dijkstra} */
	this.dijkstra=new reach.route.Dijkstra();
};

reach.route.Batch.prototype.prepareAccess=function(conf) {
	var profileAccessList;
	var profileList;
	var	profileNum,profileCount;
	var profile;
	var flag;

	profileAccessList=[];
	profileList=this.mapSet.profileSet.wayProfileList;
	profileCount=profileList.length;

	for(profileNum=0;profileNum<profileCount;profileNum++) {
		profile=profileList[profileNum];
		profile.id=profileNum;

		if(profile.access&gis.osm.ProfileSet.access.FOOT) {
			if(profile.limit&gis.osm.ProfileSet.access.FOOT) flag=0.5;
			else flag=1;
		} else flag=0;

		profileAccessList[profileNum]=flag;
	}

	conf.profileAccessList=profileAccessList;
};

/** @param {string} addrFrom */
reach.route.Batch.prototype.run=function(addrFrom,conf,time) {
	var locFrom;

	locFrom=this.geoCoder.find(addrFrom);
	this.dijkstra.start([locFrom],conf,time);

	while(!this.dijkstra.step()) {}
};
