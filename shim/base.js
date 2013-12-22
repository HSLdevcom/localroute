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

/** @fileoverview Shim to replace Closure Library.
  * This is just enough for Closure Compiler to function normally
  * without bringing in any unnecessary code. */

var goog={
	/** @type {Object.<*>} */
	global:this,
	/** @param {string} name */
	require:function() {},
	/** Create object and its parents from path.
	  * @param {string} name Path with names separated by dots.
	  * @param {*=} sym Symbol to store at the end of the path.
	  * @param {Object.<string,*>=} obj Root object. */
	exportSymbol:function(name,sym,obj) {
		var partList;
		var partNum,partCount;

		// Closure Compiler wants to see virtual nonsense calls to this function
		// that must be ignored if the code is run without compiling.
		if(name=='goog' || name=='main') return;

		// Write to the global object if no root was given.
		if(!obj) obj=/** @type {Object.<string,*>} */ (goog.global);

		// Create an empty object if not exporting a symbol.
		if(!sym) sym={};

		partList=name.split('.');
		partCount=partList.length;

		// Create object and any parents that are missing.
		for(partNum=0;partNum<partCount-1;partNum++) {
			if(!obj[partList[partNum]]) obj[partList[partNum]]={};
			obj=obj[partList[partNum]];
		}

		obj[partList[partNum]]=sym;
	},
	/** @param {Object} obj
	  * @param {string} name
	  * @param {*} sym */
	exportProperty:function(obj,name,sym) {
		obj[name]=sym;
	}
};

// Closure compiler removes provide calls but if we want to run uncompiled,
// exporting an empty symbol is a substitute for it.
goog.provide=goog.exportSymbol;
// Fake that this is Closure Library's main file, to keep the compiler happy.
goog.provide('goog');
