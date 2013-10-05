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

var gis={};
var reach={};
this.gis=gis;
this.reach=reach;
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

/** @fileoverview Calendrical calculations. */

goog.provide('gis.util.Date');

/** @constructor
  * @param {number} jd */
gis.util.Date=function(jd) {
	var year,month,day;
	var century;
	var isoWeekDay,weekDay,yearDay,isoYear,isoWeek;
	var jd1,jd4;
	var y;

	/** @param {number} jd */
	function getYMD(jd) {
		var century,centuryDay,yearDay;

		// Make the year start on March 1st so the weird month of February is moved to the end.
		jd+=305;
		// Get century and number of day within it. 146097 is the number of days in 400 years.
		century=~~((jd*4+3)/146097);
		centuryDay=jd-((century*146097)>>2);
		// Get year within century and day within year. 1461 is the number of days in 4 years.
		year=~~((centuryDay*4+3)/1461);
		yearDay=centuryDay-((year*1461)>>2);
		// 153 is the number of days in 5-month periods Mar-Jul and Aug-Dec. Here month 0 is March.
		// Formula gives month lengths 31 30 31 30 31 within those periods and February gets cut to 28 or 29 days.
		month=~~((5*yearDay+2)/153);

		day=yearDay-~~((month*153+2)/5)+1;
		// Offset months so counting starts from 1 and March becomes 3.
		month=(month+2)%12+1;
		// If month is Jan-Feb, increment year because it was effectively decremented when years were modified to start on March 1st.
		year=century*100+year+((18-month)>>4);
	}

	// US day of the week minus one, 0 is Sunday.
	weekDay=jd%7;
	// ISO day of the week minus one, 0 is Monday.
	isoWeekDay=(jd+6)%7;


	// Handle ISO week which belongs to the year its Thursday falls on.
	// Get year on this week's Thursday, which may not be this year but by definition is on this ISO year.
	getYMD(jd-isoWeekDay+3);
	isoYear=/** @type {number} */ (year);

	y=isoYear-1;
	century=~~(y/100);
	// Julian day of this ISO year's January 3rd.
	jd4=(century>>2)-century+(y>>2)+y*365+3;
	// Get last Sunday before January 4th. January 4th always falls on the first week of the ISO year because:
	// If January 1st is Thursday then 4th is Sunday, last day of the first week.
	// If January 1st is Friday then 4th is Monday, first day of the first week (previous week belongs to previous ISO year).
	// The Sunday before is the last day of the previous ISO year.
	jd4-=jd4%7;
	// Calculate ISO week number: Number of days from Sunday before ISO year's January 4th, divided by 7 rounded up.
    isoWeek=~~((jd-jd4+6)/7);

	getYMD(jd);

	y=year-1;
	century=~~(y/100);
	// Julian day of the last day of previous year.
	jd1=(century>>2)-century+(y>>2)+y*365;
	// Get day number of the year by comparing with last day of previous year.
	yearDay=jd-jd1;

	/** @type {number} */
	this.jd=jd;
	/** @type {number} */
	this.year=year;
	/** @type {number} */
	this.month=month;
	/** @type {number} */
	this.day=day;
	/** @type {number} */
	this.weekDay=weekDay;
	/** @type {number} */
	this.yearDay=yearDay;
	/** @type {number} */
	this.isoYear=isoYear;
	/** @type {number} */
	this.isoWeek=isoWeek;
};

/** @param {number} year
  * @param {number} month
  * @param {number} day
  * @return {gis.util.Date} */
gis.util.Date.fromYMD=function(year,month,day) {
	var y,century,leapDays;

	if(isNaN(year) || isNaN(month) || isNaN(day) || month<1 || month>12 || day<1 || day>31) return(null);

	// ((18-month)>>4)==1 if month<=2, else 0.
	// if month<=2 then this year's leap status doesn't affect julian day,
	// so check cumulative leap years only until previous year.
	y=year-((18-month)>>4);
	century=~~(y/100);
	leapDays=(century>>2)-century+(y>>2);

	return(new gis.util.Date(~~(((month+9)%12*153+2)/5)+leapDays+y*365+day-306));
};

/** @return {string} */
gis.util.Date.prototype.toFull=function() {
	/** @type {Array.<string>} */
	var weekDays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
	/** @type {Array.<string>} */
	var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

	/** @param {number} n
	  * @param {number} width
	  * @return {string} */
	function pad(n,width) {
		return(new Array(width-(''+n).length+1).join('0')+n);
	}

	return(
		pad(this.year,4)+'-'+pad(this.month,2)+'-'+pad(this.day,2)+
		' '+
		pad(this.isoYear,4)+'-W'+pad(this.isoWeek,2)+'-'+((this.weekDay+6)%7+1)+
		' '+
		this.jd+
		' '+
		weekDays[this.weekDay]+
		' '+
		this.day+' '+months[this.month-1]+' '+this.year
	);
};

/** @return {string} */
gis.util.Date.prototype.format=function() {
	/** @param {number} n
	  * @param {number} width
	  * @return {string} */
	function pad(n,width) {
		return(new Array(width-(''+n).length+1).join('0')+n);
	}

	return(pad(this.year,4)+'-'+pad(this.month,2)+'-'+pad(this.day,2));
};

gis.util.Date.prototype.toString=gis.util.Date.prototype.format;
/** @license
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

goog.provide('gis.Obj');

/** @param {Function} subClass
  * @param {Function} parentClass */
