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

/** @fileoverview GTFS parser, reads from zip file to internal representation. */

/* jshint -W069 */

goog.provide('reach.trans.GTFS');
goog.require('gis.Obj');
goog.require('gis.MU');
goog.require('gis.util.Date');
goog.require('gis.enc.CSVStream');
goog.require('reach.trans.Stop');
goog.require('reach.trans.Shape');
goog.require('reach.trans.Trip');
goog.require('reach.trans.Seq');

/** @constructor
  * @param {reach.trans.TransSet} transSet */
reach.trans.GTFS=function(transSet) {
	/** @type {reach.trans.TransSet} */
	this.transSet=transSet;
	/** @type {Object.<string,reach.trans.Stop>} */
	this.stopTbl={};
	/** @type {Object.<string,number>} */
	this.validTbl={};
	/** @type {Object.<string,reach.trans.GTFS.RouteDesc>} */
	this.routeTbl={};
	/** @type {Object.<string,reach.trans.Shape>} */
	this.shapeTbl={};
	/** @type {Object.<string,reach.trans.GTFS.TripDesc>} */
	this.descTbl={};
	/** @type {Object.<string,reach.trans.Trip>} */
	this.tripTbl={};
	/** @type {number} */
	this.tripCount=0;
	/** @type {Object.<string,reach.trans.Seq>} */
	this.seqTbl={};
	/** @type {Object.<string,reach.trans.Key>} */
	this.keyTbl={};
};

/** @typedef {{route:string,valid:number,sign:string,arriveList:Array.<number>,departList:Array.<number>,stopList:Array.<string>,flagList:Array.<number>,done:boolean}} */
reach.trans.GTFS.TripDesc;

/** @typedef {{shortCode:string,name:string,mode:number}} */
reach.trans.GTFS.RouteDesc;

/** @param {string} zipPath
  * @param {string} name
  * @return {gis.enc.CSVStream} */
reach.trans.GTFS.prototype.readFile=function(zipPath,name) {
	var stream;
	var child;

	stream=new gis.enc.CSVStream();
	child=childProcess.spawn('unzip',['-p',zipPath,name]);
	child.stdout.pipe(stream);

	return(stream);
};

/** @param {Array.<string>} row
  * @return {Object.<string,number>} */
reach.trans.GTFS.prototype.getFields=function(row) {
	var fieldTbl;
	var fieldNum,fieldCount;

	fieldTbl={};
	fieldCount=row.length;

	for(fieldNum=0;fieldNum<fieldCount;fieldNum++) {
		fieldTbl[row[fieldNum]]=fieldNum;
	}

	return(fieldTbl);
};

/** @param {string} txt
  * @return {number} */
reach.trans.GTFS.prototype.parseTime=function(txt) {
	var timeParts;

	timeParts=txt.split(':');
	return((  (+timeParts[0]|0)*60 + (+timeParts[1]|0)  )*60 + (+timeParts[2]|0));
};

/** @param {string} txt
  * @return {gis.util.Date} */
reach.trans.GTFS.prototype.parseDate=function(txt) {
	return(gis.util.Date.fromYMD(+txt.substr(0,4),+txt.substr(4,2),+txt.substr(6,2)));
};

/** @param {gis.enc.CSVStream} stream
  * @param {function()} done */
reach.trans.GTFS.prototype.importStops=function(stream,done) {
	var self=this;
	var rowNum;
	/** @type {reach.trans.StopSet} */
	var stopSet;
	var stopTbl;

	var fieldTbl;
	var stopCol,codeCol,latCol,lonCol,nameCol;

	stopSet=this.transSet.stopSet;
	stopTbl=this.stopTbl;
	rowNum=0;

	/** @param {Array.<string>} row */
	stream.on('data',function(row) {
		var id;
		var ll;
		var stop;

		if(!rowNum++) {
			fieldTbl=self.getFields(row);

			stopCol=fieldTbl['stop_id'];
			codeCol=fieldTbl['stop_code'];
			latCol=fieldTbl['stop_lat'];
			lonCol=fieldTbl['stop_lon'];
			nameCol=fieldTbl['stop_name'];
		} else {
			id=row[stopCol];
			ll=new gis.Deg(+row[latCol],+row[lonCol]).toMU();
//			stop=new reach.trans.Stop(row[codeCol],row[nameCol],ll);

//			stopTbl[id]=stop;
//			stopSet.insert(stop);

			stop=stopSet.insert(row[codeCol],row[nameCol],ll);
			stopTbl[id]=stop;
		}
	});

	stream.on('end',done);
};

