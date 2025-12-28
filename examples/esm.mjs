/**
 * OSC Client and Server Example (ESM with Callbacks)
 * 
 * This example demonstrates using node-osc with ES modules and callback-based API.
 * It shows how to create both a client and server, send messages, and handle events.
 * 
 * To run this example:
 * node examples/esm.mjs
 */

import { Client, Server } from 'node-osc';

// Create a client connected to localhost on port 3333
const client = new Client('127.0.0.1', 3333);

// Create a server listening on port 3333, bound to all interfaces
var server = new Server(3333, '0.0.0.0');

// Listen for when the server is ready
server.on('listening', () => {
  console.log('OSC Server is Listening');
});

// Listen for incoming messages
server.on('message', (msg, rinfo) => {
  // msg is an array: [address, ...arguments]
  console.log(`Message: ${msg}\nReceived from: ${rinfo.address}:${rinfo.port}`);
  
  // Close the server after receiving a message
  server.close();
});

// Send a message with callback-based API
client.send('/hello', 'world', (err) => {
  if (err) console.error(err);
  
  // Close the client after sending
  client.close();
});