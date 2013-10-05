#!/bin/sh
BASE=${1%.*}
BASE=${BASE%-main}

python ../bin/closurebuilder.py -i ../src/$BASE-main.js ../src/$BASE-main.js --root=../src/gis --root=../src/reach --root=../shim | xargs cat ../shim/classes.js > ../dist/$BASE.js
