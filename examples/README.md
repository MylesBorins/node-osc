# node-osc Examples

This directory contains working examples demonstrating various ways to use the node-osc library.

## Running the Examples

All examples can be run directly with Node.js. Some examples require a server and client running simultaneously.

### Server/Client Examples

Run the server in one terminal:
```bash
node examples/server.js
```

Run the client in another terminal:
```bash
node examples/client.js
```

### Standalone Examples

These examples run both client and server in the same process:

```bash
# Callback-based example
node examples/esm.mjs

# Async/await example (recommended)
node examples/async-await.mjs

# Bundle example
node examples/bundle-example.mjs

# Error handling example
node examples/error-handling.mjs
```

## Example Files

### [server.js](./server.js)
**CommonJS Server Example**

Demonstrates:
- Creating an OSC server with CommonJS
- Listening for messages
- Displaying remote client information
- Closing the server after receiving a message

### [client.js](./client.js)
**CommonJS Client Example**

Demonstrates:
- Creating an OSC client with CommonJS
- Building messages with the Message class
- Sending messages with callbacks

### [esm.mjs](./esm.mjs)
**ESM with Callbacks Example**

Demonstrates:
- Using node-osc with ES modules
- Callback-based API
- Server event listeners
- Client sending with callbacks

### [async-await.mjs](./async-await.mjs)
**ESM with Async/Await Example** (Recommended Pattern)

Demonstrates:
- Modern async/await patterns
- Using `node:events.once()` to wait for server ready
- Sending multiple messages in parallel with `Promise.all()`
- Clean shutdown of both client and server
- Complete end-to-end workflow

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

### [bundle-example.mjs](./bundle-example.mjs)
**OSC Bundles Example**

Demonstrates:
- Creating OSC bundles with multiple messages
- Sending bundles atomically
- Receiving and processing bundles
- Using timetags

### [error-handling.mjs](./error-handling.mjs)
**Error Handling Example**

Demonstrates:
- Proper error handling with try/catch
- Server error events
- Resource cleanup with finally blocks
- Handling closed socket errors

## Tips

1. **Always close resources**: Use try/finally or ensure you call `.close()` on clients and servers
2. **Wait for server ready**: Use the 'listening' event before sending messages
3. **Use async/await**: The async/await pattern is cleaner than callbacks for most use cases
4. **Handle errors**: Always implement error handling in production code
5. **Test locally first**: Start with `127.0.0.1` before trying network communication

## Further Reading

- [Main README](../README.md) - Quick start guide
- [API Documentation](../docs/API.md) - Complete API reference
- [OSC Specification](http://opensoundcontrol.org/spec-1_0) - Learn about the OSC protocol
