# localroute.js

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

## Useful API functions

* transSet=new reach.trans.TransSet();
* transSet.importData(transData);
* transSet.prepareDay(gis.util.Date.fromYMD(2013,10,4));
* lines=transSet.lineSet.find({name:'eira',code:'18'});
* stops=transSet.stopSet.find({name:'kamppi',lines:lines});
* arrivals=stops[0].getArrivals();

The prepareDay call filters all data so that "find" and "getArrivals" commands
return data for the selected day.

After the above commands, to print the stop timetable:
```js
arrivals.map(
	function(arrival) {
		console.log(
			~~(arrival.time/3600)+':'+
			gis.Q.zeroPad(~~(arrival.time/60)%60,2)+' '+
			arrival.trip.key.shortCode+' '+
			arrival.trip.key.sign);
		return(arrival.trip);
	}
);
```
Compare to [Official timetable](http://aikataulut.reittiopas.fi/pysakit/fi/1040112.html).

## Object properties

* stop.origId: Code shown to the public on the physical stop.
* stop.name
* stop.ll.toDeg(): Coordinates in WGS84 degrees, members llat and llon.
* stop.lineList, stop.posList: Lines passing by stop and stop's index in their stopList.

* line.stopList
* line.tripList

* trip.key.line
* trip.key.shortCode: For example bus number.
* trip.key.name: Typically list of important areas along the route, both directions usually have an identical name.
* trip.key.sign: Destination name visible in front of the vehicle.

* trip.valid: Bit mask when the trip is available, bit 0 is first day in data, bit 1 is second...
* trip.startTime: Departure time from first stop in seconds from midnight.
* trip.timeList: Departure/arrival times on all stops along the line.

## Examples

Print numbers of all lines that stop at Konemies:

```js
transSet.lineSet.find({
	stops:transSet.stopSet.find({name:'konemies'})
}).map(function(line) {
	return(line.tripList[0].key.shortCode)
})
```

## Structure of compressed data

* List of strings (names and codes), LZ77 compressed.
* Stop IDs, names (references to list of strings) and coordinates, delta encoded.
* Lines, encoded so that stops previously seen following the same predecessor are stored as indices into the predecessor's follower list.
* Keys: line names, codes and headsigns stored as references to list of strings.
* trips, grouped by valid day mask, delta encoded, LZ77 compressed.
