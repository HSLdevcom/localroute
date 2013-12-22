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

goog.provide('reach.trans.SeqSet');
goog.require('reach.trans.StopSet');
goog.require('reach.trans.Seq');

/** @constructor */
reach.trans.SeqSet=function() {
	/** @type {Array.<reach.trans.Seq>} */
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

/** @param {number=} id
  * @return {reach.trans.Seq} */
reach.trans.SeqSet.prototype.createSeq=function(id) {
	var seq;

	if(!id && id!==0) id=this.count++;
	seq=new reach.trans.Seq();
	seq.id=id;
	this.list[id]=seq;

	return(seq);
};

/** @param {function(string)} write */
reach.trans.SeqSet.prototype.exportTempPack=function(write) {
	var refList;
	var seqList;
	var seqNum,seqCount;
	var seq;
	var stopNum,stopCount;
	var stop;

	seqList=this.list;
	seqCount=this.count;
	write(seqCount+'\n');

	for(seqNum=0;seqNum<seqCount;seqNum++) {
		seq=seqList[seqNum];

		refList=[];
		stopCount=seq.stopList.length;
		for(stopNum=0;stopNum<stopCount;stopNum++) {
			stop=seq.stopList[stopNum];
			refList[stopNum]=stop.id;
		}

		write(seq.id+'\t'+refList.join('\t')+'\n');
	}
};

/** @param {gis.io.LineStream} stream
  * @param {reach.trans.StopSet} stopSet */
reach.trans.SeqSet.prototype.importTempPack=function(stream,stopSet) {
	var txt;
	var seqList;
	var seqNum,seqCount;
	var seq;
	var fieldList;
	var stopList;
	var stopNum,stopCount;

	txt=stream.readLine();

	seqCount=+txt;
	this.list=[];
	this.list.length=seqCount;
	this.count=seqCount;

	for(seqNum=0;seqNum<seqCount;seqNum++) {
		fieldList=stream.readLine().split('\t');
		seq=this.createSeq(+fieldList[0]);

		stopCount=fieldList.length-1;
		stopList=[];
		stopList.length=stopCount;

		for(stopNum=0;stopNum<stopCount;stopNum++) {
			stopList[stopNum]=stopSet.list[+fieldList[stopNum+1]];
		}

		seq.stopList=stopList;
	}
};

/** @param {function(reach.trans.Seq)} handler */
reach.trans.SeqSet.prototype.forSeqs=function(handler) {
	var seqList;
	var seqNum,seqCount;

	seqList=this.list;
	seqCount=this.count;

	for(seqNum=0;seqNum<seqCount;seqNum++) {
		handler(seqList[seqNum]);
	}
};

reach.trans.SeqSet.prototype.sortTrips=function() {
	var seqList;
	var seqNum,seqCount;
	var seq;
	var stampList;
	var tripList;
	var tripNum,tripCount;
	var trip;
	var tripRefList;

	/** @param {{stamp:number,trip:reach.trans.Trip}} a
	  * @param {{stamp:number,trip:reach.trans.Trip}} b */
	function compareTrips(a,b) {
		return(a.stamp-b.stamp);
	}

	seqList=this.list;
	seqCount=this.count;

	for(seqNum=0;seqNum<seqCount;seqNum++) {
		seq=seqList[seqNum];
		tripRefList=[];

		stampList=seq.stampList;
		tripList=seq.tripList;
		tripCount=tripList.length;

		for(tripNum=0;tripNum<tripCount;tripNum++) {
			tripRefList[tripNum]={stamp:stampList[tripNum],trip:tripList[tripNum]};
		}

		tripRefList.sort(compareTrips);

		for(tripNum=0;tripNum<tripCount;tripNum++) {
			stampList[tripNum]=tripRefList[tripNum].stamp;
			tripList[tripNum]=tripRefList[tripNum].trip;
		}
	}
};

/** @param {gis.io.PackStream} stream */
reach.trans.SeqSet.prototype.exportPack=function(stream) {
	var seqList;
	var seqNum,seqCount;
	var seq;
	var stopList;
	var stopNum,stopCount;
	var stop,prevStop;
	var packNum;
	var repLen;
	var maxRep;

	maxRep=this.maxRep;

	seqList=this.list;
	seqCount=this.count;

	stream.writeLong([seqCount]);

	for(seqNum=0;seqNum<seqCount;seqNum++) {
		seq=seqList[seqNum];
		stopList=seq.stopList;
		stopCount=stopList.length;

		stop=stopList[0];
		stream.writeShort([stopCount,stop.id]);
		repLen=0;

		for(stopNum=1;stopNum<stopCount;stopNum++) {
			prevStop=stop;
			stop=seq.stopList[stopNum];

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
reach.trans.SeqSet.prototype.importPack=function(stream,stopSet) {
	/** @type {reach.trans.SeqSet} */
	var self=this;
	var seqCount;
	var seq;
	var stopNum,stopCount;
	var stop,prevStop;
	var id;
	/** @type {number} */
	var maxRep;
	var followerCount;
	/** @type {Array.<number>} */
	var dec;
	var step;

	var advance=function() {
		switch(step) {
			// Initialize.
			case 0:
				step++;

				maxRep=self.maxRep;
				self.list=[];

				dec=/** @type {Array.<number>} */ ([]);
				stream.readLong(dec,1);
				seqCount=dec[0];

				return(seqCount);

			// Iterate to load info for each stop sequence.
			case 1:
				seq=self.createSeq();

				stream.readShort(dec,2);
				stopCount=dec[0];
				stopNum=0;
				stop=stopSet.list[dec[1]];
				seq.insert(stop,stopNum++);

				seq.followerList=[];

				while(stopNum<stopCount) {
					stream.readShort(dec,1);
					id=dec[0];
					followerCount=stop.followerList.length;
					if(id<maxRep) {
						// The next <id> stops are in the same order as when those stops were first seen in the data.
						id++;
						while(id--) {
							seq.followerList[stopNum-1]=0;
							stop=stop.followerList[0];
							seq.insert(stop,stopNum++);
						}
					} else if(id<maxRep+followerCount) {
						// Next stop has already been seen after this stop in other stop sequences so its full ID and reach time aren't needed.
						seq.followerList[stopNum-1]=id-maxRep+1;
						stop=stop.followerList[id-maxRep+1];
						seq.insert(stop,stopNum++);
					} else {
						seq.followerList[stopNum-1]=followerCount;

						prevStop=stop;
						stop=stopSet.list[id-followerCount-maxRep];
						seq.insert(stop,stopNum++);

						prevStop.followerList[followerCount]=stop;
					}
				}

				seqCount--;
				return(seqCount);
		}
	};

	step=0;
	return(advance);
};

/** @param {Array.<reach.trans.Seq>} seqList
  * @param {function(reach.trans.Trip):boolean} handler
  * @return {Array.<reach.trans.Seq>} */
reach.trans.SeqSet.prototype.filterTrips=function(seqList,handler) {
	var outList;
	var seqNum,seqCount;
	var seq;
	var tripList;
	var tripNum,tripCount;

	outList=[];

	seqCount=seqList.length;
	for(seqNum=0;seqNum<seqCount;seqNum++) {
		seq=seqList[seqNum];

		tripList=seq.tripList;
		tripCount=tripList.length;

		for(tripNum=0;tripNum<tripCount;tripNum++) {
			if(handler(tripList[tripNum])) {
				outList.push(seq);
				break;
			}
		}
	}

	return(outList);
};

/** @param {Array.<reach.trans.Seq>} seqList
  * @param {function(reach.trans.Stop):boolean} handler
  * @return {Array.<reach.trans.Seq>} */
reach.trans.SeqSet.prototype.filterStops=function(seqList,handler) {
	var outList;
	var seqNum,seqCount;
	var seq;
	var stopList;
	var stopNum,stopCount;

	outList=[];

	seqCount=seqList.length;
	for(seqNum=0;seqNum<seqCount;seqNum++) {
		seq=seqList[seqNum];

		stopList=seq.stopList;
		stopCount=stopList.length;

		for(stopNum=0;stopNum<stopCount;stopNum++) {
			if(handler(stopList[stopNum])) {
				outList.push(seq);
				break;
			}
		}
	}

	return(outList);
};


/** @param {Object.<string,*>} term
  * @return {Array.<reach.trans.Seq>} */
reach.trans.SeqSet.prototype.find=function(term) {
	var seqList;
	/** @type {string} */
	var name;
	/** @type {string} */
	var code;
	/** @type {RegExp} */
	var nameRe;
	/** @type {RegExp} */
	var codeRe;
	/** @type {Object.<number,boolean>} */
	var stopTbl;
	var stopList;
	var stopNum,stopCount;

	seqList=this.list;
	name=/** @type {string} */ (term['name']);
	code=/** @type {string} */ (term['code']);
	if(name || code) {
		if(name) nameRe=new RegExp('^'+name,'i');
		if(code) codeRe=new RegExp('^'+code+'([^0-9]|$)','i');
		seqList=this.filterTrips(seqList,function(trip) {
			if(name && (!trip.key.sign || !nameRe.test(trip.key.sign)) && (!trip.key.name || !nameRe.test(trip.key.name))) return(false);
			if(code && (!trip.key.shortCode || !codeRe.test(trip.key.shortCode))) return(false);
			return(true);
		});
	}
	stopList=/** @type {Array.<reach.trans.Stop>} */ (term['stops']);
	if(stopList) {
		stopTbl={};
		stopCount=stopList.length;
		for(stopNum=0;stopNum<stopCount;stopNum++) {
			stopTbl[stopList[stopNum].id]=true;
		}

		seqList=this.filterStops(seqList,function(stop) {
			return(stopTbl[stop.id]||false);
		});
	}

	return(seqList);
};
