/**
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

goog.provide('main');
goog.require('gis.Obj');
goog.require('gis.util.Date');
goog.require('reach.trans.TransSet');

/** @type {reach.trans.TransSet} */
var transSet;
var stream;
var fd;

transSet=new reach.trans.TransSet();

transSet.importTempPack(fs.readFileSync(process.argv[2],'utf8'));

fd=fs.openSync(process.argv[3],'w');

/** @param {string} txt */
function write(txt) {fs.writeSync(fd,txt,null,'utf8');}

stream=new gis.io.PackStream(null,write);
transSet.exportPack(stream);

fs.closeSync(fd);
