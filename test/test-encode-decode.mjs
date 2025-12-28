import { test } from 'tap';
import { encode, decode, Message, Bundle } from 'node-osc';

test('encode and decode: simple message', (t) => {
  const message = new Message('/test', 42, 'hello', 3.14);
  
  const buffer = encode(message);
  t.ok(Buffer.isBuffer(buffer), 'encode should return a Buffer');
  
  const decoded = decode(buffer);
  t.equal(decoded.oscType, 'message', 'should decode as message');
  t.equal(decoded.address, '/test', 'should preserve address');
  t.equal(decoded.args.length, 3, 'should have 3 arguments');
  t.equal(decoded.args[0].value, 42, 'should preserve integer argument');
  t.equal(decoded.args[1].value, 'hello', 'should preserve string argument');
  t.ok(Math.abs(decoded.args[2].value - 3.14) < 0.001, 'should preserve float argument');
  
  t.end();
});

test('encode and decode: bundle', (t) => {
  const bundle = new Bundle(
    ['/test1', 100],
    ['/test2', 'world']
  );
  
  const buffer = encode(bundle);
  t.ok(Buffer.isBuffer(buffer), 'encode should return a Buffer');
  
  const decoded = decode(buffer);
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

test('encode and decode: nested bundle', (t) => {
  const innerBundle = new Bundle(['/inner', 42]);
  const outerBundle = new Bundle(10, ['/outer', 'test']);
  outerBundle.append(innerBundle);
  
  const buffer = encode(outerBundle);
  const decoded = decode(buffer);
  
  t.equal(decoded.oscType, 'bundle', 'should decode as bundle');
  t.ok(decoded.timetag > 0, 'should have non-zero timetag');
  t.equal(decoded.elements.length, 2, 'should have 2 elements');
  t.equal(decoded.elements[0].oscType, 'message', 'first element should be message');
  t.equal(decoded.elements[1].oscType, 'bundle', 'second element should be bundle');
  t.equal(decoded.elements[1].elements[0].address, '/inner', 'nested bundle should preserve address');
  
  t.end();
});

test('encode and decode: round-trip with boolean values', (t) => {
  const message = new Message('/booleans');
  message.append(true);
  message.append(false);
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, true, 'should preserve true value');
  t.equal(decoded.args[1].value, false, 'should preserve false value');
  
  t.end();
});

test('encode and decode: round-trip with blob', (t) => {
  const blobData = Buffer.from([0x01, 0x02, 0x03, 0x04]);
  const message = new Message('/blob', { type: 'blob', value: blobData });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value), 'should decode as Buffer');
  t.same(decoded.args[0].value, blobData, 'should preserve blob data');
  
  t.end();
});

test('encode and decode: message with mixed types', (t) => {
  const message = new Message('/mixed');
  message.append(42);              // integer
  message.append(3.14);            // float
  message.append('hello');         // string
  message.append(true);            // boolean
  message.append({ type: 'blob', value: Buffer.from([0x01, 0x02]) }); // blob
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args.length, 5, 'should have 5 arguments');
  t.equal(decoded.args[0].value, 42, 'should preserve integer');
  t.ok(Math.abs(decoded.args[1].value - 3.14) < 0.001, 'should preserve float');
  t.equal(decoded.args[2].value, 'hello', 'should preserve string');
  t.equal(decoded.args[3].value, true, 'should preserve boolean');
  t.ok(Buffer.isBuffer(decoded.args[4].value), 'should preserve blob as Buffer');
  
  t.end();
});

test('decode: raw buffer from external source', (t) => {
  // Simulate receiving a raw OSC message buffer from an external source
  // This is a hand-crafted OSC message for "/test" with integer 123
  const rawBuffer = Buffer.from([
    0x2f, 0x74, 0x65, 0x73, 0x74, 0x00, 0x00, 0x00, // "/test\0\0\0"
    0x2c, 0x69, 0x00, 0x00,                         // ",i\0\0"
    0x00, 0x00, 0x00, 0x7b                          // 123
  ]);
  
  const decoded = decode(rawBuffer);
  
  t.equal(decoded.oscType, 'message', 'should decode as message');
  t.equal(decoded.address, '/test', 'should decode correct address');
  t.equal(decoded.args.length, 1, 'should have 1 argument');
  t.equal(decoded.args[0].value, 123, 'should decode correct value');
  
  t.end();
});

test('encode: message for external consumption', (t) => {
  const message = new Message('/oscillator/frequency', 440);
  const buffer = encode(message);
  
  // Verify buffer is suitable for sending over network
  t.ok(Buffer.isBuffer(buffer), 'should be a Buffer');
  t.ok(buffer.length > 0, 'should have non-zero length');
  
  // Verify it can be decoded back
  const decoded = decode(buffer);
  t.equal(decoded.address, '/oscillator/frequency', 'should preserve address');
  t.equal(decoded.args[0].value, 440, 'should preserve value');
  
  t.end();
});

test('encode and decode: MIDI messages with Buffer', (t) => {
  const midiBuffer = Buffer.from([0x00, 0x90, 0x3C, 0x7F]); // port 0, note on, note 60, velocity 127
  const message = new Message('/midi', { type: 'midi', value: midiBuffer });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value), 'should decode as Buffer');
  t.same(decoded.args[0].value, midiBuffer, 'should preserve MIDI data');
  
  t.end();
});

