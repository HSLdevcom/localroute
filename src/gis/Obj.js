/**
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

/* global self */
/* global window */

goog.provide('gis.Obj');

/** @param {Function} subClass
  * @param {Function} parentClass */
gis.inherit=function(subClass,parentClass) {
	var Obj;

	Obj=/** @constructor */ function() {};
	Obj.prototype=parentClass.prototype;
	subClass.prototype=new Obj();
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
