/*
	OSM Squeezer

	Copyright (c) "2013, by Aalto University, Finland;
	             Contributors: Juha Järvi <juha.jarvi@aalto.fi>;
	             Affiliation: Helsinki Institute for Information Technology HIIT;
	             Project: CultAR;
	             Task manager: Antti Nurminen <andy@iki.fi>;
	             URL: http://www.hiit.fi
	                  http://www.cultar.eu

	             The research leading to these results has received funding from the European Union
	             Seventh Framework Programme (FP7/2007-2013) under grant agreement no 601139"

	All rights reserved.

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met:

	1. Redistributions of source code must retain the above copyright notice, this
	   list of conditions and the following disclaimer.
	2. Redistributions in binary form must reproduce the above copyright notice,
	   this list of conditions and the following disclaimer in the documentation
	   and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
	ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
	WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
	ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
	SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

goog.provide('gis.osm.TagTable');
goog.require('gis.Obj');

/** @constructor */
gis.osm.TagTable=function() {
	/** @type {Object.<string,string>} */
	this.tbl={};
};

gis.osm.TagTable.DENY={};
gis.osm.TagTable.AVOID={};
gis.osm.TagTable.REVERSE={};

/** @type {Object.<string,number|Object>} */
gis.osm.TagTable.boolTbl={
	'no':0,
	'yes':1,
	'false':0,
	'true':1,

	// oneway
	'reverse':gis.osm.TagTable.REVERSE,
	'opposite_lane':gis.osm.TagTable.REVERSE,

	// access
	'designated':1,
	'permissive':1,
	'allowed':1,
	'limited':gis.osm.TagTable.AVOID,
	'destination':gis.osm.TagTable.AVOID,
	'private':gis.osm.TagTable.AVOID,

	'disused':gis.osm.TagTable.DENY,
	'abandoned':gis.osm.TagTable.DENY,
	'dismantled':gis.osm.TagTable.DENY
};

/** @param {string} key
  * @param {string} val */
gis.osm.TagTable.prototype.insert=function(key,val) {
	var lower;

	lower=gis.Q.trim(key.toLowerCase());
	if(lower==key || !this.tbl[lower]) this.tbl[lower]=val;
};

/** @param {string} key
  * @return {string} */
gis.osm.TagTable.prototype.getString=function(key) {
	return(this.tbl[key] || '');
};

/** @param {string} key
  * @param {string} val */
gis.osm.TagTable.prototype.match=function(key,val) {
	return(this.tbl[key] && gis.Q.trim(this.tbl[key].toLowerCase())==val);
};

/** @param {string} key
  * @param {number|null} miss
  * @param {number|null} err
  * @return {number|null} */
gis.osm.TagTable.prototype.getBool=function(key,miss,err) {
	var val;
	var flag;

	if(!this.tbl.hasOwnProperty(key)) return(miss);
	val=this.tbl[key].toLowerCase();

	flag=gis.osm.TagTable.boolTbl[val];
	if(!flag && flag!==0) {
		flag=parseInt(val,10);
//		if(!flag && flag!==0) {console.log(val);return(err);}
		if(!flag && flag!==0) return(err);
	}

	return(flag);
};

/** @param {string} key
  * @param {number|null} miss
  * @param {number|null} err
  * @return {number|null} */
gis.osm.TagTable.prototype.getNum=function(key,miss,err) {
	var num;

	if(!this.tbl.hasOwnProperty(key)) return(miss);

	num=parseInt(this.tbl[key],10);
//	if(!num && num!==0) {console.log(tbl[key]);return(err);}
	if(!num && num!==0) return(err);

	return(num);
};
