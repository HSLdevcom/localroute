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

goog.provide('gis.data.RadixHeap');
goog.require('gis.data.HeapItem');

/** @constructor
  * @param {number} size */
gis.data.RadixHeap=function(size) {
	var i;

	/** @type {Array.<gis.data.HeapItem>} */
	this.heap=[];
//	this.heap=new Array(size);
	/** @type {number} */
	this.cursor=0;
	/** @type {number} */
	this.size=size;
	/** @type {number} */
	this.itemCount=0;
};

gis.data.RadixHeap.prototype.clear=function() {
	var i;

	this.heap=[];
//	this.heap=new Array(size);
	this.cursor=0;
	this.itemCount=0;
};

/** @param {gis.data.HeapItem} item */
gis.data.RadixHeap.prototype.remove=function(item) {
	var next;

	next=item.heapNext;

	if(next) next.heapPrev=item.heapPrev;
	if(item.heapPrev) {
		item.heapPrev.heapNext=next;
	} else {
		this.heap[~~item.cost]=next;
	}

	item.heapPrev=null;
	item.heapNext=null;
	this.itemCount--;
};

/** @param {gis.data.HeapItem} item
  * @param {number} cost */
gis.data.RadixHeap.prototype.insert=function(item,cost) {
	var old;

	// if(cost<this.cursor) console.log('RadixHeap.insert says: The cursor decrease IS necessary.');
	// if(cost<this.cursor) this.cursor=cost;
	item.cost=cost;

	old=this.heap[~~item.cost];
	item.heapNext=old;
	item.heapPrev=null;
	if(old) old.heapPrev=item;

	this.heap[~~item.cost]=item;
	this.itemCount++;
};

/** @param {gis.data.HeapItem} item
  * @param {number} cost */
gis.data.RadixHeap.prototype.setKey=function(item,cost) {
	this.remove(item);
	this.insert(item,cost);
};

/** @return {gis.data.HeapItem} */
gis.data.RadixHeap.prototype.extractMin=function() {
	var item;

	if(this.itemCount==0) return(null);

	item=this.heap[this.cursor];
	while(!item) {
		item=this.heap[++this.cursor];
	}

	if(item) this.remove(item);

	return(item);
};
