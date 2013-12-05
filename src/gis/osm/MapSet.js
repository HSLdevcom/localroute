/** @license
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

goog.provide('gis.osm.MapSet');
goog.require('gis.Obj');
goog.require('gis.io.PackStream');
goog.require('gis.enc.NameSet');
goog.require('gis.osm.NodeSet');
goog.require('gis.osm.MetaSet');
goog.require('gis.osm.ProfileSet');
goog.require('gis.osm.WaySet');

/** @constructor */
gis.osm.MapSet=function() {
	/** @type {gis.enc.NameSet} */
	this.nameSet=new gis.enc.NameSet();
	/** @type {gis.osm.NodeSet} */
	this.nodeSet=new gis.osm.NodeSet();
	/** @type {gis.osm.MetaSet} */
	this.metaSet=new gis.osm.MetaSet();
	/** @type {gis.osm.ProfileSet} */
	this.profileSet=new gis.osm.ProfileSet();
	/** @type {gis.osm.WaySet} */
	this.waySet=new gis.osm.WaySet();
	/** @type {number} */
	this.iterId=0;
};

/** @param {boolean} harder */
gis.osm.MapSet.prototype.optimize=function(harder) {
	var profileSet;
	var waySet;

	profileSet=this.profileSet;
	waySet=this.waySet;

	if(harder) {
		waySet.simplify(5,10);
		waySet.cluster(20,profileSet);
	}

	waySet.linkChains(profileSet);
	while(waySet.optimize()) waySet.linkChains(profileSet);
};

/** @param {gis.io.PackStream} stream */
gis.osm.MapSet.prototype.exportPack=function(stream) {
	var nameSet;
	var metaSet;
	var profileSet;
	var waySet;

	nameSet=this.nameSet;
	metaSet=this.metaSet;
	profileSet=this.profileSet;
	waySet=this.waySet;

	profileSet.clearCounts();
	waySet.markProfiles();
	profileSet.sortProfiles();

	metaSet.getNames(nameSet);
	waySet.getNames(nameSet);
	nameSet.sortNames();
console.log(nameSet.list.length+' names');
	nameSet.exportPack(stream);

	profileSet.exportPack(stream);

	waySet.exportPack(stream,nameSet);

	metaSet.exportBindPack(stream,nameSet);

/*
	for(dataNum=0;dataNum<dataCount;dataNum++) {
		stream.writeRaw(hdrList[dataNum]);
		stream.writeRaw(dataList[dataNum]);
	}
*/
};

/** @param {gis.io.PackStream} stream */
gis.osm.MapSet.prototype.importPack=function(stream) {
	var nameSet;

	nameSet=this.nameSet;

	nameSet.importPack(stream);
	this.profileSet.importPack(stream);
	this.waySet.importPack(stream,this.nodeSet,this.profileSet,nameSet,true);
};
