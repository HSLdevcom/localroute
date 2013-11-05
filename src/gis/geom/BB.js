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

/** @fileoverview Bounding box defined by coordinates of two corners. */

goog.provide('gis.geom.BB');
goog.require('gis.Obj');

/** @constructor
  * @param {number} lat1 South edge latitude.
  * @param {number} lon1 West edge longitude.
  * @param {number} lat2 North edge latitude.
  * @param {number} lon2 East edge longitude. */
gis.geom.BB=function(lat1,lon1,lat2,lon2) {
    /** @type {number} */
    this.lat1=lat1;
    /** @type {number} */
    this.lon1=lon1;
    /** @type {number} */
    this.lat2=lat2;
    /** @type {number} */
    this.lon2=lon2;
};

gis.geom.BB.prototype.toString=function() {
	return('('+this.lat1+', '+this.lon1+')-('+this.lat2+', '+this.lon2+')');
};

/** Calculate minimum squared distance from point to bounding box.
  * @param {number} lat
  * @param {number} lon
  * @return {number} Squared distance in map units or zero if point is inside bounds. */
gis.geom.BB.prototype.sqDistTo=function(lat,lon) {
	var lat1,lon1,lat2,lon2,dlat,dlon;
	var dist,minDist;

	lat1=this.lat1;
	lon1=this.lon1;
	lat2=this.lat2;
	lon2=this.lon2;

	if(lat>=lat1 && lat<lat2 && lon>=lon1 && lon<lon2) return(0);

	// Check corners.
	dlat=lat-lat1;dlon=lon-lon1;minDist=dlat*dlat+dlon*dlon;
	dlat=lat-lat2;dist=dlat*dlat+dlon*dlon;if(dist<minDist) minDist=dist;
	dlon=lon-lon2;dist=dlat*dlat+dlon*dlon;if(dist<minDist) minDist=dist;
	dlat=lat-lat1;dist=dlat*dlat+dlon*dlon;if(dist<minDist) minDist=dist;

	// Check edges.
	if(lat>=lat1 && lat<lat2) {
		dlon=lon-lon1;if(dlon*dlon<minDist) minDist=dlon*dlon;
		dlon=lon-lon2;if(dlon*dlon<minDist) minDist=dlon*dlon;
	}

	if(lon>=lon1 && lon<lon2) {
		dlat=lat-lat1;if(dlat*dlat<minDist) minDist=dlat*dlat;
		dlat=lat-lat2;if(dlat*dlat<minDist) minDist=dlat*dlat;
	}

	return(minDist);
};

/** Merge bounding boxes.
  * @param {gis.geom.BB} other */
gis.geom.BB.prototype.merge=function(other) {
	if(other.lat1<this.lat1) this.lat1=other.lat1;
	if(other.lon1<this.lon1) this.lon1=other.lon1;
	if(other.lat2>this.lat2) this.lat2=other.lat2;
	if(other.lon2>this.lon2) this.lon2=other.lon2;
};
