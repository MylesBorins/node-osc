// Example: Using promises with node-osc Client and Server
import { Client, Server } from 'node-osc';

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

  // Create client and send messages
  const client = new Client('127.0.0.1', 3333);
  
  try {
    // Send messages using promises
    await client.send('/hello', 'world');
    console.log('Message 1 sent');
    
    await client.send('/test', 42, true, 'string');
    console.log('Message 2 sent');
    
    await client.send(['/array', 1, 2, 3]);
    console.log('Message 3 sent');
    
    // Clean up using promises
    await client.close();
    console.log('Client closed');
    
    await server.close();
    console.log('Server closed');
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