/** @param {gis.enc.CSVStream} stream
  * @param {gis.util.Date} startDate
  * @param {number} totalDays
  * @param {function()} done */
reach.trans.GTFS.prototype.importWeeks=function(stream,startDate,totalDays,done) {
	var self=this;
	var rowNum;
	var dayList;
	/** @type {Object.<string,number>} */
	var validTbl;

	var fieldTbl;
	var dayCol;
	var validCol,startCol,endCol;

	dayList=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
	validTbl=this.validTbl;
	rowNum=0;

	/** @param {Array.<string>} row */
	stream.on('data',function(row) {
		var valid,prevValid;
		var dayNum;
		var offset;

		if(!rowNum++) {
			fieldTbl=self.getFields(row);
			dayCol=[];

			validCol=fieldTbl['service_id'];
			for(dayNum=0;dayNum<7;dayNum++) dayCol[dayNum]=fieldTbl[dayList[dayNum]];
			startCol=fieldTbl['start_date'];
			endCol=fieldTbl['end_date'];
		} else {
			valid=0;
			for(dayNum=0;dayNum<7;dayNum++) {
				if(+row[dayCol[dayNum]]) valid=(valid|(0x10204081<<((dayNum-startDate.weekDay+7)%7)))>>>0;
			}

			offset=self.parseDate(row[startCol]).jd-startDate.jd;
			if(offset>totalDays-1) valid=0;
			else if(offset>0) valid&=(~0)<<offset;

			offset=self.parseDate(row[endCol]).jd-startDate.jd+1;
			if(offset<0) valid=0;
			else if(offset<totalDays) valid&=(1<<offset)-1;

			valid&=(1<<totalDays)-1;

			prevValid=validTbl[row[validCol]];
			if(prevValid) valid|=prevValid;	// According to spec a single service can have only one range of dates, but let's be more forgiving and merge them.
			validTbl[row[validCol]]=valid>>>0;
		}
	});

	stream.on('end',done);
};

/** @param {gis.enc.CSVStream} stream
  * @param {gis.util.Date} startDate
  * @param {number} totalDays
  * @param {function()} done */
reach.trans.GTFS.prototype.importDays=function(stream,startDate,totalDays,done) {
	var self=this;
	var rowNum;
	/** @type {Object.<string,number>} */
	var validTbl;

	var fieldTbl;
	var validCol,dateCol,flagCol;

	validTbl=this.validTbl;
	rowNum=0;

	/** @param {Array.<string>} row */
	stream.on('data',function(row) {
		var offset;
		var valid;
		var flag;

		if(!rowNum++) {
			fieldTbl=self.getFields(row);

			validCol=fieldTbl['service_id'];
			dateCol=fieldTbl['date'];
			flagCol=fieldTbl['exception_type'];
		} else {
			offset=self.parseDate(row[dateCol]).jd-startDate.jd;
			if(offset<0 || offset>totalDays-1) return;

			flag=row[flagCol];
			valid=validTbl[row[validCol]];

			if(flag==1) valid|=1<<offset;
			else if(flag==2) valid&=~(1<<offset);
			validTbl[row[validCol]]=valid>>>0;
		}
	});

	stream.on('end',done);
};

/** @param {gis.enc.CSVStream} stream
  * @param {function()} done */
reach.trans.GTFS.prototype.importRoutes=function(stream,done) {
	var self=this;
	var rowNum;
	var routeTbl;

	var fieldTbl;
	var routeCol,codeCol,nameCol,modeCol;

	routeTbl=this.routeTbl;
	rowNum=0;

	/** @param {Array.<string>} row */
	stream.on('data',function(row) {
		if(!rowNum++) {
			fieldTbl=self.getFields(row);

			routeCol=fieldTbl['route_id'];
			codeCol=fieldTbl['route_short_name'];
			nameCol=fieldTbl['route_long_name'];
			modeCol=fieldTbl['route_type'];
		} else {
			routeTbl[row[routeCol]]={shortCode:row[codeCol],name:row[nameCol],mode:+row[modeCol]};
		}
	});

	stream.on('end',done);
};

/** @param {gis.enc.CSVStream} stream
  * @param {function()} done */
