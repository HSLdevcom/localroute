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

/*
	OpenStreetMap wiki at http://wiki.openstreetmap.org/wiki/PBF_Format says:

		File format

		A file contains a header followed by a sequence of fileblocks.
		The design is intended to allow future random-access to the contents of the file and skipping past not-understood or unwanted data.

		The format is a repeating sequence of:
		- int4: length of the BlobHeader message in network byte order
		- serialized BlobHeader message
		- serialized Blob message (size is given in the header)

		A BlobHeader is currently defined as:
		message BlobHeader {
			required string type = 1;
			optional bytes indexdata = 2;
			required int32 datasize = 3;
		}

	Content in the wiki quoted under Creative Commons Attribution-ShareAlike 2.0 license.
*/

/* jshint -W069 */

goog.provide('gis.osm.PBF');
goog.require('gis.Obj');
goog.require('gis.Deg');
goog.require('gis.io.PackStream');
goog.require('gis.osm.NodeSet');
goog.require('gis.osm.Node');
goog.require('gis.osm.MetaSet');
goog.require('gis.osm.ProfileSet');
goog.require('gis.osm.WaySet');
goog.require('gis.osm.TagTable');
goog.require('gis.bin.OsmDesc');

/** @constructor
  * @param {gis.osm.MapSet} mapSet */
gis.osm.PBF=function(mapSet) {
	/** @type {gis.osm.MapSet} */
	this.mapSet=mapSet;
	/** @type {Object.<number,boolean>} */
	this.maskGrid;

	/** @type {number} */
	this.nodeCount=0;
};

/** @type {number} Maximum BlobHeader size. */
gis.osm.PBF.hdrMax=64*1024;
/** @type {number} Maximum Blob size. */
gis.osm.PBF.blobMax=32*1024*1024;
/** @type {number} Multiplication factor for packing decimal degree coordinate pairs into an integer.
  * 360*182=65520<2^16 and 180*182=32760<2^15 so both fit in 31 bits. */
gis.osm.PBF.gridMul=182;

/** UTF-8 decode list of strings.
  * @param {Array.<string>} txtList Array of strings to store output.
  * @param {Array.<Buffer>} bufList */
gis.osm.PBF.prototype.decodeTxtList=function(txtList,bufList) {
	var txtNum,txtCount;

	if(!txtList) txtList=[];
	txtCount=bufList.length;
	for(txtNum=0;txtNum<txtCount;txtNum++) {
		txtList[txtNum]=bufList[txtNum].toString('utf8');
	}

	return(txtList);
};

/** @param {Array.<string>} txtList
  * @param {Array.<string>} nameList
  * @return {Object.<number,boolean>} */
gis.osm.PBF.prototype.makeKeyTbl=function(txtList,nameList) {
	var keepTxtTbl;
	var keepKeyTbl;
	var nameNum,nameCount;
	var txtNum,txtCount;
	var txt;

	// Create table of interesting key names.
	keepTxtTbl={};
	nameCount=nameList.length;

	for(nameNum=0;nameNum<nameCount;nameNum++) {
		keepTxtTbl[nameList[nameNum]]=true;
	}

	// Get IDs for listed names.
	keepKeyTbl={};
	txtCount=txtList.length;

	for(txtNum=0;txtNum<txtCount;txtNum++) {
		txt=gis.Q.trim(txtList[txtNum].toLowerCase());
		if(keepTxtTbl[txt]) keepKeyTbl[txtNum]=true;
	}

	return(keepKeyTbl);
};

/** Parse list of compressed OSM nodes and tags.
  * @param {Primitive} dense
  * @param {Array.<string>} txtList
  * @param {PrimitiveBlock} prim
  * @param {gis.osm.WaySet} waySet
  * @param {gis.osm.NodeSet} nodeSet
  * @param {gis.osm.MetaSet} metaSet */
