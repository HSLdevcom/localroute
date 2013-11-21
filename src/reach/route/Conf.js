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

/** @constructor */
reach.route.Conf=function(city) {
	/** @type {number} Number of TU (Time Units) per one second, defining accuracy. */
	this.timeDiv=10;
	/** @type {number} Maximum travel cost. Unit: 1/timeDiv seconds. */
	this.maxCost=this.timeDiv*60*60* 2;	// 2 hours.
	/** @type {number} Sentinel value representing infinite cost. Unit: 1/timeDiv seconds. */
	this.infCost=this.maxCost*2;	// Any number bigger than maxCost.

	this.srid='EPSG:4326';	// Default projection, EPSG 4326 is WGS84.

	/** @type {number} Walking speed. Unit: TU/m */
	this.walkTimePerM=60*this.timeDiv/ 70	// 70 m/min
//	this.walkTimePerM=3.6*this.timeDiv/ 5;	// 5 km/h
};
