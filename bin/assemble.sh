#!/bin/bash

DIR=$( cd "$( dirname "$0" )" && pwd )
GET=`which wget`
if [ "x$GET" = "x" ]; then
	GET="`which curl` -O"
fi

function download {
	if [ ! -f "$DIR/$1" ]; then
		( cd "$DIR" && $GET "https://raw.githubusercontent.com/google/closure-library/master/closure/bin/build/$1" )
	fi
}

download closurebuilder.py
download depstree.py
download jscompiler.py
download source.py
download treescan.py

python "$DIR/closurebuilder.py" $@
