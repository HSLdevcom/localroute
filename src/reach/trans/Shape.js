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

goog.provide('reach.trans.Shape');

/** @constructor */
reach.trans.Shape=function() {
	/** @type {Array.<number>} */
	this.posList=[];
	/** @type {Array.<number>} */
	this.ptList=[];
	/** @type {Object.<number,reach.trans.Seq>} */
	this.seqTbl={};
	/** @type {Array.<reach.trans.Seq>} */
	this.seqList=[];

	/** @type {boolean} */
	this.sorted=false;
};

/** @param {number} pos
  * @param {number} lat
  * @param {number} lon */
reach.trans.Shape.prototype.insert=function(pos,lat,lon) {
	this.posList.push(pos);
	this.ptList.push(gis.MU.toNum(lat,lon));
};

reach.trans.Shape.prototype.sortPoints=function() {
	var posList;
	var posPtList;
	var ptList;
	var ptNum,ptCount;

	posPtList=/** @type {Array.<{pos:number,pt:number}>} */ ([]);

	posList=this.posList;
	ptList=this.ptList;
	ptCount=ptList.length;

	for(ptNum=0;ptNum<ptCount;ptNum++) {
		posPtList[ptNum]={pos:posList[ptNum],pt:ptList[ptNum]};
	}

	posPtList.sort(function(a,b) {
		return(a.pos-b.pos);
	});

	for(ptNum=0;ptNum<ptCount;ptNum++) {
		ptList[ptNum]=posPtList[ptNum].pt;
	}

	this.sorted=true;
};

/** @param {gis.io.PackStream} stream
  * @param {number} detail
  * @param {number} roundOff */
reach.trans.Shape.prototype.exportPack=function(stream,detail,roundOff) {
	var seqList;
	var seqNum,seqCount;
	var ptList;
	var ptNum,ptCount;
	var ll;
	var lat,latPrev;
	var lon,lonPrev;
	var outList;

	seqList=this.seqList;
	seqCount=seqList.length;

	ptList=this.ptList;
	ptCount=ptList.length;

	outList=[seqCount,ptCount];

	for(seqNum=0;seqNum<seqCount;seqNum++) {
		outList.push(seqList[seqNum].id);
	}

	lat=0;
	lon=0;

	for(ptNum=0;ptNum<ptCount;ptNum++) {
		latPrev=lat;
		lonPrev=lon;

		ll=gis.MU.ll.fromNum(ptList[ptNum]);
		lat=(ll.llat+roundOff)>>detail;
		lon=(ll.llon+roundOff)>>detail;

		outList.push(gis.Q.fromSigned(lat-latPrev),gis.Q.fromSigned(lon-lonPrev));
	}

	stream.writeLong(outList);
};

/** @param {gis.io.PackStream} stream
  * @param {number} detail
  * @param {number} roundOff
  * @param {reach.trans.SeqSet} seqSet */
reach.trans.Shape.prototype.importPack=function(stream,detail,roundOff,seqSet) {
	var seqNum,seqCount;
	var ptNum,ptCount;
	var pos;
	var lat,lon;
	var dec;

	dec=/** @type {Array.<number>} */ ([]);

	stream.readLong(dec,2);
	seqCount=dec[0];
	ptCount=dec[1];

	stream.readLong(dec,seqCount);

	for(seqNum=0;seqNum<seqCount;seqNum++) {
		this.seqList.push(seqSet.list[dec[seqNum]]);
	}

	stream.readLong(dec,ptCount*2);
	pos=0;
	lat=0;
	lon=0;

	for(ptNum=0;ptNum<ptCount;ptNum++) {
		lat+=gis.Q.toSigned(dec[pos++]);
		lon+=gis.Q.toSigned(dec[pos++]);

		this.ptList[ptNum]=gis.MU.toNum((lat<<detail)+roundOff,(lon<<detail)+roundOff);
	}
};
