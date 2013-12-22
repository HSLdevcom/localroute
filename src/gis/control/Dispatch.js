goog.provide('gis.control.Dispatch');
goog.require('gis.Obj');
goog.require('gis.data.List');
goog.require('gis.Task');

/** @constructor */
gis.control.Dispatch=function() {
	/** @type {gis.data.List} */
	this.runList=new gis.data.List();
};

/** @return {gis.control.Task} */
gis.control.Dispatch.prototype.fetch=function(url) {
	var task;

	task=new gis.Task('',
		function(task) {
			/** @type {XMLHttpRequest} */
			var http;

			if(typeof(XMLHttpRequest)!='undefined') {
				http=new XMLHttpRequest();
				http.onreadystatechange=function() {
					if(http.readyState==4) {
						if(http.status==200) task.success(http.responseText);
					}
				};

				http.open('GET',url,true);
				http.send(null);

				task.wait();
			} else {
				fs.readFile(url,'utf8',function(err,data) {task.success(data);});

				task.wait();
			}
		}
	);

	this.run(task);

	return(task);
};

/** @return {gis.control.Task} */
gis.control.Dispatch.prototype.wait=function() {
	var task;

	task=new gis.Task('',
		function(task) {
			task.wait();
		}
	);

	this.run(task);

	return(task);
};

/** @param {gis.control.Task} task
  * @param {*} result */
gis.control.Dispatch.prototype.run=function(task,result) {
	var result;

	if(!task.dispatch) task.dispatch=this;

	task.state=gis.Task.State.NONE;
	if(task.init) result=task.init(task,result);

	if(task.state!=gis.Task.State.WAIT && typeof(result)!='function') {
		task.success(result);
	}

	return(task);

//	this.runList.insert(task);
};

gis.control.Dispatch.prototype.when=function(task,next) {
	if(task.state==gis.Task.State.DONE) return(this.run(next));

	if(!next.dispatch) next.dispatch=this;
	next.state=gis.Task.State.WAIT;

	task.nextList.push(next);
	next.depList.push(task);

	return(next);
};

/** @param {gis.control.Task} task */
gis.control.Dispatch.prototype.block=function(task) {
	task.state=gis.Task.State.WAIT;
};

/** @param {gis.control.Task} task
  * @param {*} result */
gis.control.Dispatch.prototype.success=function(task,result) {
	var nextList;
	var nextNum,nextCount;
	var next;
	var depList;
	var depNum,depCount;
	var dep;

	task.state=gis.Task.State.DONE;

	nextList=task.nextList;
	nextCount=nextList.length;

	for(nextNum=0;nextNum<nextCount;nextNum++) {
		next=nextList[nextNum];
		depList=next.depList;
		depCount=depList.length;

		for(depNum=0;depNum<depCount;depNum++) {
			dep=depList[depNum];
			if(dep.state!=gis.Task.State.DONE) break;
		}

		if(depNum>=depCount) {
			// All dependencies are done.
			this.run(next,result);
		}
	}
};
