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

goog.provide('reach.route.Batch');
goog.require('gis.Obj');
goog.require('reach.route.GeoCoder');
goog.require('reach.route.Conf');
goog.require('reach.route.Dijkstra');

/** @constructor
  * @param {gis.osm.MapSet} mapSet */
reach.route.Batch=function(mapSet,geoCoder,transSet) {
    /** @type {gis.osm.MapSet} */
    this.mapSet=mapSet;
    /** @type {gis.osm.TransSet} */
    this.transSet=transSet;

	/** @type {reach.route.GeoCoder} */
	this.geoCoder=geoCoder;

	/** @type {reach.route.Dijkstra} */
	this.dijkstra=new reach.route.Dijkstra();

//	this.precalcResult;
};

reach.route.Batch.prototype.prepareAccess=function(conf) {
	var profileAccessList;
	var profileList;
	var	profileNum,profileCount;
	var profile;
	var flag;

	profileAccessList=[];
	profileList=this.mapSet.profileSet.wayProfileList;
	profileCount=profileList.length;

	for(profileNum=0;profileNum<profileCount;profileNum++) {
		profile=profileList[profileNum];
		profile.id=profileNum;

		if(profile.access&gis.osm.ProfileSet.access.FOOT) {
			if(profile.limit&gis.osm.ProfileSet.access.FOOT) flag=0.5;
			else flag=1;
		} else flag=0;

		profileAccessList[profileNum]=flag;
	}

	conf.profileAccessList=profileAccessList;
};

/** @param {reach.loc.Location} locFrom */
reach.route.Batch.prototype.run=function(locFrom,conf,time) {
	this.dijkstra.start([locFrom],conf,time);

	while(!this.dijkstra.step()) {}
};

reach.route.Batch.prototype.preCalc=function(locFrom,conf,depart) {
	var dijkstra;

	// Load transit departures around desired departure time.
	if(this.transSet) {
		this.transSet.prepare(depart-4*60*60000,depart+8*60*60000);
	}

	dijkstra=this.dijkstra;
	dijkstra.start([locFrom],conf,depart);

	while(!dijkstra.step()) {}

	return(dijkstra.result);
};

/** @param {reach.trans.StopSet} stopSet
  * @param {reach.route.Conf} conf */
reach.route.Batch.prototype.bindStops=function(stopSet,conf) {
	var mapSet;
	var stopNum;

	mapSet=this.mapSet;
	mapSet.waySet.clearMarks();
	stopNum=0;

	stopSet.forStops(
		/** @param {reach.trans.Stop} stop */
		function(stop) {
			var loc;
			var refList;
			var refNum,refCount;
			var ref;
			var way;

			loc=new reach.loc.Outdoor(stop.ll,mapSet);
			refList=loc.getNodes(conf);
			refCount=refList.length;

			if(!refCount) {
//				console.log('Failed to bind stop '+stop.name);
				return;
			}

			for(refNum=0;refNum<refCount;refNum++) {
				ref=refList[refNum];
				way=ref.way;
				node=ref.node;
				if(!node.stopRefList) node.stopRefList=[];
				node.stopRefList.push({stop:stop,dist:ref.dist});

				if(!stop.nodeRefList) stop.nodeRefList=[];
				stop.nodeRefList.push(ref);
/*
//if(stop==stopSet.list[416]) {
if(way==mapSet.waySet[31073]) {
console.log(stop);
console.log(way);
}
*/
			}
		}
	);

	mapSet.iterId=stopNum+1;
};

/** @param {reach.trans.TransSet} transSet
  * @param {reach.route.Conf} conf */
