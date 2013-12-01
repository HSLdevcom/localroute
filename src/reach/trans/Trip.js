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

goog.provide('reach.trans.Trip');

/** @constructor
  * @param {reach.trans.Key} key */
reach.trans.Trip=function(key) {
	/** @type {reach.trans.Key} */
	this.key=key;
	/** @type {number} */
	this.valid;
	/** @type {Array.<number>|Uint32Array} Unit: seconds. */
//	this.deltaList;
	/** @type {Array.<number>} Unit: seconds. */
	this.timeList;

	/** @type {number} Unit: seconds. */
//	this.startTime;
	/** @type {number} Unit: seconds. */
//	this.duration;
	/** @type {number} */
	this.id;
};

/** @enum {number} */
reach.trans.Trip.Mode={
	TRAM:0,
	SUBWAY:1,
	TRAIN:2,
	BUS:3,
	FERRY:4,
	CABLE:5,
	AERIAL:6,
	FUNICULAR:7
};

/** @param {number} stopNum
  * @return {number} */
reach.trans.Trip.prototype.getArrival=function(stopNum) {
	var timeList;
	var arrival;
	var pos;

	timeList=this.timeList;
	arrival=0;
	for(pos=0;pos<=stopNum;pos++) arrival+=timeList[pos];

	return(arrival);
};
