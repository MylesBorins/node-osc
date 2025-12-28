// Example: Using async/await with node-osc Client and Server (ESM)
import { once } from "node:events";
import { setImmediate } from "node:timers/promises";
import { Client, Server } from "node-osc";

// Create and start server
const server = new Server(3333, "0.0.0.0");
await once(server, "listening");

console.log("OSC server listening on port 3333");

// Receive messages
server.on("message", (msg) => {
  const [address, ...args] = msg;
  console.log("Received:", address, args);
});

// Create client
const client = new Client("127.0.0.1", 3333);

// Send messages
await client.send("/hello", "world");
console.log("Sent /hello");

await Promise.all([
  client.send("/counter", 1),
  client.send("/counter", 2),
  client.send("/counter", 3),
]);
console.log("Sent counters");

// Allow socket I/O to be processed
await setImmediate();

// Clean shutdown
await client.close();
await server.close();

console.log("Client and server closed");