gis.inherit=function(subClass,parentClass) {
	var Obj;

	Obj=/** @constructor */ function() {};
	Obj.prototype=parentClass.prototype;
	subClass.prototype=new Obj();
//	subClass.parentClass=parentClass;
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

if(gis.env.platform==gis.env.Type.NODE) {
	eval("var fs=require('fs');");
	eval("var sys=require('sys');");
	eval("var Iconv=require('iconv').Iconv;");
	eval("var expat=require('node-expat');");
	eval("var Stream=require('stream');");
	eval("var util=require('util');");
	eval("var childProcess=require('child_process');");
	eval("var lz77=require('lz77');");
}
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

goog.provide('gis.io.LineStream');
goog.require('gis.Obj');
goog.require('gis.io.Stream');

/** @constructor
  * @extends {gis.io.Stream}
  * @param {string} data
  * @param {function(string)} write */
gis.io.LineStream=function(data,write) {
	var lineList;

	gis.io.Stream.call(this);

	if(data) lineList=data.split(/\r?\n/);
	else lineList=[];

	/** @type {Array.<string>} */
	this.lineList=lineList;
	/** @type {number} */
	this.lineCount=lineList.length;
	/** @type {function(string)} */
	this.write=write;
};

gis.inherit(gis.io.LineStream,gis.io.Stream);

/** @return {string} */
gis.io.LineStream.prototype.readLine=function() {
	if(this.pos>=this.lineCount) return(null);
	return(this.lineList[this.pos++]);
}

/** @param {string} txt */
gis.io.LineStream.prototype.writeText=function(txt) {
	this.write(txt);
};
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

goog.provide('gis.io.PackStream');
goog.require('gis.Obj');
goog.require('gis.io.Stream');

/** @constructor
  * @extends {gis.io.Stream}
  * @param {string} data
  * @param {function(string)} write */
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

	/** @type {string} */
	this.data=data;
	/** @type {number} */
	this.len=data?data.length:0;
	/** @type {function(string)} */
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

goog.provide('gis.Deg');
goog.require('gis.Obj');

/** Coordinate pair in decimal degrees.
  * @constructor
  * @param {number} lat Latitude, -90 to 90. Unit: degrees.
  * @param {number} lon Longitude, -180 to 180. Unit: degrees. */
gis.Deg=function(lat,lon) {
	/** @type {number} Latitude called llat for easier grepping, -90 to 90. Unit: degrees. */
	this.llat=lat;
	/** @type {number} Longitude called llon for easier grepping, -180 to 180. Unit: degrees. */
	this.llon=lon;
};

/** @return {string} */
gis.Deg.prototype.format=function() {
	return(this.llat+(this.llat<0?'S':'N')+', '+this.llon+(this.llon<0?'W':'E'));
};

gis.Deg.prototype.toString=gis.Deg.prototype.format;

/** Convert coordinate pair from decimal degrees to MU by scaling and Mercator transformation.
  * @return {gis.MU} New transformed coordinate pair. */
gis.Deg.prototype.toMU=function() {
	var r=gis.MU.range/2;

	return(new gis.MU(
		~~((Math.log(Math.tan((this.llat+90)*Math.PI/360))/Math.PI+1)*r),
		~~((this.llon/180+1)*r)
	));
};

/** Export EPSG:900913 coordinates.
  * @return {{llat:number,llon:number}} New transformed coordinate pair. */
gis.Deg.prototype.toGoog=function() {
	var r=gis.MU.major;

	return({
		llat:Math.log(Math.tan((this.llat+90)*Math.PI/360))*r,
		llon:this.llon/180*Math.PI*r
	});
};

/** Import EPSG:900913 coordinates.
  * @param {number} lat
  * @param {number} lon
  * @return {gis.Deg} New transformed coordinate pair. */
gis.Deg.fromGoog=function(lat,lon) {
	var r=gis.MU.major;

	return(new gis.Deg(Math.atan(Math.exp(lat/r))*360/Math.PI-90,lon*180/r/Math.PI));
};
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

/** @fileoverview Definition of Map Units and WGS84 ellipsoid. */

goog.provide('gis.MU');
goog.require('gis.Obj');
goog.require('gis.Deg');

/** Coordinate pair in MU (Map Units, Mercator projected 30-bit unsigned integer coordinates on WGS84 ellipsoid).
  * Note: lon=+180 degrees takes 31 bits.
  * @constructor
  * @param {number} lat Latitude, integer 0 to 1073741824. Unit: MU.
  * @param {number} lon Longitude, integer 0 to 1073741824. Unit: MU. */
gis.MU=function(lat,lon) {
	/** @type {number} Latitude called llat for easier grepping, integer 0 to 1073741824. Unit: MU. */
	this.llat=lat;
	/** @type {number} Longitude called llon for easier grepping, integer 0 to 1073741824. Unit: MU. */
	this.llon=lon;
};

/** @type {number} Number of bits to use for coordinates. */
gis.MU.bits=30;
/** @type {number} Maximum Map Unit coordinate value. */
gis.MU.range=1<<gis.MU.bits;
/** @type {number} Earth (first) flattening, often called "f". */
gis.MU.flatten=1/298.257223563;
/** @type {number} Earth equatorial radius, often called "a". Unit: meters. */
gis.MU.major=6378137;
/** @type {number} Earth polar radius, often called "b". Unit: meters. */
gis.MU.minor=gis.MU.major*(1-gis.MU.flatten);
/** @type {number} Min/max latitude for square-shaped Mercator projection. */
gis.MU.degLatRange=85.05112877980659;

/** @return {string} */
gis.MU.prototype.toString=function() {
	return(this.llat+','+this.llon);
};

/** Convert coordinate pair from MU to decimal degrees by scaling and inverse Mercator transformation.
  * @return {gis.Deg} New transformed coordinate pair. */
gis.MU.prototype.toDeg=function() {
	return(new gis.Deg(
		Math.atan(Math.exp((this.llat/gis.MU.range*2-1)*Math.PI))*360/Math.PI-90,
		(this.llon/gis.MU.range*2-1)*180
	));
};

/** @param {number} north Movement northward. Unit: meters.
  * @param {number} east Movement eastward. Unit: meters.
  * @return {gis.MU} New transformed coordinate pair. */
gis.MU.prototype.offset=function(north,east) {
	var scale;
	var f,t;

	// Tangent of latitude.
	t=Math.exp((this.llat/gis.MU.range*2-1)*Math.PI);
	// Latitude scale factor due to stretching in Mercator.
	scale=gis.MU.range/(gis.MU.major*4*Math.PI)*(1/t+t);
	// Ellipsoid flattening correction factor.
	f=gis.MU.flatten;
	t=t*t+1;
	// No division by zero here, denominator is >1.
	t=f*( (1-t)/(t*t)*8+1 );

	return(new gis.MU(
		this.llat+scale/(1+( t*3-f )/2)*north,
		this.llon+scale/(1+( t+f )/2)*east
	));
};

/** @param {number} lat
  * @return {number} Scaling factor. */
gis.MU.getScale=function(lat) {
	var scale;
	var f,t;
	var north,east;

	// Tangent of latitude.
	t=Math.exp((lat/gis.MU.range*2-1)*Math.PI);
	// Latitude scale factor due to stretching in Mercator.
	scale=gis.MU.range/(gis.MU.major*4*Math.PI)*(1/t+t);
	// Ellipsoid flattening correction factor.
	f=gis.MU.flatten;
	t=t*t+1;
	// No division by zero here, denominator is >1.
	t=f*( (1-t)/(t*t)*8+1 );

	// Calculate displacement in meters in rectangular coordinates.
	return((1+( t*3-f )/2)/scale);
};

/** Fast approximate distance calculation on ellipsoidal surfaces, intended for points <1km apart and not right on the polar ice caps.
  * @param {gis.MU} ll
  * @return {number} Distance. Unit: meters. */
gis.MU.prototype.distTo=function(ll) {
/*
	var f,t;
	var scale;
	var north,east;

	// Tangent of average latitude.
	t=Math.exp(((this.llat+ll.llat)/gis.MU.range-1)*Math.PI);
	// Latitude scale factor due to stretching in Mercator.
	scale=gis.MU.range/(gis.MU.major*4*Math.PI)*(1/t+t);
	// Ellipsoid flattening correction factor.
	f=gis.MU.flatten;
	t=t*t+1;
	// No division by zero here, denominator is >1.
	t=f*( (1-t)/(t*t)*8+1 );

	// Calculate displacement in meters in rectangular coordinates.
	north=(ll.llat-this.llat)*(1+( t*3-f )/2)/scale;
	east=(ll.llon-this.llon)*(1+( t+f )/2)/scale;
*/

	var scale;
	var north,east;

	scale=gis.MU.getScale((this.llat+ll.llat)/2);
	north=(ll.llat-this.llat)*scale;
	east=(ll.llon-this.llon)*scale;

	return(Math.sqrt(north*north+east*east));
};
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

goog.provide('reach.trans.Stop');
//goog.require('reach.road.Node');
//goog.require('reach.util');
goog.require('gis.MU');
//goog.require('reach.data.QuadTreeItem');

/** @constructor
  * @param {string} origId
  * @param {string} name
  * @param {gis.MU} ll */
reach.trans.Stop=function(origId,name,ll) {
	/** @type {number} */
	this.id=0;
	/** @type {string} */
	this.origId=origId;
	/** @type {string} */
	this.name=name;
	/** @type {gis.MU} */
	this.ll=ll;

	// Links connecting stop to transit network.
	/** @type {Array.<reach.trans.Line>} Transit lines passing by this stop. */
	this.lineList=[];
	/** @type {Array.<number>} How many stops are passed along each transit line before reaching this stop. */
	this.posList=[];

    /** @type {Object.<reach.trans.Trip.Mode,boolean>} */
    this.transModeTbl;

	// Routing data to store how stop was reached etc.
	/** @type {number} */
	this.runId;
	/** @type {number} */
	this.cost;
	/** @type {number} */
	this.time;
	/** @type {Array.<reach.road.Node>} Street network node that led to this stop. */
	this.srcNodeList;
	/** @type {Array.<reach.trans.Trip>} Trip along a transit line that led to this stop. */
	this.srcTripList;
	/** @type {Array.<number>} Offset of this stop along source trip. */
	this.srcPosList;

	// For backtracking.
	/** @type {number} */
	this.lastVisitTime;
	/** @type {Array.<number>} */
	this.lastTimeList;
	/** @type {Array.<reach.trans.Trip>} */
	this.lastTripList;
	/** @type {Array.<{time:number,cost:number,trip:reach.trans.Trip}>} */
	this.reverseDataList;
	/** @type {reach.route.result.LegRef} */
//	this.endWalk;

	// Links connecting stop to road network.
	/** @type {reach.road.Node} Nearest fast road graph node. */
	this.node;

	// Time table statistics used when compressing and decompressing.
	/** @type {Object.<number,number>} */
	this.followerTbl;
	/** @type {Array.<reach.trans.Stop>} */
	this.followerList;
	/** @type {number} */
	this.followerCount;
	/** @type {Array.<number>} */
	this.packNumList;
	/** @type {number} */
	this.packCount;

	/** @type {Array.<Array.<number>>} */
	this.durationsTo;
	/** @type {Array.<{mean:number,variance:number}>} */
	this.statsTo;

	/** @type {reach.loc.Location} */
	this.loc;

	/** @type {number} Number of departures around search start time, to evaluate stop niceness. */
	this.departureCount;

	/** @type {boolean} */
	this.disabled;
};

/** @param {reach.trans.Stop} next
  * @param {number} duration */
/*
reach.trans.Stop.prototype.addFollower=function(next,duration) {
	var followerNum;

*/
//	if(!this.durationsTo) this.durationsTo=/** @type {Array.<Array.<number>>} */ [];
/*
	followerNum=this.followerTbl[next.id];
	if(!followerNum && followerNum!==0) {
//		followerNum=this.followerList.length;
		followerNum=this.followerCount++;
		this.followerTbl[next.id]=followerNum;
//		this.followerList.push(next);
*/
//		this.durationsTo.push(/** @type {Array.<number>} */ ([duration]));
/*
	} else {
		this.durationsTo[followerNum].push(duration);
	}
};
*/

// This is only used for compressing data.
/** @param {number} statMul */
reach.trans.Stop.prototype.calcStats=function(statMul) {
	var followerNum,followerCount;
	var sampleNum,sampleCount;
	var stats;
	var mean,stdDev;
	var duration,err;
	var durationList,filteredList;

	followerCount=this.durationsTo.length;

	for(followerNum=0;followerNum<followerCount;followerNum++) {
		durationList=this.durationsTo[followerNum];
		stats=gis.Q.getStats(durationList);

		// Try to find errors if variance is over 1 minute.
		if(stats.variance>1) {
			sampleCount=durationList.length;
			stdDev=Math.sqrt(stats.variance);
			mean=stats.mean;

			filteredList=[];

			for(sampleNum=0;sampleNum<sampleCount;sampleNum++) {
				duration=durationList[sampleNum];
				err=(duration-mean)/stdDev;

				// If difference from mean is 3 sigma or less, accept data point.
				if(err>=-3 && err<=3) filteredList.push(duration);
				//else console.log(this.name+' -> '+this.followerList[followerNum].name+' mean '+mean+' dev '+stdDev+' sample '+duration+' error '+err);
			}

			stats=gis.Q.getStats(filteredList);
		}

//console.log(stats.variance);
		stats.mean=~~(stats.mean+0.5);
		stats.variance=~~(stats.variance+0.5);

		this.statsTo[followerNum]=stats;
	}
};

/** @return {Array.<{time:number,trip:reach.trans.Trip}>} */
reach.trans.Stop.prototype.getArrivals=function() {
	var lineList;
	var lineNum,lineCount;
	var line;
	var posList;
	var pos;
	var tripList;
	var tripNum,tripCount;
	var trip;
	var outList;

	outList=/** @type {Array.<{time:number,trip:reach.trans.Trip}>} */ ([]);
	posList=this.posList;

	lineList=this.lineList;
	lineCount=lineList.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=lineList[lineNum];
		pos=posList[lineNum];

		tripList=line.tripList;
		tripCount=tripList.length;
		for(tripNum=0;tripNum<tripCount;tripNum++) {
			trip=tripList[tripNum];

			outList.push({'time':trip.getArrival(pos),'trip':trip});
		}
	}

	outList.sort(function(a,b) {return(a.time-b.time);});

	return(outList);
};
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
}

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
}

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
}

