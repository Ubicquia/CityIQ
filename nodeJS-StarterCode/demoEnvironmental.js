const fs = require('fs')
const cityiq = require("./cityiq.js")

// myCredentials.js contains all the necessary credentials for reference
const credentials = require("./myCredentials.json")

// this function is where queries can be specified.  
async function environmental() {
    console.log('obtaining environmental data')
    // specifies the credentials and begins authentication - see cityiq.js
    let ciq = await cityiq(credentials)

    /* To Learn more about how the ciq.assets, ciq.locations and ciq.events functions work, 
    please reference cityiq.js*/

    //obtaining environmental data by eventTypes  // please note - environmental data cannot be queried by locationtype
    let assets = await ciq.assets('TEMPERATURE')
    console.log(assets[0])

    // return all environmental events in the last timespan between 12hours ago and 3 hours ago   
    let events = await ciq.events(assets[0].assetUid, 'assetUid', 'TEMPERATURE', (new Date()).getTime() - (24 * 60 * 6000))
    console.log("writing all TEMPERATURE events from the last 24 hours for asset: " + assets[0].assetUid)
    fs.writeFileSync('environmental-test.json', JSON.stringify(events, null, 2))

}

// instantiates demo function to run queries
environmental()