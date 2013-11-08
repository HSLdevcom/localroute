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

goog.provide('gis.io.PackStream');
goog.require('gis.Obj');
goog.require('gis.io.Stream');

/** @constructor
  * @extends {gis.io.Stream}
  * @param {string|null} data
  * @param {function(string)|null} write */
gis.io.PackStream=function(data,write) {
	//                  1         2         3         4         5         6          7         8         9
	//        123 456789012345678901234567890123456789012345678901234567890 123456789012345678901234567890123456
//	var tbl="\n !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
	var tbl="\n!#$%()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}~";
	// Potentially dangerous characters: tab space "&'\`
	var dec=[];
	var i;

	gis.io.Stream.call(this);

	for(i=0;i<tbl.length;i++) {
		dec[tbl.charCodeAt(i)]=i;
	}

	/** @type {Array.<string>} */
	this.encTbl=tbl.split('');
	/** @type {Array.<number>} */
	this.decTbl=dec;
	/** @type {number} */
	this.extra=tbl.length-64;

	/** @type {string|null} */
	this.data=data;
	/** @type {number} */
	this.len=data?data.length:0;
	/** @type {function(string)|null} */
	this.write=write;
};

gis.inherit(gis.io.PackStream,gis.io.Stream);

/** Read a sequence of variable length integers. Small numbers compress better.
  * @param {Array.<number>} result Output array, reused between calls for speed.
  * @param {number} count
  * @return {Array.<number>} */
gis.io.PackStream.prototype.readShort=function(result,count) {
	var dec=this.decTbl;
	var extra=this.extra;
	var data;
	var pos;
	var c;
	var len,x,n;

	data=this.data;
	pos=this.pos;
	len=this.len;

	n=0;
	while(pos<len && n<count) {
		x=0;
		while((c=dec[data.charCodeAt(pos++)])>=64) x=x*extra+c-64;
		result[n++]=(x<<6)+c;
	}

	this.pos=pos;
	return(result);
};

/** Read a sequence of variable length integers. Large numbers compress better.
  * @param {Array.<number>} result Output array, reused between calls for speed.
  * @param {number} count
  * @return {Array.<number>} */
gis.io.PackStream.prototype.readLong=function(result,count) {
	var dec=this.decTbl;
	var extra=this.extra;
	var data;
	var pos;
	var c;
	var len,x,n;

	data=this.data;
	pos=this.pos;
	len=this.len;

	n=0;
	while(pos<len && n<count) {
		x=0;
		while((c=dec[data.charCodeAt(pos++)])<64) x=(x<<6)+c;
		result[n++]=x*extra+c-64;
	}

	this.pos=pos;
	return(result);
};

/** @param {Array.<number>} data Must be a list of positive numbers, otherwise this function hangs!
  * @return {string} */
gis.io.PackStream.prototype.encodeShort=function(data) {
	var enc=this.encTbl;
	var extra=this.extra;
	var c;
	var len,x;
	var result;

	len=data.length;
	result='';

	while(len--) {
		x=data[len];
		// if(x<0) {console.trace('Negative number to encode!');throw('Negative number to encode!');}
		result=enc[x&63]+result;
		x>>=6;

		while(x) {
			c=x%extra;
			x=(x-c)/extra;
			result=enc[c+64]+result;
		}
	}

	return(result);
};

/** @param {Array.<number>} data Must be a list of positive numbers, otherwise this function hangs!
  * @return {number} */
gis.io.PackStream.prototype.writeShort=function(data) {
	var result;

	result=this.encodeShort(data);
	this.write(result);

	return(result.length);
};

/** @param {Array.<number>} data Must be a list of positive numbers, otherwise this function hangs!
  * @return {string} */
gis.io.PackStream.prototype.encodeLong=function(data) {
	var enc=this.encTbl;
	var extra=this.extra;
	var c;
	var len,x;
	var result;

	len=data.length;
	result='';

	while(len--) {
		x=data[len];
		// if(x<0) {console.trace('Negative number to encode!');throw('Negative number to encode!');}
		c=x%extra;
		x=(x-c)/extra;
		result=enc[c+64]+result;

		while(x) {
			result=enc[x&63]+result;
			x>>=6;
		}
	}

	return(result);
};

/** @param {Array.<number>} data Must be a list of positive numbers, otherwise this function hangs!
  * @return {number} */
gis.io.PackStream.prototype.writeLong=function(data) {
	var result;

	result=this.encodeLong(data);
	this.write(result);

	return(result.length);
};

/** @param {number} len
  * @return {string} */
gis.io.PackStream.prototype.readRaw=function(len) {
	var data;

	data=this.data.substr(this.pos,len);
	this.pos+=len;

	return(data);
};

/** @param {string} data */
gis.io.PackStream.prototype.writeRaw=function(data) {
	this.write(data);
};

/** @param {number} len
  * @return {number} */
gis.io.PackStream.prototype.verify=function(len) {
//	return(this.check.append(this.data,this.pos,len));
	return(0);
};