reach.trans.GTFS.prototype.importShapes=function(stream,done) {
	var self=this;
	var rowNum;
	var shapeTbl;
	var shape;
	var ll;

	var fieldTbl;
	var shapeCol,latCol,lonCol,posCol;

	shapeSet=this.transSet.shapeSet;
	shapeTbl=this.shapeTbl;

	rowNum=0;

	/** @param {Array.<string>} row */
	stream.on('data',function(row) {
		if(!rowNum++) {
			fieldTbl=self.getFields(row);

			shapeCol=fieldTbl['shape_id'];
			latCol=fieldTbl['shape_pt_lat'];
			lonCol=fieldTbl['shape_pt_lon'];
			posCol=fieldTbl['shape_pt_sequence'];
		} else {
			shape=shapeTbl[row[shapeCol]];
			if(!shape) {
				shape=shapeSet.createShape();
				shapeTbl[row[shapeCol]]=shape;
			}
			ll=new gis.Deg(row[latCol],row[lonCol]).toMU();
			shape.insert(row[posCol],ll.llat,ll.llon);
		}
	});

	stream.on('end',function() {
		done();
	});
};

/** @param {gis.enc.CSVStream} stream
  * @param {function()} done */
reach.trans.GTFS.prototype.importTrips=function(stream,done) {
	var self=this;
	var rowNum;
	/** @type {Object.<string,number>} */
	var validTbl;
	var descTbl;
	var shapeTbl;

	var fieldTbl;
	var routeCol,validCol,idCol,signCol;
	var sign;

	validTbl=this.validTbl;
	descTbl=this.descTbl;
	shapeTbl=this.shapeTbl;
	rowNum=0;

	/** @param {Array.<string>} row */
	stream.on('data',function(row) {
		var tripDesc;
		var valid;

		if(!rowNum++) {
			fieldTbl=self.getFields(row);

			routeCol=fieldTbl['route_id'];
			validCol=fieldTbl['service_id'];
			idCol=fieldTbl['trip_id'];
			signCol=fieldTbl['trip_headsign'];
			shapeCol=fieldTbl['shape_id'];
		} else {
			valid=validTbl[row[validCol]];
			if(!valid) return;

			sign=row[signCol];
			if(!sign) sign='';

			tripDesc={route:row[routeCol],valid:valid,sign:sign,arriveList:[],departList:[],stopList:[],flagList:[],shape:shapeTbl[row[shapeCol]],done:false};
			descTbl[row[idCol]]=tripDesc;
		}
	});

	stream.on('end',function() {
		self.validTbl={};
		done();
	});
};

/** @param {gis.enc.CSVStream} stream
  * @param {boolean} fast
  * @param {function()} done */
reach.trans.GTFS.prototype.importTimes=function(stream,fast,done) {
	var self=this;
	var rowNum;
	/** @type {Object.<string,reach.trans.GTFS.TripDesc>} */
	var descTbl;
	/** @type {reach.trans.GTFS.TripDesc|null} */
	var prevDesc;

	var fieldTbl;
	var idCol,arriveCol,departCol,stopCol,posCol,pickCol,dropCol;

	descTbl=this.descTbl;
	prevDesc=null;
	rowNum=0;

	/** @param {Array.<string>} row */
	stream.on('data',function(row) {
		var tripDesc;
		var flag;
		var pos;

		if(!rowNum++) {
			fieldTbl=self.getFields(row);

			idCol=fieldTbl['trip_id'];
			arriveCol=fieldTbl['arrival_time'];
			departCol=fieldTbl['departure_time'];
			stopCol=fieldTbl['stop_id'];
			posCol=fieldTbl['stop_sequence'];
			pickCol=fieldTbl['pickup_type'];
			dropCol=fieldTbl['drop_off_type'];
		} else {
			tripDesc=descTbl[row[idCol]];
			if(!tripDesc) return;

			if(fast) {
				if(tripDesc!=prevDesc && prevDesc) {
					self.prepareDesc(prevDesc);
					if(tripDesc.done) {
						console.log('ERROR in importTimes, call with fast=false!');
						console.log(row);
						return;
					}
				}

				prevDesc=tripDesc;
			}

			flag=0;
			if(+row[pickCol]) flag|=(row[pickCol]&3)<<2;
			if(+row[dropCol]) flag|=(row[dropCol]&3);

			pos=+row[posCol];
			tripDesc.arriveList[pos]=self.parseTime(row[arriveCol]);
			tripDesc.departList[pos]=self.parseTime(row[departCol]);
			tripDesc.stopList[pos]=row[stopCol];
			tripDesc.flagList[pos]=flag;
		}
	});

	stream.on('end',function() {
		if(fast && prevDesc) self.prepareDesc(prevDesc);
		done();
	});
};

