const fs = require('fs')
const cityiq = require("./cityiq.js")

// myCredentials.js contains all the necessary credentials for reference
const credentials = require("./myCredentials.json")


// this function is where queries can be specified.  
async function bicycle() {
    console.log('obtaining bicycle data')
    // specifies the credentials and begins authentication - see cityiq.js
    let ciq = await cityiq(credentials)

    //obtaining bicycle data by eventTypes
    let assets = await ciq.assets('BICYCLE')
    console.log(assets[0]) // returns the first asset found

    // return all bicycle events in last 24 hours related to the assetUid found above    
    let events = await ciq.events( assets[0].assetUid, 'assetUid', 'BICYCLE',(new Date()).getTime() - (24 * 60 * 6000))
    console.log("writing all BICYCLE events from the last 24 hours for asset: " + assets[0].assetUid)
    fs.writeFileSync('bicycle-test.json', JSON.stringify(events, null, 2))

}

// instantiates demo function to run queries
bicycle()