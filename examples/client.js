/**
 * OSC Client Example (CommonJS)
 * 
 * This example demonstrates how to create an OSC client and send messages
 * using the Message class with callbacks.
 * 
 * To run this example:
 * 1. Start the server: node examples/server.js
 * 2. Run this client: node examples/client.js
 */

'use strict';
const { Client, Message } = require('node-osc');

// Create a client connected to localhost on port 3333
const client = new Client('127.0.0.1', 3333);

// Create a message using the Message class
const message = new Message('/address');
message.append('testing');  // Append a string
message.append('testing');  // Append another string
message.append(123);        // Append an integer

// Send the message with a callback
client.send(message, (err) => {
  if (err) {
    console.error(new Error(err));
  }
  // Always close the client when done
  client.close();
});

// Alternative ways to send messages:

// Method 1: Send address and arguments directly
// client.send('/address', 'testing', 'testing', 123);

// Method 2: Create message with constructor arguments
// const msg = new Message('/address', 1, 2, 3);
// client.send(msg);
