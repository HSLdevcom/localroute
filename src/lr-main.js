/** @license
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

/** @fileoverview
  * @suppress {reportUnknownTypes} */

/* jshint -W069 */
/* jshint evil:true */
/* jshint quotmark:false */

goog.provide('main');
goog.require('gis.Obj');
goog.require('gis.util.Opt');
goog.require('gis.util.Date');
goog.require('reach.trans.TransSet');
goog.require('reach.trans.GTFS');
goog.require('gis.osm.MapSet');
goog.require('gis.osm.PBF');
goog.require('reach.route.GeomSet');
goog.require('reach.route.Batch');
goog.require('reach.route.GeoCoder');
goog.require('reach.Api');

function initNode() {
	var dateParts;
	var dateStart;
	var dateSys;
	var dayCount;
	var timeParts;
	var depart,arrive;
	var transSet;
	var mapSet;
	var gtfs;
	var conf;
	var geoCoder;
	var batch;
	var opt;
	var taskList;
	var context;
	var fd;

	eval("fs=require('fs');");
	eval("sys=require('sys');");
//	eval("Iconv=require('iconv').Iconv;");  For future Shapefile support.
	eval("util=require('util');");

	opt=new gis.util.Opt({
		date:['D|date','DATE',null,'Start date in yyyy-mm-dd format, default today'],
		days:['days','COUNT',30,'Number of days to include in schedule'],
		inGTFS:['in-gtfs','FILE',null,'Input public transport data in Google Transit Feed Specification format'],
		inKalkati:['in-kalkati','FILE',null,'Input public transport data in Kalkati XML format'],
		outGTFSGeom:['out-gtfs-geom','FILE',null,'Output GTFS transit line geometry'],
		inGTFSGeom:['in-gtfs-geom','FILE',null,'Input GTFS transit line geometry'],
		outTransTemp:['out-tempt','FILE',null,'Output public transport data in human-readable intermediate format'],
		inTransTemp:['in-tempt','FILE',null,'Input public transport data in human-readable intermediate format'],
		outTrans:['out-trans','FILE',null,'Output public transport data in a squeezed package'],
		inTrans:['T|in-trans','FILE',null,'Input public transport data in a squeezed package'],
		mapRound:['map-round','INTEGER',2,'Bits of precision to discard in coordinate compression'],
		inPBF:['in-pbf','FILE',null,'Input OpenStreetMap data in Protocol Buffer format'],
		outMap:['out-map','FILE',null,'Output map data in a squeezed package'],
		inMap:['M|in-map','FILE',null,'Input map data in a squeezed package'],
		outOSM:['out-osm','FILE',null,'Output map data OpenStreetMap format'],
		compressMap:['compress-map','',null,'Compress map data harder'],
		bindTrans:['bind-trans','',null,'Bind public transport data with map data'],
		from:['f|from','PLACE',null,'Routing start location'],
		to:['t|to','PLACE',null,'Routing target location'],
		depart:['d|depart','TIME',null,'Routing departure time, default now'],
		arrive:['a|arrive','TIME',null,'Routing arrival time'],
		debug:['debug','',null,'Debug']
//      verbose:['v|verbose',null,null,'Print more details'],
//      stops:['stops','LIST',null,'Print cost of a predefined route'],
//      nostops:['nostops','LIST',null,'Disable some stops'],
    },[],'LocalRoute.js','v0.1.0');

	opt.parse(process.argv);
	dateSys=new Date();

	if(opt.def.date) {
		dateParts=opt.def.date.split('-');
		if(dateParts.length==3) dateStart=gis.util.Date.fromYMD(+dateParts[0],+dateParts[1],+dateParts[2]);
	} else {
		dateStart=gis.util.Date.fromYMD(dateSys.getFullYear(),dateSys.getMonth()+1,dateSys.getDate());
	}

	dayCount=opt.def.days;

	if(opt.def.depart) {
		timeParts=opt.def.depart.split(':');
		depart=new Date(dateStart.year,dateStart.month-1,dateStart.day,+timeParts[0],+timeParts[1],+timeParts[2]||0,0).getTime();
	} else if(opt.def.arrive) {
		timeParts=opt.def.arrive.split(':');
		arrive=new Date(dateStart.year,dateStart.month-1,dateStart.day,+timeParts[0],+timeParts[1],+timeParts[2]||0,0).getTime();
	} else {
		depart=new Date(dateStart.year,dateStart.month-1,dateStart.day,dateSys.getHours(),dateSys.getMinutes(),dateSys.getSeconds(),0).getTime();
	}

//	depart-=new Date((dateStart*1440+offset+720)*60000).getTimezoneOffset()*60000;

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
			eval("childProcess=require('child_process');");
			transSet=new reach.trans.TransSet(dateStart);
			gtfs=new reach.trans.GTFS(transSet);
			gtfs.importZip(opt.def.inGTFS,dateStart,dayCount,nextTask);
		});
	}

	if(opt.def.inKalkati) {
		taskList.push(function() {
			eval("childProcess=require('child_process');");
			eval("expat=require('node-expat');");
			nextTask();
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
			var stream;

			transSet=new reach.trans.TransSet();
			stream=new gis.io.PackStream(fs.readFileSync(opt.def.inTrans,'utf8'),null);
			transSet.importPack(stream);
			console.log('Transit data start '+transSet.date.toString());
			nextTask();
		});
	}

	if(opt.def.inGTFSGeom) {
		taskList.push(function() {
			var stream;

			stream=new gis.io.PackStream(fs.readFileSync(opt.def.inGTFSGeom,'utf8'),null);
			transSet.shapeSet.importPack(stream,transSet.seqSet);
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
			var stream;

			fd=fs.openSync(opt.def.outTrans,'w');
			stream=new gis.io.PackStream(null,write);
			transSet.exportPack(stream);
			fs.closeSync(fd);
			nextTask();
		});
	}

	if(opt.def.outGTFSGeom) {
		taskList.push(function() {
			var stream;

			fd=fs.openSync(opt.def.outGTFSGeom,'w');
			stream=new gis.io.PackStream(null,write);
			transSet.shapeSet.exportPack(stream,+opt.def.mapRound);
			fs.closeSync(fd);
		});
	}

	// Map input.

	if(opt.def.inPBF) {
		taskList.push(function() {
			var maxWalk;
			var stopList;
			var stopNum,stopCount;
			var ll,sw,ne;
			var pbf;

			eval("Schema=require('protobuf').Schema;");
			eval("zlib=require('zlib');");
			mapSet=new gis.osm.MapSet();
			pbf=new gis.osm.PBF(mapSet);

			maxWalk=2000;
			stopList=transSet.stopSet.list;
			stopCount=stopList.length;

			for(stopNum=0;stopNum<stopCount;stopNum++) {
				ll=stopList[stopNum].ll;

				sw=ll.offset(-maxWalk,-maxWalk).toDeg();
				ne=ll.offset(maxWalk,maxWalk).toDeg();

				pbf.addMask(sw,ne);
			}

			pbf.importPBF(opt.def.inPBF,nextTask);
		});
	}

	if(opt.def.inMap) {
		taskList.push(function() {
			var stream;

			mapSet=new gis.osm.MapSet();
			stream=new gis.io.PackStream(fs.readFileSync(opt.def.inMap,'utf8'),null);
			mapSet.importPack(stream);
			nextTask();
		});
	}

	// Processing.

	if(opt.def.compressMap) {
		taskList.push(function() {
			mapSet.optimize(false);
			mapSet.waySet.simplify(2,2);

			mapSet.waySet.prepareTree();

			mapSet.waySet.findLanes(20,15);
			mapSet.waySet.mergeLanes(mapSet.nodeSet);

			mapSet.optimize(false);
			mapSet.waySet.calcDist();
			mapSet.optimize(true);
			nextTask();
		});
	}

	if(opt.def.bindTrans) {
		taskList.push(function() {
			var geomSet;

			geomSet=new reach.route.GeomSet();
			geomSet.prepareTree(transSet.shapeSet.list);
/*
			var seqList;
			var seqNum,seqCount;
			var seq;

			seqList=transSet.seqSet.list;
			seqCount=seqList.length;

			fd=fs.openSync('shape.txt','w');
			stream=new gis.io.PackStream(null,write);

			for(seqNum=0;seqNum<seqCount;seqNum++) {
				seq=seqList[seqNum];
				console.log(seqNum+' '+seq.shapeList.length+' '+(seq.shapeList.length?seq.shapeList[0].seqList.length:''));
				if(seq.shapeList.length) seq.shapeList[0].exportPack(stream,+opt.def.mapRound);
			}

			fs.closeSync(fd);
*/
		});
	}

	// Routing.

	if(opt.def.from) {
		taskList.push(function() {
			var stopNum;
			var wayNum;
			var dataPtr;

			conf=new reach.route.Conf();
			wayNum=0;
			dataPtr=0;

			// Load transit departures around desired departure time.
			if(transSet) {
				transSet.prepare(depart-4*60*60000,depart+8*60*60000);
			}

			mapSet.waySet.prepareTree();

			geoCoder=new reach.route.GeoCoder(mapSet,transSet);
			batch=new reach.route.Batch(mapSet,geoCoder,transSet);
			batch.prepareAccess(conf);

			mapSet.waySet.forWays(function(way) {
				way.calcDist();
			});

			if(transSet) {
				batch.bindStops(transSet.stopSet,conf);
				batch.prepareRefs(transSet,conf);
			}

			batch.run(geoCoder.find(opt.def.from),conf,depart);

			nextTask();
		});
	}

	if(opt.def.to) {
		taskList.push(function() {
			batch.getRoute(geoCoder.find(opt.def.to),conf,batch.dijkstra.result);

			nextTask();
		});
	}

	// Map output.

	if(opt.def.outMap) {
		taskList.push(function() {
			var stream;

			fd=fs.openSync(opt.def.outMap,'w');
			stream=new gis.io.PackStream(null,write);
			mapSet.waySet.detail=+opt.def.mapRound;
			mapSet.exportPack(stream);
			fs.closeSync(fd);
			nextTask();
		});
	}

	if(opt.def.outOSM) {
		taskList.push(function() {
			fd=fs.openSync(opt.def.outOSM,'w');
			mapSet.waySet.exportOSM(write,mapSet.profileSet);
			fs.closeSync(fd);
			nextTask();
		});
	}

