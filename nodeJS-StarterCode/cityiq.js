// node fetch is required to establish requests
const fetch = require("node-fetch")
// btoa function is required to encode username and password
const btoa = str => new Buffer.from(str).toString('base64')

const pageSize = 1000
const pageNumber = 0
const eventTypes = ['PKIN', 'PKOUT', 'PEDEVT', 'BICYCLE', 'TFEVT', 'HUMIDITY', 'PRESSURE', 'TEMPERATURE', 'METROLOGY', 'ENERGY_TIMESERIES']
const mediaTypes = ['IMAGE', 'VIDEO']
const assetTypes = ['CAMERA', 'ENV_SENSOR', 'NODE', 'EM_SENSOR']
const locationTypes = ['PARKING_ZONE', 'TRAFFIC_LANE', 'WALKWAY']

// requests function formats requests via node.js
function request(url, headers, body) {
  let options = { headers: headers, body: body }
  return fetch(url, options).then(result => {
    if (result.status >= 400) return (result.statusText)
    else return result.text().then(txt => {
      try { return JSON.parse(txt) }
      catch (err) { return txt }
    })
  })
}

// cityiq main function to be called at least once in each demo.js file
module.exports = async function (tenant) {
  console.log('starting requests')
  /* establishing access by getting the client_token with uaa url 
     and username and password. 
     While this request is a basic auth request, the client token will be 
     used for bearer authentication. */
  const bearer = (await request(tenant.uaa, { authorization: 'Basic ' + btoa(tenant.client) }))
  const client_token = bearer.access_token

  const zones = {
    PKIN: tenant.id + "-IE-PARKING",
    PKOUT: tenant.id + "-IE-PARKING",
    PEDEVT: tenant.id + "-IE-PEDESTRIAN",
    TFEVT: tenant.id + "-IE-TRAFFIC",
    BICYCLE: tenant.id + "-IE-BICYCLE",
    HUMIDITY: tenant.id + "-IE-ENVIRONMENTAL",
    PRESSURE: tenant.id + "-IE-ENVIRONMENTAL",
    TEMPERATURE: tenant.id + "-IE-ENVIRONMENTAL",
    METROLOGY: tenant.id + '-IC-METROLOGY',
    ENERGY_TIMESERIES: tenant.id + '-IC-EN_TIMESERIES',
    IMAGE: tenant.id + "-IE-IMAGE",
    VIDEO: tenant.id + "-IE-VIDEO"
  }

  // this function searches assets by their content variables (i.e. assetType, eventTypes, mediaTypes, coordinates etc)
  async function assets(type, id) {
    // id variable can be null

    /** set the variables, query headers and query url will be specified here. 
     * Each request will be made in this function
     * options for eventTypes, mediaTypes and assetTypes are specified here
    */

    let query, headers, queryURL

    /**If statements specify each query for each search parameter. 
     * Default is to search assets by assetUid */
    if (eventTypes.includes(type)) {
      console.log('querying assets by eventTypes')
      query = '/assets/search?bbox=' + tenant.bbox + '&q=eventTypes:' + type + '&page=0&size=' + pageSize
    } else if (mediaTypes.includes(type)) {
      console.log('querying assets by mediaType')
      query = '/assets/search?bbox=' + tenant.bbox + '&q=mediaType:' + type + '&page=0&size=' + pageSize
    } else if (assetTypes.includes(type)) {
      console.log('querying assets by assetType')
      query = '/assets/search?bbox=' + tenant.bbox + '&q=assetType:' + type + '&page=0&size=' + pageSize
    } else if ((id !== undefined) && (['subAssets', 'locations'].includes(type))) {
      console.log('querying for ' + type + ' by uid')
      query = '/assets/' + id + '/' + type
    }
    else {
      console.log('querying by assetUid')
      query = '/assets/' + type
    }

    headers = { authorization: 'Bearer ' + client_token, 'predix-zone-id': zones['TFEVT'] }
    queryURL = tenant.metadataService + query
    console.log('Query URL: ' + queryURL)

    let response = (await request(queryURL, headers))
    // if content is not defined then return the response otherwise return the content.
    return (response.content === undefined) ? response : response.content

  }

  // this function searches locations by their content variables
  async function locations(type, coord = '-90:-180,90:180') {

    let query, headers, queryURL

    if (type === 'bbox') {
      console.log('querying locations by  bbox')
      query = '/locations/search?bbox=' + coord
    } else if (locationTypes.includes(type)) {
      console.log('querying locations by locationType')
      query = '/locations/search?bbox=' + coord + '&q=locationType:' + type
    } else if ((type == 'assets') && (!coord.includes(":"))) {
      console.log('querying for ' + type + ' by uid')
      query = '/locations/' + coord + '/' + type
    } else {
      console.log('querying locations by locationUid')
      query = '/locations/' + type
    }

    headers = { authorization: 'Bearer ' + client_token, 'predix-zone-id': zones['TFEVT'] }
    queryURL = tenant.metadataService + query
    console.log('Query URL: ' + queryURL)

    let response = (await request(queryURL, headers))
    return (response.content === undefined) ? response : response.content
  }

  async function events(id, idType, type, start, stop) {

    let query, headers, queryURL, span


    if (eventTypes.indexOf(type) <= 4) {
      if (idType == 'assetUid') {
        console.log('querying events by asset, eventTypes and time span')
        query = '/assets/' + id + '/events?eventType=' + type
      } else if (idType == 'locationUid') {
        console.log('querying events by locationUid, eventType, and time span')
        query = '/locations/' + id + '/events?eventType=' + type
      } else {
        console.log('querying events by location, eventType and time span')
        query = '/locations/events?eventType=' + type + '&bbox=' + tenant.bbox
      }
    } else if (eventTypes.indexOf(type) >= 5) {
      console.log('querying events by asset, eventTypes and time span')
      query = '/assets/' + id + '/events?eventType=' + type
    } else if (mediaTypes.includes(type)) {
      if (idType == 'assetUid') {
        console.log('querying events by asset, assetType and time span')
        query = '/assets/' + id + '/events?assetType=' + type
      } else if (idType == 'locationUid') {
        console.log('querying events by locationUid, assetType, and time span')
        query = '/locations/' + id + '/events?assetType=' + type
      } else {
        console.log('querying events by location, assetType and time span')
        query = '/locations/events?assetType=' + type + '&bbox=' + coord
      }
    } else {
      console.log('querying assets by externalRefId')
      query = '/assets/' + id + '/events?externalRefId=' + type
    }

    span = '&startTime=' + start + '&endTime=' + ((typeof (stop) == 'undefined') ? '9999999999999' : stop)
    headers = { authorization: 'Bearer ' + client_token, 'predix-zone-id': zones[type] }
    queryURL = tenant.eventService + query + span + '&pageOffset=' + pageNumber + '&pageLimit=' + pageSize
    console.log('Query URL: ' + queryURL)

    let response = (await request(queryURL, headers))
    if (response) {
      console.log("There are a total of " + response.pagination.totalRecords + " events in this timeframe")
      console.log("You are can query for " + (response.pagination.totalPages - 1) + " more pages of " + response.pagination.pageLimit + " events each")

    }
    return (response.content === undefined) ? response : response.content
  }





  return {
    assets: assets,
    locations: locations,
    events: events
  }
}

