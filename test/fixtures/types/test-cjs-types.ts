// Test CJS-style TypeScript imports
import type { Client, Server, Message, Bundle } from 'node-osc';
const osc = require('node-osc');

// Create server first (typical usage pattern)
const server: Server = new osc.Server(3333, '0.0.0.0');

// Create client after server
const client: Client = new osc.Client('127.0.0.1', 3333);

// Test Message type
const message: Message = new osc.Message('/test', 1, 2, 3);

// Test Bundle type
const bundle: Bundle = new osc.Bundle(['/one', 1]);

// Test encode/decode with consistent type annotations
const encoded: Buffer = osc.encode(message);
const decoded: Object = osc.decode(encoded);
