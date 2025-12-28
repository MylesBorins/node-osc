// Test ESM TypeScript imports with Top-Level Await
import { Client, Server, Message, Bundle, encode, decode } from '../../../lib/index.mjs';

// Create server first (typical usage pattern)
const server: Server = new Server(3333, '0.0.0.0');
server.on('message', (msg) => {
  console.log('Received message:', msg);
});

// Create client after server
const client: Client = new Client('127.0.0.1', 3333);

// Test async usage with Top-Level Await (ESM feature)
await client.send('/test', 1, 2, 3);
await client.close();
await server.close();

// Test Message type
const message: Message = new Message('/oscillator/frequency', 440);
message.append(3.14);
message.append('hello');
message.append(true);

// Test Bundle type
const bundle: Bundle = new Bundle(['/one', 1], ['/two', 2]);
bundle.append(['/three', 3]);

// Test encode/decode with consistent type annotations
const encoded: Buffer = encode(message);
const decoded: any = decode(encoded);