reach.route.Batch.prototype.prepareRefs=function(transSet,conf) {
	var mapSet;
	var wayNum;
	var dataPtr;

	mapSet=this.mapSet;
	wayNum=0;
	dataPtr=0;

	conf.ptrWayFirst=dataPtr;

	mapSet.waySet.forWays(function(way) {
		way.getNodes();

		way.iterId=wayNum++;
		way.dataPtr=dataPtr;

		dataPtr+=way.nodeList.length;
	});

	conf.ptrWayLast=dataPtr-1;

	if(transSet) {
		conf.ptrStopFirst=dataPtr;

		transSet.stopSet.forStops(
			/** @param {reach.trans.Stop} stop */
			function(stop) {
				stop.dataPtr=dataPtr++;
			}
		);

		conf.ptrStopLast=dataPtr-1;
		conf.ptrSeqFirst=dataPtr;

		transSet.seqSet.forSeqs(
			/** @param {reach.trans.Seq} seq */
			function(seq) {
				seq.dataPtr=dataPtr;
				dataPtr+=seq.stopList.length;
			}
		);

		conf.ptrSeqLast=dataPtr-1;
	}
};

/** @param {reach.loc.Location} locTo */
reach.route.Batch.prototype.getRoute=function(locTo,conf,result) {
	var locTo;
	var refList;
	var refNum,refCount;
	var ref,refBest;
	var cost,costBest;
	var srcList;
	var timeList;
	var legList;
	var leg;
	var ptList;
	var mode;
	var way;
	var pos,pos2;
	var node;
	var wayList;
	var wayNum,wayCount;
	var way;
	var stopRefList;
	var stop;
	var seqList;
	var seqNum,seqCount;
	var deg;
	var json;

	refList=locTo.getNodes(conf);
	refCount=refList.length;
	costBest=0;

	for(refNum=0;refNum<refCount;refNum++) {
		ref=refList[refNum];

		cost=result.costList[ref.way.dataPtr+ref.pos];
		if(!cost) continue;

		cost+=ref.dist*conf.walkCostPerM;
		if(!costBest || cost<costBest) {
			costBest=cost;
			refBest=ref;
		}
	}

	legList=[];
	if(!refBest) return(legList);
	leg=null;

	srcList=result.srcList;
	timeList=result.timeList;

	mode='w';
	way=refBest.way;
	pos=refBest.pos;

	while(1) {
		if(mode=='w') {
//console.log(mode+' '+(way.dataPtr+pos));
			if(!leg) {
				leg={
					'mode':'WALK',
					'routeType':null,
					'route':''
				};
				leg['endTime']=timeList[way.dataPtr+pos];
				legList.push(leg);
				ptList=[];
			}

//			console.log(pos+'\t'+way.name);
			deg=way.nodeList[pos].ll.toDeg();
			ptList.push([deg.llat*100000,deg.llon*100000]);

			src=srcList[way.dataPtr+pos];
			if(src>=way.dataPtr && src<way.dataPtr+way.nodeCount) {
				// Stay on the same road.
				pos=src-way.dataPtr;
			} else if(src>=conf.ptrWayFirst && src<=conf.ptrWayLast) {
//console.log((way.dataPtr+pos)+' w->w '+src);
				node=way.nodeList[pos];
				wayList=node.wayList;
				wayCount=wayList.length;

				for(wayNum=0;wayNum<wayCount;wayNum++) {
					way=wayList[wayNum];
//					if(src==way.dataPtr+node.posList[wayNum]) break; Doesn't work because src is not at the intersection.
					if(src>=way.dataPtr && src<way.dataPtr+way.nodeList.length) break;
				}

				if(wayNum>=wayCount) return(null);

				pos=src-way.dataPtr;
			} else if(src>=conf.ptrStopFirst && src<=conf.ptrStopLast) {
//console.log((way.dataPtr+pos)+' w->s '+src);
				leg['startTime']=timeList[way.dataPtr+pos];
				leg['duration']=leg['endTime']-leg['startTime'];
				leg['legGeometry']={'points':ptList.reverse()};

				stopRefList=way.nodeList[pos].stopRefList;
				refCount=stopRefList.length;

				for(refNum=0;refNum<refCount;refNum++) {
					stop=stopRefList[refNum].stop;
					if(stop.dataPtr==src) break;
				}

				if(refNum>=refCount) return(null);

				leg=null;
				mode='s';
			} else {
				leg['startTime']=timeList[way.dataPtr+pos];
				leg['duration']=leg['endTime']-leg['startTime'];
				leg['legGeometry']={'points':ptList.reverse()};

				break;
			}
		} else if(mode=='s') {
//console.log(mode+' '+stop.dataPtr);
			console.log(stop.name);
			src=srcList[stop.dataPtr];

			if(src>=conf.ptrSeqFirst && src<=conf.ptrSeqLast) {
//console.log(stop.dataPtr+' s->t '+src);
				seqList=stop.seqList;
				seqCount=seqList.length;

				for(seqNum=0;seqNum<seqCount;seqNum++) {
					seq=seqList[seqNum];
					if(src>=seq.dataPtr && src<seq.dataPtr+seq.stopList.length) break;
				}

				if(seqNum>=seqCount) return(null);

				pos=stop.posList[seqNum];
				trip=seq.tripList[srcList[seq.dataPtr+pos]];

				if(!leg) {
					leg={
						'mode':'BUS',
						'routeType':3,
						'route':trip.key.shortCode,
						'routeId':trip.key.shortCode
					};

					deg=stop.ll.toDeg();
					leg['to']={
						'lat':deg.llat,
						'lon':deg.llon,
						'name':stop.name,
						'stop':stop
					};

					leg['endTime']=seq.stampList[srcList[seq.dataPtr+pos]]+trip.timeList[pos]*1000;
					legList.push(leg);
					ptList=[];
				}

				pos2=src-seq.dataPtr;
				while(1) {
					deg=stop.ll.toDeg();
					ptList.push([deg.llat*100000,deg.llon*100000]);
					if(pos==pos2) break;
					pos--;
					stop=seq.stopList[pos];
				}

//				console.log(trip.key.shortCode+' '+trip.key.sign);
//				pos=src-seq.dataPtr;
//				stop=seq.stopList[pos];

				deg=stop.ll.toDeg();
				leg['from']={
					'lat':deg.llat,
					'lon':deg.llon,
					'name':stop.name,
					'stop':stop
				};

				leg['startTime']=seq.stampList[srcList[seq.dataPtr+pos]]+trip.timeList[pos]*1000;
				leg['duration']=leg['endTime']-leg['startTime'];
				leg['legGeometry']={'points':ptList.reverse()};

				leg=null;
			} else if(src>=conf.ptrWayFirst && src<=conf.ptrWayLast) {
//console.log(stop.dataPtr+' s->w '+src);
				nodeRefList=stop.nodeRefList;
				refCount=nodeRefList.length;

				// TODO: Here we check all ways connected to the stop's nearest node.
				// Instead the stop's source should be set to the correct way directly, maybe by removing stoprefs from nodes and putting
				// them into ways.
foo:
				for(refNum=0;refNum<refCount;refNum++) {
					way=nodeRefList[refNum].way;
					pos=nodeRefList[refNum].pos;
					node=way.nodeList[pos];

					wayList=node.wayList;
					wayCount=wayList.length;

					for(wayNum=0;wayNum<wayCount;wayNum++) {
						way=wayList[wayNum];
						if(src>=way.dataPtr && src<way.dataPtr+way.nodeList.length) {
							pos=src-way.dataPtr;
							break foo;
						}
					}

					// TODO: this line should replace the loop above if stop's source was set to the correct way.
//					if(src==way.dataPtr+pos) break;
				}

				if(refNum>=refCount) return(null);

//				pos=nodeRefList[refNum].pos;
console.log(way.nodeList[pos].ll.toDeg());
				mode='w';
			} else {
				break;
			}
		}
	}

	legList.reverse();
//	console.log(legList);

	json={
		'startTime':legList[0]['startTime'],
		'duration':legList[legList.length-1]['endTime']-legList[0]['startTime'],
		'legs':legList
	};

	console.log('ROUTE:');
	console.log(json);
	console.log(legList.length);

	return(json);
};