test('encode and decode: MIDI messages with object', (t) => {
  const midiObj = { port: 0, status: 0x90, data1: 0x3C, data2: 0x7F };
  const message = new Message('/midi', { type: 'midi', value: midiObj });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value), 'should decode as Buffer');
  t.equal(decoded.args[0].value[0], 0, 'port should be 0');
  t.equal(decoded.args[0].value[1], 0x90, 'status should be 0x90');
  t.equal(decoded.args[0].value[2], 0x3C, 'data1 should be 0x3C');
  t.equal(decoded.args[0].value[3], 0x7F, 'data2 should be 0x7F');
  
  t.end();
});

test('encode and decode: null type tag', (t) => {
  // Create a message with null value by manually constructing the buffer
  // OSC format: address + type tags + no data for 'N' type
  const addressBuf = Buffer.from('/test\0\0\0', 'utf8');
  const typeTagsBuf = Buffer.from(',N\0\0', 'utf8');
  const buffer = Buffer.concat([addressBuf, typeTagsBuf]);
  
  const decoded = decode(buffer);
  
  t.equal(decoded.oscType, 'message', 'should decode as message');
  t.equal(decoded.address, '/test', 'should have correct address');
  t.equal(decoded.args[0].value, null, 'should decode null value');
  
  t.end();
});

test('encode: error on unknown argument type', (t) => {
  const message = new Message('/test', { type: 'unknown', value: 42 });
  
  t.throws(() => {
    encode(message);
  }, /Unknown argument type: unknown/, 'should throw on unknown type');
  
  t.end();
});

test('encode: error on unencodable argument', (t) => {
  const message = new Message('/test');
  message.args.push(() => {}); // Functions can't be encoded
  
  t.throws(() => {
    encode(message);
  }, /Don't know how to encode argument/, 'should throw on unencodable argument');
  
  t.end();
});

test('decode: error on unknown type tag', (t) => {
  // Create a message with an unknown type tag 'X'
  const addressBuf = Buffer.from('/test\0\0\0', 'utf8');
  const typeTagsBuf = Buffer.from(',X\0\0', 'utf8');
  const buffer = Buffer.concat([addressBuf, typeTagsBuf]);
  
  t.throws(() => {
    decode(buffer);
  }, /I don't understand the argument code X/, 'should throw on unknown type tag');
  
  t.end();
});

test('encode: MIDI error on wrong buffer length', (t) => {
  const wrongBuffer = Buffer.from([0x90, 0x3C]); // Only 2 bytes, should be 4
  const message = new Message('/midi', { type: 'midi', value: wrongBuffer });
  
  t.throws(() => {
    encode(message);
  }, /MIDI message must be exactly 4 bytes/, 'should throw on wrong buffer length');
  
  t.end();
});

test('encode: MIDI error on invalid value type', (t) => {
  const message = new Message('/midi', { type: 'midi', value: 'not a buffer' });
  
  t.throws(() => {
    encode(message);
  }, /MIDI value must be a 4-byte Buffer/, 'should throw on invalid MIDI value');
  
  t.end();
});

test('decode: MIDI error on insufficient buffer', (t) => {
  // Create a message with MIDI type tag but not enough data
  const addressBuf = Buffer.from('/test\0\0\0', 'utf8');
  const typeTagsBuf = Buffer.from(',m\0\0', 'utf8');
  const dataBuf = Buffer.from([0x90, 0x3C]); // Only 2 bytes, should be 4
  const buffer = Buffer.concat([addressBuf, typeTagsBuf, dataBuf]);
  
  t.throws(() => {
    decode(buffer);
  }, /Not enough bytes for MIDI message/, 'should throw on insufficient MIDI data');
  
  t.end();
});

test('encode and decode: Buffer argument (inferred blob type)', (t) => {
  const bufferArg = Buffer.from([0x01, 0x02, 0x03, 0x04]);
  const message = new Message('/buffer', bufferArg);
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value), 'should decode as Buffer');
  t.same(decoded.args[0].value, bufferArg, 'should preserve Buffer data');
  
  t.end();
});

test('encode and decode: double type (treated as float)', (t) => {
  const message = new Message('/double', { type: 'double', value: 3.141592653589793 });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  // Doubles are encoded as floats in OSC 1.0, so precision is reduced
  t.ok(Math.abs(decoded.args[0].value - 3.141592653589793) < 0.001, 'should preserve approximate value');
  
  t.end();
});

test('decode: error on malformed type tags (no leading comma)', (t) => {
  // Create a message with malformed type tags (missing comma)
  const addressBuf = Buffer.from('/test\0\0\0', 'utf8');
  const typeTagsBuf = Buffer.from('iXX\0', 'utf8'); // Should start with comma
  const buffer = Buffer.concat([addressBuf, typeTagsBuf]);
  
  t.throws(() => {
    decode(buffer);
  }, /Malformed Packet/, 'should throw on malformed type tags');
  
  t.end();
});

test('encode and decode: nested bundle with message and bundle elements', (t) => {
  // Test the else branch in encodeBundleToBuffer for message elements
  const innerBundle = new Bundle(['/inner/message', 123]);
  const outerBundle = new Bundle(['/outer/message', 'test'], innerBundle);
  
  const buffer = encode(outerBundle);
  const decoded = decode(buffer);
  
  t.equal(decoded.oscType, 'bundle', 'should be a bundle');
  t.equal(decoded.elements.length, 2, 'should have 2 elements');
  t.equal(decoded.elements[0].oscType, 'message', 'first element should be message');
  t.equal(decoded.elements[1].oscType, 'bundle', 'second element should be bundle');
  
  t.end();
});
