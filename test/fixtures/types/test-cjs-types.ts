// Test CJS-style TypeScript imports with single .d.ts file
import { Client, Server, Message, Bundle, encode, decode } from '../../../lib/index.mjs';

// Create server first (typical usage pattern)
const server: Server = new Server(3333, '0.0.0.0');

// Create client after server
const client: Client = new Client('127.0.0.1', 3333);

// Test async usage (typical pattern with await)
async function testAsyncUsage() {
  await client.send('/test', 1, 2, 3);
  await client.close();
  await server.close();
}

// Test Message type
const message: Message = new Message('/test', 1, 2, 3);

// Test Bundle type
const bundle: Bundle = new Bundle(['/one', 1]);

// Test encode/decode with consistent type annotations
const encoded: Buffer = encode(message);
const decoded: any = decode(encoded);
