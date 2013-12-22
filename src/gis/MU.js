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

/** @type {gis.MU} Used to avoid creating new objects for temporary use. */
gis.MU.ll=new gis.MU(0,0);

/** @type {Array.<{north:number,east:number}>} */
gis.MU.scaleTbl=[];

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
/** @type {Array.<number>} Table for finding rightmost set bit by de Bruijn multiplication.
  * From Bit Twiddling Hacks by Sean Eron Anderson. */
gis.MU.bsr=[
     0,  1, 28,  2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17,  4, 8,
    31, 27, 13, 23, 21, 19, 16, 7, 26, 12, 18,  6, 11,  5, 10, 9
];

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

/** @param {number} lat
  * @return {{north:number,east:number}} Scaling factors. */
gis.MU.getScale=function(lat) {
	var scale;
	var factor;
	var f,t;

	scale=gis.MU.scaleTbl[(lat+(1<<(gis.MU.bits-17)))>>>(gis.MU.bits-16)];
	if(!scale) {
		// Tangent of latitude.
		t=Math.exp((lat/gis.MU.range*2-1)*Math.PI);
		// Latitude scale factor due to stretching in Mercator.
		factor=gis.MU.range/(gis.MU.major*4*Math.PI)*(1/t+t);
		// Ellipsoid flattening correction factor.
		f=gis.MU.flatten;
		t=t*t+1;
		// No division by zero here, denominator is >1.
		t=f*( (1-t)/(t*t)*8+1 );

		// Calculate displacement in meters in rectangular coordinates.
		scale={
			north:(1+( t*3-f )/2)/factor,
			east:(1+( t+f )/2)/factor
		};

		gis.MU.scaleTbl[(lat+(1<<(gis.MU.bits-17)))>>>(gis.MU.bits-16)]=scale;
	}

	return(scale);
};

/** @param {number} north Movement northward. Unit: meters.
  * @param {number} east Movement eastward. Unit: meters.
  * @return {gis.MU} New transformed coordinate pair. */
gis.MU.prototype.offset=function(north,east) {
	var scale;

	scale=gis.MU.getScale(this.llat);

	return(new gis.MU(
		this.llat+north/scale.north,
		this.llon+east/scale.east
	));
};

/** Fast approximate distance calculation on ellipsoidal surfaces, intended for points <1km apart and not right on the polar ice caps.
  * @param {gis.MU} ll
  * @return {number} Distance. Unit: meters. */
gis.MU.prototype.distTo=function(ll) {
	var scale;
	var north,east;

	// Scale for average latitude.
	scale=gis.MU.getScale((this.llat+ll.llat)/2);

	// Calculate displacement in meters in rectangular coordinates.
	north=(ll.llat-this.llat)*scale.north;
	east=(ll.llon-this.llon)*scale.east;

	return(Math.sqrt(north*north+east*east));
};

/** Pack coordinate pair into an IEEE 754 double precision number, like this:
  * seeeeeee eeeeaaaa aaaaaaaa aaaaaaaa aaaooooo oooooooo oooooooo ooooooo1
  * 28 o's are longitude bits, 23 a's are latitude bits, 11 e's the exponent.
  * One more bit of latitude is implicitly encoded into e by normalization,
  * 4 more bits explicitly by multiplying the entire number by a power of 2.
  * Note that coordinates are rounded to 28 bits!
  * @param {number} lat
  * @param {number} lon
  * @return {number} */
gis.MU.toNum=function(lat,lon) {
	lat=(lat+2)>>2;
	lon=(lon+2)>>2;

	return( ( ((lat&0xffffff)*(1<<28)+lon)*2+1 ) * ((1<<(lat>>24))>>>0) );
};

/** @return {number} */
gis.MU.prototype.toNum=function() {
	return(gis.MU.toNum(this.llat,this.llon));
};

/** Unpack coordinate pair from an IEEE 754 double precision number.
  * @param {number} n
  * @return {gis.MU} */
gis.MU.prototype.fromNum=function(n) {
    var e;

	// Rightmost bit of mantissa is 1, some latitude bits are encoded into the
	// exponent causing the rightmost bit to shift left after converting to int.
	e=gis.MU.bsr[(((n&-n)>>>0)*0x077cb531)>>>27];
	// Divide by exponent offset to get all 53 bits of mantissa.
	n/=((1<<e)>>>0)*2;

	this.llat=((n/(1<<28))|(e<<24))<<2;
	this.llon=(n&((1<<28)-1))<<2;

	return(this);
};

/** @param {number} n
  * @return {gis.MU} */
gis.MU.fromNum=function(n) {
	var ll;

	ll=new gis.MU(0,0);
	return(ll.fromNum(n));
};
