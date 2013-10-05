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

goog.provide('gis.enc.LZ');
goog.require('gis.Obj');
goog.require('gis.Q');

/** @constructor */
gis.enc.LZ=function() {
	/** @type {number} */
	this.minRefLen=2;
};

/** LZ77-style compression.
  * @param {string} data
  * @param {number} repLen
  * @param {number} dictSize
  * @param {gis.io.PackStream} stream
  * @return {string} */
gis.enc.LZ.prototype.compressBytes=function(data,repLen,dictSize,stream) {
	var minRefLen=this.minRefLen;
	var dataPos,dataLen,readLen;
	var bufPos,bufRest,dictLen;
	var dictStart;
	var buf,dict,plain;
	var dictPos;
	var len,bestLen,bestPos;
	var ref;
	var result;
	var resultLen;
	var c;

	result=/** @type {Array.<string>} */ (['']);
	buf=/** @type {Array.<string>} */ ([]);
	bufPos=0;
	bufRest=0;
	dict=/** @type {Array.<string>} */ ([]);
	dictLen=0;
	plain='';
	dictStart=0;
	resultLen=0;

	dataLen=data.length;
	dataPos=0;

	while(dataPos<dataLen || bufRest) {
		readLen=repLen;
		if(bufRest+readLen>repLen) readLen=repLen-bufRest;
		if(dataPos+readLen>dataLen) readLen=dataLen-dataPos;

		buf.push.apply(buf,data.substr(dataPos,readLen).split(''));
//		buf=buf.concat(data.substr(dataPos,readLen).split(''));
		c=buf[bufPos];

		dataPos+=readLen;
		bufRest+=readLen;

		bestLen=0;
		bestPos=0;

		// Simple O(N^2) check to see if buffer contents can be found in dict.
		if(dictLen>dictSize) dictStart=dictLen-dictSize;
		for(dictPos=dictLen;dictPos-->dictStart;) {
			if(dict[dictPos]!=c) continue;

			for(len=1;len<bufRest;len++) {
				// Extracting bytes from dict past its end will repeat the extract several times.
				if(buf[bufPos+len]!=dict[dictPos+len%(dictLen-dictPos)]) break;
			}

			if(len-(dictPos>dictLen-1-64?0:1)>bestLen) {
				bestLen=len;
				bestPos=dictPos;
			}
		}

		ref='';
		if(bestLen>=minRefLen) {
			ref=stream.encodeShort([gis.Q.fromSigned(bestLen-minRefLen),dictLen-1-bestPos]);
		}

		if(bestLen<minRefLen || bestLen<=ref.length+(plain?1:0)) {
			// Storing a reference would save no space compared to outputting the compressable sequence as plain text,
			// so output one character as plain text and then loop back to find a sequence in dict again..
			plain+=c;
			dict.push(c);
			dictLen++;
			bufPos++;
			bufRest--;
		} else {
			// First output any pending uncompressed data.
			if(plain) {
				ref=stream.encodeShort([gis.Q.fromSigned(-plain.length)])+plain+ref;
				plain='';
			}
			result.push(ref);
			resultLen+=ref.length;
			bufPos+=bestLen;
			bufRest-=bestLen;

			if(bestLen<dictLen-bestPos) {
				dict.push.apply(dict,dict.slice(bestPos,bestPos+bestLen));
//				dict=dict.concat(dict.slice(bestPos,bestPos+bestLen));
				dictLen+=bestLen;
			}
		}

		if(dictLen>dictSize*2) {
			dict.splice(0,dictLen-(dictSize+1));
			dictLen=dictSize+1;
		}

		if(bufPos>repLen*2) {
			buf.splice(0,repLen*2);
			bufPos-=repLen*2;
		}
	}

	if(plain) {
		ref=stream.encodeShort([gis.Q.fromSigned(-plain.length)])+plain;
		resultLen+=ref.length;
		result.push(ref);
	}

	result[0]=stream.encodeLong([resultLen,dictSize]);

/*
	// For testing, decompress and compare:
	var compressed=result.join('');
	var data2=this.decompressBytes(new gis.io.PackStream(compressed,null),compressed.length,dictSize);
	console.log((data==data2)+'\t'+data.length+'\t'+data2.length);
*/


	return(result.join(''));
};

/** @param {gis.io.PackStream} stream
  * @return {string} */
gis.enc.LZ.prototype.decompressBytes=function(stream) {
	var minRefLen=this.minRefLen;
	var len,dictSize;
	var data,dict;
	var plain;
	var first,rep,dist,ref;
	var part;
	var chars;
	var dec;

	dec=/** @type {Array.<number>} */ ([]);
	stream.readLong(dec,2);
	len=dec[0];
	dictSize=dec[1];

	data=/** @type {Array.<string>} */ ([]);
	dict=/** @type {Array.<string>} */ ([]);
	first=stream.pos;

	while(stream.pos<first+len) {
		stream.readShort(dec,1);
		rep=gis.Q.toSigned(dec[0]);

		if(rep<0) {
			plain=stream.readRaw(-rep);

			data.push(plain);
			dict.push.apply(dict,plain.split(''));
		} else {
			rep+=minRefLen;
			stream.readShort(dec,1);
			dist=dec[0]+1;
			ref=dict.length-dist;

			if(rep>=dist) {
				part=dict.slice(ref).join('');

				while(rep>dist) {
					data.push(part);
					rep-=dist;
				}
				data.push(part.substr(0,rep));
			} else {
				chars=dict.slice(ref,ref+rep);
				data.push(chars.join(''));
				dict.push.apply(dict,chars);
			}
		}

		if(dict.length>dictSize*2) dict.splice(0,dict.length-dictSize);
	}

	return(data.join(''));
};
