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

goog.provide('reach.route.GeoCoder');
goog.require('gis.Obj');
goog.require('gis.osm.MapSet');
goog.require('reach.loc.Outdoor');

/** @constructor
  * @param {gis.osm.MapSet} mapSet
  * @param {reach.trans.TransSet} transSet */
reach.route.GeoCoder=function(mapSet,transSet) {
	var degPattern;

    /** @type {gis.osm.MapSet} */
    this.mapSet=mapSet;

    /** @type {reach.trans.TransSet} */
    this.transSet=transSet;

	degPattern='([-+]?) *'+ // Optional sign.
		// Degrees with o character, degree symbol or a broken alternative: UTF-8 encoded version or invalid unicode character.
		'(?:([0-9]+) *(?:\xc2?\xb0|[o\ufffd]) *'+
			// Minutes and ' character or unicode prime or a broken alternative.
			'(?:([0-9]+) *(?:\xe2\x80\xb2|[\'\u2032\ufffd]))?'+
		')? *'+
		// Decimal number optionally followed by o, ', ", degree symbol, unicode (double) prime or a broken alternative.
		'((?:[0-9]*\\.)?[0-9]+) *(?:\xc2?\xb0|\xe2\x80[\xb2\xb3]|[o\'"\u2032\u2033\ufffd])?';

	this.coordRe=new RegExp(
		'^[({\\[]? *'+              // Allow starting coordinate pair with parentheses and whitespace.
		degPattern+' *'+
		'([nesw])? *'+
		'[,;/] *'+
		degPattern+' *'+
		'([nesw])? *'+
		'[)}\\]]?$');
};

/** @param {string} addr */
reach.route.GeoCoder.prototype.find=function(addr) {
	var loc;
	var coordParts;
	var lat,lon,tmp;
	var ll;

	loc=null;

	addr=gis.Q.trim(addr.toLowerCase());
	coordParts=addr.match(this.coordRe);
//	console.log(coordParts);

	if(coordParts) {
		lat=+coordParts[4];
		if(coordParts[3]) lat=lat/60+(+coordParts[3]);
		if(coordParts[2]) lat=lat/60+(+coordParts[2]);
		if(coordParts[1]=='-') lat=-lat;

		lon=+coordParts[9];
		if(coordParts[8]) lon=lon/60+(+coordParts[8]);
		if(coordParts[7]) lon=lon/60+(+coordParts[7]);
		if(coordParts[6]=='-') lon=-lon;

		if(coordParts[5]=='e' || coordParts[5]=='w' || coordParts[10]=='n' || coordParts[10]=='s') {
			tmp=lat;
			lat=lon;
			lon=tmp;
		}

		if(lat>=-90 && lat<=90 && lon>=-180 && lon<=180) {
			ll=new gis.Deg(lat,lon).toMU();
			loc=new reach.loc.Outdoor(ll,this.mapSet);
		}
	}

	return(loc);
};
