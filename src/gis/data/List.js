goog.provide('gis.data.List');
goog.require('gis.Obj');
goog.require('gis.data.Link');

/** @constructor */
gis.data.List=function() {
	/** @type {gis.data.Link} */
	this.first=null;
};

/** @param {*} item
  * @return {gis.data.Link} */
gis.data.List.prototype.insert=function(item) {
	var link;

	link=new gis.data.Link(item);
	if(this.first) this.first.prev=link;

	link.next=this.first;
	this.first=link;

	return(link);
};

/** @param {gis.data.Link} link */
gis.data.List.prototype.remove=function(link) {
	if(this.first==link) this.first=link.next;

	if(link.prev) link.prev.next=link.next;
	if(link.next) link.next.prev=link.prev;
};
