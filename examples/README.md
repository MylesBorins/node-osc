# node-osc Examples

This directory contains examples demonstrating various ways to use the node-osc library.

## Running the Examples

### CommonJS Examples

Run the server in one terminal:
```bash
node examples/server.js
```

Run the client in another terminal:
```bash
node examples/client.js
```

### ESM Examples

Run the callback-based example:
```bash
node examples/esm.mjs
```

Run the async/await example:
```bash
node examples/async-await.mjs
```

## Examples Overview

### [server.js](./server.js)
**CommonJS Server Example**

Demonstrates:
- Creating an OSC server with CommonJS
- Listening for messages
- Displaying remote client information
- Closing the server after receiving a message

```bash
node examples/server.js
```

### [client.js](./client.js)
**CommonJS Client Example**

Demonstrates:
- Creating an OSC client with CommonJS
- Building messages with the Message class
- Sending messages with callbacks
- Multiple ways to send messages (commented examples)

```bash
node examples/client.js
```

### [esm.mjs](./esm.mjs)
**ESM with Callbacks Example**

Demonstrates:
- Using node-osc with ES modules
- Callback-based API
- Server event listeners
- Client sending with callbacks

```bash
node examples/esm.mjs
```

### [async-await.mjs](./async-await.mjs)
**ESM with Async/Await Example**

Demonstrates:
- Modern async/await patterns
- Using `node:events.once()` to wait for server ready
- Sending multiple messages in parallel with `Promise.all()`
- Clean shutdown of both client and server
- Complete end-to-end workflow

This is the recommended pattern for new projects.

```bash
node examples/async-await.mjs
```

Expected output:
```
OSC server listening on port 3333
Sent /hello
Sent counters
Received: /hello [ 'world' ]
Received: /counter [ 1 ]
Received: /counter [ 2 ]
Received: /counter [ 3 ]
Client and server closed
```

## Creating Your Own Examples

### Basic Client-Server Pattern

**Server (server.mjs):**
```javascript
import { Server } from 'node-osc';

const server = new Server(3333, '0.0.0.0');

server.on('listening', () => {
  console.log('Server ready on port 3333');
});

server.on('message', (msg, rinfo) => {
  const [address, ...args] = msg;
  console.log(`${address}: ${args.join(', ')}`);
});
```

**Client (client.mjs):**
```javascript
import { Client } from 'node-osc';

const client = new Client('127.0.0.1', 3333);

await client.send('/test', 1, 2, 3);
await client.close();
```

### Working with Bundles

**bundle-example.mjs:**
```javascript
import { Bundle, Client, Server } from 'node-osc';
import { once } from 'node:events';

// Start server
const server = new Server(3333, '0.0.0.0');
await once(server, 'listening');

// Handle bundles
server.on('bundle', (bundle) => {
  console.log(`Bundle with timetag: ${bundle.timetag}`);
  bundle.elements.forEach((msg, i) => {
    console.log(`  Message ${i + 1}:`, msg);
  });
});

// Create and send bundle
const client = new Client('127.0.0.1', 3333);

const bundle = new Bundle(
  ['/synth/freq', 440],
  ['/synth/amp', 0.5],
  ['/synth/gate', 1]
);

await client.send(bundle);

// Cleanup
await client.close();
await server.close();
```

### Error Handling Example

**error-handling.mjs:**
```javascript
import { Client, Server } from 'node-osc';

const server = new Server(3333, '0.0.0.0');

// Handle server errors
server.on('error', (err, rinfo) => {
  console.error(`Server error from ${rinfo.address}:${rinfo.port}`);
  console.error(err.message);
});

const client = new Client('127.0.0.1', 3333);

try {
  await client.send('/test', 123);
  console.log('Message sent successfully');
} catch (err) {
  console.error('Failed to send message:', err.message);
} finally {
  await client.close();
}

await server.close();
```

## Tips

1. **Always close resources**: Use try/finally or ensure you call `.close()` on clients and servers
2. **Wait for server ready**: Use the 'listening' event before sending messages
3. **Use async/await**: The async/await pattern is cleaner than callbacks for most use cases
4. **Handle errors**: Always implement error handling in production code
5. **Test locally first**: Start with `127.0.0.1` before trying network communication

## Further Reading

- [API Documentation](../API.md) - Complete API reference
- [OSC Specification](http://opensoundcontrol.org/spec-1_0) - Learn about the OSC protocol
- [README](../README.md) - Main project documentation
