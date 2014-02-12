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

### Step 1: Build the project

Simply append all necessary source files:

```sh
cd build
./compile-debug-shim.sh lr
```

OR

Compile with plovr. Download `plovr.jar` into `bin` and run:

```sh
cd build
java -jar ../bin/plovr.jar plovr.json > ../dist/lr.js
```

OR

Compile with Google Closure Compiler. Download `compiler.jar` into `bin` and run:

```sh
cd build
./compile-debug-shim.sh lr
```

Afterwards, copy `lr.js` from the directory `dist` to where you want it.

### Step 2: Preprocess schedule data.

```sh
node lr.js --date 2013-12-02 --in-gtfs helsinki/gtfs.zip \
           --out-tempt helsinki/readable.txt --out-gtfs-geom helsinki/geom.txt
```

The interval of dates is 30 days starting from and including the given date parameter.

This preprocesses [GTFS data](http://dev.hsl.fi/) in `helsinki/gtfs.zip`, stores (somewhat) human-readable transit schedules in `helsinki/readable.txt` and (if the last, optional argument is passed) compresses original route polyline coordinates into `helsinki/geom.txt`.

### Step 3: Compress schedule data.

```sh
node lr.js --in-tempt helsinki/readable.txt --out-trans helsinki/trans.txt
```

### Step 4: Preprocess map data.

```sh
node lr.js --in-tempt helsinki/readable.txt --in-pbf helsinki/osm.pbf \
           --out-map helsinki/map-big.txt
```

This reads the previously stored transit data to get the coordinates of transit stops used to guess the area relevant to routing. Then it extracts [the map data in PBF format](http://download.geofabrik.de/europe/finland.html), applies basic compression and stores it in `helsinki-map.txt`.

### Step 5: (Optionally) compress map data.

```sh
node lr.js --in-map helsinki/map-big.txt --out-map helsinki/map.txt \
           --map-round 5 --compress-map
```

Note that the parameter `--compress-map` needs to be last.

### Step 6: Calculate routes! (Debug output for now)

```sh
node lr.js -M helsinki/map.txt -T helsinki/trans.txt \
           -f 60.1688,24.9412 -t 60.3093,24.5141 \
           -D 2013-12-03 -d 08:00
```

## Library structure

API uses two global objects, `gis` and `reach`. `gis` has some general-purpose
functions, while `reach` is related to public transit. The main class to access data
is `reach.trans.TransSet`. It has members `stopSet`, `lineSet` and `tripSet` for all
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
