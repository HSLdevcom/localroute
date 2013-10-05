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

goog.provide('gis.io.OctetStream');
goog.require('gis.Obj');
goog.require('gis.io.Stream');

/** @constructor
  * @extends {gis.io.Stream} */
gis.io.OctetStream=function() {
	gis.io.Stream.call(this);
    /** @type {gis.io.Stream.Endian} */
    this.endian;
	/** @type {string} */
	this.encoding;
};

gis.inherit(gis.io.OctetStream,gis.io.Stream);

/** @param {gis.io.Stream.Endian} endian */
gis.io.OctetStream.prototype.setEndian=function(endian) {};

/** @param {string} encoding */
gis.io.OctetStream.prototype.setEncoding=function(encoding) {};

/** @param {number} count */
gis.io.OctetStream.prototype.skip=function(count) {
	this.pos+=count;
};

/** @return {number} */
gis.io.OctetStream.prototype.peek8=function() {};

/** @return {number} */
gis.io.OctetStream.prototype.read8=function() {};

/** @return {number} */
gis.io.OctetStream.prototype.read16=function() {};

/** @return {number} */
gis.io.OctetStream.prototype.read32=function() {};

/** @return {number} */
gis.io.OctetStream.prototype.readFloat=function() {};

/** @return {number} */
gis.io.OctetStream.prototype.readDouble=function() {};

/** @param {number} count
  * @return {string} */
gis.io.OctetStream.prototype.readChars=function(count) {};
