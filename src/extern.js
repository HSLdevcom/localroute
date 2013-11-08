/*
	This file is part of LocalRoute.js.

	Written in 2012, 2013 by Juha Järvi

	To the extent possible under law, the author(s) have dedicated all
	copyright and related and neighboring rights to this software to the
	public domain worldwide. This software is distributed without any
	warranty.

	You should have received a copy of the CC0 Public Domain Dedication
	along with this software. If not, see
	<http://creativecommons.org/publicdomain/zero/1.0/>.
*/

/** @type {Object} */
var console={
	/** @param {string} txt */
	log:function(txt) {}
};

/** @type {Object} */
var global={
	/** @param {*=} arg
	  * @return {*} */
	yield:function(arg) {}
};

/** @type {Object} */
window.opera={
	/** @return {number} */
	version:function() {}
};

/** @constructor */
function FileDescriptor() {}

/** @constructor */
function Buffer() {}

/** @param {*} buf
  * @return {boolean} */
Buffer.isBuffer=function(buf) {};

/** @param {string=} enc
  * @return {string} */
Buffer.prototype.toString=function(enc) {};

/** @constructor */
function Stream() {}

/** @param {string} evt
  * @param {function(*)} handler */
Stream.prototype.on=function(evt,handler) {};

/** @param {Stream} stream */
Stream.prototype.pipe=function(stream) {};

/** @param {*} data
  * @return {boolean} */
Stream.prototype.push=function(data) {};

/** @constructor
  * @extends {Stream} */
Stream.Transform=function() {}

/** @type {Object} */
Stream.Transform.prototype._readableState={
	objectMode:false
};

/** @param {function(*=)} func
  * @return {Fiber.Fiber} */
function Fiber(func) {}

/** @constructor */
Fiber.Fiber=function() {};

/** @param {*=} arg */
Fiber.Fiber.prototype.run=function(arg) {};

/** @type {Fiber.Fiber} */
Fiber.current;

/** @constructor */
function Child() {}

/** @type {Stream} */
Child.prototype.stdout;

/** @type {Object} */
var util={
	/** @param {*} child
	  * @param {*} parent */
	inherits:function(child,parent) {}
};

/** @type {Object} */
var fs={
	/** @param {string} path
	  * @return {Stream} */
	createReadStream:function(path) {},
	/** @param {string} path
	  * @param {string} enc
	  * @param {function({errno:number,code:string,path:string},string)} handler
	  * @return {string} */
	readFile:function(path,enc,handler) {},
	/** @param {string} path
	  * @param {string=} enc
	  * @return {NodeBuffer|string} */
	readFileSync:function(path,enc) {},
	/** @param {string} path
	  * @param {string} mode
	  * @return {FileDescriptor} */
	openSync:function(path,mode) {},
	/** @param {FileDescriptor} fd
	  * @param {string} txt
	  * @param {?number=} pos
	  * @param {string=} enc */
	writeSync:function(fd,txt,pos,enc) {},
	/** @param {FileDescriptor} fd */
	closeSync:function(fd) {},
	/** @param {string} path
	  * @return {NodeStat} */
	statSync:function(path) {}
};

/** @type {Object} */
var childProcess={
	/** @param {string} path
	  * @param {Array.<string>} args
	  * @return {Child} */
	spawn:function(path,args) {}
};

/** @type {Object} */
var sqlite3={};

/** @constructor
  * @param {string} name
  * @param {number} mode */
sqlite3.Database=function(name,mode) {};

/** @param {...*} args */
sqlite3.Database.prototype.each=function(args) {};

/** @type {number} */
sqlite3.OPEN_READONLY;

/** @type {Object} */
var process={
	/** @type {Array.<string>} */
	argv:[],
	/** @type {Object} */
	versions:{
		v8:{},
		/** @type {Object} */
		node:{}
	},

	/** @return {Object.<string,number>} */
	memoryUsage:function() {},

	exit:function() {}
}

/** @type {Object.<string,*>} */
var searchConf;
var extra;

var winExport;

