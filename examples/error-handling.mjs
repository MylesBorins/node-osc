/**
 * OSC Error Handling Example
 * 
 * This example demonstrates proper error handling patterns with node-osc,
 * including handling server errors, client errors, and ensuring cleanup.
 * 
 * To run this example:
 * node examples/error-handling.mjs
 */

import { once } from "node:events";
import { Client, Server } from "node-osc";

console.log("=== OSC Error Handling Examples ===\n");

// Example 1: Server decode errors
console.log("1. Testing server decode error handling...");
const server = new Server(3333, "0.0.0.0");

// Set up error handler for server
server.on("error", (err, rinfo) => {
  console.error(`❌ Server error from ${rinfo.address}:${rinfo.port}`);
  console.error(`   ${err.message}`);
});

await once(server, "listening");
console.log("✅ Server started successfully\n");

// Example 2: Try/catch with async/await
console.log("2. Testing client send with try/catch...");
const client = new Client("127.0.0.1", 3333);

try {
  await client.send("/test", 123, "hello", true);
  console.log("✅ Message sent successfully\n");
} catch (err) {
  console.error(`❌ Failed to send message: ${err.message}\n`);
}

// Example 3: Error when sending on closed socket
console.log("3. Testing send on closed socket...");
await client.close();
console.log("   Client closed");

try {
  await client.send("/test", 456);
  console.log("✅ Message sent (this shouldn't happen)\n");
} catch (err) {
  console.log(`✅ Caught expected error: ${err.message}`);
  console.log(`   Error code: ${err.code}\n`);
}

// Example 4: Try/finally for cleanup
console.log("4. Testing try/finally for guaranteed cleanup...");
const client2 = new Client("127.0.0.1", 3333);

try {
  await client2.send("/cleanup/test", 789);
  console.log("✅ Message sent");
  
  // Simulate an error
  throw new Error("Simulated error");
} catch (err) {
  console.log(`⚠️  Caught error: ${err.message}`);
} finally {
  // This always runs, even if there was an error
  await client2.close();
  console.log("✅ Client closed in finally block\n");
}

// Example 5: Callback-based error handling
console.log("5. Testing callback-based error handling...");
const client3 = new Client("127.0.0.1", 3333);

await new Promise((resolve) => {
  client3.send("/callback/test", 999, (err) => {
    if (err) {
      console.error(`❌ Send error: ${err}`);
    } else {
      console.log("✅ Message sent via callback");
    }
    
    client3.close((err) => {
      if (err) {
        console.error(`❌ Close error: ${err}`);
      } else {
        console.log("✅ Client closed via callback\n");
      }
      resolve();
    });
  });
});

// Example 6: Multiple operations with proper error handling
console.log("6. Testing multiple operations with error handling...");
const client4 = new Client("127.0.0.1", 3333);

try {
  // Send multiple messages
  const results = await Promise.allSettled([
    client4.send("/multi/1", 1),
    client4.send("/multi/2", 2),
    client4.send("/multi/3", 3),
  ]);
  
  // Check results
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      console.log(`✅ Message ${i + 1} sent successfully`);
    } else {
      console.error(`❌ Message ${i + 1} failed: ${result.reason}`);
    }
  });
} catch (err) {
  console.error(`❌ Unexpected error: ${err.message}`);
} finally {
  await client4.close();
  console.log("✅ Client closed\n");
}

// Example 7: Server error event
console.log("7. Testing server message handling with error check...");
let messageReceived = false;

server.on("message", (msg) => {
  messageReceived = true;
  const [address, ...args] = msg;
  console.log(`✅ Received: ${address} with args: ${args.join(", ")}`);
});

const client5 = new Client("127.0.0.1", 3333);
await client5.send("/final/test", "done");
await client5.close();

// Wait a bit for message to be received
await new Promise(resolve => setTimeout(resolve, 100));

if (!messageReceived) {
  console.log("⚠️  Warning: Message was not received");
}

// Clean shutdown
await server.close();
console.log("\n✅ All tests complete, server closed");

console.log("\n=== Key Takeaways ===");
console.log("1. Always use try/catch with async/await");
console.log("2. Use try/finally to ensure cleanup");
console.log("3. Listen for 'error' events on servers");
console.log("4. Check for errors in callbacks");
console.log("5. Don't send on closed sockets");
console.log("6. Use Promise.allSettled for multiple operations");
