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
goog.require('reach.trans.StopSet');
goog.require('reach.trans.SeqSet');
goog.require('reach.trans.KeySet');
goog.require('reach.trans.TripSet');
goog.require('reach.trans.ShapeSet');
goog.require('gis.io.LineStream');
goog.require('gis.enc.NameSet');
goog.require('gis.enc.CRC32');

/** @constructor
  * @param {gis.util.Date=} date */
reach.trans.TransSet=function(date) {
	/** @type {gis.util.Date} */
	this.date=date||null;
	/** @type {gis.enc.NameSet} */
	this.nameSet=new gis.enc.NameSet();
	/** @type {reach.trans.StopSet} */
	this.stopSet=new reach.trans.StopSet();
	/** @type {reach.trans.SeqSet} */
	this.seqSet=new reach.trans.SeqSet();
	/** @type {reach.trans.KeySet} */
	this.keySet=new reach.trans.KeySet();
	/** @type {reach.trans.TripSet} */
	this.tripSet=new reach.trans.TripSet();
	/** @type {reach.trans.ShapeSet} */
	this.shapeSet=new reach.trans.ShapeSet();
};

/** @param {function(string)} write */
reach.trans.TransSet.prototype.exportTempPack=function(write) {
	write(this.date.jd+'\n');
	this.stopSet.exportTempPack(write);
	this.seqSet.exportTempPack(write);
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
	this.seqSet.importTempPack(stream,this.stopSet);
	this.keySet.importTempPack(stream,this.seqSet);
	this.tripSet.importTempPack(stream,this.keySet);
};

/** @param {gis.io.PackStream} stream */
reach.trans.TransSet.prototype.exportPack=function(stream) {
	var dataList,hdrList;
	var dataNum,dataCount;
	var crc32;
	/** @type {string} */
	var data;
	var version;
	var len,total;

	version=1;
	crc32=new gis.enc.CRC32();

	dataList=/** @type {Array.<string>} */ ([]);
	hdrList=/** @type {Array.<string>} */ ([]);

	/** @param {string} txt */
	var writeData=function(txt) {
		data+=txt;
	};

	this.stopSet.getNames(this.nameSet);
	this.keySet.getNames(this.nameSet);

	this.nameSet.sortNames();

	data='';
	this.nameSet.exportPack(new gis.io.PackStream(null,writeData));
	dataList.push(data);

	data='';
	this.stopSet.exportPack(new gis.io.PackStream(null,writeData),this.nameSet);
	dataList.push(data);

	this.stopSet.clearFollowers();
//	this.seqSet.addFollowers();
//	this.stopSet.calcStats();

	data='';
	this.seqSet.exportPack(new gis.io.PackStream(null,writeData));
//	data=new gis.enc.LZ().compressBytes(data,256,2048,new gis.io.PackStream(null,writeData));
	dataList.push(data);

	data='';
	this.keySet.exportPack(new gis.io.PackStream(null,writeData),this.nameSet);
	dataList.push(data);

	this.tripSet.groupTrips();
//	this.seqSet.calcStats();

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
	gis.Q.busy(this.seqSet.importPack(stream,this.stopSet));

	stream.readLong(dec,2);
	gis.Q.busy(this.keySet.importPack(stream,this.seqSet,this.nameSet));

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

/** Load and sort all bus departures within a time range.
  * @param {number} first Unix timestamp, milliseconds from 1970-01-01 00:00 UTC.
  * @param {number} last */
reach.trans.TransSet.prototype.prepare=function(first,last) {
	var offset;
	var jdFirst,jdLast,jd;
	var noon;
	var secFirst,secLast;
	var date;

	// TODO: offset should be in transit feed timezone, not local timezone.
	// Get offset from UTC for start time.
	offset=new Date(first).getTimezoneOffset();
	// Get days from 1970-01-01 to first day to load.
	// Start from 360 minutes before time range to load, because times after midnight might be stored in previous day with hour>24.
	jdFirst=~~((first/60000-offset-360)/1440);

	// Calculate timestamp approximately at noon, when daylight savings offset should be the same as during most of the day.
	// If daylight savings changes between start time and next noon, this may be off by an hour or so.
	noon=(jdFirst*1440+offset+720)*60000;

	// Get offset from UTC for end time.
	offset=new Date(last).getTimezoneOffset();
	// Get days from 1970-01-01 to last day to load.
	jdLast=~~((last/60000-offset)/1440);

	this.seqSet.forSeqs(
		/** @param {reach.trans.Seq} seq */
		function(seq) {
			seq.tripList=[];
			seq.stampList=[];
		}
	);

	for(jd=jdFirst;jd<=jdLast;jd++) {
		// Recalculate exact timestamp at noon by checking UTC offset near midday.
		offset=new Date(noon).getTimezoneOffset();
		noon=(jd*1440+offset+720)*60000;
		// GTFS times are defined as starting from 12 hours before noon.
		this.tripSet.bindSeqs(jd+719163-this.date.jd,noon-720*60000,first,last);

		noon+=1440*60000;
	}

	this.seqSet.sortTrips();
//	transSet.prepare(1385240400000-1-40*1440*60000,1385244000000+26*60*60000-40*1440*60000)
};