gis.osm.PBF.prototype.parseDense=function(dense,txtList,prim,waySet,nodeSet,metaSet) {
	var grid;
	var gridMul,mul,testMul,testAdd;
	var id;
	var latList,lonList;
	var lat,lon;
	var ll;
	var nodeIdList;
	var nodeNum,nodeCount;
	var node;
	var matchList;
//	var matchCount;
	var keepKeyTbl;
	var tagTbl;
	var tagList;
	var tagNum,tagCount,tagFirst;
	var useful;
	var key,val;
	var meta;

	grid=this.maskGrid;
	gridMul=gis.osm.PBF.gridMul;

	mul=prim['granularity']/100/10000000;
	testMul=gridMul*mul;
	testAdd=90*gridMul+0.5;
	nodeCount=dense['id'].length;

	this.nodeCount+=nodeCount;
	console.log(this.nodeCount+' nodes read.');

	id=0;
	lat=0;
	lon=0;

	// Read delta encoded node IDs and coordinates, store only those inside marked grid cells.
	nodeIdList=/** @type {Array.<number>} */ ([]);
	latList=dense['lat'];
	lonList=dense['lon'];
	matchList=[];
//	matchCount=0;
	for(nodeNum=0;nodeNum<nodeCount;nodeNum++) {
		id+=+dense['id'][nodeNum];
		lat+=+latList[nodeNum];
		lon+=+lonList[nodeNum];
		if(!grid[((lat*testMul+testAdd)<<16)+~~(lon*testMul+testAdd*2-0.5)]) continue;

		ll=new gis.Deg(lat*mul,lon*mul).toMU();
		nodeSet.insertCoord(id,ll);
		nodeIdList[nodeNum]=id;
	}

	// Return if stored nodes didn't have any tags.
	tagList=dense['keysVals'];
//	if(!matchCount || !tagList || !tagList.length) return;
	if(!nodeIdList.length || !tagList || !tagList.length) return;

	if(!txtList.length) this.decodeTxtList(txtList,prim['stringtable']['s']);

	// Create table with IDs of interesting key names that indicate useful nodes.
	keepKeyTbl=this.makeKeyTbl(txtList,'addr:housenumber amenity barrier highway leisure public_transport railway shop sport tourism traffic_sign'.split(' '));

	// Read list of tags for all nodes.
	tagCount=tagList.length;
	tagFirst=0;
	nodeNum=0;
	useful=false;
	tagTbl=null;

	// This loop reads at least one past the end of the array, just so code for handling the end of a node wouldn't need to be copied also after the loop.
	for(tagNum=0;tagNum<=tagCount;) {
		key=+tagList[tagNum++];
		if(!key) {
			// Key ID 0 means continue to next node. Check if the previous node has useful tags to parse.
			if(useful) {
				meta=metaSet.parse(tagTbl,'n');
				if(meta) {
					node=nodeSet.promote(nodeIdList[nodeNum],waySet,true);
//					node.meta=meta;
//					metaSet.insertNode(node);
				}
			}
			tagFirst=tagNum;
			nodeNum++;
			useful=false;
		} else if(useful) {
			// Store all keys and values for useful nodes.
			val=tagList[tagNum++];	// If data is invalid this may read past end of list.
			tagTbl.insert(txtList[key],txtList[val]);
		} else if(nodeIdList[nodeNum] && keepKeyTbl[key]) {
			// If an interesting key is encountered, reread that node's tags to store them all.
			useful=true;
			tagNum=tagFirst;
			tagTbl=new gis.osm.TagTable();
		} else tagNum++;
	}
};

/** @param {PrimitiveList} descList
  * @param {Array.<string>} txtList
  * @param {PrimitiveBlock} prim
  * @param {gis.osm.WaySet} waySet
  * @param {gis.osm.NodeSet} nodeSet */
gis.osm.PBF.prototype.parseWays=function(descList,txtList,prim,waySet,nodeSet) {
	var descNum,descCount;
	var desc;
	var refList;
	var refNum,refCount;
	var nodeTbl;
	var nodeList;
	var nodeCount;
	var nodeId;
	var wayTbl;
	var way,prevWay;
	var keepKeyTbl;
	var tagTbl;
	var tagNum,tagCount;
	var key,val;
	var profile;
	var name;
	var stream;

	wayTbl=waySet.tbl;
	nodeTbl=nodeSet.tbl;

	if(!txtList.length) this.decodeTxtList(txtList,prim['stringtable']['s']);
	// For profile key compression in memory.
	stream=new gis.io.PackStream(null,null);

	// Create table with IDs of interesting key names that indicate useful ways.
	keepKeyTbl=this.makeKeyTbl(txtList,'amenity highway leisure public_transport railway shop sport tourism'.split(' '));

	descCount=descList.length;
	for(descNum=0;descNum<descCount;descNum++) {
		desc=descList[descNum];
		if(!desc['keys']) continue;

		tagCount=desc['keys'].length;
		for(tagNum=0;tagNum<tagCount;tagNum++) {
			if(keepKeyTbl[+desc['keys'][tagNum]]) break;
		}

		// Ignore the way if no interesting keys were found.
		if(tagNum==tagCount) continue;

		tagTbl=new gis.osm.TagTable();
		for(tagNum=0;tagNum<tagCount;tagNum++) {
			key=+desc['keys'][tagNum];
			val=+desc['vals'][tagNum];
			tagTbl.insert(txtList[key],txtList[val]);
		}

		way=null;
		profile=null;
		name=tagTbl.getString('name');

		nodeId=0;
		nodeList=[];
		nodeCount=0;
		refList=desc['refs'];
		refCount=refList.length;

		for(refNum=0;refNum<refCount;refNum++) {
			nodeId+=+refList[refNum];

			if(!nodeTbl[nodeId]) {
				// If the current node has not been read but the way has two or more nodes,
				// output the way and start a new one.
				// TODO: should load also next node immediately outside grid, so the road doesn't erroneusly end inside area that should be valid.
				if(nodeCount>1) {
					if(!profile) {
						profile=this.mapSet.profileSet.insertWay(tagTbl,stream);
						if(!profile) break;
					}
					prevWay=way;
					way=this.mapSet.waySet.insertNodes(nodeList,profile,name,nodeSet);
					// If way is cut because part of it is outside the grid, link the parts together.
					if(prevWay) prevWay.next=way;
					else wayTbl[+desc['id']]=way;
				}

				nodeList=[];
				nodeCount=0;
				continue;
			}

			nodeList[nodeCount++]=nodeId;
		}

		if(nodeCount>1) {
			if(!profile) profile=this.mapSet.profileSet.insertWay(tagTbl,stream);
			if(profile) {
				prevWay=way;
				way=this.mapSet.waySet.insertNodes(nodeList,profile,name,nodeSet);
				// If way is cut because part of it is outside the grid, link the parts together.
				if(prevWay) prevWay.next=way;
				else wayTbl[+desc['id']]=way;
			}
		}
	}
};