/** Fast fixed point cos, input [0,2pi[ scaled to [0,65536[ and output [-1,1] to [-65536,65536].
  * @param {number} x
  * @return {number}  */
gis.Q.cos16=function(x) {
	return(gis.Q.sin16(x+16384));
}

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

goog.provide('gis.enc.LZ');
goog.require('gis.Obj');
goog.require('gis.Q');

/** @constructor */
gis.enc.LZ=function() {
	/** @type {number} */
	this.minRefLen=2;
};

/** LZ77-style compression.
  * @param {string} data
  * @param {number} repLen
  * @param {number} dictSize
  * @param {gis.io.PackStream} stream
  * @return {string} */
gis.enc.LZ.prototype.compressBytes=function(data,repLen,dictSize,stream) {
	var minRefLen=this.minRefLen;
	var dataPos,dataLen,readLen;
	var bufPos,bufRest,dictLen;
	var dictStart;
	var buf,dict,plain;
	var dictPos;
	var len,bestLen,bestPos;
	var ref;
	var result;
	var resultLen;
	var c;

	result=/** @type {Array.<string>} */ (['']);
	buf=/** @type {Array.<string>} */ ([]);
	bufPos=0;
	bufRest=0;
	dict=/** @type {Array.<string>} */ ([]);
	dictLen=0;
	plain='';
	dictStart=0;
	resultLen=0;

	dataLen=data.length;
	dataPos=0;

	while(dataPos<dataLen || bufRest) {
		readLen=repLen;
		if(bufRest+readLen>repLen) readLen=repLen-bufRest;
		if(dataPos+readLen>dataLen) readLen=dataLen-dataPos;

		buf.push.apply(buf,data.substr(dataPos,readLen).split(''));
//		buf=buf.concat(data.substr(dataPos,readLen).split(''));
		c=buf[bufPos];

		dataPos+=readLen;
		bufRest+=readLen;

		bestLen=0;
		bestPos=0;

		// Simple O(N^2) check to see if buffer contents can be found in dict.
		if(dictLen>dictSize) dictStart=dictLen-dictSize;
		for(dictPos=dictLen;dictPos-->dictStart;) {
			if(dict[dictPos]!=c) continue;

			for(len=1;len<bufRest;len++) {
				// Extracting bytes from dict past its end will repeat the extract several times.
				if(buf[bufPos+len]!=dict[dictPos+len%(dictLen-dictPos)]) break;
			}

			if(len-(dictPos>dictLen-1-64?0:1)>bestLen) {
				bestLen=len;
				bestPos=dictPos;
			}
		}

		ref='';
		if(bestLen>=minRefLen) {
			ref=stream.encodeShort([gis.Q.fromSigned(bestLen-minRefLen),dictLen-1-bestPos]);
		}

		if(bestLen<minRefLen || bestLen<=ref.length+(plain?1:0)) {
			// Storing a reference would save no space compared to outputting the compressable sequence as plain text,
			// so output one character as plain text and then loop back to find a sequence in dict again..
			plain+=c;
			dict.push(c);
			dictLen++;
			bufPos++;
			bufRest--;
		} else {
			// First output any pending uncompressed data.
			if(plain) {
				ref=stream.encodeShort([gis.Q.fromSigned(-plain.length)])+plain+ref;
				plain='';
			}
			result.push(ref);
			resultLen+=ref.length;
			bufPos+=bestLen;
			bufRest-=bestLen;

			if(bestLen<dictLen-bestPos) {
				dict.push.apply(dict,dict.slice(bestPos,bestPos+bestLen));
//				dict=dict.concat(dict.slice(bestPos,bestPos+bestLen));
				dictLen+=bestLen;
			}
		}

		if(dictLen>dictSize*2) {
			dict.splice(0,dictLen-(dictSize+1));
			dictLen=dictSize+1;
		}

		if(bufPos>repLen*2) {
			buf.splice(0,repLen*2);
			bufPos-=repLen*2;
		}
	}

	if(plain) {
		ref=stream.encodeShort([gis.Q.fromSigned(-plain.length)])+plain;
		resultLen+=ref.length;
		result.push(ref);
	}

	result[0]=stream.encodeLong([resultLen,dictSize]);

/*
	// For testing, decompress and compare:
	var compressed=result.join('');
	var data2=this.decompressBytes(new gis.io.PackStream(compressed,null),compressed.length,dictSize);
	console.log((data==data2)+'\t'+data.length+'\t'+data2.length);
*/


	return(result.join(''));
};

/** @param {gis.io.PackStream} stream
  * @return {string} */
gis.enc.LZ.prototype.decompressBytes=function(stream) {
	var minRefLen=this.minRefLen;
	var len,dictSize;
	var data,dict;
	var plain;
	var first,rep,dist,ref;
	var part;
	var chars;
	var dec;

	dec=/** @type {Array.<number>} */ ([]);
	stream.readLong(dec,2);
	len=dec[0];
	dictSize=dec[1];

	data=/** @type {Array.<string>} */ ([]);
	dict=/** @type {Array.<string>} */ ([]);
	first=stream.pos;

	while(stream.pos<first+len) {
		stream.readShort(dec,1);
		rep=gis.Q.toSigned(dec[0]);

		if(rep<0) {
			plain=stream.readRaw(-rep);

			data.push(plain);
			dict.push.apply(dict,plain.split(''));
		} else {
			rep+=minRefLen;
			stream.readShort(dec,1);
			dist=dec[0]+1;
			ref=dict.length-dist;

			if(rep>=dist) {
				part=dict.slice(ref).join('');

				while(rep>dist) {
					data.push(part);
					rep-=dist;
				}
				data.push(part.substr(0,rep));
			} else {
				chars=dict.slice(ref,ref+rep);
				data.push(chars.join(''));
				dict.push.apply(dict,chars);
			}
		}

		if(dict.length>dictSize*2) dict.splice(0,dict.length-dictSize);
	}

	return(data.join(''));
};
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

goog.provide('reach.trans.NameSet');
goog.require('gis.enc.LZ');

/** @constructor */
reach.trans.NameSet=function() {
	/** @type {Object.<string,number>} */
	this.tbl={};
	/** @type {Array.<string>} */
	this.list=[];
	/** @type {number} */
	this.count=0;
};

/** @param {string} txt */
reach.trans.NameSet.prototype.insert=function(txt) {
	var num;

	num=this.tbl[txt];
	if(!num && num!==0) {
		num=this.count++;
		this.list[num]=txt;
		this.tbl[txt]=num;
	}
};

reach.trans.NameSet.prototype.sortNames=function() {
	var nameTbl;
	var nameList;
	var nameNum,nameCount;

	nameTbl=this.tbl;
	nameList=this.list;
	nameList.sort();
	nameCount=nameList.length;

	for(nameNum=0;nameNum<nameCount;nameNum++) {
		nameTbl[nameList[nameNum]]=nameNum;
	}
};

/** @param {string} txt
  * @return {number} */
reach.trans.NameSet.prototype.getId=function(txt) {
	return(this.tbl[txt]);
};

/** @param {gis.io.PackStream} stream */
reach.trans.NameSet.prototype.exportPack=function(stream) {
	var txt;
	var lz;

	lz=new gis.enc.LZ();

	txt=this.list.join('\n');
	txt=lz.compressBytes(txt,32,2048,stream);
	stream.writeRaw(txt);
};

/** @param {gis.io.PackStream} stream */
reach.trans.NameSet.prototype.importPack=function(stream) {
	var txt;
	var lz;

	lz=new gis.enc.LZ();
	txt=lz.decompressBytes(stream);
	this.list=txt.split('\n');
};
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

goog.provide('reach.trans.StopSet');
goog.require('reach.trans.Stop');
goog.require('reach.trans.NameSet');
goog.require('gis.io.PackStream');

/** @constructor */
reach.trans.StopSet=function() {
	/** @type {Array.<reach.trans.Stop>} */
	this.list=[];
	/** @type {number} */
	this.count=0;
};

/** @param {reach.trans.Stop} stop */
reach.trans.StopSet.prototype.insert=function(stop) {
	stop.id=this.count;
	this.list[this.count++]=stop;

	return(stop);
};

reach.trans.StopSet.prototype.exportTempPack=function(write) {
	var stopList;
	var stopNum,stopCount;
	var stop;

	stopList=this.list;
	stopCount=this.count;
	write(stopCount+'\n');

	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=stopList[stopNum];
		write(stop.id+'\t'+stop.origId+'\t'+stop.ll.llat+'\t'+stop.ll.llon+'\t'+stop.name+'\n');
	}
};

reach.trans.StopSet.prototype.importTempPack=function(stream) {
	var txt;
	var stopList;
	var stopNum,stopCount;
	var stop;
	var ll;

	txt=stream.readLine();

	stopCount=+txt;
	stopList=[];
	stopList.length=stopCount;
	this.count=stopCount;

	for(stopNum=0;stopNum<stopCount;stopNum++) {
		fieldList=stream.readLine().split('\t');
		ll=new gis.MU(+fieldList[2],+fieldList[3]);
		stop=new reach.trans.Stop(fieldList[1],fieldList[4],ll);

		stop.id=+fieldList[0];
		stopList[stopNum]=stop;
	}

	this.list=stopList;
};

