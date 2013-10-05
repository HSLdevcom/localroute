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

/** @fileoverview Fast table-based Base64 encoding. */

goog.provide('gis.enc.Base64');

/** @constructor */
gis.enc.Base64=function() {
	//                 1         2         3         4         5         6
	//       0123456789012345678901234567890123456789012345678901234567890123
	var b64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var chr,enc;
	/** @type {Array.<number>} */
	var dec=[];
	var i,j;

	chr=b64.split('');
	enc=[];

	// Construct lookup table for 12-bit values.
	for(i=0;i<65;i++) {
		dec[b64.charCodeAt(i)]=i;
		for(j=0;j<65;j++) {
			// Reverse characters for table entries > 4096 because padding char goes last.
			enc[i*64+j]=i<64?chr[i]+chr[j]:chr[j]+chr[i];
		}
	}

	/** @type {Array.<string>} */
	this.encTbl=enc;
	/** @type {Array.<number>} */
	this.decTbl=dec;
	/** @type {number} Must be divisible by 3. */
	this.chunkSize=9999;
};

/** Very fast base64 encoding. Handles 12 bits per table lookup.
  * @param {string|Array|Uint8Array} data
  * @param {number} pos
  * @param {number} end
  * @return {string} */
gis.enc.Base64.prototype.encodePart=function(data,pos,end) {
	var txt;
	var encTbl;
	var chr;

	encTbl=this.encTbl;
	txt='';
	if(typeof(data)=='string') {
		// This loop can be a performance bottleneck, so it's repeated for strings and arrays.
		for(;pos<end;pos+=3) {
			chr=data.charCodeAt(pos-1);
			txt+=encTbl[(data.charCodeAt(pos-2)<<4)+(chr>>4)];
			txt+=encTbl[((chr&15)<<8)+data.charCodeAt(pos)];
		}
	} else {
		for(;pos<end;pos+=3) {
			txt+=encTbl[(data[pos-2]<<4)+(data[pos-1]>>4)];
			txt+=encTbl[((data[pos-1]&15)<<8)+(/** @type {number} */ data[pos])];
		}
	}

	return(txt);
};

/** Base64 encode data in chunks and assemble result into a string.
  * @param {string|Array|ArrayBuffer|Uint8Array|NodeBuffer} data
  * @return {string} */
gis.enc.Base64.prototype.encode=function(data) {
	var txtList;
	var txt;
	var encTbl;
	var pos,len,end;
	var chr;
	var chunkSize;

	if(typeof(data)=='string') {
		// For string data it's faster to use the browser's internal base64 encoding if available.
		// Converting an array to string first would make it slower instead, see http://jsperf.com/base64-encode
		if(typeof(window)!='undefined' && window.btoa) return(window.btoa(data));
	} else data=gis.enc.util.toArray8(data);
	len=data.length;
	if(!len) len=0;

	encTbl=this.encTbl;
	chunkSize=this.chunkSize;
	txtList=[];
	txt='';

	// Base64 encode in chunks.
	end=2;
	pos=end;
	while(end<len) {
		end+=chunkSize;
		if(end>len) end=len;
		if(txt) txtList.push(txt);
		txt=this.encodePart(data,pos,end);
		pos=end;
	}

	// Encode remaining bytes.
	switch(len%3) {
		case 2:
			if(typeof(data)=='string') {
				chr=data.charCodeAt(len-1);
				txt+=encTbl[(data.charCodeAt(len-2)<<4)+(chr>>4)];
				txt+=encTbl[4096+(chr&15)*4];
			} else {
				txt+=encTbl[(data[len-2]<<4)+(data[len-1]>>4)];
				txt+=encTbl[4096+(data[len-1]&15)*4];
			}
			break;
		case 1:
			if(typeof(data)=='string') txt+=encTbl[data.charCodeAt(len-1)<<4];
			else txt+=encTbl[data[len-1]<<4];
			txt+=encTbl[4160];
	}

	if(len>chunkSize+2) {
		txtList.push(txt);
		txt=/** @type {string} */ (txtList.join(''));
	}

	return(txt);
};
