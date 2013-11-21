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

goog.provide('gis.io.Stream');
goog.require('gis.Obj');

/** @constructor */
gis.io.Stream=function() {
	/** @type {number} */
	this.pos=0;
};

/** @enum {boolean} */
gis.io.Stream.Endian={
	BIG:true,
	LITTLE:false
};