/*
		taskList.push(function() {
			var seqList;
			var seqNum,seqCount;
			var seq;
			var stopList;
			var stopNum,stopCount;
			var stop;
			var deg;

			transSet.prepare(new Date().getTime()-86400*1000*50,new Date().getTime()-86400*1000*30);
			seqList=transSet.seqSet.list;
			seqCount=seqList.length;
			for(seqNum=0;seqNum<seqCount;seqNum++) {
				seq=seqList[seqNum];
				stopList=seq.stopList;
				stopCount=stopList.length;
				if(!seq.tripList.length) continue;
				console.log(seq.tripList[0].key.shortCode+'\t'+seq.tripList[0].key.name);

				for(stopNum=0;stopNum<stopCount;stopNum++) {
					stop=stopList[stopNum];
					deg=stop.ll.toDeg();
					console.log(deg.llat+'\t'+deg.llon+'\t'+stop.name);
				}
			}
			nextTask();
		});
*/

	nextTask();

	if(opt.def.debug) {
		// Useful for debugging:
		context=require('repl').start('> ').context;
		context.gis=gis;
		context.reach=reach;
		context.transSet=transSet;
		context.mapSet=mapSet;
	}
}

if(typeof(process)!='undefined' && process.argv && typeof(process.argv[1])=='string' && process.argv[1].match(/(^|[/])lr.js$/)) {
	initNode();
}
