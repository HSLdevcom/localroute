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

goog.provide('reach.route.Visitor');
goog.require('gis.Obj');
goog.require('gis.data.HeapItem');

/** @constructor
  * @implements {gis.data.HeapItem} */
reach.route.Visitor=function() {
	/** @type {number} */
	this.cost=0;
	/** @type {number} */
	this.time=0;
	/** @type {number} */
	this.src=0;

	/** @type {number} Index of this stop in Dijkstra's heap. */
	this.heapIndex;
	/** @type {reach.route.Visitor} */
	this.heapPrev=null;
	/** @type {reach.route.Visitor} */
	this.heapNext=null;
};

/** @enum {number} */
reach.route.Visitor.State={
	OK:0,
	WAIT:-1
};

/** @enum {number} */
reach.route.Visitor.Src={
	NONE:0,
	WAY:1,
	TRIP:2,
	STOP:3
};

/** @param {reach.route.Dijkstra} dijkstra
  * @param {reach.route.Result} result
  * @return {reach.route.Visitor.State} */
reach.route.Visitor.prototype.visit=function(dijkstra,result) {};
