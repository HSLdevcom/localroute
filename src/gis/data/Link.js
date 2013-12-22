goog.provide('gis.data.Link');

/** @constructor
  * @param {*} item */
gis.data.Link=function(item) {
	/** @type {gis.data.Link} */
	this.prev=null;
	/** @type {gis.data.Link} */
	this.next=null;
	/** @type {*} */
	this.item=item;
};
