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

/* jshint -W069 */

goog.provide('reach.trans.StopSet');
goog.require('reach.trans.Stop');
goog.require('gis.enc.NameSet');
goog.require('gis.io.PackStream');

/** @constructor */
reach.trans.StopSet=function() {
	/** @type {Array.<reach.trans.Stop>} */
	this.list=[];
	/** @type {number} */
	this.count=0;
};

/** @param {string} origId
  * @param {string} name
  * @param {gis.MU} ll
  * @return {reach.trans.Stop} */
reach.trans.StopSet.prototype.insert=function(origId,name,ll) {
	var stop;

	stop=new reach.trans.Stop(origId,name,ll);
	stop.id=this.count;
	this.list[this.count++]=stop;

	return(stop);
};

/** @param {function(string)} write */
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

/** @param {gis.io.LineStream} stream */
reach.trans.StopSet.prototype.importTempPack=function(stream) {
	var txt;
//	var stopList;
	var stopNum,stopCount;
	var stop;
	var fieldList;
	var ll;

	txt=stream.readLine();

	stopCount=+txt;
	this.list=[];
	this.count=0;
//	stopList=[];
//	stopList.length=stopCount;
//	this.count=stopCount;

	for(stopNum=0;stopNum<stopCount;stopNum++) {
		fieldList=stream.readLine().split('\t');
		ll=new gis.MU(+fieldList[2],+fieldList[3]);
//		stop=new reach.trans.Stop(fieldList[1],fieldList[4],ll);
		stop=this.insert(fieldList[1],fieldList[4],ll);

		stop.id=+fieldList[0];
//		stopList[stopNum]=stop;
	}

//	this.list=stopList;
};

/** @param {gis.enc.NameSet} nameSet */
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

//		stop.followerTbl={};
		stop.followerList=[];
		stop.followerCount=0;
//		stop.durationsTo=[];
//		stop.statsTo=[];
		stop.packNumTbl={};
		stop.packCount=0;
	}
};

/** @param {gis.io.PackStream} stream
  * @param {gis.enc.NameSet} nameSet */
reach.trans.StopSet.prototype.exportPack=function(stream,nameSet) {
	var stopList;
	var stopNum,stopCount;
	var stop;
	var lat,lon;
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
  * @param {gis.enc.NameSet} nameSet
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
	/** @type {Array.<number>} */
	var dec;
	var step;

	var advance=function() {
		var stop;

		switch(step) {
			// Initialize.
			case 0:
				step++;

				self.list=[];
				self.count=0;

				dec=/** @type {Array.<number>} */ ([]);
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
//				stop=new reach.trans.Stop(nameSet.list[origId],nameSet.list[nameId],ll);
				stop=self.insert(nameSet.list[origId],nameSet.list[nameId],ll);
				stop.followerList=[];
//				stop.statsTo=[];
//				self.insert(stop);

				return(--stopCount);
		}
	};

	step=0;
	return(advance);
};

/** @param {function(reach.trans.Stop):boolean} handler */
reach.trans.StopSet.prototype.forStops=function(handler) {
	var stopNum,stopCount;
	var stop;

	stopCount=this.list.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		handler(this.list[stopNum]);
	}
};

/** @param {Array.<reach.trans.Stop>} stopList
  * @param {function(reach.trans.Stop):boolean} handler
  * @return {Array.<reach.trans.Stop>} */
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
  * @param {function(reach.trans.Seq):boolean} handler
  * @return {Array.<reach.trans.Stop>} */
reach.trans.StopSet.prototype.filterSeqs=function(stopList,handler) {
	var outList;
	var stopNum,stopCount;
	var stop;
	var seqList;
	var seqNum,seqCount;

	outList=[];

	stopCount=stopList.length;
	for(stopNum=0;stopNum<stopCount;stopNum++) {
		stop=stopList[stopNum];

		seqList=stop.seqList;
		seqCount=seqList.length;

		for(seqNum=0;seqNum<seqCount;seqNum++) {
			if(handler(seqList[seqNum])) {
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
	/** @type {RegExp} */
	var nameRe;
	/** @type {Object.<number,boolean>} */
	var seqTbl;
	var seqList;
	var seqNum,seqCount;

	stopList=this.list;
	name=/** @type {string} */ (term['name']);
	if(name) {
		nameRe=new RegExp('^'+name,'i');
		stopList=this.filter(stopList,function(stop) {
			return(!!stop.name && nameRe.test(stop.name));
		});
	}

	seqList=/** @type {Array.<reach.trans.Seq>} */ (term['lines']);
	if(seqList) {
		seqTbl={};
		seqCount=seqList.length;
		for(seqNum=0;seqNum<seqCount;seqNum++) {
			seqTbl[seqList[seqNum].id]=true;
		}

		stopList=this.filterSeqs(stopList,function(seq) {
			return(seqTbl[seq.id]||false);
		});
	}

	return(stopList);
};
