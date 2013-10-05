/** @license
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

goog.provide('gis.Obj');

/** @param {Function} subClass
  * @param {Function} parentClass */
gis.inherit=function(subClass,parentClass) {
	var Obj;

	Obj=/** @constructor */ function() {};
	Obj.prototype=parentClass.prototype;
	subClass.prototype=new Obj();
//	subClass.parentClass=parentClass;
};

gis.env={};

/** @enum {number} */
gis.env.Type={
	UNKNOWN:0,
	BROWSER:1,
	WORKER:2,
	NODE:3
};

/** @type {gis.env.Type} */
gis.env.platform;

if(typeof(process)!='undefined' && process.versions && process.versions.node) {
	gis.env.platform=gis.env.Type.NODE;
} else if((typeof(window)=='undefined' || !window.document) && typeof(self)!='undefined' && self!=window) {
	gis.env.platform=gis.env.Type.WORKER;
} else if(typeof(navigator)!='undefined') {
	gis.env.platform=gis.env.Type.BROWSER;
} else {
	gis.env.platform=gis.env.Type.UNKNOWN;
}

if(gis.env.platform==gis.env.Type.NODE) {
	eval("var fs=require('fs');");
	eval("var sys=require('sys');");
	eval("var Iconv=require('iconv').Iconv;");
	eval("var expat=require('node-expat');");
	eval("var Stream=require('stream');");
	eval("var util=require('util');");
	eval("var childProcess=require('child_process');");
	eval("var lz77=require('lz77');");
}