/** @param {reach.trans.NameSet} nameSet */
reach.trans.StopSet.prototype.getNames=function(nameSet) {
	var stopList;
	var stopNum,stopCount;

	stopList=this.list;
	stopCount=this.count;

	for(stopNum=0;stopNum<stopCount;stopNum++) {
		nameSet.insert(stopList[stopNum].origId);
		nameSet.insert(stopList[stopNum].name);
//		nameSet.insert(stopList[stopNum].name+'\t'+stopList[stopNum].origId);
	}
};

reach.trans.StopSet.prototype.clearFollowers=function() {
	var stopList;
	var stopNum,stopCount;
	var stop;

	stopList=this.list;
	stopCount=this.count;

	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=stopList[stopNum];

		stop.followerTbl={};
		stop.followerList=[];
		stop.followerCount=0;
		stop.durationsTo=[];
		stop.statsTo=[];
		stop.packNumTbl={};
		stop.packCount=0;
	}
};

/** @param {gis.io.PackStream} stream
  * @param {reach.trans.NameSet} nameSet */
reach.trans.StopSet.prototype.exportPack=function(stream,nameSet) {
	var stopList;
	var stopNum,stopCount;
	var stop;
	var ll,lat,lon;
	var origId,prevId,prevLat,prevLon;
	var nameId,prevNameId;

	stopList=this.list;
	stopCount=this.count;

	prevId=0;
	prevLat=0;
	prevLon=0;
	prevNameId=0;

	stream.writeLong([stopCount]);

	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=stopList[stopNum];
		lat=stop.ll.llat;
		lon=stop.ll.llon;
		origId=nameSet.getId(stop.origId);
		nameId=nameSet.getId(stop.name);
//		nameId=nameSet.getId(stop.name+'\t'+stop.origId);

		stream.writeShort([
			gis.Q.fromSigned(origId-prevId),
			gis.Q.fromSigned(nameId-prevNameId),
			gis.Q.fromSigned(lat-prevLat),
			gis.Q.fromSigned(lon-prevLon)
		]);

		prevId=origId;
		prevNameId=nameId;
		prevLat=lat;
		prevLon=lon;
	}
};

/** @param {gis.io.PackStream} stream
  * @param {reach.trans.NameSet} nameSet
  * @return {function():number} */
reach.trans.StopSet.prototype.importPack=function(stream,nameSet) {
	/** @type {reach.trans.StopSet} */
	var self=this;
	/** @type {number} */
	var origId;
	/** @type {number} */
	var nameId;
	/** @type {gis.MU} */
	var ll;
	/** @type {number} */
	var lat;
	/** @type {number} */
	var lon;
	/** @type {number} */
	var stopNum;
	var stopCount;
	var nameList;
	var dec;
	var step;

	var advance=function() {
		var data;
		var stop;

		switch(step) {
			// Initialize.
			case 0:
				step++;

				self.list=[];
//				self.tbl={};

				dec=[];
				stream.readLong(dec,1);
				stopCount=dec[0];
				stopNum=0;

				origId=0;
				lat=0;
				lon=0;
				nameId=0;

				return(stopCount);

			// Iterate to read stop data.
			case 1:
				stream.readShort(dec,4);
				origId+=gis.Q.toSigned(dec[0]);
				nameId+=gis.Q.toSigned(dec[1]);
				lat+=gis.Q.toSigned(dec[2]);
				lon+=gis.Q.toSigned(dec[3]);

				ll=new gis.MU(lat,lon);
				stop=new reach.trans.Stop(nameSet.list[origId],nameSet.list[nameId],ll);
				stop.followerList=[];
				stop.statsTo=[];
				self.insert(stop);

				return(--stopCount);
		}
	};

	step=0;
	return(advance);
};

/** @param {Array.<reach.trans.Stop>} stopList
  * @param {function(reach.trans.Stop):boolean} handler */
reach.trans.StopSet.prototype.filter=function(stopList,handler) {
	var outList;
	var stopNum,stopCount;
	var stop;

	outList=[];

	stopCount=stopList.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=stopList[stopNum];
		if(handler(stop)) outList.push(stop);
	}

	return(outList);
};

/** @param {Array.<reach.trans.Stop>} stopList
  * @param {function(reach.trans.Line):boolean} handler */
reach.trans.StopSet.prototype.filterLines=function(stopList,handler) {
	var outList;
	var stopNum,stopCount;
	var stop;
	var lineList;
	var lineNum,lineCount;

	outList=[];

	stopCount=stopList.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=stopList[stopNum];

		lineList=stop.lineList;
		lineCount=lineList.length;

		for(lineNum=0;lineNum<lineCount;lineNum++) {
			if(handler(lineList[lineNum])) {
				outList.push(stop);
				break;
			}
		}
	}

	return(outList);
};

/** @param {Object.<string,*>} term
  * @return {Array.<reach.trans.Stop>} */
reach.trans.StopSet.prototype.find=function(term) {
	var stopList;
	var name;
	var nameRe;
	var lineTbl;
	var lineList;
	var lineNum,lineCount;

	stopList=this.list;
	name=term['name'];
	if(name) {
		nameRe=new RegExp('^'+name,'i');
		stopList=this.filter(stopList,function(stop) {
			return(stop.name && nameRe.test(stop.name));
		});
	}

	lineList=term['lines'];
	if(lineList) {
		lineTbl={};
		lineCount=lineList.length;
		for(lineNum=0;stopNum<stopCount;stopNum++) {
			lineTbl[stopList[stopNum].id]=true;
		}

		stopList=this.filterLines(stopList,function(line) {
			return(lineTbl[line.id]||false);
		});
	}

	return(stopList);
};
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

goog.provide('reach.trans.Line');
goog.require('reach.trans.Stop');
//goog.require('reach.trans.Trip');
//goog.require('reach.util');

/** @constructor */
reach.trans.Line=function() {
	/** @type {number} */
	this.id=0;

	/** @type {Array.<reach.trans.Stop>} */
	this.stopList=[];
	/** @type {Array.<reach.trans.Trip>} */
	this.tripList=[];
	/** @type {Array.<number>} */
	this.distList=[];
	/** @type {Array.<number>} */
	this.followerList;
	/** @type {number} */
	this.tripCount=0;
	this.deltaStopList;

	/** @type {Array.<number>} Average time in minutes from first stop to reach each stop along the line. */
	this.arriveMean=[0];
	/** @type {Array.<number>} */
	this.arriveVariance=[0];
	this.duration;

	/** @type {Object.<number,number>} Used to filter out line if none of its trips use an allowed mode of transportation. */
	this.transModeTbl={};

	/** @type {number} */
	this.runId=0;
	/** @type {number} */
	this.firstPos=0;
	/** @type {Array.<number>} */
	this.costList=[];
	/** @type {Array.<number>} */
	this.timeList=[];

	/** @type {number} Number of departures around search start time, to evaluate line niceness. */
	this.departureCount=0;
};

reach.trans.Line.prototype.calcStats=function() {
	var followerList;
	var stopList;
	var stopNum,stopCount;
	var stop;
	var stats;
	var arriveMean;
	var arriveVariance;
	var deltaStopList;
	var deltaCount;
	var duration;
	var varianceSum;

	followerList=this.followerList;
	stopList=this.stopList;
	stopCount=stopList.length;
	arriveMean=[];
	arriveVariance=[];
	deltaStopList=[];
	deltaCount=0;
	duration=0;
	varianceSum=0;

	for(stopNum=0;stopNum<stopCount-1;stopNum++) {
		stop=stopList[stopNum];
		stats=stop.statsTo[followerList[stopNum]];
		duration+=stats.mean;
		varianceSum+=stats.variance;
		arriveMean[stopNum]=duration;
		arriveVariance[stopNum]=varianceSum;

		if(!stats.variance) continue;

		deltaStopList[deltaCount++]=stopNum+1;
	}

	this.arriveMean=arriveMean;
	this.arriveVariance=arriveVariance;
	this.deltaStopList=deltaStopList;
	this.duration=duration;

	stopCount--;
	if(deltaCount) deltaCount--;
};

/** @param {number} departTime Unit: minutes from midnight.
  * @return {number} */
/*
reach.trans.Line.prototype.findDeparture=function(departTime) {
	var first,last,mid;
	var trip;

	mid=0;
	first=0;
	last=this.tripList.length-1;
	// Binary search to find when the next bus of this line arrives.
	while(first<=last) {
		mid=(first+last)>>1;
		trip=this.tripList[mid];
		if(trip.startTime<departTime) first=mid+1;
		else if(trip.startTime>departTime) last=mid-1;
		else break;
	}

	return(mid);
};
*/

/** @param {number} time
  * @param {number} stopNum
  * @param {number} tripNum
  * @param {number} arrivalTime
  * @param {number} delta
  * @param {number} last
  * @return {Array.<number>} */
/*
reach.trans.Line.prototype.nextArrival=function(time,stopNum,tripNum,arrivalTime,delta,last,conf) {
	var prevTime;
	var prevNum;
	var trip;
	var transferTime;

	prevNum=tripNum;
	prevTime=arrivalTime;
	tripNum+=delta;

	for(;tripNum>=0 && tripNum<=last;tripNum+=delta) {
		trip=this.tripList[tripNum];
		if(!trip.getTransitCost(conf)) continue;
		transferTime=trip.getTransferTime(conf.forward,conf);

		arrivalTime=trip.guessArrival(stopNum)*60*conf.timeDiv;
		if((time+transferTime-arrivalTime)*delta>0) {
			prevNum=tripNum;
			prevTime=arrivalTime;
		} else return([tripNum,arrivalTime,prevNum,prevTime]);
	}

	return([tripNum,arrivalTime,prevNum,prevTime]);
}
*/