/** @type {Object} */
var Proj4js={
	/** @type {Object.<string,string>} */
	defs:{},
	/** @param {Proj4js.Proj} src
	  * @param {Proj4js.Proj} dst
	  * @param {Proj4js.Point} pt
	  * @return {Proj4js.Point} */
	transform:function(src,dst,pt) {}
};

/** @constructor
  * @param {string} srid */
Proj4js.Proj=function(srid) {};

/** @constructor
  * @param {number} x
  * @param {number} y */
Proj4js.Point=function(x,y) {};

/** @type {number} */
Proj4js.Point.prototype.x;

/** @type {number} */
Proj4js.Point.prototype.y;

/** @param {string} path
  * @return {Object} */
var require=function(path) {};

require.main={
	filename:''
};

/** @type {Object} */
var path={
	/** @type {function(string,string):string} */
	resolve:function(path1,path2) {},
	/** @type {function(string):string} */
	dirname:function(path) {}
};

/** @constructor
  * @param {string} src
  * @param {string} dst */
var Iconv=function(src,dst) {};

/** @param {string} buf
  * @return {string} */
Iconv.prototype.convert=function(buf) {};

/** @type {Object} */
var OpenLayers={
	/** @constructor
	  * @param {number} left
	  * @param {number} bottom
	  * @param {number} right
	  * @param {number} top */
	Bounds:function(left,bottom,right,top) {},
	Control:{
		/** @constructor */
		Base:function() {},
		/** @constructor
		  * @extends {OpenLayers.Control.Base} */
		MousePosition:function() {},
		/** @constructor
		  * @extends {OpenLayers.Control.Base} */
		LayerSwitcher:function() {},
		/** @constructor
		  * @extends {OpenLayers.Control.Base}
		  * @param {Object.<string,*>} args */
		Navigation:function(args) {},
		/** @constructor
		  * @extends {OpenLayers.Control.Base}
		  * @param {Object.<string,*>} args */
		PanZoomBar:function(args) {},
		/** @constructor
		  * @extends {OpenLayers.Control.Base}
		  * @param {Object.<string,*>} args */
		ScaleLine:function(args) {},
		/** @constructor
		  * @extends {OpenLayers.Control.Base}
		  * @param {OpenLayers.Layer.Base} layer
		  * @param {Object.<string,*>} args */
		DragFeature:function(layer,args) {}
	},
	Feature:{
		/** @constructor */
		Base:function() {},
		/** @constructor
		  * @extends {OpenLayers.Feature.Base}
		  * @param {OpenLayers.Geometry.Base} geom
		  * @param {Object.<string,*>} args
		  * @param {Object.<string,*>} style */
		Vector:function(geom,args,style) {}
	},
	Geometry:{
		/** @constructor */
		Base:function() {},
		/** @constructor
		  * @extends {OpenLayers.Geometry.Base}
		  * @param {number} lon
		  * @param {number} lat */
		Point:function(lon,lat) {},
		/** @constructor
		  * @extends {OpenLayers.Geometry.Base}
		  * @param {Array.<OpenLayers.Geometry.Point>} pts */
		LineString:function(pts) {},
		/** @constructor
		  * @extends {OpenLayers.Geometry.Base} */
		Polygon:function() {}
	},
	Layer:{
		/** @constructor */
		Base:function() {},
		/** @constructor
		  * @extends {OpenLayers.Layer.Base}
		  * @param {string} name
		  * @param {string} url
		  * @param {Object.<string,*>} args */
		XYZ:function(name,url,args) {},
		/** @constructor
		  * @extends {OpenLayers.Layer.Base}
		  * @param {string} name */
		Boxes:function(name) {},
		/** @constructor
		  * @extends {OpenLayers.Layer.Base}
		  * @param {string} name
		  * @param {Object.<string,*>} args */
		Vector:function(name,args) {}
	},
	/** @constructor
	  * @param {number} lon
	  * @param {number} lat */
	LonLat:function(lon,lat) {},
	/** @constructor
	  * @param {string} name
	  * @param {Object.<string,*>} args */
	Map:function(name,args) {},
	Marker:{
	/** @constructor
	  * @param {OpenLayers.Bounds} bounds */
		Box:function(bounds) {}
	},
	/** @constructor
	  * @param {string} name */
	Projection:function(name) {},
	/** @constructor */
	Tile:function() {}
};

