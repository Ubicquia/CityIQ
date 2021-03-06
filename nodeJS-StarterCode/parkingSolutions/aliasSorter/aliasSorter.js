// Note IoU function requires Clipper Library: clipper.js
// Please download clipper.js from https://github.com/junmer/clipper-lib and save in the aliasSorter Respository

const cityiq = require('../../cityiq.js')
const ClipperLib = require('./clipper.js.js.js')
const fs = require('fs')

const percentThreshold = 0.5 // overlap threshold - cityiq resolution is about half a vehicle
const timeThreshold = 180000  // debouncing period - 3 minuites
const endTime = new Date().getTime()
const startTime = endTime - (24 * 60 * 60000)

// myCredentials.js contains all the necessary credentials for reference
const credentials = require("../../../myCredentials.json")
let ciq
let state = {}

async function main() {
    // get token and give the rest access to cityiq.js 
    ciq = await cityiq(credentials)

    // get master list of locations and their subassets (for reference)
    locationSorter().then(locationList => {
        // get all the events for the locationList based off inputs from inputs.js and sort for alias'
        eventSorter(locationList).then(output => {
            fs.writeFile('aliasSorter-test.json', JSON.stringify(output, null, 2), err => { if (err != null) console.log('failed to save') })

        })
    })

}
main()

async function eventSorter(locationList) {
    let masterList = {}
    for (let i = 0; i < locationList.length; i++) {
        const a = locationList[i];

        // get events for locationList[i].locationUid using cityiq.js
        pkinEvents = await ciq.events(a.locationUid, 'locationUid', 'PKIN', startTime, endTime)
        pkoutEvents = await ciq.events(a.locationUid, 'locationUid', 'PKOUT', startTime, endTime)

        // sorting through whole list of ins to return a list of sequential ins
        parking = pkinEvents.concat(pkoutEvents).sort((a, b) => a.timestamp - b.timestamp)

        // update parking event list for locationList[i] to find alias' and assign them in the alias sub list
        parking.forEach(ev => {
            update_parking(state, ev, percentThreshold, timeThreshold)
        })
        // save info to masterList
        masterList[a.locationUid] = parking
    }
    return masterList

}

// async function to get the locations and their associated assets
async function locationSorter() {
    let locationList = await ciq.locations('PARKING_ZONE', credentials.bbox)
    // find all the locations associated with each asset on the list and record their coordinates
    for (let i = 0; i < locationList.length; i++) {
        const element = locationList[i];
        let foundAssets = (await ciq.locations('assets', element.locationUid)).assets
        let assetList = []

        foundAssets.forEach(element => {
            let first = true
            assetList.forEach(a => {
                if (a.parentAssetUid == element.parentAssetUid) {
                    first = false
                }
            });
            assetList.push({
                first,
                assetUid: element.assetUid,
                parentAssetUid: element.parentAssetUid,
                eventTypes: element.eventTypes,
                coordinates: element.coordinates
            })
        })

        locationList[i].assets = assetList
    }
    return locationList
}


// update location state object with next parking event, append pkin event with overlap details
function update_parking(state, event, percentThreshold, timeThreshold) {

    if ((event.eventType == 'PKIN') && (event != undefined)) {
        event.alias = []
        let location = event.properties.geoCoordinates.split(',').map(co => {
            let deg = co.split(':').map(txt => parseFloat(txt))
            return { lat: deg[0], lng: deg[1] }
        })

        Object.keys(state).forEach(key => {
            let over = IoU(location, state[key].location);
            let timeDifferenceSec = Math.round((event.timestamp - state[key].timestamp) / 1000)
            if ((over >= percentThreshold) && (timeDifferenceSec <= timeThreshold)) {
                uid = key.split(':')
                event.alias.push({
                    assetUid: uid[0], objectUid: uid[1], timestamp: state[key].timestamp, percentageOverlap: over,
                    timeDifferenceSec: timeDifferenceSec
                })
            }
        })

        state[event.assetUid + ':' + event.properties.objectUid] = { location: location, timestamp: event.timestamp }
    } else {
        delete state[event.assetUid + ':' + event.properties.objectUid]
    }


}

// return IoU of 2 zones defined as arrays of {lat,lng}	
function IoU(zone1, zone2) {
    let K = Math.cos(zone1[0].lat / 180 * Math.PI) // spherical correction
    let subj = zone1.map(pt => ({ X: pt.lng * 1.11e5 * K, Y: pt.lat * 1.11e5 })) // scale to meters
    let clip = zone2.map(pt => ({ X: pt.lng * 1.11e5 * K, Y: pt.lat * 1.11e5 })) // scale to meters

    let clipper = new ClipperLib.Clipper()
    clipper.AddPaths([subj], ClipperLib.PolyType.ptSubject, true)
    clipper.AddPaths([clip], ClipperLib.PolyType.ptClip, true)

    let intersect = new ClipperLib.Paths()
    clipper.Execute(ClipperLib.ClipType.ctIntersection, intersect)

    if (intersect.length > 0) {
        let over = surface(intersect[0])
        return Math.round(over / (surface(subj) + surface(clip) - over) * 100) // IoU %
    }
    else return 0
}



// return surface area of polygon defined as array of {X,Y} coordinates
function surface(zone) {
    let area = 0
    if (zone.length > 0) {
        let j = zone.length - 1
        for (let i = 0; i < zone.length; i++) {
            area += (zone[j].X + zone[i].X) * (zone[j].Y - zone[i].Y)
            j = i
        }
    }
    return -area / 2
}

async function assetLocationAssociation(zone, id, type) {
    let query, headers, queryURL
    headers = { authorization: 'Bearer ' + client_token, 'predix-zone-id': zone }

    if (type == 'locations') {
        console.log('getting locations associated with a specific assetUid: ' + id)
        query = '/v2/metadata/assets/' + id + '/' + type

        queryURL = tenant.metadataservice + query
        console.log('Query URL: ' + queryURL)
        let response = (await request(queryURL, headers))
        // reutrns a list of locations associated witht he input assetUid
        return (response.locations === undefined) ? response : response.locations

    } else if (type == 'assets') {
        console.log('getting assets associated with a specific locationUid: ' + id)
        query = query = '/v2/metadata/locations/' + id + '/' + type

        queryURL = tenant.metadataservice + query
        console.log('Query URL: ' + queryURL)
        let response = (await request(queryURL, headers))
        // returns a list of assets associated with the input locationUid
        return (response.assets === undefined) ? response : response.assets

    } else {
        console.log('incorrect type input')
    }
}