/** @param {number} stopNum   
  * @param {number} time   
  * @return {?{trip:reach.trans.Trip,time:number}} */
/*
reach.trans.Line.prototype.guessArrival=function(stopNum,time,conf) {
	type {reach.trans.Line}
	var self=this;
	var departTime,arrivalTime,prevTime;
	var trip;
	var tripNum,last;
	var forward;
	var transitCost;
	var transferTime;
	var prevNum;
	var near;

	if(this.tripList.length==0) return(null);

	forward=conf.forward;
	departTime=time/(60*conf.timeDiv)-this.meanDuration[stopNum]/this.lineSet.city.statMul;

	tripNum=this.findDeparture(departTime);
	trip=this.tripList[tripNum];
	// These crazy variables are here because technically different trips on the same could have different modes of transport...
	// Should get rid of them and split the line to two different ones if something that insane happens in the data.
	transitCost=trip.getTransitCost(conf);
	transferTime=trip.getTransferTime(forward,conf);

	arrivalTime=trip.guessArrival(stopNum)*60*conf.timeDiv;
	last=this.tripList.length-1;

	prevNum=tripNum;
	prevTime=arrivalTime;

	if((forward && arrivalTime>time+transferTime) || (!forward && arrivalTime<time+transferTime) || !transitCost) {
		// Check if there's an even earlier arrival.
		near=this.nextArrival(time+transferTime,stopNum,tripNum,prevTime,forward?-1:1,last,conf);
		tripNum=near[2];
		arrivalTime=near[3];

		trip=this.tripList[tripNum];
		transitCost=trip.getTransitCost(conf);
		transferTime=trip.getTransferTime(forward,conf);
	}

	if((forward && arrivalTime<time+transferTime) || (!forward && arrivalTime>time+transferTime) || !transitCost) {
		// The transport went already so find a later arrival.
		near=this.nextArrival(time+transferTime,stopNum,tripNum,prevTime,forward?1:-1,last,conf);
		tripNum=near[0];
		arrivalTime=near[1];
		if(tripNum<0 || tripNum>last) return(null);

		trip=this.tripList[tripNum];
		transitCost=trip.getTransitCost(conf);
		transferTime=trip.getTransferTime(forward,conf);
	}

	if((forward && arrivalTime<time+transferTime) || (!forward && arrivalTime>time+transferTime) || !transitCost) return(null);

	return({trip:trip,time:arrivalTime,tripNum:tripNum});
};
*/
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

goog.provide('reach.trans.LineSet');
goog.require('reach.trans.StopSet');
goog.require('reach.trans.Line');

/** @constructor */
reach.trans.LineSet=function() {
	/** @type {Array.<reach.trans.Line>} */
	this.list=[];
	/** @type {number} */
	this.count=0;
	/** @type {number} */
	this.maxRep=16;

	/** @type {Array.<number>} */
	this.validList=[];
	/** @type {Array.<boolean>} */
	this.validAccept;
};

/** @param {reach.trans.Line} line */
reach.trans.LineSet.prototype.insert=function(line) {
	line.id=this.count;
	this.list[this.count++]=line;

	return(line);
};

/** @param {function(string)} write */
reach.trans.LineSet.prototype.exportTempPack=function(write) {
	var refList;
	var lineList;
	var lineNum,lineCount;
	var line;
	var stopNum,stopCount;
	var stop;

	lineList=this.list;
	lineCount=this.count;
	write(lineCount+'\n');

	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=lineList[lineNum];

		refList=[];
		stopCount=line.stopList.length;
		for(stopNum=0;stopNum<stopCount;stopNum++) {
			stop=line.stopList[stopNum];
			refList[stopNum]=stop.id;
		}

		write(line.id+'\t'+refList.join('\t')+'\n');
	}
};

/** @param {gis.io.PackStream} stream
  * @param {reach.trans.StopSet} stopSet */
reach.trans.LineSet.prototype.importTempPack=function(stream,stopSet) {
	var txt;
	var lineList;
	var lineNum,lineCount;
	var line;
	var stopList;
	var stopNum,stopCount;
	var stop;

	txt=stream.readLine();

	lineCount=+txt;
	lineList=[];
	lineList.length=lineCount;
	this.count=lineCount;

	for(lineNum=0;lineNum<lineCount;lineNum++) {
		fieldList=stream.readLine().split('\t');
		line=new reach.trans.Line();

		stopCount=fieldList.length-1;
		stopList=[];
		stopList.length=stopCount;

		for(stopNum=0;stopNum<stopCount;stopNum++) {
			stopList[stopNum]=stopSet.list[+fieldList[stopNum+1]];
		}

		line.id=+fieldList[0];
		line.stopList=stopList;
		lineList[lineNum]=line;
	}

	this.list=lineList;
};

reach.trans.LineSet.prototype.addFollowers=function() {
	var lineList;
	var lineNum,lineCount;
	var line;
	var stopList;
	var stopNum,stopCount;
	var stop,prevStop;
	var followerList;
	var followerNum;

	lineList=this.list;
	lineCount=this.count;

	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=lineList[lineNum];

		followerList=[];
		stopList=line.stopList;
		stop=stopList[0];

		stopCount=stopList.length;
		for(stopNum=1;stopNum<stopCount;stopNum++) {
			prevStop=stop;
			stop=stopList[stopNum];
			followerNum=prevStop.followerTbl[stop.id];

			if(!followerNum && followerNum!==0) {
				followerNum=prevStop.followerCount++;
				prevStop.followerTbl[stop.id]=followerNum;
//				prevStop.followerList[followerNum]=stop;
				prevStop.durationsTo[followerNum]=[];
			}

			followerList[stopNum-1]=followerNum;
		}

		line.followerList=followerList;
	}
};

/*
reach.trans.LineSet.prototype.calcStats=function() {
	var lineList;
	var lineNum,lineCount;

	lineList=this.list;
	lineCount=this.count;

	for(lineNum=0;lineNum<lineCount;lineNum++) {
		lineList[lineNum].calcStats();
	}
};
*/

reach.trans.LineSet.prototype.clearTrips=function() {
	var lineList;
	var lineNum,lineCount;

	lineList=this.list;
	lineCount=this.count;

	for(lineNum=0;lineNum<lineCount;lineNum++) {
		lineList[lineNum].tripList=[];
	}
};

reach.trans.LineSet.prototype.sortTrips=function() {
	var lineList;
	var lineNum,lineCount;

	function compareTrips(a,b) {
		return(a.startTime-b.startTime);
	}

	lineList=this.list;
	lineCount=this.count;

	for(lineNum=0;lineNum<lineCount;lineNum++) {
		lineList[lineNum].tripList.sort(compareTrips);
	}
};

/** @param {gis.io.PackStream} stream */
reach.trans.LineSet.prototype.exportPack=function(stream) {
	var lineList;
	var lineNum,lineCount;
	var line;
	var stopList;
	var stopNum,stopCount;
	var stop,prevStop;
	var followerNum,packNum;
	var repLen;
	var stats;
	var maxRep;

	maxRep=this.maxRep;

	lineList=this.list;
	lineCount=this.count;

	stream.writeLong([lineCount]);

	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=lineList[lineNum];
		stopList=line.stopList;
		stopCount=stopList.length;

		stop=stopList[0];
		stream.writeShort([stopCount,stop.id]);
		repLen=0;

		for(stopNum=1;stopNum<stopCount;stopNum++) {
			prevStop=stop;
			stop=line.stopList[stopNum];

			packNum=prevStop.packNumTbl[stop.id];
			if(packNum===0) {
				if(repLen==maxRep) {
					stream.writeShort([repLen-1]);
					repLen=0;
				}
				repLen++;
			} else {
				if(repLen) stream.writeShort([repLen-1]);
				repLen=0;

				if(packNum) {
					stream.writeShort([packNum+maxRep-1]);
				} else {
					stream.writeShort([prevStop.packCount+maxRep+stop.id]);
					prevStop.packNumTbl[stop.id]=prevStop.packCount++;
				}
			}
		}

		if(repLen) stream.writeShort([repLen-1]);
	}
};

/** @param {gis.io.PackStream} stream
  * @param {reach.trans.StopSet} stopSet
  * @return {function():number} */
reach.trans.LineSet.prototype.importPack=function(stream,stopSet) {
	/** @type {reach.trans.LineSet} */
	var self=this;
	var lineNum,lineCount;
	var line;
	var stopNum,stopCount;
	var stop,prevStop;
	var id;
	var j,maxRep;
	var followerCount;
	var dec;
	var step;

	var advance=function() {
		switch(step) {
			// Initialize.
			case 0:
				step++;

				maxRep=self.maxRep;
				self.list=[];

				dec=[];
				stream.readLong(dec,1);
				lineCount=dec[0];

				return(lineCount);

			// Iterate to load info for each line such as list of stops.
			case 1:
				line=new reach.trans.Line(self);

				stream.readShort(dec,2);
				stopCount=dec[0];
				stopNum=0;
				stop=stopSet.list[dec[1]];

				stop.lineList.push(line);
				stop.posList.push(stopNum);
				line.stopList[stopNum++]=stop;

				line.followerList=[];

				while(stopNum<stopCount) {
					stream.readShort(dec,1);
					id=dec[0];
					followerCount=stop.followerList.length;
					if(id<maxRep) {
						// The next <id> stops are in the same order as when those stops were first seen in the data.
						id++;
						while(id--) {
							line.followerList[stopNum-1]=0;
							stop=stop.followerList[0];

							stop.lineList.push(line);
							stop.posList.push(stopNum);
							line.stopList[stopNum++]=stop;
						}
					} else if(id<maxRep+followerCount) {
						line.followerList[stopNum-1]=id-maxRep+1;
						stop=stop.followerList[id-maxRep+1];

						// Next stop has already been seen after this stop on other lines so its full ID and reach time aren't needed.
						stop.lineList.push(line);
						stop.posList.push(stopNum);
						line.stopList[stopNum++]=stop;
					} else {
						line.followerList[stopNum-1]=followerCount;

						prevStop=stop;
						stop=stopSet.list[id-followerCount-maxRep];
						stop.lineList.push(line);
						stop.posList.push(stopNum);
						line.stopList[stopNum++]=stop;

						prevStop.followerList[followerCount]=stop;
					}
				}

				self.insert(line);

				lineCount--;
				return(lineCount);
		}
	};

	step=0;
	return(advance);
};

