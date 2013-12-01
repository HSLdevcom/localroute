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

goog.provide('gis.osm.Meta');
goog.require('gis.Obj');

/** @constructor */
gis.osm.Meta=function() {
	/** @type {gis.osm.Meta.Type} */
	this.type;

	/** @type {number} */
	this.count=0;

	/** @type {Array.<gis.osm.Node>} Nodes using this metadata, used during compression. */
	this.nodeList;
};

/** @enum {number} */
gis.osm.Meta.Type={
	NONE:0,
	WAY:1,
	STOP:2
};

/** @param {gis.enc.NameSet} nameSet */
gis.osm.Meta.prototype.getNames=function(nameSet) {};

/** @param {gis.io.PackStream} stream
  * @param {gis.enc.NameSet} nameSet */
gis.osm.Meta.prototype.exportPack=function(stream,nameSet) {};
