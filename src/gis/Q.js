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

goog.provide('gis.Q');

/** Empty class just to hold bit twiddling methods.
  * @constructor */
gis.Q=function() {};

/** Decode signed integer, compressed into unsigned with least significant bit as sign.
  * Adapted from Sean Anderson's conditional negate bit twiddling hack.
  * In Out
  *  0  0
  *  1 -1
  *  2  1
  *  3 -2
  *  4  2
  * @param {number} x
  * @return {number}  */
gis.Q.toSigned=function(x) {
	return((x>>>1)^-(x&1));
};

/** Encode signed integer, compressing to unsigned with least significant bit as sign.
  * In Out
  * -2  3
  * -1  1
  *  0  0
  *  1  2
  *  2  4
  * @param {number} x
  * @return {number}  */
gis.Q.fromSigned=function(x) {
	return((x<<1)^-(x>>>31));
};

/** Fast fixed point sin, input [0,2pi[ scaled to [0,65536[ and output [-1,1] to [-65536,65536].
  * Adapted from "Fast and accurate sine/cosine" thread at devmaster.net by Nick.
  * This is 2x the speed of Math.sin and good enough for projecting global maps.
  * Output is continuous and exactly correct at min/max values and zeroes.
  * @param {number} x
  * @return {number}  */
gis.Q.sin16=function(x) {
	var m;

	// Truncate to 16 bits and sign extend.
	x=((x&65535)^32768)-32768;
	// Prepare mask for getting absolute value.
	m=x>>>16;
	// x-=abs(x)*x
	x-=((x+m^m)*x)>>15;
	// Prepare mask for getting absolute value.
	m=x>>>16;
	// x=abs(x)*x*0.225+x*0.775
	x=((((x+m^m)*x)>>13)*115+x*397)>>6;

	return(x);
};

/** Fast fixed point cos, input [0,2pi[ scaled to [0,65536[ and output [-1,1] to [-65536,65536].
  * @param {number} x
  * @return {number}  */
gis.Q.cos16=function(x) {
	return(gis.Q.sin16(x+16384));
};

/** @type {number} Square of a number that definitely fits in the 53-bit integer precision of JavaScript numbers. */
gis.Q.maxSqr=Math.pow(2,102);

/** Return arbitrary number with same sign as cross product a1*a2-b1*b2 (2x2 determinant).
  * Exact for at least 31-bit signed integer input. Note order of parameters.
  * @param {number} a1
  * @param {number} b1
  * @param {number} b2
  * @param {number} a2
  * @return {number} */
gis.Q.detSign64=function(a1,b1,b2,a2) {
	var a,b,d;

	// Try floating point first and return result if products are small enough (check the sum of their squares)
	// or their difference is large enough.
	// Multiplication results have 53 bits of accuracy while 64 may be needed, so after rounding error can be
	// +/- 2^10=1024 for each product and 2048 for their difference, if they don't fit in 53 bits.
	a=a1*a2;
	b=b1*b2;
	d=a-b;
	if(d*d>2048*2048 || a*a+b*b<gis.Q.maxSqr) return(d);

	// Calculate only lowest 15 bits of products, since higher ones were already found to be equal.
	// Signs of products match because they're over 50 bits while their difference is small, so no checks are needed.
	d=(a1&0x7fff)*(a2&0x7fff)-(b1&0x7fff)*(b2&0x7fff);

	// Product high bits can be pairs like 7fff and 0000, while real difference is small (such as +/- 1).
	// To fix this, take only 13 bits of the difference and sign extend.
	return(((d&0x1fff)^0x1000)-0x1000);
};

/** @param {number} n
  * @param {number} prec
  * @return {number} */
gis.Q.round=function(n,prec) {
	if(n<0) prec=-prec;
	return(~~(n*prec+0.5)/prec);
};

/** @param {Array.<number>} data
  * @return {{mean:number,variance:number}} */
gis.Q.getStats=function(data) {
	var i,count;
	var x,sum;
	var mean,variance;

	count=data.length;

	sum=0;
	for(i=0;i<count;i++) sum+=data[i];
	mean=sum/count;

	sum=0;
	for(i=0;i<count;i++) {
		x=data[i]-mean;
		sum+=x*x;
	}
	variance=sum/count;

	return({mean:mean,variance:variance});
};

/** @param {function():number} advance */
gis.Q.busy=function(advance) {
	while(advance()) {}
};

/** @param {number|string} n
  * @param {number} width
  * @return {string} */
gis.Q.zeroPad=function(n,width) {
	var len;

	n=''+n;
	len=n.length;
	if(len>=width) return(n);

	return(new Array(width-n.length+1).join('0')+n);
};

/** Trim leading and trailing whitespace.
  * Based on code by Steven Levithan at http://blog.stevenlevithan.com/archives/faster-trim-javascript
  * @param {string} txt
  * @return {string} */
gis.Q.trim=function(txt) {
	var pos;
	var re;

	txt=txt.replace(/^\s\s*/,'');
	pos=txt.length;
	re=/\s/;

	while(re.test(txt.charAt(--pos))) {}
	return(txt.substr(0,pos+1));
};

/** @param {number} stamp
  * @return {string}  */
gis.Q.formatTime=function(stamp) {
	var d=new Date(stamp);

	return(gis.Q.zeroPad(d.getHours(),2)+':'+gis.Q.zeroPad(d.getMinutes(),2)+':'+gis.Q.zeroPad(d.getSeconds(),2));
};