/** @param {Array.<reach.trans.Line>} lineList
  * @param {function(reach.trans.Trip):boolean} handler */
reach.trans.LineSet.prototype.filterTrips=function(lineList,handler) {
	var outList;
	var lineNum,lineCount;
	var line;
	var tripList;
	var tripNum,tripCount;

	outList=[];

	lineCount=lineList.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=lineList[lineNum];

		tripList=line.tripList;
		tripCount=tripList.length;

		for(tripNum=0;tripNum<tripCount;tripNum++) {
			if(handler(tripList[tripNum])) {
				outList.push(line);
				break;
			}
		}
	}

	return(outList);
};

/** @param {Array.<reach.trans.Line>} lineList
  * @param {function(reach.trans.Stop):boolean} handler */
reach.trans.LineSet.prototype.filterStops=function(lineList,handler) {
	var outList;
	var lineNum,lineCount;
	var line;
	var stopList;
	var stopNum,stopCount;

	outList=[];

	lineCount=lineList.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=lineList[lineNum];

		stopList=line.stopList;
		stopCount=stopList.length;

		for(stopNum=0;stopNum<stopCount;stopNum++) {
			if(handler(stopList[stopNum])) {
				outList.push(line);
				break;
			}
		}
	}

	return(outList);
};


/** @param {Object.<string,*>} term
  * @return {Array.<reach.trans.Line>} */
reach.trans.LineSet.prototype.find=function(term) {
	var lineList;
	var name,code;
	var nameRe,codeRe;
	var stopList;
	var stopNum,stopCount;

	lineList=this.list;
	name=term['name'];
	code=term['code'];
	if(name || code) {
		if(name) nameRe=new RegExp('^'+name,'i');
		if(code) codeRe=new RegExp('^'+code+'([^0-9]|$)','i');
		lineList=this.filterTrips(lineList,function(trip) {
			if(name && (!trip.key.sign || !nameRe.test(trip.key.sign)) && (!trip.key.name || !nameRe.test(trip.key.name))) return(false);
			if(code && (!trip.key.shortCode || !codeRe.test(trip.key.shortCode))) return(false);
			return(true);
		});
	}
	stopList=term['stops'];
	if(stopList) {
		stopTbl={};
		stopCount=stopList.length;
		for(stopNum=0;stopNum<stopCount;stopNum++) {
			stopTbl[stopList[stopNum].id]=true;
		}

		lineList=this.filterStops(lineList,function(stop) {
			return(stopTbl[stop.id]||false);
		});
	}

	return(lineList);
};

/*
reach.trans.LineSet.prototype.sortTrips=function() {
    var lineNum;
    var line;
    var tripListList;
	var tripNum;
*/

	/** @param {reach.trans.Trip} a
	  * @param {reach.trans.Trip} b
	  * @return {number} */
/*
	function compareTrips(a,b) {
		return(a.startTime-b.startTime);
	}

	for(lineNum=this.list.length;lineNum--;) {
		line=this.city.lineSet.list[lineNum];
		tripListList=[];
		for(var validNum in line.tripListTbl) {
			if(this.validAccept[validNum] && line.tripListTbl.hasOwnProperty(validNum)) {
				tripListList.push(line.tripListTbl[+validNum]);
			}
		}

		// Concatenate together all trip lists from different valid day groups.
		line.tripList=line.tripList.concat.apply(line.tripList,tripListList);

		line.tripList.sort(compareTrips);

		for(tripNum=line.tripList.length;tripNum--;) {
			line.tripList[tripNum].num=tripNum;
		}
	}
};

reach.trans.LineSet.prototype.calcNiceness=function(startTime,niceDepartureSpan) {
	var lineNum,lineCount;
	var line;
	var trip;
	var stopList;
	var stopNum,stopCount;
	var stop;
	var lastTime;
	var i,l;

	stopList=this.city.stopSet.list;
	stopCount=stopList.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=stopList[stopNum];
		stop.departureCount=0;
	}

	lineCount=this.list.length;
	for(lineNum=0;lineNum<lineCount;lineNum++) {
		line=this.list[lineNum];

		// Find departures within an hour after search start time.
		lastTime=startTime+niceDepartureSpan;
		l=line.tripList.length;

		line.departureCount=0;
		for(i=line.findDeparture(startTime);i<l;i++) {
			trip=line.tripList[i];
			if(trip.startTime>lastTime) break;
			line.departureCount++;
		}

		stopCount=line.stopList.length;
		for(stopNum=0;stopNum<stopCount;stopNum++) {
			stop=line.stopList[stopNum];
			stop.departureCount+=line.departureCount;
		}
	}
};
*/
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

goog.provide('gis.enc.Util');
goog.provide('gis.enc.util');

/** @constructor */
gis.enc.Util=function() {};

/** @param {Array|ArrayBuffer|Uint8Array} data
  * @return {Array|Uint8Array} */
gis.enc.Util.prototype.toArray8=function(data) {
	if(gis.env.arrayBuffer && data instanceof ArrayBuffer) data=new Uint8Array(data);
	return(/** @type {Array|Uint8Array} */ data);
}

gis.enc.util=new gis.enc.Util();
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

goog.provide('reach.trans.Trip');

/** @constructor
  * @param {reach.trans.Key} key */
reach.trans.Trip=function(key) {
	/** @type {reach.trans.Key} */
	this.key=key;
	/** @type {number} */
	this.valid;
	/** @type {Array.<number>|Uint32Array} Unit: minutes. */
	this.deltaList;
	/** @type {Array.<number>} Unit: minutes. */
	this.timeList;

	/** @type {number} Unit: minutes. */
	this.startTime;
	/** @type {number} Unit: minutes. */
	this.duration;
	/** @type {number} */
	this.id;
};

/** @enum {number} */
reach.trans.Trip.Mode={
	TRAM:0,
	SUBWAY:1,
	TRAIN:2,
	BUS:3,
	FERRY:4,
	CABLE:5,
	AERIAL:6,
	FUNICULAR:7
};

/** @param {number} stopNum */
reach.trans.Trip.prototype.getArrival=function(stopNum) {
	var timeList;
	var arrival;
	var pos;

	timeList=this.timeList;
	arrival=0;
	for(pos=0;pos<=stopNum;pos++) arrival+=timeList[pos];

	return(arrival);
};
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

goog.provide('reach.trans.TripSet');
goog.require('reach.trans.Trip');

/** @constructor */
reach.trans.TripSet=function() {
	/** @type {Array.<reach.trans.Trip>} */
	this.list=[];
	/** @type {number} */
	this.count=0;
	/** @type {Object.<number,number>} */
	this.validTbl;
	/** @type {Array.<number>} */
	this.validList;

	/** @type {Array.<Array.<reach.trans.Trip>>} */
	this.validGroupList;
};

/** @type {number} */
reach.trans.TripSet.tolerance=1;

/** @param {reach.trans.Trip} trip */
reach.trans.TripSet.prototype.insert=function(trip) {
	this.list[this.count++]=trip;

	return(trip);
};

/** @param {function()} write */
reach.trans.TripSet.prototype.exportTempPack=function(write) {
	var validGroupList;
	var validNum,validCount;
	var tripList;
	var tripNum,tripCount;
	var trip;

	tripCount=this.count;
	write(tripCount+'\n');

	validGroupList=this.validGroupList;
	validCount=validGroupList.length;

	for(validNum=0;validNum<validCount;validNum++) {
		tripList=validGroupList[validNum];
		tripCount=tripList.length;

		for(tripNum=0;tripNum<tripCount;tripNum++) {
			trip=tripList[tripNum];
//			write(trip.key.id+'\t'+foo(trip.valid)+'\t'+trip.debug+'\t'+trip.timeList.join('\t')+'\n');
			write(trip.key.id+'\t'+trip.valid+'\t'+trip.timeList.join('\t')+'\n');
		}
	}
};

/** @param {gis.io.LineStream} stream
  * @param {reach.trans.KeySet} keySet */
reach.trans.TripSet.prototype.importTempPack=function(stream,keySet) {
	var txt;
	var tripList;
	var tripNum,tripCount;
	var trip;
	var timeList;
	var timeNum,timeCount;

	txt=stream.readLine();

	tripCount=+txt;
	tripList=[];
	tripList.length=tripCount;
	this.count=tripCount;

	for(tripNum=0;tripNum<tripCount;tripNum++) {
		fieldList=stream.readLine().split('\t');
		trip=new reach.trans.Trip(keySet.list[+fieldList[0]]);
		trip.valid=+fieldList[1];

		timeCount=fieldList.length-2;
		timeList=[];
		timeList.length=timeCount;

		for(timeNum=0;timeNum<timeCount;timeNum++) {
			timeList[timeNum]=+fieldList[timeNum+2];
		}

//if(timeList.length!=trip.key.line.stopList.length) console.log('ERROR');
		trip.timeList=timeList;
		trip.startTime=timeList[0];
		tripList[tripNum]=trip;
	}

	this.list=tripList;
};