/** @type {OpenLayers.Bounds} */
OpenLayers.Layer.Base.prototype.maxExtent;
OpenLayers.Layer.Base.prototype.redraw=function() {};
OpenLayers.Layer.Vector.prototype.removeAllFeatures=function() {};
/** @param {Array.<OpenLayers.Feature.Base>} featureList */
OpenLayers.Layer.Vector.prototype.addFeatures=function(featureList) {};

/** @param {number} z */
OpenLayers.Layer.Base.prototype.setZIndex=function(z) {};

/** @type {Object} */
OpenLayers.Marker.Box.events={
	/** @param {string} type
	  * @param {function()} handler */
	register:function(type,obj,handler) {}
};

/** @param {string} color
  * @param {number} width */
OpenLayers.Marker.Box.prototype.setBorder=function(color,width) {};

/** @param {OpenLayers.Layer.Base} layer */
OpenLayers.Map.prototype.addLayer=function(layer) {};
/** @param {Array.<OpenLayers.Layer.Base>} layerList */
OpenLayers.Map.prototype.addLayers=function(layerList) {};
/** @param {OpenLayers.LonLat} ll
  * @param {number} zoom */
OpenLayers.Map.prototype.setCenter=function(ll,zoom) {};
/** @return {number} */
OpenLayers.Map.prototype.getZoom=function() {};
/** @param {OpenLayers.Control.Base} control */
OpenLayers.Map.prototype.addControl=function(control) {};
/** @param {OpenLayers.Layer.Base} layer */
OpenLayers.Map.prototype.raiseLayer=function(layer) {};
/** @type {Array.<OpenLayers.Layer.Base>} */
OpenLayers.Map.prototype.layers;
/** @param {Array.<number>} list
  * @return {OpenLayers.Bounds} */
OpenLayers.Bounds.fromArray=function(list) {};

OpenLayers.Control.DragFeature.prototype.activate=function() {};

/** @type {Object.<string,string>} */
OpenLayers.Feature.Vector.style;
/** @type {OpenLayers.Geometry.Base} */
OpenLayers.Feature.Vector.prototype.geometry;

/** @type {number} */
OpenLayers.Geometry.LonLat.prototype.lat;
/** @type {number} */
OpenLayers.Geometry.LonLat.prototype.lon;

/** @type {number} */
OpenLayers.Geometry.Point.prototype.x;
/** @type {number} */
OpenLayers.Geometry.Point.prototype.y;

/** @param {OpenLayers.Geometry.Point} pos
  * @param {number} size
  * @param {number} corners
  * @return {OpenLayers.Geometry.Polygon} */
OpenLayers.Geometry.Polygon.createRegularPolygon=function(pos,size,corners) {};

/** @param {OpenLayers.Marker.Box} box */
OpenLayers.Layer.Boxes.prototype.addMarker=function(box) {};
/** @param {OpenLayers.Marker.Box} box */
OpenLayers.Layer.Boxes.prototype.removeMarker=function(box) {};

/** @param {OpenLayers.Bounds} area
  * @return {OpenLayers.Size} */
OpenLayers.Layer.XYZ.prototype.getImageSize=function(area) {};
/** @type {HTMLDivElement} */
OpenLayers.Layer.XYZ.prototype.div;

/** @type {number} */
OpenLayers.Bounds.prototype.left;
/** @type {number} */
OpenLayers.Bounds.prototype.bottom;
/** @type {number} */
OpenLayers.Bounds.prototype.right;
/** @type {number} */
OpenLayers.Bounds.prototype.top;

