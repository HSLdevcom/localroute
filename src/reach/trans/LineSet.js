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

/** @param {gis.io.LineStream} stream
  * @param {reach.trans.StopSet} stopSet */
reach.trans.LineSet.prototype.importTempPack=function(stream,stopSet) {
	var txt;
	var lineList;
	var lineNum,lineCount;
	var line;
	var fieldList;
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

	/** @param {reach.trans.Trip} a
	  * @param {reach.trans.Trip} b */
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
				lineCount=dec[0];

				return(lineCount);

			// Iterate to load info for each line such as list of stops.
			case 1:
				line=new reach.trans.Line();

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
  * @param {function(reach.trans.Trip):boolean} handler
  * @return {Array.<reach.trans.Line>} */
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
  * @param {function(reach.trans.Stop):boolean} handler
  * @return {Array.<reach.trans.Line>} */
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

	lineList=this.list;
	name=/** @type {string} */ (term['name']);
	code=/** @type {string} */ (term['code']);
	if(name || code) {
		if(name) nameRe=new RegExp('^'+name,'i');
		if(code) codeRe=new RegExp('^'+code+'([^0-9]|$)','i');
		lineList=this.filterTrips(lineList,function(trip) {
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

		lineList=this.filterStops(lineList,function(stop) {
			return(stopTbl[stop.id]||false);
		});
	}

	return(lineList);
};