reach.trans.TripSet.prototype.addDurations=function() {
	var tripList;
	var tripNum,tripCount;
	var trip;
	var line;
	var timeList;
	var followerList;
	var stopList;
	var stopNum,stopCount;
	var stop;
	var duration,totalDuration;

	tripList=this.list;
	tripCount=this.count;

	for(tripNum=0;tripNum<tripCount;tripNum++) {
		trip=tripList[tripNum];
		timeList=trip.timeList;

		line=trip.key.line;
		line.tripCount++;
		followerList=line.followerList;
		stopList=line.stopList;
		stopCount=stopList.length;
		totalDuration=0;

		for(stopNum=0;stopNum<stopCount-1;stopNum++) {
			stop=stopList[stopNum];
			followerNum=followerList[stopNum];

			duration=timeList[stopNum+1];
			stop.durationsTo[followerNum].push(duration);
			totalDuration+=duration;
		}

		trip.duration=totalDuration;
	}
};

reach.trans.TripSet.prototype.groupTrips=function() {
	var tripList;
	var tripNum,tripCount;
	var trip;
	var validTbl;
	var validList;
	var validGroupList;
	var validNum,validCount;
	var valid;

	tripList=this.list;
	tripCount=this.count;
	validTbl={};
	validList=[];
	validGroupList=[];
	validCount=0;

	for(tripNum=0;tripNum<tripCount;tripNum++) {
		trip=tripList[tripNum];
		valid=trip.valid;

		validNum=validTbl[valid];
		if(!validNum && validNum!==0) {
			validNum=validCount++;
			validTbl[valid]=validNum;
			validList[validNum]=valid;
			validGroupList[validNum]=[trip];
		} else validGroupList[validNum].push(trip);
	}

	for(validNum=0;validNum<validCount;validNum++) {
		validGroupList[validNum].sort(function(a,b) {return(a.key.id-b.key.id || a.timeList[0]-b.timeList[0]);});
	}

	this.validTbl=validTbl;
	this.validList=validList;
	this.validGroupList=validGroupList;
};

/** @param {gis.io.PackStream} stream */
reach.trans.TripSet.prototype.exportPack=function(stream) {
	var validGroupList;
	var validList;
	var validNum,validCount;
	var tripList;
	var tripNum,tripCount;
	var depart,prevDepart,wait,prevWait;
	var keyId,prevKeyId;
	var row,data;
	var timeList;
	var timeNum,timeCount;
	var err;
	var txt;
	var lz;

	validGroupList=this.validGroupList;
	validList=this.validList;
	validCount=validList.length;

	lz=new gis.enc.LZ();

	stream.writeLong([validCount]);
	stream.writeLong(validList);
	depart=0;

	for(validNum=0;validNum<validCount;validNum++) {
		tripList=validGroupList[validNum];
		tripCount=tripList.length;

		data=[];
		prevKeyId=0;
		keyId=-1;

		for(tripNum=0;tripNum<tripCount;tripNum++) {
			trip=tripList[tripNum];

			prevDepart=depart;
			depart=~~(trip.timeList[0]/reach.trans.TripSet.tolerance+0.5);
			prevWait=wait;
			wait=depart-prevDepart;

			if(trip.key.id!=keyId) {
				if(keyId>=0) {
					row[0]=gis.Q.fromSigned(keyId-prevKeyId);
					row[1]=row.length-2;
					data.push(stream.encodeShort(row));
					prevKeyId=keyId;
				}
				keyId=trip.key.id;
				prevWait=-depart;
				wait=0;
				// Reserve space for key offset and row length.
				row=[0,0];
			}

//console.log(depart+' '+wait+' '+(wait-prevWait));
			row.push(gis.Q.fromSigned(wait-prevWait));
		}

		if(keyId>=0) {
			row[0]=gis.Q.fromSigned(keyId-prevKeyId);
			row[1]=row.length-2;
			data.push(stream.encodeShort(row));
		}

		txt=data.join('');
		txt=lz.compressBytes(txt,32,256,stream);
		stream.writeLong([tripCount]);
		stream.writeRaw(txt);

		data=[];

		for(tripNum=0;tripNum<tripCount;tripNum++) {
			timeList=tripList[tripNum].timeList;
			timeCount=timeList.length;
			row=[];

			for(timeNum=1;timeNum<timeCount;timeNum++) {
				err=timeList[timeNum]/reach.trans.TripSet.tolerance;
				if(err<0) err=-~~(-err+0.5);
				else err=~~(err+0.5);
				row[timeNum-1]=gis.Q.fromSigned(err);
			}

			data.push(stream.encodeShort(row));
		}

		txt=data.join('');
		txt=lz.compressBytes(txt,256*2,2048,stream);
		stream.writeRaw(txt);
	}
};

/** @param {gis.io.PackStream} stream
  * @param {reach.trans.KeySet} keySet */
reach.trans.TripSet.prototype.importPack=function(stream,keySet) {
	/** @type {reach.trans.TripSet} */
	var self=this;
	var validGroupList;
	var validList;
	var validNum;
	/** @type {number} */
	var validCount;
	var valid;
	/** @type {number} */
	var tripNum;
	/** @type {number} */
	var tripLast;
	/** @type {number} */
	var tripCount;
	var keyId;
	/** @type {gis.io.PackStream} */
	var pack;
	var dec;
	/** @type {gis.enc.LZ} */
	var lz;
	var step;

	var advance=function() {
//		var tripList;
		var timeList;
		var timeNum,timeCount;
		var time;
		var depart,wait;
		var trip;
		var key;

		switch(step) {
			// Initialize.
			case 0:
				step++;

				lz=new gis.enc.LZ();

				dec=[];
				stream.readLong(dec,1);
				validCount=dec[0];
				validNum=0;
				tripNum=0;
				tripLast=0;

				validList=[];
				stream.readLong(validList,validCount);
				self.validList=validList;

				validGroupList=[];
				self.validGroupList=validGroupList;

				return(validCount);

			case 1:
				step++;

				stream.readLong(dec,1);
				tripCount=dec[0];
				tripLast+=tripCount;

				valid=validList[validNum];
				keyId=0;

				txt=lz.decompressBytes(stream);
				pack=new gis.io.PackStream(txt,null);

				return(validCount);
			case 2:
				pack.readShort(dec,2);
				keyId+=gis.Q.toSigned(dec[0]);
				timeCount=dec[1];
				pack.readShort(dec,timeCount);

				key=keySet.list[keyId];

				depart=gis.Q.toSigned(dec[0]);
				wait=gis.Q.toSigned(dec[1]);

				timeList=[depart,depart+wait];
				depart+=wait;

				for(timeNum=2;timeNum<timeCount;timeNum++) {
					wait+=gis.Q.toSigned(dec[timeNum]);
					depart+=wait;
					timeList[timeNum]=depart;
				}

//				tripList=[];

				for(timeNum=0;timeNum<timeCount;timeNum++) {
					depart=timeList[timeNum]*reach.trans.TripSet.tolerance;

					trip=new reach.trans.Trip(key);
					trip.startTime=depart;
					trip.timeList=[depart];
					trip.valid=valid;

//					tripList.push(trip);
					self.insert(trip);
				}

//				validGroupList[validNum]=tripList;

				tripCount-=timeCount;
				if(!tripCount) step++;

				return(validCount);
			case 3:
				step=1;

				txt=lz.decompressBytes(stream);
				pack=new gis.io.PackStream(txt,null);

				for(;tripNum<tripLast;tripNum++) {
					trip=self.list[tripNum];
					timeCount=trip.key.line.stopList.length-1;
					pack.readShort(dec,timeCount);

					for(timeNum=0;timeNum<timeCount;timeNum++) {
						time=gis.Q.toSigned(dec[timeNum])*reach.trans.TripSet.tolerance;
						trip.timeList[timeNum+1]=time;
					}
				}

				validNum++;
				validCount--;
				return(validCount);
		}
	};

	step=0;
	return(advance);
};

/** @param {number} mask */
reach.trans.TripSet.prototype.bindLines=function(mask) {
	var validList;
	var validGroupList;
	var validNum,validCount;
	var tripList;
	var tripNum,tripCount;
	var trip;
	var line;

	validGroupList=this.validGroupList;
	validList=this.validList;
	validCount=validList.length;

	for(validNum=0;validNum<validCount;validNum++) {
		if(!(validList[validNum]&mask)) continue;

		tripList=validGroupList[validNum];
		tripCount=tripList.length;

		for(tripNum=0;tripNum<tripCount;tripNum++) {
			trip=tripList[tripNum];
			line=trip.key.line;

			line.tripList.push(trip);
		}
	}
};
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

goog.provide('reach.trans.Key');
goog.require('reach.trans.Line');

/** @constructor
  * @param {reach.trans.Line} line */
reach.trans.Key=function(line) {
	var fieldList;

	/** @type {number} */
	this.id=0;
	/** @type {reach.trans.Line} */
	this.line=line;

	/** @type {number} */
	this.mode;
	/** @type {string} */
	this.shortCode;
	/** @type {string} */
	this.name;
	/** @type {string} */
	this.sign;
};

/** @param {string} code
  * @return {{id:string,suffix:string}} */
reach.trans.Key.parseCode=function(code) {
	var partList;

	partList=code.match(/^([0-9]*)(.*)/);
	if(!partList[1]) return({id:code,suffix:''});

	return({id:partList[1],suffix:partList[2]});
};
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

