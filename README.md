# node-osc

A no frills [Open Sound Control](http://opensoundcontrol.org) client and server.
Heavily inspired by [pyOSC](https://trac.v2.nl/wiki/pyOSC).

## Installation

Install using npm

```
npm install node-osc
```

## Features

- 🚀 Simple and intuitive API
- 🔄 Both callback and async/await support
- 📦 Send and receive OSC messages and bundles
- 🌐 Works with both ESM and CommonJS
- 📘 TypeScript type definitions included (generated from JSDoc)
- 📝 Comprehensive documentation and examples
- ✅ Well tested and actively maintained

## Quick Start

### Sending Messages

```js
import { Client } from 'node-osc';

const client = new Client('127.0.0.1', 3333);
await client.send('/oscAddress', 200);
await client.close();
```

### Receiving Messages

```js
import { Server } from 'node-osc';

const server = new Server(3333, '0.0.0.0');

server.on('message', (msg) => {
  console.log(`Message: ${msg}`);
});
```

## Documentation

📚 **[Full API Documentation](./API.md)** - Comprehensive guide to all features

## Compatibility

Written using ESM supports CJS

Supports the latest versions of Node.js 20, 22, and 24 in both ESM + CJS

## Examples

### Sending OSC messages with callbacks:

```js
import { Client } from 'node-osc';

const client = new Client('127.0.0.1', 3333);
client.send('/oscAddress', 200, () => {
  client.close();
});
```

### Sending OSC messages with async/await:

```js
import { Client } from 'node-osc';

const client = new Client('127.0.0.1', 3333);
await client.send('/oscAddress', 200);
await client.close();
```
  
### Listening for OSC messages with callbacks:

```js
import { Server } from 'node-osc';

var oscServer = new Server(3333, '0.0.0.0', () => {
  console.log('OSC Server is listening');
});

oscServer.on('message', function (msg) {
  console.log(`Message: ${msg}`);
  oscServer.close();
});
```

### Listening for OSC messages with async/await:

```js
import { Server } from 'node-osc';

const oscServer = new Server(3333, '0.0.0.0');

await new Promise((resolve) => {
  oscServer.on('listening', () => {
    console.log('OSC Server is listening');
    resolve();
  });
});

oscServer.on('message', function (msg) {
  console.log(`Message: ${msg}`);
});

// Later...
await oscServer.close();
```

### Sending OSC bundles:

```js
import { Bundle, Client } from 'node-osc';

// a bundle without an explicit time tag
const bundle = new Bundle(['/one', 1], ['/two', 2], ['/three', 3]);

// a bundle with a timetag of 10
bundle.append(new Bundle(10, ['/four', 4]));

const client = new Client('127.0.0.1', 3333);
client.send(bundle));
```

### Listening for OSC bundles:

```js
import { Server } from 'node-osc';

var oscServer = new Server(3333, '0.0.0.0', () => {
  console.log('OSC Server is listening');
});

oscServer.on('bundle', function (bundle) {
  bundle.elements.forEach((element, i) => {
    console.log(`Timestamp: ${bundle.timetag[i]}`);
    console.log(`Message: ${element}`);
  });
  oscServer.close();
});
```

### CJS API

Both callback and promise-based APIs work with CommonJS!

#### With callbacks:

```js
const { Client, Server } = require('node-osc');

const client = new Client('127.0.0.1', 3333);
var server = new Server(3333, '0.0.0.0');

server.on('listening', () => {
  console.log('OSC Server is listening.');
})

server.on('message', (msg) => {
  console.log(`Message: ${msg}`);
  server.close();
});

client.send('/hello', 'world', (err) => {
  if (err) console.error(err);
  client.close();
});
```

#### With async/await:

```js
const { Client, Server } = require('node-osc');

async function main() {
  const server = new Server(3333, '0.0.0.0');
  const client = new Client('127.0.0.1', 3333);

  await new Promise((resolve) => {
    server.on('listening', resolve);
  });

  server.on('message', (msg) => {
    console.log(`Message: ${msg}`);
  });

  await client.send('/hello', 'world');
  await client.close();
  await server.close();
}

main();
```

## Advanced Usage

### Working with Bundles

OSC bundles allow you to send multiple messages atomically:

```js
import { Bundle, Client } from 'node-osc';

const bundle = new Bundle(
  ['/synth/frequency', 440],
  ['/synth/amplitude', 0.5],
  ['/synth/gate', 1]
);

const client = new Client('127.0.0.1', 3333);
await client.send(bundle);
await client.close();
```

### Address-Specific Listeners

Listen for specific OSC addresses:

```js
import { Server } from 'node-osc';

const server = new Server(3333, '0.0.0.0');

// Listen for messages to specific address
server.on('/note', (msg) => {
  const [address, pitch, velocity] = msg;
  console.log(`Note: ${pitch}, Velocity: ${velocity}`);
});
```

### Error Handling

Always handle errors appropriately:

```js
const client = new Client('127.0.0.1', 3333);

try {
  await client.send('/test', 123);
} catch (err) {
  console.error('Failed to send:', err.message);
} finally {
  await client.close();
}
```

### Low-Level Encoding and Decoding

For advanced use cases, you can directly encode and decode OSC messages:

```js
import { Message, encode, decode } from 'node-osc';

// Encode a message to binary
const message = new Message('/oscillator/frequency', 440);
const buffer = encode(message);

// Send over custom transport (WebSocket, file, etc.)
console.log('Encoded bytes:', buffer.length);

// Decode binary data back to a message
const decoded = decode(buffer);
console.log('Address:', decoded.address);
console.log('Value:', decoded.args[0].value);
```

This is useful for:
- Sending OSC over non-UDP transports (WebSocket, TCP, HTTP)
- Storing OSC messages to files or databases
- Testing and debugging OSC implementations
- Building custom OSC routers or processors

## API Overview

- **`Client`** - Send OSC messages and bundles
  - `new Client(host, port)` - Create a client
  - `send(...args)` - Send a message or bundle
  - `close()` - Close the client

- **`Server`** - Receive OSC messages and bundles
  - `new Server(port, host, callback)` - Create a server
  - `on('message', callback)` - Listen for messages
  - `on('bundle', callback)` - Listen for bundles
  - `close()` - Close the server

- **`Message`** - Construct OSC messages
  - `new Message(address, ...args)` - Create a message
  - `append(arg)` - Add arguments

- **`Bundle`** - Group multiple messages
  - `new Bundle(timetag, ...elements)` - Create a bundle
  - `append(element)` - Add messages or nested bundles

- **`encode(message)`** - Encode OSC messages/bundles to binary
  - Convert Message or Bundle to Buffer for transmission

- **`decode(buffer)`** - Decode OSC binary data
  - Parse Buffer into Message or Bundle object

For complete API documentation, see **[API.md](./API.md)**.

## Troubleshooting

### Messages Not Being Received

1. **Check firewall settings** - Ensure UDP port is open
2. **Verify host binding** - Use `'0.0.0.0'` to listen on all interfaces
3. **Check port numbers** - Ensure client and server use the same port
4. **Network connectivity** - Test with localhost first (`127.0.0.1`)

### "Cannot send message on closed socket"

This error occurs when trying to send after closing the client:

```js
// ❌ Wrong
await client.close();
await client.send('/test', 123); // Error!

// ✅ Correct
await client.send('/test', 123);
await client.close();
```

### Server Not Listening

Ensure you wait for the server to start:

```js
const server = new Server(3333, '0.0.0.0');

// Wait for server to be ready
await new Promise(resolve => server.on('listening', resolve));

// Now safe to send messages
console.log('Server ready!');
```

## TypeScript

TypeScript type definitions are included! No need to install `@types/node-osc`.

The types are automatically generated from JSDoc comments during the build process and included with the package. Both ESM and CommonJS type definitions are provided. TypeScript will automatically use them when you import from `node-osc`.

**Note:** If you previously installed `@types/node-osc`, you should uninstall it to avoid conflicts:
```bash
npm uninstall @types/node-osc
```

```typescript
import { Client, Server, Message, Bundle } from 'node-osc';

const client = new Client('127.0.0.1', 3333);
await client.send('/test', 1, 2, 3);
await client.close();
```  

## Examples

See the [examples](./examples/) directory for more usage examples:
- [client.js](./examples/client.js) - CommonJS client example
- [server.js](./examples/server.js) - CommonJS server example
- [esm.mjs](./examples/esm.mjs) - ESM example with callbacks
- [async-await.mjs](./examples/async-await.mjs) - ESM example with async/await

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Apache-2.0

**Note:** This project was relicensed from LGPL-3.0-or-later to Apache-2.0 in December 2025.
