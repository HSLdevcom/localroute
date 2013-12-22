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
reach.trans.TripSet.tolerance=15;

/** @param {reach.trans.Trip} trip */
reach.trans.TripSet.prototype.insert=function(trip) {
	this.list[this.count++]=trip;

	return(trip);
};

/** @param {function(string)} write */
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
	var fieldList;
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

		trip.timeList=timeList;
//		trip.startTime=timeList[0];
		tripList[tripNum]=trip;
	}

	this.list=tripList;
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
	validTbl=/** @type {Object.<number,number>} */ ({});
	validList=[];
	validGroupList=/** @type {Array.<Array.<reach.trans.Trip>>} */ ([]);
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
		/** @param {reach.trans.Trip} a
		  * @param {reach.trans.Trip} b */
		validGroupList[validNum].sort(function(a,b) {return(a.key.id-b.key.id || a.timeList[0]-b.timeList[0]);});
	}

	this.validTbl=validTbl;
	this.validList=validList;
	this.validGroupList=validGroupList;
};

/** @param {gis.io.PackStream} stream */
reach.trans.TripSet.prototype.exportPack=function(stream) {
	var tolerance;
	var validGroupList;
	var validList;
	var validNum,validCount;
	var tripList;
	var tripNum,tripCount;
	var trip;
	var depart,prevDepart,wait,prevWait;
	var keyId,prevKeyId;
	var row,data;
	var timeList;
	var timeNum,timeCount;
	var err;
	var txt;
	var lz;

	tolerance=reach.trans.TripSet.tolerance;

	validGroupList=this.validGroupList;
	validList=this.validList;
	validCount=validList.length;

	lz=new gis.enc.LZ();

	stream.writeLong([tolerance,validCount]);
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
			depart=~~(trip.timeList[0]/tolerance+0.5);
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
			prevDepart=0;

			for(timeNum=1;timeNum<timeCount;timeNum++) {
				depart=~~(timeList[timeNum]/tolerance+0.5);
				if(depart<prevDepart) depart=prevDepart;

				row[timeNum-1]=depart-prevDepart;
				prevDepart=depart;
			}

			data.push(stream.encodeShort(row));
		}

		txt=data.join('');
		txt=lz.compressBytes(txt,256*2,2048,stream);
		stream.writeRaw(txt);
	}
};

/** @param {gis.io.PackStream} stream
  * @param {reach.trans.KeySet} keySet
  * @return {function():number} */
reach.trans.TripSet.prototype.importPack=function(stream,keySet) {
	/** @type {reach.trans.TripSet} */
	var self=this;
	var tolerance;
	var validGroupList;
	var validList;
	var validNum;
	/** @type {number} */
	var validCount;
	/** @type {number} */
	var valid;
	/** @type {number} */
	var tripNum;
	/** @type {number} */
	var tripLast;
	/** @type {number} */
	var tripCount;
	/** @type {number} */
	var keyId;
	/** @type {gis.io.PackStream} */
	var pack;
	/** @type {Array.<number>} */
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
		var txt;
		var key;

		switch(step) {
			// Initialize.
			case 0:
				step++;

				lz=new gis.enc.LZ();

				dec=/** @type {Array.<number>} */ ([]);
				stream.readLong(dec,2);
				tolerance=dec[0];
				validCount=dec[1];
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

				for(timeNum=0;timeNum<timeCount;timeNum++) {
					depart=timeList[timeNum]*tolerance;

					trip=new reach.trans.Trip(key);
//					trip.startTime=depart;
					trip.timeList=[depart];
					trip.valid=valid;

					self.insert(trip);
				}

				tripCount-=timeCount;
				if(!tripCount) step++;

				return(validCount);
			case 3:
				step=1;

				txt=lz.decompressBytes(stream);
				pack=new gis.io.PackStream(txt,null);

				for(;tripNum<tripLast;tripNum++) {
					trip=self.list[tripNum];
					timeCount=trip.key.seq.stopList.length-1;
					pack.readShort(dec,timeCount);
					time=0;

					for(timeNum=0;timeNum<timeCount;timeNum++) {
						time+=dec[timeNum]*tolerance;
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

/** Add trips to their respective stop sequences.
  * @param {number} day
  * @param {number} dayStamp
  * @param {number} first
  * @param {number} last */
reach.trans.TripSet.prototype.bindSeqs=function(day,dayStamp,first,last) {
	var mask;
	var validGroupList;
	var validList;
	var validNum,validCount;
	var tripList;
	var tripNum,tripCount;
	var trip;
	var stamp;
	var seq;

	mask=1<<day;
//console.log(new Date(dayStamp));

	validGroupList=this.validGroupList;
	validList=this.validList;
	validCount=validList.length;

	for(validNum=0;validNum<validCount;validNum++) {
		if(!(validList[validNum]&mask)) continue;

		tripList=validGroupList[validNum];
		tripCount=tripList.length;

		for(tripNum=0;tripNum<tripCount;tripNum++) {
			trip=tripList[tripNum];
			stamp=dayStamp+trip.timeList[0]*1000;
			if(stamp<first || stamp>last) continue;
//			if(trip.key.shortCode=='65N') console.log(trip.key.shortCode+' '+trip.key.sign+' '+trip.startTime+' '+new Date(stamp));

			seq=trip.key.seq;
			seq.tripList.push(trip);
			seq.stampList.push(stamp);
		}
	}
};
