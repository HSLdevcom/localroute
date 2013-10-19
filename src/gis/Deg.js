/*
	This file is part of LocalRoute.js.

	Written in 2012, 2013 by Juha Järvi

	To the extent possible under law, the author(s) have dedicated all
	copyright and related and neighboring rights to this software to the
	public domain worldwide. This software is distributed without any
	warranty.

	You should have received a copy of the CC0 Public Domain Dedication
	along with this software. If not, see
	<http://creativecommons.org/publicdomain/zero/1.0/>.
*/

goog.provide('gis.Deg');
goog.require('gis.Obj');

/** Coordinate pair in decimal degrees.
  * @constructor
  * @param {number} lat Latitude, -90 to 90. Unit: degrees.
  * @param {number} lon Longitude, -180 to 180. Unit: degrees. */
gis.Deg=function(lat,lon) {
	/** @type {number} Latitude called llat for easier grepping, -90 to 90. Unit: degrees. */
	this.llat=lat;
	/** @type {number} Longitude called llon for easier grepping, -180 to 180. Unit: degrees. */
	this.llon=lon;
};

/** @return {string} */
gis.Deg.prototype.format=function() {
	return(this.llat+(this.llat<0?'S':'N')+', '+this.llon+(this.llon<0?'W':'E'));
};

gis.Deg.prototype.toString=gis.Deg.prototype.format;

/** Convert coordinate pair from decimal degrees to MU by scaling and Mercator transformation.
  * @return {gis.MU} New transformed coordinate pair. */
gis.Deg.prototype.toMU=function() {
	var r=gis.MU.range/2;

	return(new gis.MU(
		~~((Math.log(Math.tan((this.llat+90)*Math.PI/360))/Math.PI+1)*r),
		~~((this.llon/180+1)*r)
	));
};

/** Export EPSG:900913 coordinates.
  * @return {{llat:number,llon:number}} New transformed coordinate pair. */
gis.Deg.prototype.toGoog=function() {
	var r=gis.MU.major;

	return({
		llat:Math.log(Math.tan((this.llat+90)*Math.PI/360))*r,
		llon:this.llon/180*Math.PI*r
	});
};

/** Import EPSG:900913 coordinates.
  * @param {number} lat
  * @param {number} lon
  * @return {gis.Deg} New transformed coordinate pair. */
gis.Deg.fromGoog=function(lat,lon) {
	var r=gis.MU.major;

	return(new gis.Deg(Math.atan(Math.exp(lat/r))*360/Math.PI-90,lon*180/r/Math.PI));
};