/** @param {PrimitiveList} descList
  * @param {Array.<string>} txtList
  * @param {{granularity:number,stringtable:{s:Array.<Buffer>}}} prim
  * @param {gis.osm.WaySet} waySet
  * @param {gis.osm.NodeSet} nodeSet
  * @param {gis.osm.MetaSet} metaSet */
gis.osm.PBF.prototype.parseRels=function(descList,txtList,prim,waySet,nodeSet,metaSet) {
	var nodeTbl;
	var node;
	var wayTbl;
	var way;
	var metaTbl;
	var meta;
	var descNum,descCount;
	var desc;
	var typeList;
	var idList;
	var idNum,idCount;
	var id;
	var roleIdList;
	var roleList;
	var memberList;
	var memberCount;
	var typeKeyTbl,keepTypeTbl;
	var tagTbl;
	var tagNum,tagCount;
	var key,val;

	nodeTbl=nodeSet.tbl;
	wayTbl=waySet.tbl;
	metaTbl=metaSet.tbl;

	if(!txtList.length) this.decodeTxtList(txtList,prim['stringtable']['s']);

	// Create table with IDs of interesting type names that indicate useful relations.
	keepTypeTbl=this.makeKeyTbl(txtList,'route route_master access enforcement restriction associatedstreet bridge tunnel site public_transport'.split(' '));
	typeKeyTbl=this.makeKeyTbl(txtList,['type']);

	descCount=descList.length;
	for(descNum=0;descNum<descCount;descNum++) {
		desc=descList[descNum];
		if(!desc['keys']) continue;

		tagCount=desc['keys'].length;
		for(tagNum=0;tagNum<tagCount;tagNum++) {
			if(typeKeyTbl[+desc['keys'][tagNum]] && keepTypeTbl[+desc['vals'][tagNum]]) break;
		}

		// Ignore the relation if its type isn't interesting.
		if(tagNum==tagCount) continue;

		roleList=[];
		memberList=[];
		memberCount=0;
		typeList=desc['types'];
		roleIdList=desc['rolesSid'];
		idList=desc['memids'];

		if(!typeList || !roleIdList || !idList) continue;

		idCount=idList.length;
		id=0;

		for(idNum=0;idNum<idCount;idNum++) {
			id+=+idList[idNum];
			if(typeList[idNum]=='NODE') {
				node=nodeTbl[id];
				if(node) {
					roleList[memberCount]='n'+txtList[+roleIdList[idNum]];
					memberList[memberCount++]=node;
				}
			} else if(typeList[idNum]=='WAY') {
				way=wayTbl[id];
				if(way) {
					roleList[memberCount]='w'+txtList[+roleIdList[idNum]];
					memberList[memberCount++]=way;
				}
			} else if(typeList[idNum]=='RELATION') {
				// Relations may refer to other relations not yet loaded,
				// so those references must be stored by ID and resolved only after all relations are loaded.
				roleList[memberCount]='r'+txtList[+roleIdList[idNum]];
/*
console.log(roleList[memberCount]+' '+desc['id']+' '+id);
for(tagNum=0;tagNum<tagCount;tagNum++) {
if(typeKeyTbl[+desc['keys'][tagNum]] && keepTypeTbl[+desc['vals'][tagNum]]) console.log(txtList[+desc['vals'][tagNum]]);
}
*/
				memberList[memberCount++]=id;
			}
		}

		// Ignore the relation if no members are within grid to import.
		if(!memberCount) continue;

		tagTbl=new gis.osm.TagTable();
		for(tagNum=0;tagNum<tagCount;tagNum++) {
			key=+desc['keys'][tagNum];
			val=+desc['vals'][tagNum];
			tagTbl.insert(txtList[key],txtList[val]);
		}

		meta=metaSet.parseRel(tagTbl,roleList,memberList);
		if(meta) metaTbl[+desc['id']]=meta;
	}
};