goog.provide('reach.trans.KeySet');
goog.require('reach.trans.Key');
goog.require('reach.trans.NameSet');
goog.require('gis.io.PackStream');

/** @constructor */
reach.trans.KeySet=function() {
	/** @type {Array.<reach.trans.Key>} */
	this.list=[];
	/** @type {number} */
	this.count=0;
};

/** @param {reach.trans.Key} key */
reach.trans.KeySet.prototype.insert=function(key) {
	key.id=this.count;
	this.list[this.count++]=key;

	return(key);
};

reach.trans.KeySet.prototype.exportTempPack=function(write) {
	var keyList;
	var keyNum,keyCount;

	keyList=this.list;
	keyCount=this.count;
	write(keyCount+'\n');

	for(keyNum=0;keyNum<keyCount;keyNum++) {
		key=keyList[keyNum];
		write(key.id+'\t'+key.line.id+'\t'+key.mode+'\t'+key.shortCode+'\t'+key.sign+'\t'+key.name+'\n');
	}
};

reach.trans.KeySet.prototype.importTempPack=function(stream,lineSet) {
	var txt;
	var keyList;
	var keyNum,keyCount;
	var key;

	txt=stream.readLine();

	keyCount=+txt;
	keyList=[];
	keyList.length=keyCount;
	this.count=keyCount;

	for(keyNum=0;keyNum<keyCount;keyNum++) {
		fieldList=stream.readLine().split('\t');
		key=new reach.trans.Key(lineSet.list[+fieldList[1]]);

		key.id=+fieldList[0];
		key.mode=+fieldList[2];
		key.shortCode=fieldList[3];
		key.sign=fieldList[4];
		key.name=fieldList[5];

		keyList[keyNum]=key;
	}

	this.list=keyList;
};

/** @param {reach.trans.NameSet} nameSet */
reach.trans.KeySet.prototype.getNames=function(nameSet) {
	var keyList;
	var keyNum,keyCount;
	var key;

	keyList=this.list;
	keyCount=this.count;

	for(keyNum=0;keyNum<keyCount;keyNum++) {
		key=keyList[keyNum];
		nameSet.insert(key.shortCode);
		nameSet.insert(key.name);
		nameSet.insert(key.sign);
	}
};

/** @param {gis.io.PackStream} stream
  * @param {reach.trans.NameSet} nameSet */
reach.trans.KeySet.prototype.exportPack=function(stream,nameSet) {
	var keyList;
	var keyNum,keyCount;
	var key;

	keyList=this.list;
	keyCount=this.count;
	stream.writeLong([keyCount]);

	for(keyNum=0;keyNum<keyCount;keyNum++) {
		key=keyList[keyNum];

		stream.writeLong([key.line.id,key.mode,nameSet.getId(key.shortCode),nameSet.getId(key.sign),nameSet.getId(key.name)]);
	}
};

/** @param {gis.io.PackStream} stream
  * @param {reach.trans.LineSet} lineSet
  * @param {reach.trans.NameSet} nameSet */
reach.trans.KeySet.prototype.importPack=function(stream,lineSet,nameSet) {
	/** @type {reach.trans.LineSet} */
	var self=this;
	var keyCount;
	var dec;
	var step;

	var advance=function() {
		var key;

		switch(step) {
			// Initialize.
			case 0:
				step++;

				dec=[];
				stream.readLong(dec,1);
				keyCount=dec[0];

				return(keyCount);

			case 1:
				stream.readLong(dec,5);

				key=new reach.trans.Key(lineSet.list[dec[0]]);
				key.mode=dec[1];
				key.shortCode=nameSet.list[dec[2]];
				key.sign=nameSet.list[dec[3]];
				key.name=nameSet.list[dec[4]];

				self.insert(key);

				keyCount--;
				return(keyCount);
		}
	};

	step=0;
	return(advance);
};


/*
	var keyList;
	var keyNum,keyCount;
	var key;

	keyList=this.list;
	keyCount=this.count;
	stream.writeLong([keyCount]);

	for(keyNum=0;keyNum<keyCount;keyNum++) {
		key=keyList[keyNum];

		stream.writeLong([key.line.id,key.mode,nameSet.getId(key.shortCode),nameSet.getId(key.name),nameSet.getId(key.sign)]);
	}
};
*/
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

goog.provide('reach.trans.TransSet');
goog.require('reach.trans.NameSet');
goog.require('reach.trans.StopSet');
goog.require('reach.trans.LineSet');
goog.require('reach.trans.KeySet');
goog.require('reach.trans.TripSet');
goog.require('gis.io.LineStream');
goog.require('gis.enc.CRC32');

/** @constructor */
reach.trans.TransSet=function(date) {
	this.date=date;
	/** @type {reach.trans.NameSet} */
	this.nameSet=new reach.trans.NameSet();
	/** @type {reach.trans.StopSet} */
	this.stopSet=new reach.trans.StopSet();
	/** @type {reach.trans.LineSet} */
	this.lineSet=new reach.trans.LineSet();
	/** @type {reach.trans.KeySet} */
	this.keySet=new reach.trans.KeySet();
	/** @type {reach.trans.TripSet} */
	this.tripSet=new reach.trans.TripSet();
};

/** @param {function(string)} write */
reach.trans.TransSet.prototype.exportTempPack=function(write) {
	write(this.date.jd+'\n');
	this.stopSet.exportTempPack(write);
	this.lineSet.exportTempPack(write);
	this.keySet.exportTempPack(write);
	this.tripSet.groupTrips();
	this.tripSet.exportTempPack(write);
};

/** @param {string} data */
reach.trans.TransSet.prototype.importTempPack=function(data) {
	var stream;

	stream=new gis.io.LineStream(data,null);
	this.date=new gis.util.Date(+stream.readLine());
	this.stopSet.importTempPack(stream);
	this.lineSet.importTempPack(stream,this.stopSet);
	this.keySet.importTempPack(stream,this.lineSet);
	this.tripSet.importTempPack(stream,this.keySet);
};

reach.trans.TransSet.prototype.exportPack=function(stream) {
	var dataList,hdrList;
	var dataNum,dataCount;
	var crc32;
	var data;
	var version;
	var len,total;

	version=1;
	crc32=new gis.enc.CRC32();

	dataList=[];
	hdrList=[];

	writeData=function(txt) {
		data+=txt;
	};

	this.stopSet.getNames(transSet.nameSet);
	this.keySet.getNames(transSet.nameSet);

	this.nameSet.sortNames();

	data='';
	this.nameSet.exportPack(new gis.io.PackStream(null,writeData));
	dataList.push(data);

	data='';
	this.stopSet.exportPack(new gis.io.PackStream(null,writeData),transSet.nameSet);
	dataList.push(data);

	this.stopSet.clearFollowers();
//	this.lineSet.addFollowers();
//	this.tripSet.addDurations();
//	this.stopSet.calcStats();

	data='';
	this.lineSet.exportPack(new gis.io.PackStream(null,writeData));
//	data=new gis.enc.LZ().compressBytes(data,256,2048,new gis.io.PackStream(null,writeData));
	dataList.push(data);

	data='';
	this.keySet.exportPack(new gis.io.PackStream(null,writeData),transSet.nameSet);
	dataList.push(data);

	this.tripSet.groupTrips();
//	this.lineSet.calcStats();

	data='';
	this.tripSet.exportPack(new gis.io.PackStream(null,writeData));
	dataList.push(data);

	total=0;
	dataCount=dataList.length;

	for(dataNum=0;dataNum<dataCount;dataNum++) {
		data=dataList[dataNum];
		len=data.length;
		hdrList[dataNum]=stream.encodeLong([crc32.append(data,0,len),len]);
		total+=len+hdrList[dataNum].length;
	}

	stream.writeLong([version,total,this.date.jd]);

	for(dataNum=0;dataNum<dataCount;dataNum++) {
		stream.writeRaw(hdrList[dataNum]);
		stream.writeRaw(dataList[dataNum]);
//		console.log(dataList[dataNum].length);
	}
};

/** @param {gis.io.PackStream} stream */
reach.trans.TransSet.prototype.importPack=function(stream) {
	var dec;

	dec=[];
	stream.readLong(dec,3);
//	console.log('Version '+dec[0]);
//	console.log('Size '+dec[1]);
	this.date=new gis.util.Date(dec[2]);

	stream.readLong(dec,2);
//	console.log('CRC '+dec[0]);
//	console.log('Size '+dec[1]);
	this.nameSet.importPack(stream);

	stream.readLong(dec,2);
	gis.Q.busy(this.stopSet.importPack(stream,this.nameSet));

	stream.readLong(dec,2);
	gis.Q.busy(this.lineSet.importPack(stream,this.stopSet));

	stream.readLong(dec,2);
	gis.Q.busy(this.keySet.importPack(stream,this.lineSet,this.nameSet));

	stream.readLong(dec,2);
	gis.Q.busy(this.tripSet.importPack(stream,this.keySet));

	this.tripSet.groupTrips();
};

/** @param {string} data */
reach.trans.TransSet.prototype.importData=function(data) {
	var stream;

	stream=new gis.io.PackStream(data,null);
	this.importPack(stream);
};

/** @param {gis.util.Date} date */
reach.trans.TransSet.prototype.prepareDay=function(date) {
	var mask;

	mask=1<<(date.jd-this.date.jd);

	this.lineSet.clearTrips();
	this.tripSet.bindLines(mask);
	this.lineSet.sortTrips();
};
/**
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

goog.provide('main');
goog.require('gis.Obj');
goog.require('gis.util.Date');
goog.require('reach.trans.TransSet');
