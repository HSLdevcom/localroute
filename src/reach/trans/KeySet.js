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
goog.require('gis.enc.NameSet');
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

/** @param {function(string)} write */
reach.trans.KeySet.prototype.exportTempPack=function(write) {
	var keyList;
	var keyNum,keyCount;
	var key;

	keyList=this.list;
	keyCount=this.count;
	write(keyCount+'\n');

	for(keyNum=0;keyNum<keyCount;keyNum++) {
		key=keyList[keyNum];
		write(key.id+'\t'+key.line.id+'\t'+key.mode+'\t'+key.shortCode+'\t'+key.sign+'\t'+key.name+'\n');
	}
};

/** @param {gis.io.LineStream} stream
  * @param {reach.trans.LineSet} lineSet */
reach.trans.KeySet.prototype.importTempPack=function(stream,lineSet) {
	var txt;
	var fieldList;
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

/** @param {gis.enc.NameSet} nameSet */
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
  * @param {gis.enc.NameSet} nameSet */
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
  * @param {gis.enc.NameSet} nameSet
  * @return {function():number} */
reach.trans.KeySet.prototype.importPack=function(stream,lineSet,nameSet) {
	/** @type {reach.trans.KeySet} */
	var self=this;
	var keyCount;
	/** @type {Array.<number>} */
	var dec;
	var step;

	var advance=function() {
		var key;

		switch(step) {
			// Initialize.
			case 0:
				step++;

				dec=/** @type {Array.<number>} */ ([]);
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
