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

goog.provide('gis.io.NodeStream');
goog.require('gis.Obj');
goog.require('gis.io.OctetStream');

/** @constructor
  * @extends {gis.io.OctetStream}
  * @param {gis.io.Stream.Endian=} endian
  * @param {NodeBuffer=} data */
gis.io.NodeStream=function(endian,data) {
	gis.io.OctetStream.call(this);
	/** @type {NodeBuffer} */
	this.data=data;
	/** @type {Iconv} */
	this.dec;

	this.setEndian(endian);
};

gis.inherit(gis.io.NodeStream,gis.io.OctetStream);

/** @param {gis.io.Stream.Endian} endian */
gis.io.NodeStream.prototype.setEndian=function(endian) {
	this.endian=endian;

	if(endian==gis.io.Stream.Endian.LITTLE) {
		this.read16=this.read16L;
		this.read32=this.read32L;
		this.readFloat=this.readFloatL;
		this.readDouble=this.readDoubleL;
	} else {
		this.read16=this.read16B;
		this.read32=this.read32B;
		this.readFloat=this.readFloatB;
		this.readDouble=this.readDoubleB;
	}
};

/** @param {string} encoding */
gis.io.NodeStream.prototype.setEncoding=function(encoding) {
    this.encoding=encoding;
	this.dec=new Iconv(encoding,'UTF-8//IGNORE');
};

/** @return {number} */
gis.io.NodeStream.prototype.peek8=function() {
	return(this.data.readUInt8(this.pos));
};

/** @return {number} */
gis.io.NodeStream.prototype.read8=function() {
	return(this.data.readUInt8(this.pos++));
};

/** @return {number} */
gis.io.NodeStream.prototype.read16L=function() {
	return(this.data.readUInt16LE((this.pos+=2)-2));
};

/** @return {number} */
gis.io.NodeStream.prototype.read16B=function() {
	return(this.data.readUInt16BE((this.pos+=2)-2));
};

/** @return {number} */
gis.io.NodeStream.prototype.read32L=function() {
	return(this.data.readUInt32LE((this.pos+=4)-4));
};

/** @return {number} */
gis.io.NodeStream.prototype.read32B=function() {
	return(this.data.readUInt32BE((this.pos+=4)-4));
};

/** @return {number} */
gis.io.NodeStream.prototype.readFloatL=function() {
	return(this.data.readFloatLE((this.pos+=4)-4));
};

/** @return {number} */
gis.io.NodeStream.prototype.readFloatB=function() {
	return(this.data.readFloatLE((this.pos+=4)-4));
};

/** @return {number} */
gis.io.NodeStream.prototype.readDoubleL=function() {
	return(this.data.readDoubleLE((this.pos+=8)-8));
};

/** @return {number} */
gis.io.NodeStream.prototype.readDoubleB=function() {
	return(this.data.readDoubleBE((this.pos+=8)-8));
};

/** @param {number} count
  * @return {string} */
gis.io.NodeStream.prototype.readChars=function(count) {
	var first;

	first=this.pos;

	// Read bytes, convert to UTF8 string and remove trailing ASCII NUL characters.
	return(this.dec.convert(this.data.slice(first,this.pos+=count)).toString('utf8').replace(/[\0]+$/,''));
};
