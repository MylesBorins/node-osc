# node-osc

A no frills [Open Sound Control](http://opensoundcontrol.org) client and server.
Heavily inspired by [pyOSC](https://trac.v2.nl/wiki/pyOSC).

## Installation

Install using npm

```bash
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

- 📚 **[API Documentation](./docs/API.md)** - Complete API reference generated from source code
- 📖 **[Examples](./examples/)** - Working examples for various use cases

## Compatibility

Written using ESM, supports CJS.

Supports the latest versions of Node.js 20, 22, and 24 in both ESM + CJS.

## TypeScript

TypeScript type definitions are included! No need to install `@types/node-osc`.

The types are automatically generated from JSDoc comments during the build process and included with the package. A single `.d.mts` type definition format is provided that works for both ESM and CommonJS consumers.

**Note:** If you previously installed `@types/node-osc`, you should uninstall it to avoid conflicts:
```bash
npm uninstall @types/node-osc
```

## More Examples

### Sending with async/await

```js
import { Client } from 'node-osc';

const client = new Client('127.0.0.1', 3333);
await client.send('/oscAddress', 200);
await client.close();
```

### Sending with callbacks

```js
import { Client } from 'node-osc';

const client = new Client('127.0.0.1', 3333);
client.send('/oscAddress', 200, () => {
  client.close();
});
```

### Listening for OSC messages

```js
import { Server } from 'node-osc';

const oscServer = new Server(3333, '0.0.0.0', () => {
  console.log('OSC Server is listening');
});

oscServer.on('message', function (msg) {
  console.log(`Message: ${msg}`);
});
```

### Sending OSC bundles

```js
import { Bundle, Client } from 'node-osc';

const bundle = new Bundle(['/one', 1], ['/two', 2], ['/three', 3]);
const client = new Client('127.0.0.1', 3333);
await client.send(bundle);
await client.close();
```

### Listening for OSC bundles

```js
import { Server } from 'node-osc';

const oscServer = new Server(3333, '0.0.0.0', () => {
  console.log('OSC Server is listening');
});

oscServer.on('bundle', function (bundle) {
  bundle.elements.forEach((element) => {
    console.log(`Timestamp: ${bundle.timetag}`);
    console.log(`Message: ${element}`);
  });
});
```

### Low-Level Encoding and Decoding

For advanced use cases, you can directly encode and decode OSC messages:

```js
import { Message, encode, decode } from 'node-osc';

// Encode a message to binary
const message = new Message('/oscillator/frequency', 440);
const buffer = encode(message);

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

See the **[API Documentation](./docs/API.md)** for complete details.

## CommonJS

Both callback and promise-based APIs work with CommonJS!

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

## Examples

See the [examples](./examples/) directory for more usage examples:
- [client.js](./examples/client.js) - CommonJS client example
- [server.js](./examples/server.js) - CommonJS server example
- [esm.mjs](./examples/esm.mjs) - ESM example with callbacks
- [async-await.mjs](./examples/async-await.mjs) - ESM example with async/await
- [bundle-example.mjs](./examples/bundle-example.mjs) - Working with bundles
- [error-handling.mjs](./examples/error-handling.mjs) - Error handling patterns

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Apache-2.0

**Note:** This project was relicensed from LGPL-3.0-or-later to Apache-2.0 in December 2025.