/** @param {reach.trans.GTFS.TripDesc} tripDesc */
reach.trans.GTFS.prototype.prepareDesc=function(tripDesc) {
	var refList;
	var refNum,refCount;
	var ref;
	var timeList;
	var prevTime;
	var stopTbl;
	var stopList;
	var stopNum,stopCount;
	var seqSet;
	var seqTbl;
	var seq;
	var shape;
	var keySet;
	var keyTbl;
	var keyObj;
	var key;
	var routeTbl;
	var route;
	var tripSet;
	var tripTbl;
	var trip;
	var arrive,depart,time;

	seqSet=this.transSet.seqSet;
	keySet=this.transSet.keySet;
	tripSet=this.transSet.tripSet;

	seqTbl=this.seqTbl;
	stopTbl=this.stopTbl;
	keyTbl=this.keyTbl;
	routeTbl=this.routeTbl;
	tripTbl=this.tripTbl;

	refList=[];
	timeList=[];
	prevTime=0;
	stopCount=0;

	refCount=tripDesc.stopList.length;
	for(refNum=0;refNum<refCount;refNum++) {
		ref=tripDesc.stopList[refNum];
		if(!ref) continue;

		arrive=tripDesc.arriveList[refNum];
		depart=tripDesc.departList[refNum];

		refList[stopCount]=ref;
		timeList[stopCount++]=arrive-prevTime;
		prevTime=arrive;

		if(depart!=arrive) {
			refList[stopCount]=ref;
			timeList[stopCount++]=depart-prevTime;
			depart=prevTime;
		}
	}

	key=refList.join('\t');
	seq=seqTbl[key];
	if(!seq) {
		stopList=[];
		for(stopNum=0;stopNum<stopCount;stopNum++) {
			stopList[stopNum]=stopTbl[refList[stopNum]];
		}

		seq=seqSet.createSeq();
		seq.stopList=stopList;
		seqTbl[key]=seq;
	}

	shape=tripDesc.shape;
	if(shape) {
		if(!shape.sorted) shape.sortPoints();
		if(!shape.seqTbl[seq.id]) {
			shape.seqTbl[seq.id]=seq;
			shape.seqList.push(seq);
			seq.shapeList.push(shape);
		}
	}

	key=seq.id+'\t'+tripDesc.route+'\t'+tripDesc.sign;
	keyObj=keyTbl[key];
	if(!keyObj) {
		keyObj=new reach.trans.Key(seq);

		route=routeTbl[tripDesc.route];
		keyObj.mode=route.mode;
		keyObj.shortCode=route.shortCode;
		keyObj.name=route.name;
		keyObj.sign=tripDesc.sign;

		keyTbl[key]=keyObj;
		keySet.insert(keyObj);
	}

	key+='\t'+timeList.join('\t');
	trip=tripTbl[key];
	if(!trip) {
		time=0;
		for(stopNum=1;stopNum<stopCount;stopNum++) {
			time+=timeList[stopNum];
			timeList[stopNum]=time;
		}

		trip=new reach.trans.Trip(keyObj);
		trip.valid=tripDesc.valid;
		trip.timeList=timeList;
//		trip.startTime=timeList[0];

		tripTbl[key]=trip;
		tripSet.insert(trip);
	} else trip.valid|=tripDesc.valid;

	tripDesc.arriveList=null;
	tripDesc.departList=null;
	tripDesc.stopList=null;
	tripDesc.flagList=null;
	tripDesc.done=true;
};

/** @param {string} path
  * @param {gis.util.Date} startDate
  * @param {number} totalDays
  * @param {function()} done */
reach.trans.GTFS.prototype.importZip=function(path,startDate,totalDays,done) {
	/** @type {reach.trans.GTFS} */
	var self=this;
	var fast;

	fast=false;

	function importStops() {self.importStops(self.readFile(path,'stops.txt'),importWeeks);}
	function importWeeks() {self.importWeeks(self.readFile(path,'calendar.txt'),startDate,totalDays,importDays);}
	function importDays() {self.importDays(self.readFile(path,'calendar_dates.txt'),startDate,totalDays,importRoutes);}
	function importRoutes() {self.importRoutes(self.readFile(path,'routes.txt'),importShapes);}
	function importShapes() {self.importShapes(self.readFile(path,'shapes.txt'),importTrips);}
	function importTrips() {self.importTrips(self.readFile(path,'trips.txt'),importTimes);}
	function importTimes() {self.importTimes(self.readFile(path,'stop_times.txt'),fast,prepare);}
	function prepare() {
		if(!fast) {
			for(id in self.descTbl) {
				if(!self.descTbl.hasOwnProperty(id)) continue;

				self.prepareDesc(self.descTbl[id]);
			}
		}
		done();
	}

	importStops();
};
