# node-osc API Documentation

This document provides comprehensive API documentation for the node-osc library.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [Client](#client)
  - [Server](#server)
  - [Message](#message)
  - [Bundle](#bundle)
- [Events](#events)
- [Error Handling](#error-handling)
- [Type System](#type-system)
- [Best Practices](#best-practices)

## Installation

```bash
npm install node-osc
```

## Quick Start

### Sending Messages

```javascript
import { Client } from 'node-osc';

const client = new Client('127.0.0.1', 3333);
await client.send('/test', 100, 'hello');
await client.close();
```

### Receiving Messages

```javascript
import { Server } from 'node-osc';

const server = new Server(3333, '0.0.0.0');

server.on('message', (msg) => {
  const [address, ...args] = msg;
  console.log(`${address}: ${args.join(', ')}`);
});
```

---

## API Reference

### Client

The `Client` class is used to send OSC messages and bundles to an OSC server over UDP.

#### Constructor

```javascript
new Client(host, port)
```

Creates a new OSC client.

**Parameters:**
- `host` (string): The hostname or IP address of the OSC server
- `port` (number): The port number of the OSC server

**Example:**
```javascript
const client = new Client('127.0.0.1', 3333);
const client2 = new Client('192.168.1.100', 8000);
```

#### Methods

##### `send(...args)`

Send an OSC message or bundle to the server.

**Parameters:**
- `...args`: Variable arguments, can be used in several ways:
  - `(address, ...values[, callback])` - Send a simple message
  - `(message, [callback])` - Send a Message object
  - `(bundle, [callback])` - Send a Bundle object
  - `(array, [callback])` - Send an array formatted as `[address, ...values]`

**Returns:**
- `Promise<void>` if no callback is provided
- `undefined` if callback is provided

**Throws:**
- `TypeError` - If message format is invalid
- `ReferenceError` - If trying to send on a closed socket

**Examples:**

Send a simple message with callback:
```javascript
client.send('/oscillator/frequency', 440, (err) => {
  if (err) console.error(err);
});
```

Send a simple message with async/await:
```javascript
await client.send('/oscillator/frequency', 440);
```

Send multiple arguments:
```javascript
await client.send('/note', 60, 127, 1.0);
```

Send a Message object:
```javascript
import { Message } from 'node-osc';

const msg = new Message('/test', 1, 2, 3);
await client.send(msg);
```

Send a Bundle:
```javascript
import { Bundle } from 'node-osc';

const bundle = new Bundle(['/one', 1], ['/two', 2]);
await client.send(bundle);
```

Send with array notation:
```javascript
await client.send(['/test', 1, 2, 3]);
```

##### `close([callback])`

Close the client socket.

**Parameters:**
- `callback` (Function, optional): Called when the socket is closed

**Returns:**
- `Promise<void>` if no callback is provided
- `undefined` if callback is provided

**Examples:**

With callback:
```javascript
client.close((err) => {
  if (err) console.error(err);
  console.log('Client closed');
});
```

With async/await:
```javascript
await client.close();
```

#### Properties

- `host` (string): The server hostname
- `port` (number): The server port number

---

### Server

The `Server` class receives OSC messages and bundles over UDP. It extends `EventEmitter`.

#### Constructor

```javascript
new Server(port, [host], [callback])
```

Creates a new OSC server.

**Parameters:**
- `port` (number): The port to listen on
- `host` (string, optional): The host address to bind to (default: `'127.0.0.1'`). Use `'0.0.0.0'` to listen on all network interfaces
- `callback` (Function, optional): Called when the server starts listening

**Examples:**

Basic server on localhost:
```javascript
const server = new Server(3333);
```

Server on all interfaces:
```javascript
const server = new Server(3333, '0.0.0.0');
```

With callback:
```javascript
const server = new Server(3333, '0.0.0.0', () => {
  console.log('Server listening');
});
```

Callback as second parameter (host defaults to 127.0.0.1):
```javascript
const server = new Server(3333, () => {
  console.log('Server listening on 127.0.0.1');
});
```

#### Methods

##### `close([callback])`

Close the server socket.

**Parameters:**
- `callback` (Function, optional): Called when the socket is closed

**Returns:**
- `Promise<void>` if no callback is provided
- `undefined` if callback is provided

**Examples:**

With callback:
```javascript
server.close((err) => {
  if (err) console.error(err);
  console.log('Server closed');
});
```

With async/await:
```javascript
await server.close();
```

#### Properties

- `host` (string): The bound host address
- `port` (number): The bound port number

---

### Message

The `Message` class represents an OSC message with an address pattern and arguments.

#### Constructor

```javascript
new Message(address, ...args)
```

Creates a new OSC message.

**Parameters:**
- `address` (string): The OSC address pattern (must start with `/`)
- `...args` (optional): Variable number of arguments to include in the message

**Examples:**

Empty message:
```javascript
const msg = new Message('/test');
```

Message with arguments:
```javascript
const msg = new Message('/oscillator', 440, 0.5);
```

Message with various types:
```javascript
const msg = new Message('/data', 42, 3.14, 'hello', true);
```

#### Methods

##### `append(arg)`

Append an argument to the message.

**Parameters:**
- `arg`: The argument to append. Can be:
  - A primitive value (number, string, boolean)
  - An array (values will be recursively appended)
  - An object with `type` and `value` properties for explicit type control

**Throws:**
- `Error` if the argument type cannot be encoded

**Type Detection:**
- Integers (whole numbers) → OSC integer type
- Floats (decimal numbers) → OSC float type
- Strings → OSC string type
- Booleans → OSC boolean type

**Examples:**

Append primitive values:
```javascript
const msg = new Message('/test');
msg.append(42);        // Integer
msg.append(3.14);      // Float
msg.append('hello');   // String
msg.append(true);      // Boolean
```

Append multiple values at once:
```javascript
msg.append([1, 2, 3, 4]);
```

Explicit type specification:
```javascript
msg.append({ type: 'float', value: 42 });  // Force 42 to be a float
msg.append({ type: 'integer', value: 3.14 }); // Force to integer (will truncate)
```

#### Properties

- `address` (string): The OSC address pattern
- `args` (Array): Array of argument objects with `type` and `value` properties
- `oscType` (string): Always `'message'`

---

### Bundle

The `Bundle` class represents an OSC bundle containing multiple messages or nested bundles with an optional timetag.

#### Constructor

```javascript
new Bundle([timetag], ...elements)
```

Creates a new OSC bundle.

**Parameters:**
- `timetag` (number, optional): OSC timetag for when the bundle should be processed (default: 0). If the first argument is not a number, it will be treated as a message element
- `...elements`: Messages or bundles to include. Arrays will be automatically converted to Message objects

**Examples:**

Bundle without timetag:
```javascript
const bundle = new Bundle(['/one', 1], ['/two', 2]);
```

Bundle with timetag:
```javascript
const bundle = new Bundle(10, ['/one', 1], ['/two', 2]);
```

Bundle with Message objects:
```javascript
import { Message, Bundle } from 'node-osc';

const msg1 = new Message('/test1', 100);
const msg2 = new Message('/test2', 200);
const bundle = new Bundle(msg1, msg2);
```

Nested bundles:
```javascript
const inner = new Bundle(['/inner', 1]);
const outer = new Bundle(['/outer', 2], inner);
```

#### Methods

##### `append(element)`

Append a message or bundle to this bundle.

**Parameters:**
- `element`: The element to append (Message, Bundle, or Array)

**Examples:**

Append messages:
```javascript
const bundle = new Bundle();
bundle.append(['/test', 1]);
bundle.append(new Message('/test2', 2));
```

Append nested bundles:
```javascript
const bundle1 = new Bundle(['/one', 1]);
const bundle2 = new Bundle(['/two', 2]);
bundle1.append(bundle2);
```

#### Properties

- `timetag` (number): The OSC timetag
- `elements` (Array): Array of Message or Bundle objects
- `oscType` (string): Always `'bundle'`

---

## Events

The `Server` class extends `EventEmitter` and emits the following events:

### `'listening'`

Emitted when the server starts listening for messages.

**Example:**
```javascript
server.on('listening', () => {
  console.log('Server is ready');
});
```

### `'message'`

Emitted when an OSC message is received.

**Parameters:**
- `msg` (Array): The message as an array where the first element is the address and subsequent elements are arguments
- `rinfo` (Object): Remote address information
  - `address` (string): The sender's IP address
  - `port` (number): The sender's port number

**Example:**
```javascript
server.on('message', (msg, rinfo) => {
  const [address, ...args] = msg;
  console.log(`Received ${address} from ${rinfo.address}:${rinfo.port}`);
  console.log('Arguments:', args);
});
```

### `'bundle'`

Emitted when an OSC bundle is received.

**Parameters:**
- `bundle` (Object): The bundle object
  - `timetag` (number): The bundle's timetag
  - `elements` (Array): Array of messages or nested bundles
- `rinfo` (Object): Remote address information

**Example:**
```javascript
server.on('bundle', (bundle, rinfo) => {
  console.log(`Received bundle with timetag ${bundle.timetag}`);
  bundle.elements.forEach((element) => {
    console.log('Element:', element);
  });
});
```

### Address-Specific Events

The server also emits events for each message address received. This allows you to listen for specific OSC addresses.

**Example:**
```javascript
// Listen specifically for messages to /note
server.on('/note', (msg, rinfo) => {
  const [address, pitch, velocity] = msg;
  console.log(`Note: ${pitch}, Velocity: ${velocity}`);
});

// Listen for /oscillator/frequency
server.on('/oscillator/frequency', (msg) => {
  const [address, freq] = msg;
  console.log(`Frequency set to ${freq} Hz`);
});
```

### `'error'`

Emitted when there's an error decoding an incoming message.

**Parameters:**
- `error` (Error): The error object
- `rinfo` (Object): Remote address information

**Example:**
```javascript
server.on('error', (error, rinfo) => {
  console.error(`Error from ${rinfo.address}:${rinfo.port}: ${error.message}`);
});
```

---

## Error Handling

### Client Errors

#### Sending on Closed Socket

If you try to send a message after closing the client, a `ReferenceError` will be thrown:

```javascript
const client = new Client('127.0.0.1', 3333);
await client.close();

try {
  await client.send('/test', 123);
} catch (err) {
  console.error(err.message); // "Cannot send message on closed socket."
  console.error(err.code);    // "ERR_SOCKET_DGRAM_NOT_RUNNING"
}
```

#### Invalid Message Format

Passing an invalid message format will throw a `TypeError`:

```javascript
try {
  await client.send(12345); // Not a valid message format
} catch (err) {
  console.error(err.message); // "That Message Just Doesn't Seem Right"
}
```

### Server Errors

#### Decoding Errors

When the server receives malformed OSC data, it emits an `'error'` event:

```javascript
server.on('error', (err, rinfo) => {
  console.error(`Decode error from ${rinfo.address}: ${err.message}`);
});
```

### Best Practices for Error Handling

#### With Callbacks

```javascript
client.send('/test', 123, (err) => {
  if (err) {
    console.error('Send failed:', err);
    return;
  }
  console.log('Message sent successfully');
});
```

#### With Async/Await

```javascript
try {
  await client.send('/test', 123);
  console.log('Message sent successfully');
} catch (err) {
  console.error('Send failed:', err);
}
```

#### Always Close Resources

Use try/finally to ensure resources are cleaned up:

```javascript
const client = new Client('127.0.0.1', 3333);
try {
  await client.send('/test', 123);
} finally {
  await client.close();
}
```

---

## Type System

OSC supports several data types. node-osc automatically detects types for common JavaScript values:

| JavaScript Type | OSC Type | Description |
|----------------|----------|-------------|
| Integer number | `integer` | Whole numbers (e.g., 42, -10, 0) |
| Float number | `float` | Decimal numbers (e.g., 3.14, -0.5) |
| String | `string` | Text values (e.g., "hello") |
| Boolean | `boolean` | true or false |

### Automatic Type Detection

```javascript
const msg = new Message('/test');
msg.append(42);      // → integer
msg.append(3.14);    // → float
msg.append('hello'); // → string
msg.append(true);    // → boolean
```

### Explicit Type Control

For advanced use cases, you can explicitly specify types:

```javascript
const msg = new Message('/test');

// Force a whole number to be sent as float
msg.append({ type: 'float', value: 42 });

// Use shorthand type notation
msg.append({ type: 'f', value: 42 });  // 'f' = float
msg.append({ type: 'i', value: 3.14 }); // 'i' = integer
msg.append({ type: 's', value: 'text' }); // 's' = string
```

### Supported Type Tags

- `'i'` or `'integer'` - 32-bit integer
- `'f'` or `'float'` - 32-bit float
- `'s'` or `'string'` - OSC string
- `'b'` or `'blob'` - Binary blob
- `'boolean'` - Boolean value

---

## Best Practices

### 1. Use Async/Await for Cleaner Code

Prefer async/await over callbacks for more readable code:

```javascript
// Good
async function sendMessages() {
  const client = new Client('127.0.0.1', 3333);
  try {
    await client.send('/test', 1);
    await client.send('/test', 2);
    await client.send('/test', 3);
  } finally {
    await client.close();
  }
}

// Less ideal
function sendMessages() {
  const client = new Client('127.0.0.1', 3333);
  client.send('/test', 1, (err) => {
    if (err) return console.error(err);
    client.send('/test', 2, (err) => {
      if (err) return console.error(err);
      client.send('/test', 3, (err) => {
        if (err) return console.error(err);
        client.close();
      });
    });
  });
}
```

### 2. Always Close Resources

Always close clients and servers when done:

```javascript
const client = new Client('127.0.0.1', 3333);
try {
  await client.send('/test', 123);
} finally {
  await client.close(); // Always close
}
```

### 3. Use Address-Specific Event Listeners

For better code organization, use address-specific event listeners:

```javascript
server.on('/note', (msg) => {
  handleNote(msg);
});

server.on('/control', (msg) => {
  handleControl(msg);
});

// Instead of:
server.on('message', (msg) => {
  const [address] = msg;
  if (address === '/note') handleNote(msg);
  else if (address === '/control') handleControl(msg);
});
```

### 4. Handle Errors Gracefully

Always implement error handling for both clients and servers:

```javascript
// Client
try {
  await client.send('/test', 123);
} catch (err) {
  console.error('Failed to send:', err.message);
}

// Server
server.on('error', (err, rinfo) => {
  console.error(`Server error from ${rinfo.address}:`, err.message);
});
```

### 5. Use Bundles for Related Messages

When sending multiple related messages, use bundles:

```javascript
// Good - atomic operation
const bundle = new Bundle(
  ['/synth/freq', 440],
  ['/synth/amp', 0.5],
  ['/synth/gate', 1]
);
await client.send(bundle);

// Less ideal - separate messages
await client.send('/synth/freq', 440);
await client.send('/synth/amp', 0.5);
await client.send('/synth/gate', 1);
```

### 6. Listen on All Interfaces for Network Access

If you need to receive messages from other machines:

```javascript
// Listen on all interfaces
const server = new Server(3333, '0.0.0.0');

// Only localhost (default)
const server = new Server(3333, '127.0.0.1');
```

### 7. Use Descriptive OSC Addresses

Follow OSC naming conventions:

```javascript
// Good - hierarchical, descriptive
await client.send('/synth/oscillator/1/frequency', 440);
await client.send('/mixer/channel/3/volume', 0.8);

// Less ideal - flat, unclear
await client.send('/freq1', 440);
await client.send('/vol3', 0.8);
```

### 8. Validate Input Data

Validate data before sending to avoid runtime errors:

```javascript
function sendNote(pitch, velocity) {
  if (typeof pitch !== 'number' || pitch < 0 || pitch > 127) {
    throw new Error('Invalid pitch');
  }
  if (typeof velocity !== 'number' || velocity < 0 || velocity > 127) {
    throw new Error('Invalid velocity');
  }
  return client.send('/note', pitch, velocity);
}
```

---

## TypeScript Support

Type definitions are available separately:

```bash
npm install --save @types/node-osc
```

The types will be automatically detected by TypeScript.

---

## Additional Resources

- [OSC Specification](http://opensoundcontrol.org/spec-1_0)
- [GitHub Repository](https://github.com/MylesBorins/node-osc)
- [npm Package](https://www.npmjs.com/package/node-osc)

---

## License

Apache-2.0
