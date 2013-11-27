# LocalRoute.js

LocalRoute.js calculates public transport routes on web browsers and mobile
devices, online and offline. Map, route and timetable information from
open data sources is preprocessed and compressed into a custom format.
These comparatively tiny files are delivered to the client and decompressed
before use.

LocalRoute.js guarantees routing availability and zero unexpected costs also
abroad, and maintains the user's privacy.

- Supported timetable formats: [GTFS](https://developers.google.com/transit/gtfs/), Kalkati.
- Input map data format: [PBF](https://developers.google.com/protocol-buffers/)-compressed OpenStreetMap.

## Quick start

Step 1: Build the project.

Simply append all necessary source files:
```
cd build
./compile-debug-shim.sh lr
```

OR

Compile with plovr. Download plovr.jar under bin and run:
```
cd build
java -jar ../bin/plovr.jar plovr.json > ../dist/lr.js
```

OR

Compile with Google Closure Compiler. Download compiler.jar under bin and run:
```
cd build
./compile-debug-shim.sh lr
```

Afterwards, copy lr.js from dist directory to where you want it.

Step 2: Preprocess schedule data.

```
node lr.js --date 2013-11-27 --in-gtfs helsinki.zip --out-tempt helsinki-transit.txt --out-gtfs-geom helsinki-geom.txt
```

This preprocesses GTFS data in helsinki.zip, stores (somewhat) human-readable transit schedules in helsinki-transit.txt and
(if the last, optional argument is passed) compresses original route polyline coordinates into helsinki-geom.txt.

Step 3: Preprocess map data.

```
node lr.js --in-tempt helsinki-transit.txt --in-pbf helsinki.osm.pbf --out-map helsinki-map.txt
```

This reads previously stored transit data to get coordinates of transit stops used to guess the area relevant to routing.
Then it extracts map data in PBF format, applies basic compression and stores it in helsinki-map.txt.

Step 4: Compress schedule data.

```
node lr.js --in-tempt helsinki-transit.txt --out-trans ../data/pack/helsinki.txt
```

Step 5: Calculate routes!

```
TODO
```

## Library structure

API uses two global objects, "gis" and "reach". Gis has some general-purpose
functions, reach is related to public transit. The main class to access data
is reach.trans.TransSet. It has members stopSet, lineSet and tripSet for all
public transit stops, lines and departures.

In localroute.js terminology a trip represents a single time that a vehicle goes
from the first to the last stop of its route in one direction. Therefore a
trip contains a single arrival for all stops along the route. All information
the public uses to identify the route is connected to every trip.

A line is the list of stops passed along a vehicle's route, and in the future
also its geometry. It has no other information.

## Structure of compressed data

* List of strings (names and codes), LZ77 compressed.
* Stop IDs, names (references to list of strings) and coordinates, delta encoded.
* Lines, encoded so that stops previously seen following the same predecessor are stored as indices into the predecessor's follower list.
* Keys: line names, codes and headsigns stored as references to list of strings.
* trips, grouped by valid day mask, delta encoded, LZ77 compressed.
