/**
 * OSC Server Example (CommonJS)
 * 
 * This example demonstrates how to create an OSC server that listens for
 * incoming messages and displays them along with sender information.
 * 
 * To run this example:
 * 1. Start this server: node examples/server.js
 * 2. Send messages from client: node examples/client.js
 */

'use strict';
var { Server } = require('node-osc');

// Create a server listening on port 3333, bound to all interfaces
var oscServer = new Server(3333, '0.0.0.0');

// Listen for incoming OSC messages
oscServer.on('message', function (msg, rinfo) {
  // msg is an array: [address, ...arguments]
  console.log(`Message: ${msg}\nReceived from: ${rinfo.address}:${rinfo.port}`);
  
  // Close the server after receiving one message (for demo purposes)
  oscServer.close();
});
