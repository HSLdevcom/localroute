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

/** @fileoverview Definition of Map Units and WGS84 ellipsoid. */

goog.provide('gis.MU');
goog.require('gis.Obj');
goog.require('gis.Deg');

/** Coordinate pair in MU (Map Units, Mercator projected 30-bit unsigned integer coordinates on WGS84 ellipsoid).
  * Note: lon=+180 degrees takes 31 bits.
  * @constructor
  * @param {number} lat Latitude, integer 0 to 1073741824. Unit: MU.
  * @param {number} lon Longitude, integer 0 to 1073741824. Unit: MU. */
gis.MU=function(lat,lon) {
	/** @type {number} Latitude called llat for easier grepping, integer 0 to 1073741824. Unit: MU. */
	this.llat=lat;
	/** @type {number} Longitude called llon for easier grepping, integer 0 to 1073741824. Unit: MU. */
	this.llon=lon;
};

/** @type {number} Number of bits to use for coordinates. */
gis.MU.bits=30;
/** @type {number} Maximum Map Unit coordinate value. */
gis.MU.range=1<<gis.MU.bits;
/** @type {number} Earth (first) flattening, often called "f". */
gis.MU.flatten=1/298.257223563;
/** @type {number} Earth equatorial radius, often called "a". Unit: meters. */
gis.MU.major=6378137;
/** @type {number} Earth polar radius, often called "b". Unit: meters. */
gis.MU.minor=gis.MU.major*(1-gis.MU.flatten);
/** @type {number} Min/max latitude for square-shaped Mercator projection. */
gis.MU.degLatRange=85.05112877980659;

/** @return {string} */
gis.MU.prototype.toString=function() {
	return(this.llat+','+this.llon);
};

/** Convert coordinate pair from MU to decimal degrees by scaling and inverse Mercator transformation.
  * @return {gis.Deg} New transformed coordinate pair. */
gis.MU.prototype.toDeg=function() {
	return(new gis.Deg(
		Math.atan(Math.exp((this.llat/gis.MU.range*2-1)*Math.PI))*360/Math.PI-90,
		(this.llon/gis.MU.range*2-1)*180
	));
};

/** @param {number} north Movement northward. Unit: meters.
  * @param {number} east Movement eastward. Unit: meters.
  * @return {gis.MU} New transformed coordinate pair. */
gis.MU.prototype.offset=function(north,east) {
	var scale;
	var f,t;

	// Tangent of latitude.
	t=Math.exp((this.llat/gis.MU.range*2-1)*Math.PI);
	// Latitude scale factor due to stretching in Mercator.
	scale=gis.MU.range/(gis.MU.major*4*Math.PI)*(1/t+t);
	// Ellipsoid flattening correction factor.
	f=gis.MU.flatten;
	t=t*t+1;
	// No division by zero here, denominator is >1.
	t=f*( (1-t)/(t*t)*8+1 );

	return(new gis.MU(
		this.llat+scale/(1+( t*3-f )/2)*north,
		this.llon+scale/(1+( t+f )/2)*east
	));
};

/** @param {number} lat
  * @return {number} Scaling factor. */
gis.MU.getScale=function(lat) {
	var scale;
	var f,t;
	var north,east;

	// Tangent of latitude.
	t=Math.exp((lat/gis.MU.range*2-1)*Math.PI);
	// Latitude scale factor due to stretching in Mercator.
	scale=gis.MU.range/(gis.MU.major*4*Math.PI)*(1/t+t);
	// Ellipsoid flattening correction factor.
	f=gis.MU.flatten;
	t=t*t+1;
	// No division by zero here, denominator is >1.
	t=f*( (1-t)/(t*t)*8+1 );

	// Calculate displacement in meters in rectangular coordinates.
	return((1+( t*3-f )/2)/scale);
};

/** Fast approximate distance calculation on ellipsoidal surfaces, intended for points <1km apart and not right on the polar ice caps.
  * @param {gis.MU} ll
  * @return {number} Distance. Unit: meters. */
gis.MU.prototype.distTo=function(ll) {
/*
	var f,t;
	var scale;
	var north,east;

	// Tangent of average latitude.
	t=Math.exp(((this.llat+ll.llat)/gis.MU.range-1)*Math.PI);
	// Latitude scale factor due to stretching in Mercator.
	scale=gis.MU.range/(gis.MU.major*4*Math.PI)*(1/t+t);
	// Ellipsoid flattening correction factor.
	f=gis.MU.flatten;
	t=t*t+1;
	// No division by zero here, denominator is >1.
	t=f*( (1-t)/(t*t)*8+1 );

	// Calculate displacement in meters in rectangular coordinates.
	north=(ll.llat-this.llat)*(1+( t*3-f )/2)/scale;
	east=(ll.llon-this.llon)*(1+( t+f )/2)/scale;
*/

	var scale;
	var north,east;

	scale=gis.MU.getScale((this.llat+ll.llat)/2);
	north=(ll.llat-this.llat)*scale;
	east=(ll.llon-this.llon)*scale;

	return(Math.sqrt(north*north+east*east));
};
