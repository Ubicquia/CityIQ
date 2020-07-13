const fs = require('fs')
const cityiq = require('../../cityiq.js')


// myCredentials.js contains all the necessary credentials for reference
const credentials = require("../../../myCredentials.json")

let ciq

let dates = []
process.argv.forEach((val, i) => {
    if (i >= 2) dates.push(val)
});


const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function findDataPoint(event, timestamp) {
    let value = {}
    let diff = Math.round((event.timestamp - timestamp) / event.properties.deltaBaseTimeInMilliseconds)
    if (diff > 0 && Object.keys(event.measures).length > diff) {
        value.value = event.measures['value' + diff]
        value.timestamp = event.timestamp + (diff * event.properties.deltaBaseTimeInMilliseconds)
    } else {
        value.value = (event.measures.value !== undefined) ? event.measures.value : event.measures.value1
        value.timestamp = event.timestamp
    }
    return value
}

async function init() {
    ciq = await cityiq(credentials)

    if (dates.length < 0 && dates === undefined) console.log("please enter timestamps")
    else if ((dates.length == 2) && (dates[1] - dates[0] > (35 * 24 * 60 * 60000))) console.log("please enter a time range less than 35 days")
    else if ((dates.length == 2) && (dates[0] > dates[1])) console.log("Please reverse the order of timestamps")
    else {

        let startTs = parseInt(dates[0])
        let endTs = parseInt(dates[1])
        let start = new Date(startTs)
        let end = new Date(endTs)

        start = `${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`
        end = `${end.getFullYear()}-${end.getMonth() + 1}-${end.getDate()}`

        console.log(`Getting total energy consumed from ${start} to ${end}`)

        let tsHeading = `Asset,Coordinates,Start Day Of the Week,Start Date Time (UTC),Start Timestamp,End Day Of the Week,End Date Time (UTC),End Timestamp,deltaTime(hours),CIQ EventType,unit,total energy consumption for this deltaTime  \n`
        fs.writeFileSync(`ENERGY_TIMESERIES_${start}_${end}.csv`, tsHeading)

        ciq.assets('EM_SENSOR').then(async sensors => {
            for (let sensor of sensors) {
                sleep(2000)
                let allEvents = (await ciq.events(sensor.assetUid, 'assetUid', 'ENERGY_TIMESERIES', startTs, endTs))
                if ((allEvents !== undefined) && (allEvents.length > 1)) {
                    let firstDataPoint = findDataPoint(allEvents[0], startTs)
                    let lastDataPoint = findDataPoint(allEvents[allEvents.length - 1], endTs)

                    let deltaTime = (lastDataPoint.timestamp - firstDataPoint.timestamp) / 3600000

                    let tsResult = `${sensor.assetUid},"${sensor.coordinates}",${(new Date(firstDataPoint.timestamp)).toUTCString()},${firstDataPoint.timestamp},`
                        + `${(new Date(lastDataPoint.timestamp)).toUTCString()},${lastDataPoint.timestamp},${deltaTime},ENERGY_TIMESERIES,kWh,`

                    let peaks = []
                    for (let i = 0; i < (allEvents.length - 1); i++) {
                        let keys = Object.keys(allEvents[i].measures)
                        let eventValue = (allEvents[i].measures.value !== undefined) ? allEvents[i].measures.value : allEvents[i].measures['value' + keys.length]
                        let nextEventValue = (allEvents[i + 1].measures.value !== undefined) ? allEvents[i + 1].measures.value : allEvents[i + 1].measures.value1
                        if ((eventValue !== undefined) && (nextEventValue !== undefined) && (eventValue > nextEventValue)) {
                            peaks.push(eventValue)
                        }

                    }

                    if ((peaks.length > 0) && (peaks !== undefined)) {
                        tsResult += `${(parseFloat((peaks.reduce((aggr, val) => aggr + val, 0) + lastDataPoint.value - firstDataPoint.value) * 0.0001)).toFixed(4)}\n`
                    } else {
                        tsResult += `${(parseFloat((lastDataPoint.value - firstDataPoint.value) * 0.0001)).toFixed(4)}\n`
                    }
                    fs.appendFileSync(`ENERGY_TIMESERIES_${start}_${end}.csv`, tsResult)
                    console.log(`${sensor.assetUid} - success`)
                } else {
                    console.log(`${sensor.assetUid} - insufficient events`)
                }
            }

        }).catch(err => console.log(err))
    }
}

init()


