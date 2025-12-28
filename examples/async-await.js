// Example: Using async/await with node-osc Client and Server (CommonJS)
'use strict';
const { Client, Server } = require('node-osc');

async function main() {
  // Create server and wait for it to be ready
  const server = new Server(3333, '0.0.0.0');
  
  await new Promise((resolve) => {
    server.on('listening', () => {
      console.log('OSC Server is listening on port 3333');
      resolve();
    });
  });
  
  // Set up message handler
  server.on('message', (msg) => {
    console.log(`Message received: ${msg}`);
  });

  // Create client and send messages using async/await
  const client = new Client('127.0.0.1', 3333);
  
  try {
    // Send multiple messages sequentially
    await client.send('/hello', 'world');
    console.log('Message 1 sent');
    
    await client.send('/counter', 1);
    await client.send('/counter', 2);
    await client.send('/counter', 3);
    console.log('Counter messages sent');
    
    // Clean up
    await client.close();
    await server.close();
    console.log('Client and server closed');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
