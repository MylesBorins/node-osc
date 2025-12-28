/**
 * OSC Client and Server Example (ESM with Async/Await)
 * 
 * This is the recommended pattern for modern Node.js applications.
 * It demonstrates:
 * - Using async/await for cleaner async code
 * - Properly waiting for server to be ready
 * - Sending multiple messages in parallel
 * - Clean shutdown of resources
 * 
 * To run this example:
 * node examples/async-await.mjs
 */

// Example: Using async/await with node-osc Client and Server (ESM)
import { once } from "node:events";
import { setImmediate } from "node:timers/promises";
import { Client, Server } from "node-osc";

// Create server on all interfaces, port 3333
const server = new Server(3333, "0.0.0.0");

// Wait for server to be ready using once() - cleaner than event listeners
await once(server, "listening");

console.log("OSC server listening on port 3333");

// Set up message handler
// Messages arrive as arrays: [address, ...arguments]
server.on("message", (msg) => {
  const [address, ...args] = msg;
  console.log("Received:", address, args);
});

// Create client pointing to localhost
const client = new Client("127.0.0.1", 3333);

// Send a simple message
await client.send("/hello", "world");
console.log("Sent /hello");

// Send multiple messages in parallel using Promise.all()
await Promise.all([
  client.send("/counter", 1),
  client.send("/counter", 2),
  client.send("/counter", 3),
]);
console.log("Sent counters");

// Allow socket I/O to be processed before shutting down
await setImmediate();

// Clean shutdown - always close resources
await client.close();
await server.close();

console.log("Client and server closed");
