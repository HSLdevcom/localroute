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

var goog={
	/** @type {Object.<*>} */
	global:this,
	/** @param {string} x */
	provide:function(x) {
		var a,i,o;
		if(x=='goog' || x=='main') return;
		a=x.split('.');
		o=/** @type {Object.<*>} */ (goog.global);
		for(i=0;i<a.length;i++) {
			if(!o[a[i]]) o[a[i]]={};
			o=o[a[i]];
		}
	},
	require:function() {}
};

goog.provide('goog');
