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

goog.provide('gis.enc.NameSet');
goog.require('gis.enc.LZ');

/** @constructor */
gis.enc.NameSet=function() {
	/** @type {Object.<string,number>} */
	this.tbl={};
	/** @type {Array.<string>} */
	this.list=[];
	/** @type {number} */
	this.count=0;
};

/** @param {string} txt */
gis.enc.NameSet.prototype.insert=function(txt) {
	var num;

	num=this.tbl[txt];
	if(!num && num!==0) {
		num=this.count++;
		this.list[num]=txt;
		this.tbl[txt]=num;
	}
};

gis.enc.NameSet.prototype.sortNames=function() {
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
gis.enc.NameSet.prototype.getId=function(txt) {
	return(this.tbl[txt]);
};

/** @param {gis.io.PackStream} stream */
gis.enc.NameSet.prototype.exportPack=function(stream) {
	var txt;
	var lz;

	lz=new gis.enc.LZ();

	txt=this.list.join('\n');
	txt=lz.compressBytes(txt,32,2048,stream);
	stream.writeRaw(txt);
};

/** @param {gis.io.PackStream} stream */
gis.enc.NameSet.prototype.importPack=function(stream) {
	var txt;
	var lz;

	lz=new gis.enc.LZ();
	txt=lz.decompressBytes(stream);
	this.list=txt.split('\n');
};
