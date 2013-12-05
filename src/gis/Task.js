goog.provide('gis.Task');

/** @constructor
  * @param {string} name
  * @param {function(gis.Task=):?function()} init */
gis.Task=function(name,init) {
	/** @type {string} */
	this.name=name;
	/** @type {function(gis.Task=):?function()} */
	this.init=init;

	/** @type {gis.Task.State} */
	this.state=gis.Task.State.NONE;

	/** @type {gis.control.Dispatch} */
	this.dispatch;

	/** @type {Array.<gis.Task>} */
	this.depList=[];
	/** @type {Array.<gis.Task>} */
	this.nextList=[];
};

/** @enum {number} */
gis.Task.State={
	NONE:0,
	BUSY:1,
	WAIT:2,
	DONE:3
};

gis.Task.prototype.wait=function() {
	if(!this.dispatch) return;

	this.dispatch.block(this);
};

/** @param {*=} result */
gis.Task.prototype.success=function(result) {
	if(!this.dispatch) return;

//console.log('success2 '+!!result);
	this.dispatch.success(this,result);
};

gis.Task.prototype.and=function() {
	var argNum,argCount;
	var task;

	if(!this.dispatch) return;

	task=new gis.Task();
	this.dispatch.when(this,task);
	argCount=arguments.length;

	for(argNum=0;argNum<argCount;argNum++) {
		this.dispatch.when(arguments[argNum],task);
	}

	return(task);
};

/** @param {function(gis.Task,*=)} next */
gis.Task.prototype.then=function(next) {
	if(!this.dispatch) return;

	if(!next.then) next=new gis.Task('',next);
	return(this.dispatch.when(this,next));
};
