const fs = require('fs')
const cityiq = require("./cityiq.js")

// myCredentials.js contains all the necessary credentials for reference
const credentials = require("./myCredentials.json")

// this function is where queries can be specified.  
async function traffic() {
    console.log('obtaining traffic data')
    // specifies the credentials and begins authentication - see cityiq.js
    let ciq = await cityiq(credentials)

    /* To Learn more about how the ciq.assets, ciq.locations and ciq.events functions work, 
    please reference cityiq.js*/

    //obtaining traffic data by eventTypes
    let assets = await ciq.assets('TFEVT')
    console.log(assets[0]) // returns the first asset found

    // return all traffic events in last 12 hours related to the assetUid found above
    let events = await ciq.events('1d873cf3-df13-4ddb-a83a-8f3297650c64', 'assetUid', 'TFEVT', (new Date()).getTime() - (1 * 60 * 6000))
    // let events = await ciq.events(assets[0].assetUid,'assetUid','TFEVT',(new Date()).getTime() - (24 * 60 * 6000))
    
    console.log("writing all TRAFFIC events from the last 24 hours for asset: " + assets[0].assetUid)
    fs.writeFileSync('traffic-test.json', JSON.stringify(events, null, 2))

    // return the first traffic lane location found within the tenant bounding box
    let location = await ciq.locations('TRAFFIC_LANE')
    console.log(location[0])
}

// instantiates demo function to run queries
traffic()