/**
 * OSC Bundle Example
 * 
 * This example demonstrates how to create and send OSC bundles.
 * Bundles allow you to group multiple messages together, optionally
 * with a timetag for synchronized processing.
 * 
 * To run this example:
 * node examples/bundle-example.mjs
 */

import { once } from "node:events";
import { setImmediate } from "node:timers/promises";
import { Bundle, Client, Message, Server } from "node-osc";

// Start server
const server = new Server(3333, "0.0.0.0");
await once(server, "listening");
console.log("Server listening on port 3333\n");

// Handle bundles specifically
server.on("bundle", (bundle, rinfo) => {
  console.log(`📦 Received bundle from ${rinfo.address}:${rinfo.port}`);
  console.log(`   Timetag: ${bundle.timetag}`);
  console.log(`   Elements: ${bundle.elements.length}`);
  
  // Process each element in the bundle
  bundle.elements.forEach((element, i) => {
    if (element.oscType === 'message') {
      const [address, ...args] = element;
      console.log(`   ${i + 1}. ${address}: ${args.join(', ')}`);
    } else if (element.oscType === 'bundle') {
      console.log(`   ${i + 1}. [Nested Bundle]`);
    }
  });
  console.log();
});

// Create client
const client = new Client("127.0.0.1", 3333);

// Example 1: Bundle without timetag (array notation)
console.log("Sending bundle without timetag...");
const bundle1 = new Bundle(
  ["/synth/freq", 440],
  ["/synth/amp", 0.5],
  ["/synth/gate", 1]
);
await client.send(bundle1);
await setImmediate();

// Example 2: Bundle with timetag
console.log("Sending bundle with timetag...");
const bundle2 = new Bundle(
  10,  // timetag
  ["/oscillator/1/freq", 220],
  ["/oscillator/2/freq", 330]
);
await client.send(bundle2);
await setImmediate();

// Example 3: Bundle with Message objects
console.log("Sending bundle with Message objects...");
const msg1 = new Message("/note", 60, 127);
const msg2 = new Message("/note", 64, 127);
const msg3 = new Message("/note", 67, 127);
const bundle3 = new Bundle(msg1, msg2, msg3);
await client.send(bundle3);
await setImmediate();

// Example 4: Nested bundles
console.log("Sending nested bundles...");
const innerBundle = new Bundle(["/inner/message", 123]);
const outerBundle = new Bundle(["/outer/message", 456]);
outerBundle.append(innerBundle);
await client.send(outerBundle);
await setImmediate();

// Example 5: Building a bundle incrementally
console.log("Sending incrementally built bundle...");
// Create bundle with initial element, then append more
const bundle5 = new Bundle(["/initial", 0]);
bundle5.append(["/control/1", 10]);
bundle5.append(["/control/2", 20]);
bundle5.append(["/control/3", 30]);
await client.send(bundle5);
await setImmediate();

// Clean shutdown
await client.close();
await server.close();
console.log("Done!");
