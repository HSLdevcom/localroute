/**
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

goog.provide('main');
goog.require('gis.Obj');
goog.require('gis.util.Opt');
goog.require('gis.util.Date');
goog.require('reach.trans.TransSet');
goog.require('reach.trans.GTFS');
goog.require('gis.osm.MapSet');
goog.require('gis.osm.PBF');

function init() {
	var dateParts;
	var dateStart;
	var dateSys;
	var dayCount;
	var transSet;
	var gtfs;
	var opt;
	var taskList;
	var transSet;
	var mapSet;
	var stream;
	var fd;

	opt=new gis.util.Opt({
		date:['D|date','DATE',null,'Start date in yyyy-mm-dd format, default today'],
		days:['d|days','DATE',null,'Number of days to include in schedule'],
		inGTFS:['in-gtfs','FILE',null,'Input public transport data in Google Transit Feed Specification format'],
		inKalkati:['in-kalkati','FILE',null,'Input public transport data in Kalkati XML format'],
		outTransTemp:['out-tempt','FILE',null,'Output public transport data in human-readable intermediate format'],
		inTransTemp:['in-tempt','FILE',null,'Input public transport data in human-readable intermediate format'],
		outTrans:['out-trans','FILE',null,'Output public transport data in a squeezed package'],
		inTrans:['T|in-trans','FILE',null,'Onput public transport data in a squeezed package'],
		inPBF:['in-pbf','FILE',null,'Input OpenStreetMap data in Protocol Buffer format'],
		outMap:['out-map','FILE',null,'Input map data in a squeezed package']
//      verbose:['v|verbose',null,null,'Print more details'],
//      stops:['stops','LIST',null,'Print cost of a predefined route'],
//      nostops:['nostops','LIST',null,'Disable some stops'],
    },[],'LocalRoute.js','1st infrared aardvark');

	opt.parse(process.argv);

	if(opt.def.date) {
		dateParts=opt.def.date.split('-');
		if(dateParts.length==3) dateStart=gis.util.Date.fromYMD(+dateParts[0],+dateParts[1],+dateParts[2]);
	} else {
		dateSys=new Date();
		dateStart=gis.util.Date.fromYMD(dateSys.getFullYear(),dateSys.getMonth()+1,dateSys.getDate());
	}

	dayCount=opt.def.days;
	if(!dayCount) dayCount=30;

	taskList=[];

	function nextTask() {
		if(taskList.length) (taskList.shift())();
		console.log('...');
	}

	/** @param {string} txt */
	function write(txt) {
		fs.writeSync(fd,txt,null,'utf8');
	}

	// Public transport input.

	if(opt.def.inGTFS) {
		taskList.push(function() {
			transSet=new reach.trans.TransSet(dateStart);
			gtfs=new reach.trans.GTFS(transSet);
			gtfs.importZip(opt.def.inGTFS,dateStart,dayCount,nextTask);
		});
	}

	if(opt.def.inTransTemp) {
		taskList.push(function() {
			transSet=new reach.trans.TransSet();
			transSet.importTempPack(fs.readFileSync(opt.def.inTransTemp,'utf8'));
			nextTask();
		});
	}

	if(opt.def.inTrans) {
		taskList.push(function() {
			transSet=new reach.trans.TransSet();
			stream=new gis.io.PackStream(fs.readFileSync(opt.def.inTrans,'utf8'),null);
			transSet.importPack(stream);
			nextTask();
		});
	}

	// Public transport output.

	if(opt.def.outTransTemp) {
		taskList.push(function() {
			fd=fs.openSync(opt.def.outTransTemp,'w');
			transSet.exportTempPack(write);
			fs.closeSync(fd);
			nextTask();
		});
	}

	if(opt.def.outTrans) {
		taskList.push(function() {
			fd=fs.openSync(opt.def.outTrans,'w');
			stream=new gis.io.PackStream(null,write);
			transSet.exportPack(stream);
			fs.closeSync(fd);
			nextTask();
		});
	}

	// Map input.

	if(opt.def.inPBF) {
		taskList.push(function() {
			eval("Schema=require('protobuf').Schema;");
			mapSet=new gis.osm.MapSet();
			pbf=new gis.osm.PBF(mapSet);
			pbf.importPBF(opt.def.inPBF,nextTask);
		});
	}

	// Map output.

	if(opt.def.outMap) {
		taskList.push(function() {
			fd=fs.openSync(opt.def.outMap,'w');

			stream=new gis.io.PackStream(null,write);
			mapSet.waySet.detail=2;
			mapSet.exportPack(stream);
			fs.closeSync(fd);
			nextTask();
		});
	}

	nextTask();
}

if(process && process.argv && typeof(process.argv[1])=='string' && process.argv[1].match(/(^|[/])lr.js$/)) {
	init();
}
