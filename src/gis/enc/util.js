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

goog.provide('gis.enc.Util');
goog.provide('gis.enc.util');

/** @constructor */
gis.enc.Util=function() {};

/** @param {Array|ArrayBuffer|Uint8Array} data
  * @return {Array|Uint8Array} */
gis.enc.Util.prototype.toArray8=function(data) {
	if(gis.env.arrayBuffer && data instanceof ArrayBuffer) data=new Uint8Array(data);
	return(/** @type {Array|Uint8Array} */ (data));
};

gis.enc.util=new gis.enc.Util();
