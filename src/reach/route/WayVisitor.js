goog.provide('reach.route.WayVisitor');
goog.require('reach.route.Visitor');
goog.require('gis.osm.Way');

/** @constructor
  * @extends {reach.route.Visitor} */
reach.route.WayVisitor=function() {
	reach.route.Visitor.call(this);

	/** @type {gis.osm.Way} */
	this.way;
	/** @type {number} */
	this.pos;
	/** @type {number} */
	this.cost;
	/** @type {number} */
	this.time;
	/** @type {number} */
	this.access;

	/** @type {reach.route.WayVisitor} */
	this.next;
};

gis.inherit(reach.route.WayVisitor,reach.route.Visitor);

/** @type {reach.route.WayVisitor} */
reach.route.WayVisitor.freeItem=null;

/** @param {reach.route.Dijkstra} dijkstra
  * @param {gis.osm.Way} way
  * @param {number} pos
  * @param {number} delta
  * @param {number} cost
  * @param {number} time
  * @param {number} src
  * @return {reach.route.WayVisitor} */
reach.route.WayVisitor.create=function(dijkstra,way,pos,delta,cost,time,src) {
	var self;

	self=reach.route.WayVisitor.freeItem;
	if(self) reach.route.WayVisitor.freeItem=self.next;
	else {
		self=new reach.route.WayVisitor();
	}

	self.way=way;
	self.pos=pos;
	self.delta=delta;
	self.cost=cost;
	self.time=time;
	self.src=src;
	self.access=dijkstra.conf.profileAccessList[way.profile.id];

	return(self);
};

reach.route.WayVisitor.prototype.free=function() {
	this.next=reach.route.WayVisitor.freeItem;
	reach.route.WayVisitor.freeItem=this;
	return(reach.route.Visitor.State.OK);
};

/** @param {reach.route.Dijkstra} dijkstra */
reach.route.WayVisitor.prototype.visit=function(dijkstra) {
	var way,other;
	var pos,posOther;
	var cost,costDelta,time;
	var src;
	var dataPtr;
	var dist;
	var conf;
	var node;
	var posList;
	var wayList;
	var wayNum,wayCount;
	var access;

	way=this.way;
	pos=this.pos;
	cost=this.cost;
	dataPtr=way.dataPtr+pos;

	if(dijkstra.costList[dataPtr] && dijkstra.costList[dataPtr]<=cost) return(this.free());
//globalFoo++;
//if(way.name) console.log(way.name);

	dijkstra.costList[dataPtr]=cost;
	dijkstra.srcList[dataPtr]=src;

	if(this.delta>0) {
		pos++;
		if(pos>=way.nodeList.length) return(this.free());
		dist=way.nodeDistList[pos]-way.nodeDistList[pos-1];
	} else {
		pos--;
		if(pos<0) return(this.free());
		dist=way.nodeDistList[pos+1]-way.nodeDistList[pos];
	}

	src=(way.iterId*0x1000000+pos)*4+reach.route.Visitor.Src.WAY;

	conf=dijkstra.conf;
	costDelta=dist*conf.walkCostPerM/this.access;
	if(costDelta<1) costDelta=1;
	cost+=costDelta;
	time+=dist*conf.walkTimePerM;

	node=way.nodeList[pos];
	posList=node.posList;
	wayList=node.wayList;
	wayCount=wayList.length;

	for(wayNum=0;wayNum<wayCount;wayNum++) {
		other=wayList[wayNum];
		posOther=posList[wayNum];
		access=conf.profileAccessList[other.profile.id];
		if(other==way && posOther==pos || !access) continue;

		dijkstra.found(reach.route.WayVisitor.create(dijkstra,other,posOther,-1,cost,time,src));
		dijkstra.found(reach.route.WayVisitor.create(dijkstra,other,posOther,1,cost,time,src));
	}

	this.pos=pos;
	this.cost=cost;
	this.time=time;
	this.src=src;

	dijkstra.found(this);

	return(reach.route.Visitor.State.OK);
};