/** @param {gis.Deg} sw
  * @param {gis.Deg} ne */
gis.osm.PBF.prototype.addMask=function(sw,ne) {
	var grid;
	var gridMul;
	var lat,lat2;
	var lon,lon2;

	gridMul=gis.osm.PBF.gridMul;
	grid=this.maskGrid;
	if(!grid) {
		grid={};
		this.maskGrid=grid;
	}

	lat2=~~((ne.llat+90)*gridMul+0.999);
	lon2=~~((ne.llon+180)*gridMul+0.999);
	for(lat=~~((sw.llat+90)*gridMul);lat<=lat2;lat++) {
		for(lon=~~((sw.llon+180)*gridMul);lon<=lon2;lon++) {
			grid[(lat<<16)+lon]=true;
		}
	}
};

/** @param {string} path
  * @param {function()} done */
gis.osm.PBF.prototype.importPBF=function(path,done) {
	/** @type {gis.osm.PBF} */
	var self=this;
	var nodeSet;
	var metaSet;
	var profileSet;
	var waySet;
	var fd;
	var schema;
	/** @type {Buffer} */
	var hdrBuf;
	/** @type {HdrParser} */
	var hdrParser;
	/** @type {Buffer} */
	var blobBuf;
	/** @type {BlobParser} */
	var blobParser;
	/** @type {PrimitiveBlockParser} */
	var primParser;

	/** @param {Buffer} data */
	function parseBlock(err,data) {
		var prim;
		var txtList;
		var groupList;
		var groupNum,groupCount;
		var group;

		if(!data) return;
		prim=primParser.parse(data);
		txtList=[];
		groupList=prim['primitivegroup'];
		groupCount=groupList.length;

		for(groupNum=0;groupNum<groupCount;groupNum++) {
			group=groupList[groupNum];

			if(group['dense']) self.parseDense(/** @type {Primitive} */ (group['dense']),txtList,prim,waySet,nodeSet,metaSet);
			if(group['ways']) self.parseWays(/** @type {PrimitiveList} */ (group['ways']),txtList,prim,waySet,nodeSet);
			if(group['relations']) self.parseRels(/** @type {PrimitiveList} */ (group['relations']),txtList,prim,waySet,nodeSet,metaSet);
		}

		// TODO: this makes the call stack grow too much.
		readBlock();
	}

	function readBlock() {
		var hdrLen;
		var hdr;
		var blobLen;
		var blob;
		var zBuf;

		zBuf=null;
		while(fs.readSync(fd,hdrBuf,0,4,null)==4) {
			// BlobHeader length.
			hdrLen=hdrBuf.readUInt32BE(0);
			// BlobHeader.
			fs.readSync(fd,hdrBuf,0,hdrLen,null);
			hdr=hdrParser.parse(hdrBuf.slice(0,hdrLen));

			// Blob length.
			blobLen=hdr['datasize'];
			// Blob.
			fs.readSync(fd,blobBuf,0,blobLen,null);

			if(hdr['type']=='OSMData') {
				blob=blobParser.parse(blobBuf.slice(0,blobLen));
				zBuf=blob['zlibData'];

				if(zBuf) {
					zlib.inflate(zBuf,parseBlock);
					return;
				}
			}
		}

		fs.closeSync(fd);
		done();
	}

	nodeSet=this.mapSet.nodeSet;
	metaSet=this.mapSet.metaSet;
	profileSet=this.mapSet.profileSet;
	waySet=this.mapSet.waySet;

	schema=new Schema(new Buffer(gis.bin.OsmDesc,'base64'));

	hdrParser=/** @type {HdrParser} */ (schema['BlockHeader']);
	blobParser=/** @type {BlobParser} */ (schema['Blob']);
	primParser=/** @type {PrimitiveBlockParser} */ (schema['PrimitiveBlock']);

	hdrBuf=new Buffer(gis.osm.PBF.hdrMax);
	blobBuf=new Buffer(gis.osm.PBF.blobMax);

	// Mark grid cells to convert.
//	this.addMask(new gis.Deg(60.1,24.5),new gis.Deg(60.4,25.2));

	fd=fs.openSync(path,'r');
	readBlock();
};
