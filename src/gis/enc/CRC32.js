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

/** @fileoverview Fast CRC32 calculation supporting different polynomials. */

goog.provide('gis.enc.CRC32');
goog.require('gis.enc.util');

/** 32-bit Cyclic Redundancy Check.
  * @constructor
  * @param {number=} poly Reversed generator polynomial. Leave out to use default.
  *   Other good choices are 0x82f63b78 (Castagnoli) used in Btrfs and 0xeb31d82e (Koopman). */
gis.enc.CRC32=function(poly) {
	var i,j,crc;
	var tbl;

	if(!poly) poly=0xedb88320; // Used in Ethernet, Gzip, PNG.
	tbl=/** @type {Array.<number>} */ ([]);

	for(i=0;i<256;i++) {
		crc=i;
		for(j=8;j--;) {
			crc=((crc>>>1)^(-(crc&1)&poly))>>>0;
		}
		tbl[i]=crc;
	}

	this.tbl=tbl;
	this.crc=0xffffffff;
};

/** @param {string|Array|ArrayBuffer|Uint8Array} data
  * @param {number=} pos Index in data to start checksumming.
  * @param {number=} len Number of characters to process.
  * @return {number} 32-bit CRC. */
gis.enc.CRC32.prototype.append=function(data,pos,len) {
	var tbl;
	var crc;

	if(typeof(data)!='string') data=gis.enc.util.toArray8(data);
	if(!len) {
		len=data.length;
		if(!len) len=0;
	}

	if(!pos) pos=0;
	tbl=this.tbl;
	crc=this.crc;

	if(typeof(data)=='string') {
		while(len--) crc=(crc>>>8)^tbl[(crc&255)^data.charCodeAt(pos++)];
	} else {
		while(len--) crc=(crc>>>8)^tbl[(crc&255)^data[pos++]];
	}

	this.crc=crc;
	// Flip bits and make unsigned.
	return((crc^0xffffffff)>>>0);
};
