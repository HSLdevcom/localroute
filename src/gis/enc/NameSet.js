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
