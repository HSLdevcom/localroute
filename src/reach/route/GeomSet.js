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

goog.provide('reach.route.GeomSet');
goog.require('gis.Obj');
goog.require('reach.trans.Shape');
goog.require('gis.osm.Way');

/** @constructor */
reach.route.GeomSet=function() {
};

/** @param {Array.<reach.trans.Shape>} shapeList */
reach.route.GeomSet.prototype.prepareTree=function(shapeList) {
	var tree;
	var shapeNum,shapeCount;
	var shape;
	var way;

	tree=new gis.osm.QuadTree(new gis.geom.BB(0,0,gis.MU.range,gis.MU.range));

	shapeCount=shapeList.length;

	for(shapeNum=0;shapeNum<shapeCount;shapeNum++) {
		shape=shapeList[shapeNum];
		way=new gis.osm.Way();
		way.ptList=shape.ptList;
		tree.insertWay(way);
	}

	// Can't split to much less than shapeCount points per tile
	// because so many shapes overlap that it would split forever.
	// shapeCount*2 ensures that even if all of them overlap the split will terminate.
	tree.root.split(shapeCount*2);
	this.tree=tree;
};