/** @return {HTMLImageElement} */
OpenLayers.Tile.prototype.getImage=function() {};
/** @type {OpenLayers.Bounds} */
OpenLayers.Tile.prototype.bounds;
/** @type {boolean} */
OpenLayers.Tile.prototype.frame;
/** @type {OpenLayers.Layer.XYZ} */
OpenLayers.Tile.prototype.layer;
/** @type {OpenLayers.Size} */
OpenLayers.Tile.prototype.size;
/** @type {string} */
OpenLayers.Tile.prototype.id;
// type {Array.<HTMLCanvasElement>}
//OpenLayers.Tile.prototype.customCanvasList;
/** @type {{x:number,y:number}} */
OpenLayers.Tile.prototype.position;

/** @constructor */
OpenLayers.Size=function() {};
/** @type {number} */
OpenLayers.Size.prototype.w;
/** @type {number} */
OpenLayers.Size.prototype.h;

/** @type {HTMLCanvasElement} jjrv */
OpenLayers.Tile.prototype.customCanvas;

/** @type {OpenLayers.Layer.XYZ} */
OpenLayers.Tile.prototype.layer;

/** @constructor */
var WorkerEvent=function() {};

/** @type {*} */
WorkerEvent.prototype.data;

/** @constructor
  * @extends {Worker}
  * @param {string} path */
var WWorker=function(path) {};

/** @param {MessageEvent|WorkerEvent} evt */
WWorker.prototype.onmessage=function(evt) {};

/** @param {*} msg */
WWorker.prototype.postMessage=function(msg) {};

window.gc=function() {};

/** @type {number} */
window.performance.memory.usedJSHeapSize;

global.gc=function() {};

/** @type {Object} */
var G_vmlCanvasManager={
	/** @param {HTMLCanvasElement} elem */
	initElement:function(elem) {}
};

/** @constructor */
var pgQuery=function() {};

/** @param {string} evt
  * @param {function(*)} handler */
pgQuery.prototype.on=function(evt,handler) {};

/** @type {Object} */
var pg={
	/** @constructor */
	Client:function(conn) {}
};

pg.Client.prototype.connect=function() {};

/** @param {string} sql
  * @return {pgQuery} */
pg.Client.prototype.query=function(sql) {};

pg.Client.prototype.end=function() {};

/** @constructor */
var NodeBuffer=function() {};

/** @param {number} pos
  * @return {number} */
NodeBuffer.prototype.readUInt8=function(pos) {};

/** @param {number} pos
  * @return {number} */
NodeBuffer.prototype.readUInt16LE=function(pos) {};

/** @param {number} pos
  * @return {number} */
NodeBuffer.prototype.readUInt16BE=function(pos) {};

/** @param {number} pos
  * @return {number} */
NodeBuffer.prototype.readUInt32LE=function(pos) {};

/** @param {number} pos
  * @return {number} */
NodeBuffer.prototype.readUInt32BE=function(pos) {};

/** @param {number} pos
  * @return {number} */
NodeBuffer.prototype.readFloatLE=function(pos) {};

/** @param {number} pos
  * @return {number} */
NodeBuffer.prototype.readFloatBE=function(pos) {};

/** @param {number} pos
  * @return {number} */
NodeBuffer.prototype.readDoubleLE=function(pos) {};

/** @param {number} pos
  * @return {number} */
NodeBuffer.prototype.readDoubleBE=function(pos) {};

/** @constructor */
var NodeStat=function() {};

/** @type {number} */
NodeStat.prototype.size;

/** @typedef {Object.<string,Array.<string>>} */
var Primitive;

/** @typedef {Array.<Primitive>} */
var PrimitiveList;

/** @typedef {Primitive|PrimitiveList} */
var PrimitiveGroup;

/** @typedef {{granularity:number,stringtable:{s:Array.<Buffer>},primitivegroup:Array.<Object.<string,PrimitiveGroup>>}} */
var PrimitiveBlock;

/** @constructor */
var PrimitiveBlockParser=function() {};

/** @param {Buffer} data
  * @return {PrimitiveBlock} */
PrimitiveBlockParser.prototype.parse=function(data) {};
