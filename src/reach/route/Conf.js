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

goog.provide('reach.route.Conf');
goog.require('gis.Obj');

/** @constructor */
reach.route.Conf=function() {
	/** @type {number} Number of TU (Time Units) per one second, defining accuracy. */
	this.timeDiv=10;
	/** @type {number} Maximum travel cost. Unit: TU. */
	this.maxCost=this.timeDiv*60*60* 3;	// 3 hours.
	/** @type {number} Sentinel value representing infinite cost. Unit: 1/timeDiv seconds. */
	this.infCost=this.maxCost*2;	// Any number bigger than maxCost.

	this.srid='EPSG:4326';	// Default projection, EPSG 4326 is WGS84.

	/** @type {number} Maximum great circle distance to search for a road nearest to a point. Unit: meters. */
	this.snapDist=200;

	/** @type {number} Walking speed. Unit: m/s */
	this.mpsWalk=70/60;	// 70 m/min
//	this.mpsWalk=5000/3600;	// 5 km/h

	/** @type {number} Unit: multiplication factor. */
	this.costMulWalk=1.5;
	/** @type {number} Unit: multiplication factor. */
	this.costMulWait=0.95;
	/** @type {number} Unit: multiplication factor. */
	this.costMulTrans=1;

	/** @type {number} Unit: millisecond/m. */
	this.walkTimePerM=0;
	/** @type {number} Unit: TU/m. */
	this.walkCostPerM=0;
	/** @type {number} Unit: TU/millisecond. */
	this.waitCostPerMS=0;
	/** @type {number} Unit: TU/millisecond. */
	this.transCostPerMS=0;

	/** @type {number} Unit: milliseconds. */
	this.altRouteSpan=60*60*1000;

	/** @type {Array.<number>} */
	this.profileAccessList;

	/** @type {number} First precalc table index referring to a place along a way. */
	this.ptrWayFirst;
	/** @type {number} Last precalc table index referring to a place along a way. */
	this.ptrWayLast;
	/** @type {number} */
	this.ptrStopFirst;
	/** @type {number} */
	this.ptrStopLast;
	/** @type {number} */
	this.ptrSeqFirst;
	/** @type {number} */
	this.ptrSeqLast;
};

reach.route.Conf.prototype.init=function() {
	this.walkTimePerM=1000/this.mpsWalk;
	this.walkCostPerM=this.timeDiv/this.mpsWalk*this.costMulWalk;

	this.waitCostPerMS=this.timeDiv/1000*this.costMulWait;
	this.transCostPerMS=this.timeDiv/1000*this.costMulTrans;
};
