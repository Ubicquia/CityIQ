const fs = require('fs')
const cityiq = require("./cityiq.js")

// myCredentials.js contains all the necessary credentials for reference
const credentials = require("../../myCredentials.json")


async function parking() {
    console.log('initiating demo')
    // specifies the credentials and begins authentication - see cityiq.js
    let ciq = await cityiq(credentials)

    console.log('obtaining parking data')

    /* using the assets function - querying using the metadata url for all assets with either 
    eventTypes, assetTypes or mediaTypes specified as the input to this function
    get the first asset that has a parking in event */
    let assets = await ciq.assets( 'PKIN')
    console.log(assets[0])


    // search for the asset above by searching by assetUid.  see the query printed to the console
    let uid = await ciq.assets( assets[0].assetUid)
    console.log(uid)

    // find uid's parent asset
    let parentUid
    if (uid.parentAssetUid !== undefined) { // undefined was in quotes
        parentUid = await ciq.assets( 'children', uid.parentAssetUid)
    } else {
        parentUid = await ciq.assets( uid.assetUid)
        console.log('uid found previously is a node')
    }
    console.log(parentUid)

    // get a recent asset by assetType
    let assetByType = await ciq.assets( 'CAMERA')
    console.log(assetByType[0])

    // get a recent asset by mediaType
    let assetByMediaType = await ciq.assets( 'IMAGE')
    console.log(assetByMediaType[0])

    /* using locations function - querying using the metadata url for all locations by locationType, 
    coordinatesType or locationUid.  For locationType and locationUid input first specifier.  
    For coordinates type, input ('GEO','{coordinates}') */
    let loc = await ciq.locations( 'PARKING_ZONE')
    console.log(loc[0])

    /* return all parking in events from the last 24 hours related to the camera asset found above
    timecalc is a function declared in cityiq.js. */
    let events = await ciq.events( assets[0].assetUid, 'assetUid', 'PKIN', (new Date()).getTime() - (24 * 60 * 6000))
    console.log("writing all PKIN events from the last 24 hours for asset: " + assets[0].assetUid)
    fs.writeFileSync('parking-test.json', JSON.stringify(events, null, 2))

}

// instantiates demo function to run queries
parking()