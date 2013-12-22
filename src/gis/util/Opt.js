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

/** @fileoverview
  * @suppress {reportUnknownTypes} */

/* jshint -W069 */

goog.provide('gis.util.Opt');

/** @constructor
  * @param {Object.<string,Array.<*>>} conf
  * @param {Array.<string>} restConf
  * @param {string} appName
  * @param {string} ver
  * @return {Object.<string,*>} */
gis.util.Opt=function(conf,restConf,appName,ver) {
	/** @type {Object.<string,Array.<*>>} */
	this.conf=conf;
	/** @type {Array.<string>} */
	this.restConf=restConf;
	this.restTbl={};
	/** @type {string} */
	this.appName=appName;
	/** @type {string} */
	this.ver=ver;
	/** @type {Object.<string,string>} */
	this.def;
	/** @type {Object.<string,string>} */
	this.undef;
	/** @type {Array.<string>} */
	this.rest;
};

/** @param {Array.<string>} argv */
gis.util.Opt.prototype.parse=function(argv) {
	var conf;
	var restConf;
	var argNum,argCount;
	var arg;
	var rest;
	var fields,keys;
	var keyNum,keyCount;
	var parsed;
	var pending;
	var pendNum,pendCount;
	var alias;
	var def;

	/** @param {string} key
	  * @param {string|boolean} val */
	function setArg(key,val) {
		if(alias[key]) parsed.def[alias[key].name]=val;
		else parsed.undef[key]=val;
	}

	/** @param {string} key
	  * @return {string} */
	function camel(key) {
		return(key.replace(/-([a-z])/,
			/** @param {string} s
			  * @param {string} c */
			function(s,c) {
				return(c.toUpperCase());
			}
		));
	}

	conf=this.conf;
	restConf=this.restConf;

	argCount=argv.length;
	parsed={def:{},undef:{},rest:[]};
	pending=[];
	rest=[];
	pendCount=0;
	pendNum=0;

	keyCount=restConf.length;
	for(keyNum=0;keyNum<keyCount;keyNum++) {
		this.restTbl[restConf[keyNum]]='?';
	}

	alias={};
	for(var key in conf) {
		if(!conf.hasOwnProperty(key)) continue;
		def=conf[key];
		fields=(/** @type {string} */ (def[0])).split(/[ ,|]/);
		keyCount=fields.length;
		for(keyNum=0;keyNum<keyCount;keyNum++) {
//			alias[fields[keyNum]]=key;
			alias[camel(fields[keyNum])]={name:key,type:def[1]};
		}
		if(typeof(def[2])!='undefined') parsed.def[key]=def[2];

		if(this.restTbl[conf[key][0]]) this.restTbl[conf[key][0]]=key;
	}

	for(argNum=2;argNum<argCount;argNum++) {
		arg=argv[argNum];

		if(arg=='--') {
			rest.push.apply(rest,argv.slice(argNum+1));
			break;
		}

		if(arg.match(/^-[A-Za-z]/)) {
			fields=arg.split(/[A-Za-z]/);
			keys=arg.match(/[A-Za-z]/g);

			keyCount=keys.length;
			for(keyNum=0;keyNum<keyCount;keyNum++) {
				key=keys[keyNum];
				if(fields[keyNum+1]) {
					setArg(key,fields[keyNum+1]);
				} else {
					if(key=='v' && !alias['v']) {
						this.printVersion();
						process.exit();
					}
					if(key=='h' && !alias['h']) {
						this.printUsage();
						process.exit();
					}
					if(alias[key].type) pending[pendCount++]=key;
					setArg(key,true);
				}
			}

			continue;
		}

		fields=arg.match(/^--(no-)?([^=]+)(=(.*))?/);

		if(!fields) {
			if(pendNum<pendCount) setArg(pending[pendNum++],arg);
			else rest.push(arg);
			continue;
		}

		key=fields[2];

		if(fields[4]) {
			setArg(camel((fields[1]||'')+key),fields[4]);
		} else if(fields[1]) {
			setArg(camel(key),false);
		} else {
			if(key=='version' && !alias['version']) {
				this.printVersion();
				process.exit();
			}
			if(key=='help' && !alias['help']) {
				this.printUsage();
				process.exit();
			}
			pending[pendCount++]=camel(key);
		}
	}

	while(pendNum<pendCount) {
		setArg(pending[pendNum++],true);
	}

	keyCount=restConf.length;
	if(rest.length<keyCount) {
		keyCount=rest.length;
//		this.printUsage();
//		process.exit();
	}
	for(keyNum=0;keyNum<keyCount;keyNum++) {
		parsed.def[this.restTbl[restConf[keyNum]]]=rest.shift();
	}

	parsed.rest=rest;

	this.def=parsed.def;
	this.undef=parsed.undef;
	this.rest=parsed.rest;
};

gis.util.Opt.prototype.printVersion=function() {
	if(this.ver) {
		console.log(this.appName+' '+this.ver);
	}
};

gis.util.Opt.prototype.printUsage=function() {
	var aliasList;
	var aliasNum,aliasCount;
	var alias;
	var conf;
	var restTbl;
	var i,l;

	if(this.ver) {
		console.log(this.appName+' '+this.ver);
	}

	conf=this.conf;
	restTbl=this.restTbl;

	console.log('\nUsage:\n');

	alias='';
	l=this.restConf.length;
	for(i=0;i<l;i++) {
		alias+=' '+conf[restTbl[this.restConf[i]]][1];
	}

	console.log(process.argv[0]+' '+process.argv[1]+' [OPTION]...'+alias);

	for(i=0;i<l;i++) {
		alias=conf[restTbl[this.restConf[i]]][1];
		console.log('  '+alias+new Array(28-alias.length).join(' ')+conf[restTbl[this.restConf[i]]][3]+'.');
	}

	console.log('\nOptions:');

	for(var key in conf) {
		if(!conf.hasOwnProperty(key)) continue;
		if(restTbl[conf[key][0]]) continue;
		aliasList=conf[key][0].split(/[ ,|]/);
		aliasCount=aliasList.length;
		for(aliasNum=0;aliasNum<aliasCount;aliasNum++) {
			alias=aliasList[aliasNum];
			if(alias.match(/^[A-Za-z]$/)) alias='-'+alias;
			else alias='--'+alias;
			aliasList[aliasNum]=alias;
		}

		alias=aliasList.join(', ');

		if(conf[key][1]) {
			if(aliasList[aliasList.length-1].substr(0,2)=='--') alias+='=';
			else alias+=' ';
			alias+=conf[key][1];
		}

		console.log('  '+alias+new Array(28-alias.length).join(' ')+conf[key][3]+'.');
	}
};
