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

goog.provide('reach.trans.Key');
goog.require('reach.trans.Seq');

/** @constructor
  * @param {reach.trans.Seq} seq */
reach.trans.Key=function(seq) {
	var fieldList;

	/** @type {number} */
	this.id=0;
	/** @type {reach.trans.Seq} */
	this.seq=seq;

	/** @type {number} */
	this.mode;
	/** @type {string} */
	this.shortCode;
	/** @type {string} */
	this.name;
	/** @type {string} */
	this.sign;
};

/** @param {string} code
  * @return {{id:string,suffix:string}} */
reach.trans.Key.parseCode=function(code) {
	var partList;

	partList=code.match(/^([0-9]*)(.*)/);
	if(!partList[1]) return({id:code,suffix:''});

	return({id:partList[1],suffix:partList[2]});
};
