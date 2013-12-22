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

goog.provide('reach.route.Result');
goog.require('gis.Obj');
goog.require('reach.route.Conf');

/** @constructor
  * @param {reach.route.Conf} conf */
reach.route.Result=function(conf) {
	/** @type {reach.route.Conf} */
	this.conf=conf;
	/** @type {Array.<number>} */
	this.costList=[];
	/** @type {Array.<number>} */
	this.timeList=[];
	/** @type {Array.<number>} */
	this.srcList=[];
	/** @type {Array.<number>} */
	this.enterList=[];
	/** @type {Array.<Array.<number>>} */
	this.stopSrcList=[];
	/** @type {Array.<Array.<number>>} */
	this.stopEnterList=[];
};
