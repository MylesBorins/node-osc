import { test } from 'tap';
import { toBuffer, fromBuffer, Message, Bundle } from 'node-osc';

test('toBuffer and fromBuffer: encode and decode simple message', (t) => {
  const message = new Message('/test', 42, 'hello', 3.14);
  
  const buffer = toBuffer(message);
  t.ok(Buffer.isBuffer(buffer), 'toBuffer should return a Buffer');
  
  const decoded = fromBuffer(buffer);
  t.equal(decoded.oscType, 'message', 'should decode as message');
  t.equal(decoded.address, '/test', 'should preserve address');
  t.equal(decoded.args.length, 3, 'should have 3 arguments');
  t.equal(decoded.args[0].value, 42, 'should preserve integer argument');
  t.equal(decoded.args[1].value, 'hello', 'should preserve string argument');
  t.ok(Math.abs(decoded.args[2].value - 3.14) < 0.001, 'should preserve float argument');
  
  t.end();
});

test('toBuffer and fromBuffer: encode and decode bundle', (t) => {
  const bundle = new Bundle(
    ['/test1', 100],
    ['/test2', 'world']
  );
  
  const buffer = toBuffer(bundle);
  t.ok(Buffer.isBuffer(buffer), 'toBuffer should return a Buffer');
  
  const decoded = fromBuffer(buffer);
  t.equal(decoded.oscType, 'bundle', 'should decode as bundle');
  t.equal(decoded.timetag, 0, 'should have timetag of 0');
  t.equal(decoded.elements.length, 2, 'should have 2 elements');
  t.equal(decoded.elements[0].oscType, 'message', 'first element should be message');
  t.equal(decoded.elements[0].address, '/test1', 'first element should have correct address');
  t.equal(decoded.elements[0].args[0].value, 100, 'first element should have correct argument');
  t.equal(decoded.elements[1].address, '/test2', 'second element should have correct address');
  t.equal(decoded.elements[1].args[0].value, 'world', 'second element should have correct argument');
  
  t.end();
});

test('toBuffer and fromBuffer: encode and decode nested bundle', (t) => {
  const innerBundle = new Bundle(['/inner', 42]);
  const outerBundle = new Bundle(10, ['/outer', 'test']);
  outerBundle.append(innerBundle);
  
  const buffer = toBuffer(outerBundle);
  const decoded = fromBuffer(buffer);
  
  t.equal(decoded.oscType, 'bundle', 'should decode as bundle');
  t.ok(decoded.timetag > 0, 'should have non-zero timetag');
  t.equal(decoded.elements.length, 2, 'should have 2 elements');
  t.equal(decoded.elements[0].oscType, 'message', 'first element should be message');
  t.equal(decoded.elements[1].oscType, 'bundle', 'second element should be bundle');
  t.equal(decoded.elements[1].elements[0].address, '/inner', 'nested bundle should preserve address');
  
  t.end();
});

test('toBuffer and fromBuffer: round-trip with boolean values', (t) => {
  const message = new Message('/booleans');
  message.append(true);
  message.append(false);
  
  const buffer = toBuffer(message);
  const decoded = fromBuffer(buffer);
  
  t.equal(decoded.args[0].value, true, 'should preserve true value');
  t.equal(decoded.args[1].value, false, 'should preserve false value');
  
  t.end();
});

test('toBuffer and fromBuffer: round-trip with blob', (t) => {
  const blobData = Buffer.from([0x01, 0x02, 0x03, 0x04]);
  const message = new Message('/blob', { type: 'blob', value: blobData });
  
  const buffer = toBuffer(message);
  const decoded = fromBuffer(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value), 'should decode as Buffer');
  t.same(decoded.args[0].value, blobData, 'should preserve blob data');
  
  t.end();
});

test('toBuffer and fromBuffer: encode and decode message with mixed types', (t) => {
  const message = new Message('/mixed');
  message.append(42);              // integer
  message.append(3.14);            // float
  message.append('hello');         // string
  message.append(true);            // boolean
  message.append({ type: 'blob', value: Buffer.from([0x01, 0x02]) }); // blob
  
  const buffer = toBuffer(message);
  const decoded = fromBuffer(buffer);
  
  t.equal(decoded.args.length, 5, 'should have 5 arguments');
  t.equal(decoded.args[0].value, 42, 'should preserve integer');
  t.ok(Math.abs(decoded.args[1].value - 3.14) < 0.001, 'should preserve float');
  t.equal(decoded.args[2].value, 'hello', 'should preserve string');
  t.equal(decoded.args[3].value, true, 'should preserve boolean');
  t.ok(Buffer.isBuffer(decoded.args[4].value), 'should preserve blob as Buffer');
  
  t.end();
});

test('fromBuffer: decode raw buffer from external source', (t) => {
  // Simulate receiving a raw OSC message buffer from an external source
  // This is a hand-crafted OSC message for "/test" with integer 123
  const rawBuffer = Buffer.from([
    0x2f, 0x74, 0x65, 0x73, 0x74, 0x00, 0x00, 0x00, // "/test\0\0\0"
    0x2c, 0x69, 0x00, 0x00,                         // ",i\0\0"
    0x00, 0x00, 0x00, 0x7b                          // 123
  ]);
  
  const decoded = fromBuffer(rawBuffer);
  
  t.equal(decoded.oscType, 'message', 'should decode as message');
  t.equal(decoded.address, '/test', 'should decode correct address');
  t.equal(decoded.args.length, 1, 'should have 1 argument');
  t.equal(decoded.args[0].value, 123, 'should decode correct value');
  
  t.end();
});

test('toBuffer: encode message for external consumption', (t) => {
  const message = new Message('/oscillator/frequency', 440);
  const buffer = toBuffer(message);
  
  // Verify buffer is suitable for sending over network
  t.ok(Buffer.isBuffer(buffer), 'should be a Buffer');
  t.ok(buffer.length > 0, 'should have non-zero length');
  
  // Verify it can be decoded back
  const decoded = fromBuffer(buffer);
  t.equal(decoded.address, '/oscillator/frequency', 'should preserve address');
  t.equal(decoded.args[0].value, 440, 'should preserve value');
  
  t.end();
});
