# node-osc Guide

This guide provides best practices, patterns, and detailed information for using node-osc effectively.

## Table of Contents

- [Events](#events)
- [Error Handling](#error-handling)
- [Type System](#type-system)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Events

The `Server` class extends `EventEmitter` and emits several events for different scenarios.

### Server Events

#### `listening`

Emitted when the server starts listening for messages.

```javascript
server.on('listening', () => {
  console.log('Server is ready to receive messages');
});
```

#### `message`

Emitted when an OSC message is received.

**Parameters:**
- `msg` (Array): The message as an array where the first element is the address and subsequent elements are arguments
- `rinfo` (Object): Remote address information
  - `address` (string): The sender's IP address
  - `port` (number): The sender's port number

```javascript
server.on('message', (msg, rinfo) => {
  const [address, ...args] = msg;
  console.log(`Received ${address} from ${rinfo.address}:${rinfo.port}`);
  console.log('Arguments:', args);
});
```

#### `bundle`

Emitted when an OSC bundle is received.

**Parameters:**
- `bundle` (Object): The bundle object
  - `timetag` (number): The bundle's timetag
  - `elements` (Array): Array of messages or nested bundles
- `rinfo` (Object): Remote address information

```javascript
server.on('bundle', (bundle, rinfo) => {
  console.log(`Received bundle with timetag ${bundle.timetag}`);
  bundle.elements.forEach((element) => {
    console.log('Element:', element);
  });
});
```

#### Address-Specific Events

The server also emits events for each message address received. This allows you to listen for specific OSC addresses without filtering in your code.

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

#### `error`

Emitted when there's an error decoding an incoming message or a socket error.

**Parameters:**
- `error` (Error): The error object
- `rinfo` (Object): Remote address information (for decode errors)

```javascript
server.on('error', (error, rinfo) => {
  if (rinfo) {
    console.error(`Error from ${rinfo.address}:${rinfo.port}: ${error.message}`);
  } else {
    console.error('Socket error:', error.message);
  }
});
```

### Client Events

#### `error`

Emitted when a socket error occurs.

```javascript
client.on('error', (error) => {
  console.error('Client error:', error.message);
});
```

## Error Handling

Proper error handling is essential for robust OSC applications.

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

**Prevention:** Always ensure the client is open before sending:

```javascript
const client = new Client('127.0.0.1', 3333);
try {
  await client.send('/test', 123);
} finally {
  await client.close(); // Close after sending
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

When the server receives malformed OSC data, it emits an `'error'` event rather than throwing:

```javascript
server.on('error', (err, rinfo) => {
  console.error(`Decode error from ${rinfo.address}: ${err.message}`);
});
```

### Error Handling Patterns

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

Use try/finally to ensure resources are cleaned up even if errors occur:

```javascript
const client = new Client('127.0.0.1', 3333);
try {
  await client.send('/test', 123);
  await client.send('/test', 456);
} catch (err) {
  console.error('Error sending:', err);
} finally {
  await client.close(); // Always executes
}
```

## Type System

OSC supports several data types. node-osc automatically detects types for common JavaScript values:

| JavaScript Type | OSC Type | Description |
|----------------|----------|-------------|
| Integer number | `integer` | Whole numbers (e.g., 42, -10, 0) |
| Float number | `float` | Decimal numbers (e.g., 3.14, -0.5) |
| String | `string` | Text values (e.g., "hello") |
| Boolean | `boolean` | true or false |
| Buffer | `blob` | Binary data |

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
msg.append({ type: 'i', value: 3.14 }); // 'i' = integer (truncates)
msg.append({ type: 's', value: 'text' }); // 's' = string
msg.append({ type: 'b', value: Buffer.from('data') }); // 'b' = blob
```

### Supported Type Tags

- `'i'` or `'integer'` - 32-bit integer
- `'f'` or `'float'` - 32-bit float
- `'s'` or `'string'` - OSC string
- `'b'` or `'blob'` - Binary blob
- `'boolean'` - Boolean value (true/false)
- `'T'` - True
- `'F'` - False

## Best Practices

### 1. Use Async/Await for Cleaner Code

Prefer async/await over callbacks for more readable code:

```javascript
// ✅ Good - Clean and readable
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

// ❌ Less ideal - Callback pyramid
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

Always close clients and servers when done to prevent resource leaks:

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
// ✅ Good - Clear and organized
server.on('/note', (msg) => {
  handleNote(msg);
});

server.on('/control', (msg) => {
  handleControl(msg);
});

// ❌ Less ideal - Manual routing
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
  console.error(`Server error from ${rinfo?.address}:`, err.message);
});
```

### 5. Use Bundles for Related Messages

When sending multiple related messages, use bundles for atomic operations:

```javascript
// ✅ Good - Atomic operation
const bundle = new Bundle(
  ['/synth/freq', 440],
  ['/synth/amp', 0.5],
  ['/synth/gate', 1]
);
await client.send(bundle);

// ❌ Less ideal - Separate messages (not atomic)
await client.send('/synth/freq', 440);
await client.send('/synth/amp', 0.5);
await client.send('/synth/gate', 1);
```

### 6. Listen on All Interfaces for Network Access

If you need to receive messages from other machines:

```javascript
// Listen on all interfaces (accessible from network)
const server = new Server(3333, '0.0.0.0');

// Only localhost (default, more secure)
const server = new Server(3333, '127.0.0.1');
```

### 7. Use Descriptive OSC Addresses

Follow OSC naming conventions with hierarchical addresses:

```javascript
// ✅ Good - Hierarchical and descriptive
await client.send('/synth/oscillator/1/frequency', 440);
await client.send('/mixer/channel/3/volume', 0.8);

// ❌ Less ideal - Flat and unclear
await client.send('/freq1', 440);
await client.send('/vol3', 0.8);
```

### 8. Validate Input Data

Validate data before sending to avoid runtime errors:

```javascript
function sendNote(pitch, velocity) {
  if (typeof pitch !== 'number' || pitch < 0 || pitch > 127) {
    throw new Error('Invalid pitch: must be 0-127');
  }
  if (typeof velocity !== 'number' || velocity < 0 || velocity > 127) {
    throw new Error('Invalid velocity: must be 0-127');
  }
  return client.send('/note', pitch, velocity);
}
```

### 9. Wait for Server Ready

Always wait for the server to be listening before sending messages:

```javascript
const server = new Server(3333, '0.0.0.0');

// Wait for server to be ready
await new Promise(resolve => server.on('listening', resolve));

// Now safe to send messages
console.log('Server ready!');
```

### 10. Use Parallel Sends When Appropriate

When sending multiple independent messages, use `Promise.all` for better performance:

```javascript
// Send multiple messages in parallel
await Promise.all([
  client.send('/track/1/volume', 0.8),
  client.send('/track/2/volume', 0.6),
  client.send('/track/3/volume', 0.9)
]);
```

## Troubleshooting

### Messages Not Being Received

**Possible causes and solutions:**

1. **Firewall blocking UDP traffic**
   - Check your firewall settings
   - Ensure the UDP port is open
   - Try with localhost first (`127.0.0.1`)

2. **Wrong host binding**
   - Server: Use `'0.0.0.0'` to listen on all interfaces
   - Server: Use `'127.0.0.1'` for localhost only
   - Client: Match the server's IP address

3. **Port mismatch**
   - Ensure client and server use the same port number
   - Check if another process is using the port

4. **Network connectivity**
   - Test with localhost first (`127.0.0.1`)
   - Verify network connectivity between machines
   - Check if devices are on the same network

### "Cannot send message on closed socket"

This error occurs when trying to send after closing the client:

```javascript
// ❌ Wrong - Sending after close
await client.close();
await client.send('/test', 123); // Error!

// ✅ Correct - Send before close
await client.send('/test', 123);
await client.close();
```

### Server Not Listening

Ensure you wait for the server to start before sending messages:

```javascript
const server = new Server(3333, '0.0.0.0');

// Wait for server to be ready
await new Promise(resolve => server.on('listening', resolve));

// Now safe to send messages
console.log('Server ready!');
```

### Messages Lost or Dropped

UDP is unreliable by design and messages can be lost:

**Solutions:**
1. Use TCP-based OSC if reliability is critical (requires custom implementation)
2. Implement acknowledgment messages
3. Add retry logic for critical messages
4. Use bundles to ensure related messages arrive together

### High CPU Usage

If you're seeing high CPU usage:

1. **Check for infinite loops** in event handlers
2. **Rate limit** message sending if sending many messages
3. **Use bundles** instead of many individual messages
4. **Close unused connections** to free resources

### Memory Leaks

To prevent memory leaks:

1. **Always close** clients and servers when done
2. **Remove event listeners** when no longer needed
3. **Avoid** creating new clients/servers in loops
4. **Reuse** client/server instances when possible

```javascript
// ✅ Good - Proper cleanup
const server = new Server(3333);
const handler = (msg) => console.log(msg);
server.on('message', handler);

// Later, clean up
server.removeListener('message', handler);
await server.close();
```

## Advanced Topics

### Custom Transports

The `encode` and `decode` functions allow you to use OSC over custom transports:

```javascript
import { encode, decode, Message } from 'node-osc';
import WebSocket from 'ws';

// WebSocket server
const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const oscMsg = decode(data);
    console.log('Received:', oscMsg);
  });
});

// WebSocket client
const ws = new WebSocket('ws://localhost:8080');
const message = new Message('/test', 123);
ws.send(encode(message));
```

### Timetags in Bundles

OSC bundles support timetags for scheduling:

```javascript
// Immediate execution (timetag = 0)
const bundle = new Bundle(['/test', 1], ['/test', 2]);

// Scheduled execution (timetag in OSC time)
const futureTime = Date.now() / 1000 + 5; // 5 seconds from now
const scheduledBundle = new Bundle(futureTime, ['/test', 1]);
```

**Note:** The server receives the timetag but does not automatically schedule execution. You must implement scheduling logic if needed.

### Performance Optimization

For high-throughput applications:

1. **Reuse client instances** instead of creating new ones
2. **Use bundles** to send multiple messages together
3. **Batch messages** and send periodically rather than immediately
4. **Use binary blobs** for large data instead of many arguments
5. **Profile your code** to identify bottlenecks

```javascript
// ✅ Good - Reuse client
const client = new Client('127.0.0.1', 3333);
for (let i = 0; i < 1000; i++) {
  await client.send('/test', i);
}
await client.close();

// ❌ Bad - Creating many clients
for (let i = 0; i < 1000; i++) {
  const client = new Client('127.0.0.1', 3333);
  await client.send('/test', i);
  await client.close();
}
```

## Further Reading

- [API Documentation](./API.md) - Complete API reference
- [OSC Specification](http://opensoundcontrol.org/spec-1_0) - Official OSC 1.0 specification
- [Examples](../examples/) - Working code examples
- [Main README](../README.md) - Quick start guide
