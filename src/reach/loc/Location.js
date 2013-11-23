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

goog.provide('reach.loc.Location');
goog.require('gis.Obj');
goog.require('gis.MU');

/** @constructor */
reach.loc.Location=function() {
	/** @type {reach.MU} */
	this.ll;
	/** @type {string} */
//	this.id='';
	/** @type {number} */
	this.runId=0;
	/** @type {number} */
	this.cost=0;
	/** @type {number} */
	this.time=0;
	/** @type {Array.<string>} */
	this.fieldList;
};

/** @param {reach.route.Dijkstra} dijkstra
  * @param {reach.route.Conf} conf
  * @param {number} cost
  * @param {number} time
  * @return {Array.<reach.route.Visitor>} */
reach.loc.Location.prototype.getVisitors=function(dijkstra,conf,cost,time) {};
