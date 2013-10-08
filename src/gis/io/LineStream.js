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

goog.provide('gis.io.LineStream');
goog.require('gis.Obj');
goog.require('gis.io.Stream');

/** @constructor
  * @extends {gis.io.Stream}
  * @param {string} data
  * @param {function(string)|null} write */
gis.io.LineStream=function(data,write) {
	var lineList;

	gis.io.Stream.call(this);

	if(data) lineList=data.split(/\r?\n/);
	else lineList=[];

	/** @type {Array.<string>} */
	this.lineList=lineList;
	/** @type {number} */
	this.lineCount=lineList.length;
	/** @type {function(string)|null} */
	this.write=write||null;
};

gis.inherit(gis.io.LineStream,gis.io.Stream);

/** @return {string|null} */
gis.io.LineStream.prototype.readLine=function() {
	if(this.pos>=this.lineCount) return(null);
	return(this.lineList[this.pos++]);
}

/** @param {string} txt */
gis.io.LineStream.prototype.writeText=function(txt) {
	this.write(txt);
};
