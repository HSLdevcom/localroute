/*
	OSM Squeezer

	Copyright (c) "2013, by Aalto University, Finland;
	             Contributors: Juha Järvi <juha.jarvi@aalto.fi>;
	             Affiliation: Helsinki Institute for Information Technology HIIT;
	             Project: CultAR;
	             Task manager: Antti Nurminen <andy@iki.fi>;
	             URL: http://www.hiit.fi
	                  http://www.cultar.eu

	             The research leading to these results has received funding from the European Union
	             Seventh Framework Programme (FP7/2007-2013) under grant agreement no 601139"

	All rights reserved.

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met:

	1. Redistributions of source code must retain the above copyright notice, this
	   list of conditions and the following disclaimer.
	2. Redistributions in binary form must reproduce the above copyright notice,
	   this list of conditions and the following disclaimer in the documentation
	   and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
	ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
	WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
	ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
	SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

goog.provide('gis.osm.NodeSet');
goog.require('gis.Obj');
goog.require('gis.osm.Node');
goog.require('gis.MU');

/** @constructor */
gis.osm.NodeSet=function() {
	/** @type {Array.<gis.osm.Node>} */
	this.list=[];
	/** @type {Object.<number,number|gis.osm.Node>} */
	this.tbl={};
	/** @type {number} */
	this.count=0;
};

/** @param {gis.MU} ll
  * @param {boolean} updateList Include node in node list?
  * @return {gis.osm.Node} */
gis.osm.NodeSet.prototype.createNode=function(ll,updateList) {
	var node;

	node=new gis.osm.Node(ll);
	if(updateList) {
//		Note: This messes up export! TODO: iterId would have to be cleared in way.exportPack.
//		node.iterId=this.count;
		this.list[this.count++]=node;
	}

	return(node);
};

/** @param {number} id
  * @param {gis.MU} ll */
gis.osm.NodeSet.prototype.insertCoord=function(id,ll) {
	this.tbl[id]=ll.toNum();
};

/** @param {number} id
  * @param {gis.osm.WaySet} waySet
  * @param {boolean} updateList Include node in node list?
  * @return {gis.osm.Node} */
gis.osm.NodeSet.prototype.promote=function(id,waySet,updateList) {
	var pt;
	var node;
	var way;

	pt=this.tbl[id];
	if(typeof(pt)!='number') return(pt);

	if(pt>0) {
		node=this.createNode(gis.MU.fromNum(pt),updateList);
		this.tbl[id]=node;
		return(node);
	}

	pt=-pt;
	way=waySet.list[~~(pt/0x10000)];
	node=way.promoteNode(pt&0xffff,this);
	this.tbl[id]=node;

	return(node);
};

/** Move point coordinates from nodeTbl to way and replace them with a reference.
  * If several ways share a point, convert it to a node.
  * @param {number} id
  * @param {gis.osm.Way} way
  * @param {number} wayNum
  * @param {number} pos
  * @param {gis.osm.WaySet} waySet
  * @param {boolean} forceNode
  * @return {number|gis.osm.Node} */
gis.osm.NodeSet.prototype.bindWay=function(id,way,wayNum,pos,waySet,forceNode) {
	var pt;
	var node;
	var oldWay;

	pt=this.tbl[id];
	if(typeof(pt)!='number') {
		node=pt;
		node.addWay(way,pos);
		return(node);
	}

	if(pt>0) {
		if(!forceNode) {
			this.tbl[id]=-wayNum*0x10000-pos;
			return(pt);
		}

		node=this.createNode(gis.MU.fromNum(pt),false);
	} else {
		pt=-pt;
		oldWay=waySet.list[~~(pt/0x10000)];
		node=oldWay.promoteNode(pt&0xffff,this);
	}

	node.addWay(way,pos);
	this.tbl[id]=node;

	return(node);
};
