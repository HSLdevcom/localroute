#!/bin/sh
BASE=${1%.*}
BASE=${BASE%-main}

if [ -f ../src/$BASE-main.js ]; then
../bin/assemble.sh -i ../src/$BASE-main.js ../src/$BASE-main.js \
--root=../src/gis \
--root=../src/reach \
--root=../shim |
xargs cat ../shim/classes.js > ../dist/$BASE.js
fi
