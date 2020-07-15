import requests
import base64
import json
import argparse
import time

with open('./myCredentials.json') as json_file:
    credentials = json.load(json_file)
    zones = {
        "PKIN": credentials["id"] + "-IE-PARKING",
        "PKOUT": credentials["id"] + "-IE-PARKING",
        "PEDEVT": credentials["id"] + "-IE-PEDESTRIAN",
        "TFEVT": credentials["id"] + "-IE-TRAFFIC",
        "BICYCLE": credentials["id"] + "-IE-BICYCLE",
        "HUMIDITY": credentials["id"] + "-IE-ENVIRONMENTAL",
        "PRESSURE": credentials["id"] + "-IE-ENVIRONMENTAL",
        "TEMPERATURE": credentials["id"] + "-IE-ENVIRONMENTAL",
        "METROLOGY": credentials["id"] + '-IC-METROLOGY',
        "ENERGY_TIMESERIES": credentials["id"] + '-IC-EN_TIMESERIES',
        "IMAGE": credentials["id"] + "-IE-IMAGE",
        "VIDEO": credentials["id"] + "-IE-VIDEO"
    }


class CityIq(object):
    # # Set up
    def __init__(self, tenantName):
        try:
            self.tenant = credentials
        except KeyError:
            raise Exception("Tenant string specified is not in credentials.py")
        self.token = None
        self.assets = None
        self.locations = None
        self.events = None
        self.bbox = self.tenant["bbox"]

    # # fetching token - only time to use UAA url

    def fetchToken(self):
        headers = {'Authorization': 'Basic ' +
                   (base64.b64encode(bytes(self.tenant["client"], 'ascii'))).decode('ascii')}
        response = requests.request("GET", self.tenant["uaa"], headers=headers)
        self.token = response.json()["access_token"]

    def setToken(self, token):
        self.token = token

    def getToken(self):
        return self.token

    # # bbox set up * optional, can be an input to make manipulating large amounts of nodes easier
    def setBbox(self, bbox):
        self.bbox = bbox

    def getBbox(self):
        return self.bbox

    # # gets the assets or locations by the input parameter filters
    # # path must be "assets" OR "locations"
    # # zone must be "parking", "traffic" "pedestrian" environment" "bicycle" - as seen in credentials.py
    # # filterQ is optional but recommended:
    # #     filterQ is the payload associated to q= in the params.  This can be :
    # #     "eventTypes:PKIN","eventTypes:PKOUT","eventTypes:PEDEVT", etc...
    # #     "assetType:NODE", "assetType:CAMERA", "assetType:ENV_SENSOR", etc...
    # # page is the page# you are querying (starting with 0)
    # # size is the number of assets to apppear on a page
    def fetchMetadata(self, path, filterQ=None, page=0, size=100):
        if self.token is not None:
            query = {
                "bbox": self.bbox,
                "size": str(size),
                "page": str(page)
            }
            if filterQ is not None:
                query["q"] = filterQ
            headers = {'Authorization': 'Bearer ' + self.token,
                       'Predix-Zone-Id': zones["TFEVT"]}
            response = requests.request(
                "GET", self.tenant["metadataService"]+"/"+path+"/search", headers=headers, params=query)

            try:
                # assigns differently depending on if assets or locations
                if path == "assets":
                    self.assets = response.json()["content"]
                else:
                    self.locations = response.json()["content"]

                # informs of more metadata available
                if response.json()["totalElements"] > response.json()["numberOfElements"]:
                    print("More Metadata assets are available for this query.")
                    print("TotalElements: " + str(response.json()[
                          "totalElements"]) + ". Your specified size: " + str(response.json()["size"]))
            except:
                print("Error when fetching metadata")
                print(self.tenant["metadataService"]+"/"+path+"/search")
                print(response, "\n\n")

            return response
        else:
            print("Token required to fetch metadata")

    def getAssets(self):
        return self.assets

    def getLocations(self):
        return self.locations

    # # fetches Events and saves to self.events
    # # path can be "assets" OR "locations"
    # # Uid is the assetUid or locationUid
    # # evType is the eventType as a string i.e. "PKIN"
    # # startTime is time since epoch in milliseconds
    # # endtime is time since epoch in milliseconds
    # # pageLimit is the number of elements response is restricted to
    # # pageOffset is the page you are asking for (default is 0 )

    def fetchEvents(self, path, Uid, evType, startTime, endTime, pageNumber=0, pageSize=1000):
        if self.token is not None:

            # set the query
            query = {
                "pageLimit": str(pageSize),
                "pageOffset": str(pageNumber),
                "eventType": evType,
                "startTime": startTime,
                "endTime": endTime
            }
            headers = {'Authorization': 'Bearer ' +
                       self.token, 'predix-zone-id': zones[evType]}
            response = requests.request(
                "GET", self.tenant["eventService"]+"/"+path+"/"+Uid+"/events", headers=headers, params=query)
            try:
                # sets the content to events
                self.res = response.json()
                self.events = self.res["content"]
                details = self.res["pagination"]
                # informs on pageSize exceeded
                if int(details["totalPages"]) > int(details["pageOffset"]):
                    print("There are a total of " +
                          str(details["totalRecords"])+" events in this timeframe")
                    print("You are can query for " +
                          str(details["totalPages"] - 1)+" more pages of "+ str(details["pageLimit"])+" events each")

                return response
            except Exception as e:
                print("fetchEvents Failed")
                print(response)
                print(e)
                return response

    def getEvents(self):
        return self.events

# for testing purposes


def main(args):
    # use for testing, call above functions here to execute from command line
    return

# for testing purposes


def parse_args():
    '''parse args'''
    parser = argparse.ArgumentParser()
    # put your parser.add_arguments(..) here
    return parser.parse_args()


if __name__ == '__main__':
    main(parse_args())
