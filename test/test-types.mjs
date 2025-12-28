import { test } from 'tap';
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

test('types: TypeScript compilation with ESM types', (t) => {
  const testDir = join(process.cwd(), '.tap', 'type-test-esm');
  mkdirSync(testDir, { recursive: true });
  
  const testFile = join(testDir, 'test-esm-types.ts');
  const testCode = `
// Test ESM TypeScript imports
import { Client, Server, Message, Bundle, encode, decode } from '../../lib/index.mjs';

// Create server first (typical usage pattern)
const server: Server = new Server(3333, '0.0.0.0');
server.on('message', (msg) => {
  console.log('Received message:', msg);
});

// Create client after server
const client: Client = new Client('127.0.0.1', 3333);

// Test async usage (typical pattern with await)
async function testAsyncUsage() {
  await client.send('/test', 1, 2, 3);
  await client.close();
  await server.close();
}

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
`;

  writeFileSync(testFile, testCode);

  try {
    // Run TypeScript compiler in noEmit mode to check types only
    const cmd = 'npx tsc --noEmit --skipLibCheck --esModuleInterop "' + testFile + '"';
    execSync(cmd, { 
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: process.cwd()
    });
    t.pass('ESM TypeScript types compile successfully');
  } catch (error) {
    t.fail('ESM TypeScript compilation failed: ' + error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.log('STDERR:', error.stderr);
  } finally {
    try {
      unlinkSync(testFile);
    } catch {
      // Ignore cleanup errors
    }
  }

  t.end();
});

test('types: TypeScript compilation with CJS types', (t) => {
  const testDir = join(process.cwd(), '.tap', 'type-test-cjs');
  mkdirSync(testDir, { recursive: true });
  
  const testFile = join(testDir, 'test-cjs-types.ts');
  const testCode = `
// Test CJS TypeScript imports
import { Client, Server, Message, Bundle, encode, decode } from '../../dist/lib/index.js';

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
`;

  writeFileSync(testFile, testCode);

  try {
    // Run TypeScript compiler in noEmit mode to check types only
    const cmd = 'npx tsc --noEmit --skipLibCheck --module commonjs --esModuleInterop "' + testFile + '"';
    execSync(cmd, { 
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: process.cwd()
    });
    t.pass('CJS TypeScript types compile successfully');
  } catch (error) {
    t.fail('CJS TypeScript compilation failed: ' + error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.log('STDERR:', error.stderr);
  } finally {
    try {
      unlinkSync(testFile);
    } catch {
      // Ignore cleanup errors
    }
  }

  t.end();
});
