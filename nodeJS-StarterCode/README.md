This sample code uses node packages node-fetch , fs and ws (websocket demo only)
The sample code runs in the command line and saves the events in a json response locally

To recieve access, please contact your municipality for the appropriate credentials and replace them in myCredentials.js.
For more information about the simulated data, please visit: https://docs.cityiq.io

### Executing the demos

within this directory, run the following commands for each demo:

1.  parking demo: `node demoParking.js`
2. pedestrian demo: `node demoPedestrian.js`
3. traffic demo: `node demoTraffic.js`
4. bicycle demo: `node demoBicycle.js`
5. environmental demo: `node demoEnvironmental.js`

### Debug Tips

1. ensure node.js is in your path with commands like `node -v` and `npm -v`
2. in this directory run the follwoing node command to install all dependencies: `npm install`
3. update myCredentials.json in the root directory to reflect all info obtained after you accepted the eula aggreement (client id and secret, urls and predix zone ids)
