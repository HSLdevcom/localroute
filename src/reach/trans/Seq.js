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

goog.provide('reach.trans.Seq');
goog.require('reach.trans.Stop');
//goog.require('reach.trans.Trip');
//goog.require('reach.util');

/** @constructor */
reach.trans.Seq=function() {
	/** @type {number} */
	this.id=0;

	/** @type {Array.<reach.trans.Stop>} */
	this.stopList=[];
	/** @type {Array.<number>} */
//	this.distList=[];
	/** @type {Array.<reach.trans.Trip>} */
	this.tripList=[];
	/** @type {Array.<reach.trans.Trip>} */
	this.stampList=[];
	/** @type {Array.<reach.trans.Trip>} */
//	this.newTripList=[];
	/** @type {Array.<number>} */
	this.followerList;
	/** @type {number} */
//	this.tripCount=0;

	/** @type {Object.<number,number>} Used to filter out line if none of its trips use an allowed mode of transportation. */
//	this.transModeTbl={};

	/** @type {number} */
//	this.runId=0;
	/** @type {number} */
//	this.firstPos=0;
	/** @type {Array.<number>} */
//	this.costList=[];
	/** @type {Array.<number>} */
//	this.timeList=[];

	/** @type {number} Number of departures around search start time, to evaluate line niceness. */
//	this.departureCount=0;
};
