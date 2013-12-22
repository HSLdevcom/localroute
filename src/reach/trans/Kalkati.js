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

goog.provide('reach.trans.Kalkati');
goog.require('gis.Obj');
goog.require('gis.MU');
goog.require('gis.util.Date');
goog.require('reach.trans.Stop');
goog.require('reach.trans.Seq');
goog.require('reach.trans.Trip');

/** @constructor */
reach.trans.Kalkati=function(transSet) {
	this.transSet=transSet;
};

reach.trans.Kalkati.prototype.importZip=function(path,startDate,totalDays,output) {
	var child;
	var xml;

	var validTbl;
	var valid;

	var stopSet;
	var stopTbl;
	var seqSet;
	var seqTbl;
	var keySet;
	var keyTbl;
	var tripSet;
	var tripTbl;

	var isService,isSynonym;
	var tripTimeList;
	var refList;

	var mode;

	var serviceCount;
	var progress;

	validTbl=[];

	stopSet=this.transSet.stopSet;
	seqSet=this.transSet.seqSet;
	keySet=this.transSet.keySet;
	tripSet=this.transSet.tripSet;

	stopTbl={};
	seqTbl={};
	keyTbl={};
	tripTbl={};

	isService=false;
	isSynonym=false;

	serviceCount=0;
	progress='';

	xml=new expat.Parser('UTF-8');

	/** @param {string} name
	  * @param {Array.<string>} attr */
	xml.on('startElement',function(name,attr) {
		var pos;
		var ll;
		var stop;
		var origId;
		var id;
		var dateParts;
		var firstDate;
		var noteDays;
		var offset;
		var vec;
		var bits;
		var bit;

		if(name=='Stop' && isService && valid) {
			pos=+attr['Ix'];
			tripTimeList[pos]=attr['Arrival'];
			refList[pos]=attr['StationId'];
		} else if(name=='Service') {
			isService=true;
			tripTimeList=[];
			refList=[];
		} else if(name=='ServiceNbr') key=attr['ServiceNbr']+'\t'+attr['Variant']+'\t'+attr['Name'];
		else if(name=='ServiceValidity') valid=validTbl[+attr['FootnoteId']];
		else if(name=='ServiceTrnsmode') mode=attr['TrnsmodeId'];
		else if(name=='Station' && !isSynonym) {
			origId=attr['StationId'];
			ll=new gis.Deg(attr['Y'],attr['X']).toMU();
//			stop=new reach.trans.Stop(origId,attr['Name'],ll);

//			stopTbl[origId]=stop;
//			stopSet.insert(stop);

			stop=stopSet.insert(origId,attr['Name'],ll);
			stopTbl[origId]=stop;
		} else if(name=='Footnote' && attr['Firstdate'] && attr['Vector']) {
			id=+attr['FootnoteId'];
			dateParts=attr['Firstdate'].split('-');
			// List of valid days for a trip.
			vec=attr['Vector'];
			noteDays=vec.length;

			// List start date.
			firstDate=gis.util.Date.fromYMD(+dateParts[0],+dateParts[1],+dateParts[2]);

			// Offset of first interesting date on the list.
			offset=startDate.jd-firstDate.jd;
			// Exit if it's off the end of the list.
			if(offset>noteDays-1) return;
			// Offset of last interesting date.
			pos=offset+totalDays-1;
			// Exit if it's before the start of the list.
			if(pos<0) return;

			// Make sure first and last interesting dates aren't off the ends of the list.
			if(offset<0) offset=0;
			if(pos>noteDays-1) pos=noteDays-1;

			// Read validity bits from last to first interesting date.
			bits=0;
			while(pos>=offset) {
				bits=bits*2+(vec.charCodeAt(pos)-48);
				pos--;
			}

			// If first date was before the start of the list, add extra days when trip wasn't valid yet.
			offset=startDate.jd-firstDate.jd;
			if(offset<0) bits<<=-offset;

//console.log(firstDate.format()+'\t'+offset+'\t'+vec+'\t'+bits.toString(2));

//			bits&=((1<<totalDays)>>>0)-1;
			bits&=(1<<totalDays)-1;
			// Make sure the valid days mask has days marked within the range to be compressed.
			if(bits) validTbl[id]=bits>>>0;
		} else if(name=='Synonym') isSynonym=true;
	});

	xml.on('endElement',function(name) {
		var stopData;
		var refNum,refCount;
		var stopCount;
		var stop;
		var stopList;
		var seq;
		var timeData;
		var timeList;
		var timeCount;
		var time,prevTime;
		var keyObj;
		var keyParts;
		var trip;

		if(name=='Service' && valid) {
			isService=false;

			stopData=refList.join('\t');

			seq=seqTbl[stopData];
			if(!seq) {
				stopList=[];
				stopCount=0;
				refCount=refList.length;

				for(refNum=0;refNum<refCount;refNum++) {
					stop=stopTbl[refList[refNum]];
					if(stop) stopList[stopCount++]=stop;
				}

				seq=seqSet.createSeq();
				seq.stopList=stopList;
				seqTbl[stopData]=seq;
			}

			key=seq.id+'\t'+mode+'\t'+key;
			timeData=key+'\t'+tripTimeList.join('\t');

			trip=tripTbl[timeData];
			if(!trip) {
				keyObj=keyTbl[key];
				if(!keyObj) {
					keyParts=key.split('\t');
					keyObj=new reach.trans.Key(seq);
					keyObj.mode=keyParts[1];
					keyObj.shortCode=keyParts[3];
					keyObj.name=keyParts[4];

					keyTbl[key]=keyObj;
					keySet.insert(keyObj);
				}

				timeList=[];
				timeCount=0;
//				prevTime=0;
				firstTime=0;

				refCount=tripTimeList.length;
				for(refNum=0;refNum<refCount;refNum++) {
					if(!tripTimeList[refNum]) continue;
					time=+tripTimeList[refNum];
					time=(~~(time/100)*60+time%100)*60;
//					timeList[timeCount++]=time-prevTime;
					timeList[timeCount]=time-firstTime;
					if(!timeCount) firstTime=time;
					timeCount++;
//					prevTime=time;
				}

				trip=new reach.trans.Trip(seq,keyObj);
				trip.valid=valid;
				trip.timeList=timeList;
//				trip.startTime=timeList[0];

				tripTbl[timeData]=trip;
				tripSet.insert(trip);
			} else trip.valid|=valid;

			serviceCount++;
			if(!(serviceCount&4095)) {
				progress+='.';
				console.log(progress);
//				process.exit(0);
			}
		} else if(name=='Synonym') isSynonym=false;
	});

	xml.on('end',function() {
		output();
	});

	child=childProcess.spawn('unzip',['-p',path]);
	child.stdout.pipe(xml);
};
