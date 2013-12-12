/*
	This file is part of LocalRoute.js.

	Copyright (C) 2012, 2013 BusFaster Oy

	LocalRoute.js is free software: you can redistribute it and/or modify it
	under the terms of the GNU Lesser General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	LocalRoute.js is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Lesser General Public License for more details.

	You should have received a copy of the GNU Lesser General Public License
	along with LocalRoute.js.  If not, see <http://www.gnu.org/licenses/>.
*/

/* jshint -W069 */

goog.provide('gis.enc.CSVStream');

/** @constructor
  * @export
  * @extends {Stream.Transform} */
gis.enc.CSVStream=function() {
	Stream.Transform.call(this);
	this._readableState.objectMode=true;
	/** @type {Array.<Array.<string>>} */
	this.groupList=[];
	/** @type {number} */
	this.lineNum=0;

	/** @type {Array.<string>} */
	this.row=[];
	/** @type {string} */
	this.field='';
	/** @type {boolean} */
	this.quote=false;
};

try {
	eval("Stream=require('stream');");
	if(typeof('require')!='undefined') require('util').inherits(gis.enc.CSVStream,Stream.Transform);
} catch(e) {}

/** @param {string} line
  * @return {boolean} */
gis.enc.CSVStream.prototype.parse=function(line) {
	var partList;
	var partNum,partCount;
	var part;
	var row;
	var field;
	var quote;
	var start;
	var pos,len;
	var c;

	if(line.length==0) return(true);
	if(line.indexOf('"')<0) {
		if(!this.quote) {
			return(this.push(line.split(',')));
		} else {
			this.field+=line+'\n';
			return(true);
		}
	}

	row=this.row;
	field=this.field;
	quote=this.quote;

	partList=line.split(',');
	partCount=partList.length;

	for(partNum=0;partNum<partCount;partNum++) {
		part=partList[partNum];
		start=0;

		if(!quote) {
			if(part.charAt(0)=='"') {
				quote=true;
				start=1;
				field='';
			} else field=part;
		} else if(partNum>0) field+=',';

		if(quote) {
			c=part.charAt(part.length-1);

			if(c=='"') {
				// Count trailing quotation marks.
				len=part.length;
				for(pos=len;pos-->start;) {
					if(part.charAt(pos)!='"') break;
				}
				// Odd count means end of string.
				if(len-pos-1&1) {
					quote=false;
					row.push((field+part.substr(start,len-start-1)).replace(/""/g,'"'));
				}
			}

			if(quote) field+=part.substr(start);
		} else row.push(field);
	}

	this.quote=quote;

	if(!quote) {
		this.row=[];
		return(this.push(row));
	}

	this.field=field+'\n';
	return(true);
};

gis.enc.CSVStream.prototype.dump=function() {
	var groupList;
	var lineList;
	var lineNum,lineCount;

	groupList=this.groupList;
	if(!groupList.length) return;
	lineList=groupList[0];
	lineCount=lineList.length;

	for(lineNum=this.lineNum;lineNum<lineCount-1;lineNum++) {
		if(!this.parse(lineList[lineNum].replace(/\ufeff/,''))) break;
	}

	if(lineNum==lineCount-1 && groupList.length>1) {
		groupList.shift();
		groupList[0][0]=lineList[lineNum]+groupList[0][0];
		lineNum=0;
	}

	this.lineNum=lineNum;
};

/** @param {Buffer} chunk
  * @param {string} encoding
  * @param {function()} done */
gis.enc.CSVStream.prototype['_transform']=function(chunk,encoding,done) {
	var txt;

	if(Buffer.isBuffer(chunk)) {
		txt=chunk.toString('utf8');
	}

	this.groupList.push(txt.split(/\r?\n|\r/g));
	this.dump();

	done();
};

/** @param {function()} done */
gis.enc.CSVStream.prototype['_flush']=function(done) {
	this.dump();

	done();
};

/** @type {function(string,function(Array.<string>))} */
gis.enc.CSVStream.prototype.on;
