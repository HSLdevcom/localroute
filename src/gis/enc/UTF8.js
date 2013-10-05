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

/** @fileoverview Fast UTF8 encoding and decoding. */

goog.provide('gis.enc.UTF8');

/** @constructor */
gis.enc.UTF8=function() {};

/** Fast UTF-8 encoding.
  * @param {string} data
  * @return {string} */
gis.enc.UTF8.prototype.encode=function(data) {
	var pos,len,first;
	var utf8;
	var chr;

	first=0;
	utf8='';
	len=data.length;
	for(pos=0;pos<len;pos++) {
		chr=data.charCodeAt(pos);
		if(chr<128) continue;

		if(pos>first) utf8+=data.substr(first,pos-first);
		if(chr<2048) utf8+=String.fromCharCode((chr>>6)|0xc0,(chr&0x3f)|0x80);
		else if(chr<65536) utf8+=String.fromCharCode((chr>>12)|0xe0,((chr>>6)&0x3f)|0x80,(chr&0x3f)|0x80);
		else utf8+=String.fromCharCode((chr>>18)|0xf0,((chr>>12)&0x3f)|0x80,((chr>>6)&0x3f)|0x80,(chr&0x3f)|0x80);

		first=pos+1;
	}

	if(pos>first) utf8+=data.substr(first,pos-first);
	return(utf8);
};

/** Fast UTF-8 decoding.
  * @param {string} data
  * @return {string} */
gis.enc.UTF8.prototype.decode=function(data) {
	var pos,len,first;
	var txt;
	var chr;

	first=0;
	txt='';
	len=data.length;
	for(pos=0;pos<len;pos++) {
		chr=data.charCodeAt(pos);
		if(chr<128) continue;

		if(pos>first) txt+=data.substr(first,pos-first);
		if(chr<224) txt+=String.fromCharCode(((chr&31)<<6) | (data.charCodeAt(++pos)&63));
		else if(chr<240) {
			txt+=String.fromCharCode(((chr&15)<<12) |
				((data.charCodeAt(pos+1)&63)<<6) |
				 (data.charCodeAt(pos+2)&63));
			pos+=2;
		} else {
			txt+=String.fromCharCode(((chr&7)<<18) |
				((data.charCodeAt(pos+1)&63)<<12) |
				((data.charCodeAt(pos+2)&63)<<6) |
				 (data.charCodeAt(pos+3)&63));
			pos+=3;
		}

		first=pos+1;
	}

	return(txt);
};

/*
// This version is slower but looks nice.
gis.enc.UTF8.prototype.encode=function(data) {
	return(data.replace(/[^\x00-\x7f]+/g,function(part) {
		var pos,len;
		var utf8;

		len=part.length;
		utf8='';
		for(pos=0;pos<len;pos++) {
			chr=part.charCodeAt(pos);
			if(chr<2048) utf8+=String.fromCharCode((chr>>6)|0xc0,(chr&0x3f)|0x80);
			else if(chr<65536) utf8+=String.fromCharCode((chr>>12)|0xe0,((chr>>6)&0x3f)|0x80,(chr&0x3f)|0x80);
			else utf8+=String.fromCharCode((chr>>18)|0xf0,((chr>>12)&0x3f)|0x80,((chr>>6)&0x3f)|0x80,(chr&0x3f)|0x80);
		}

		return(utf8);
	}));
};
*/
