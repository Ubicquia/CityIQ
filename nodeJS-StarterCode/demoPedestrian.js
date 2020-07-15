const fs = require('fs')
const cityiq = require("./cityiq.js")

// myCredentials.js contains all the necessary credentials for reference
const credentials = require("./myCredentials.json")


// this function is where queries can be specified.  
async function pedestrian() {
    console.log('obtaining pedestrian data')
    // specifies the credentials and begins authentication - see cityiq.js
    let ciq = await cityiq(credentials)

    //obtaining pedestrian data by eventTypes
    let assets = await ciq.assets( 'PEDEVT')
    console.log(assets[0]) // returns the first asset found

    // return all WALKwAY locations within the tenant bounding box
    let location = await ciq.locations( 'WALKWAY')
    console.log(location)

    // return all pedestrian events in last 24 hours related to the assetUid found above    
    let events = await ciq.events( assets[0].assetUid, 'assetUid', 'PEDEVT',(new Date()).getTime() - (24 * 60 * 6000))
    console.log("writing all PEDESTRIAN events from the last 24 hours for asset: " + assets[0].assetUid)
    fs.writeFileSync('pedestrian-test.json', JSON.stringify(events, null, 2))

}

// instantiates demo function to run queries
pedestrian()