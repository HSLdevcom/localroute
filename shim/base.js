/*
	This file is part of LocalRoute.js.

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
