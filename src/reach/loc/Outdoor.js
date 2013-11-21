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

goog.provide('reach.loc.Outdoor');
goog.require('gis.Obj');
goog.require('reach.loc.Location');
goog.require('gis.osm.MapSet');

/** @constructor
  * @extends {reach.loc.Location}
  * @param {gis.MU} ll
  * @param {gis.osm.MapSet} mapSet */
reach.loc.Outdoor=function(ll,mapSet) {
	reach.loc.Location.call(this);
	this.ll=ll;

	/** @type {gis.osm.MapSet} */
	this.mapSet=mapSet;

	/** @type {gis.osm.Way} */
	this.way;
	/** @type {number} */
	this.pos;

	/** @type {number} How many nearby stops have been found. */
	this.stopCount=0;
	/** @type {reach.route.result.WalkLeg} */
	this.srcLeg=null;
};

gis.inherit(reach.loc.Outdoor,reach.loc.Location);

/** @return {Array.<reach.route.Visitor>} */
reach.loc.Outdoor.prototype.getVisitors=function() {
	var nearest;

console.log(this.ll);

	// TODO: the magic number here comes from conf.snapDist
	nearest=this.mapSet.waySet.tree.findWay(this.ll.llat,this.ll.llon,null,500,this.mapSet.waySet.tree.root,0,0,0,function(way) {
		return((way.profile.access&gis.osm.ProfileSet.access.FOOT) && !(way.profile.limit&gis.osm.ProfileSet.access.FOOT));
	});

	console.log(nearest.pos);
	console.log(nearest.posNext);
	console.log(nearest.way.name);
	console.log(nearest.way.ptList[nearest.pos].nameRefList.map(function(way) {return(way.name);}).join(' '));
	console.log(nearest.way.ptList[nearest.posNext].nameRefList.map(function(way) {return(way.name);}).join(' '));

	return([]);
};
