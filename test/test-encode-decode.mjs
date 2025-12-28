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

test('encode and decode: MIDI with all zero values', (t) => {
  // Test MIDI encoding with object where all values are 0 or falsy (covers || branches)
  const message = new Message('/midi', {
    type: 'midi',
    value: {
      port: 0,
      status: 0,
      data1: 0,
      data2: 0
    }
  });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value), 'should decode as Buffer');
  t.equal(decoded.args[0].value[0], 0, 'port should be 0');
  t.equal(decoded.args[0].value[1], 0, 'status should be 0');
  t.equal(decoded.args[0].value[2], 0, 'data1 should be 0');
  t.equal(decoded.args[0].value[3], 0, 'data2 should be 0');
  
  t.end();
});

test('encode and decode: MIDI with undefined values defaulting', (t) => {
  // Test MIDI encoding where values are undefined (triggers || default to 0)
  const message = new Message('/midi', {
    type: 'midi',
    value: {
      // All undefined, should default to 0
    }
  });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value), 'should decode as Buffer');
  t.equal(decoded.args[0].value[0], 0, 'port should default to 0');
  t.equal(decoded.args[0].value[1], 0, 'status should default to 0');
  t.equal(decoded.args[0].value[2], 0, 'data1 should default to 0');
  t.equal(decoded.args[0].value[3], 0, 'data2 should default to 0');
  
  t.end();
});

test('encode and decode: MIDI with only port set', (t) => {
  // Test MIDI where only port is set, others should default
  const message = new Message('/midi', {
    type: 'midi',
    value: {
      port: 3
      // status, data1, data2 undefined
    }
  });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value[0], 3, 'port should be 3');
  t.equal(decoded.args[0].value[1], 0, 'status should default to 0');
  t.equal(decoded.args[0].value[2], 0, 'data1 should default to 0');
  t.equal(decoded.args[0].value[3], 0, 'data2 should default to 0');
  
  t.end();
});

test('encode and decode: MIDI with only status set', (t) => {
  // Test MIDI where only status is set
  const message = new Message('/midi', {
    type: 'midi',
    value: {
      status: 0x90
      // port, data1, data2 undefined
    }
  });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value[0], 0, 'port should default to 0');
  t.equal(decoded.args[0].value[1], 0x90, 'status should be 0x90');
  t.equal(decoded.args[0].value[2], 0, 'data1 should default to 0');
  t.equal(decoded.args[0].value[3], 0, 'data2 should default to 0');
  
  t.end();
});

test('encode and decode: MIDI with only data1 set', (t) => {
  // Test MIDI where only data1 is set
  const message = new Message('/midi', {
    type: 'midi',
    value: {
      data1: 0x3C
      // port, status, data2 undefined
    }
  });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value[0], 0, 'port should default to 0');
  t.equal(decoded.args[0].value[1], 0, 'status should default to 0');
  t.equal(decoded.args[0].value[2], 0x3C, 'data1 should be 0x3C');
  t.equal(decoded.args[0].value[3], 0, 'data2 should default to 0');
  
  t.end();
});

test('encode and decode: MIDI with only data2 set', (t) => {
  // Test MIDI where only data2 is set
  const message = new Message('/midi', {
    type: 'midi',
    value: {
      data2: 0x7F
      // port, status, data1 undefined
    }
  });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value[0], 0, 'port should default to 0');
  t.equal(decoded.args[0].value[1], 0, 'status should default to 0');
  t.equal(decoded.args[0].value[2], 0, 'data1 should default to 0');
  t.equal(decoded.args[0].value[3], 0x7F, 'data2 should be 0x7F');
  
  t.end();
});

test('encode and decode: explicit integer type name', (t) => {
  // Test with 'integer' type name (alternate for 'i')
  const message = new Message('/test', { type: 'integer', value: 999 });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 999, 'should encode and decode integer');
  t.end();
});

test('encode and decode: explicit float type name', (t) => {
  // Test with 'float' type name (alternate for 'f')
  const message = new Message('/test', { type: 'float', value: 2.718 });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Math.abs(decoded.args[0].value - 2.718) < 0.001, 'should encode and decode float');
  t.end();
});

test('encode and decode: explicit string type name', (t) => {
  // Test with 'string' type name (alternate for 's')
  const message = new Message('/test', { type: 'string', value: 'alternate' });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 'alternate', 'should encode and decode string');
  t.end();
});

test('encode and decode: explicit blob type name', (t) => {
  // Test with 'blob' type name (alternate for 'b')
  const blobData = Buffer.from([0xDE, 0xAD, 0xBE, 0xEF]);
  const message = new Message('/test', { type: 'blob', value: blobData });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value), 'should decode as Buffer');
  t.same(decoded.args[0].value, blobData, 'should preserve blob data');
  t.end();
});

test('encode and decode: explicit boolean type name', (t) => {
  // Test with 'boolean' type name (alternate for 'T'/'F')
  const message1 = new Message('/test', { type: 'boolean', value: true });
  const message2 = new Message('/test', { type: 'boolean', value: false });
  
  const buffer1 = encode(message1);
  const buffer2 = encode(message2);
  const decoded1 = decode(buffer1);
  const decoded2 = decode(buffer2);
  
  t.equal(decoded1.args[0].value, true, 'should encode and decode boolean true');
  t.equal(decoded2.args[0].value, false, 'should encode and decode boolean false');
  t.end();
});

test('encode and decode: explicit T type tag', (t) => {
  // Test with 'T' type tag directly (not 'boolean')
  const message = new Message('/test', { type: 'T', value: true });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, true, 'should encode and decode true with T tag');
  t.end();
});

test('encode and decode: explicit double type name', (t) => {
  // Test with 'double' type name
  const message = new Message('/test', { type: 'double', value: 3.141592653589793 });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Math.abs(decoded.args[0].value - 3.141592653589793) < 0.001, 'should encode double as float');
  t.end();
});

test('encode and decode: raw message with float type', (t) => {
  // Send raw message object directly to hit the 'float' case label
  const rawMessage = {
    oscType: 'message',
    address: '/float',
    args: [{ type: 'float', value: 1.414 }]
  };
  
  const buffer = encode(rawMessage);
  const decoded = decode(buffer);
  
  t.ok(Math.abs(decoded.args[0].value - 1.414) < 0.001, 'should handle float type');
  t.end();
});

test('encode and decode: raw message with blob type', (t) => {
  // Send raw message object directly to hit the 'blob' case label
  const blobData = Buffer.from([1, 2, 3, 4]);
  const rawMessage = {
    oscType: 'message',
    address: '/blob',
    args: [{ type: 'blob', value: blobData }]
  };
  
  const buffer = encode(rawMessage);
  const decoded = decode(buffer);
  
  t.same(decoded.args[0].value, blobData, 'should handle blob type');
  t.end();
});

test('encode and decode: raw message with double type', (t) => {
  // Send raw message object directly to hit the 'double' case label
  const rawMessage = {
    oscType: 'message',
    address: '/double',
    args: [{ type: 'double', value: 2.71828 }]
  };
  
  const buffer = encode(rawMessage);
  const decoded = decode(buffer);
  
  t.ok(Math.abs(decoded.args[0].value - 2.71828) < 0.001, 'should handle double type');
  t.end();
});

test('encode and decode: raw message with T type', (t) => {
  // Send raw message object directly to hit the 'T' case label
  const rawMessage = {
    oscType: 'message',
    address: '/bool',
    args: [{ type: 'T', value: true }]
  };
  
  const buffer = encode(rawMessage);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, true, 'should handle T type');
  t.end();
});

test('encode and decode: raw message with midi type', (t) => {
  // Send raw message object directly to hit the 'midi' case label
  const midiData = Buffer.from([0x01, 0x90, 0x3C, 0x7F]);
  const rawMessage = {
    oscType: 'message',
    address: '/midi',
    args: [{ type: 'midi', value: midiData }]
  };
  
  const buffer = encode(rawMessage);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value), 'should handle midi type');
  t.equal(decoded.args[0].value.length, 4, 'should have 4 bytes');
  t.end();
});

test('encode and decode: blob with length multiple of 4', (t) => {
  // Test blob where length % 4 === 0 (padding === 4, should use 0 padding)
  const blobData = Buffer.from([0x00, 0x01, 0x02, 0x03]); // length 4, multiple of 4
  const message = new Message('/blob4', { type: 'b', value: blobData });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.same(decoded.args[0].value, blobData, 'should handle blob with length multiple of 4');
  t.end();
});

test('encode and decode: blob with length not multiple of 4', (t) => {
  // Test blob where length % 4 !== 0 (padding < 4)
  const blobData = Buffer.from([0xAA, 0xBB, 0xCC]); // length 3, not multiple of 4
  const message = new Message('/blob3', { type: 'b', value: blobData });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.same(decoded.args[0].value, blobData, 'should handle blob with length not multiple of 4');
  t.end();
});

test('encode and decode: blob with length 1', (t) => {
  // Test blob with length 1 (padding will be 3)
  const blobData = Buffer.from([0xFF]); // length 1
  const message = new Message('/blob1', { type: 'b', value: blobData });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.same(decoded.args[0].value, blobData, 'should handle blob with length 1');
  t.end();
});

test('encode and decode: blob with length 2', (t) => {
  // Test blob with length 2 (padding will be 2)
  const blobData = Buffer.from([0xDE, 0xAD]); // length 2
  const message = new Message('/blob2', { type: 'b', value: blobData });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.same(decoded.args[0].value, blobData, 'should handle blob with length 2');
  t.end();
});

test('encode and decode: blob with length 8', (t) => {
  // Test blob with length 8 (multiple of 4, padding === 4)
  const blobData = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]); // length 8
  const message = new Message('/blob8', { type: 'b', value: blobData });
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.same(decoded.args[0].value, blobData, 'should handle blob with length 8');
  t.end();
});

test('encode and decode: MUST hit float case label directly', (t) => {
  // This test MUST hit the 'float' case label (line 139) in dist/lib/osc.js
  // We import from 'node-osc' which uses dist/lib/osc.js in CJS
  // We use type: 'float' explicitly (not 'f')
  const rawMessage = {
    oscType: 'message',
    address: '/float-label-test',
    args: [{ type: 'float', value: 123.456 }]
  };
  
  const buffer = encode(rawMessage);
  const decoded = decode(buffer);
  
  t.ok(Math.abs(decoded.args[0].value - 123.456) < 0.001, 'should encode/decode float');
  t.end();
});

test('encode and decode: MUST hit double case label directly', (t) => {
  // This test MUST hit the 'double' case label (line 148) in dist/lib/osc.js
  const rawMessage = {
    oscType: 'message',
    address: '/double-label-test',
    args: [{ type: 'double', value: 987.654 }]
  };
  
  const buffer = encode(rawMessage);
  const decoded = decode(buffer);
  
  t.ok(Math.abs(decoded.args[0].value - 987.654) < 0.001, 'should encode/decode double');
  t.end();
});

test('encode and decode: MUST hit midi case label directly', (t) => {
  // This test MUST hit the 'midi' case label (line 155) in dist/lib/osc.js
  const midiBuffer = Buffer.from([0x02, 0xA0, 0x50, 0x60]);
  const rawMessage = {
    oscType: 'message',
    address: '/midi-label-test',
    args: [{ type: 'midi', value: midiBuffer }]
  };
  
  const buffer = encode(rawMessage);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value), 'should encode/decode midi');
  t.equal(decoded.args[0].value.length, 4, 'should have 4 bytes');
  t.end();
});

// Tests for explicit type name coverage (both short and long forms)
test('encode and decode: type "f" (short form for float)', (t) => {
  const msg = new Message('/test', { type: 'f', value: 1.23 });
  const buffer = encode(msg);
  const decoded = decode(buffer);
  
  t.ok(Math.abs(decoded.args[0].value - 1.23) < 0.001);
  t.end();
});

test('encode and decode: type "float" (long form)', (t) => {
  const msg = new Message('/test', { type: 'float', value: 3.14 });
  const buffer = encode(msg);
  const decoded = decode(buffer);
  
  t.ok(Math.abs(decoded.args[0].value - 3.14) < 0.001);
  t.end();
});

test('encode and decode: type "d" (short form for double)', (t) => {
  const msg = new Message('/test', { type: 'd', value: 4.56 });
  const buffer = encode(msg);
  const decoded = decode(buffer);
  
  t.ok(Math.abs(decoded.args[0].value - 4.56) < 0.001);
  t.end();
});

test('encode and decode: type "m" (short form for MIDI)', (t) => {
  const msg = new Message('/test', { type: 'm', value: Buffer.from([5, 6, 7, 8]) });
  const buffer = encode(msg);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value));
  t.end();
});

test('encode and decode: type "midi" (long form)', (t) => {
  const msg = new Message('/test', { type: 'midi', value: Buffer.from([1, 2, 3, 4]) });
  const buffer = encode(msg);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value));
  t.end();
});

test('encode and decode: type "i" (short form for integer)', (t) => {
  const msg = new Message('/test', { type: 'i', value: 42 });
  const buffer = encode(msg);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 42);
  t.end();
});

test('encode and decode: type "integer" (long form)', (t) => {
  const msg = new Message('/test', { type: 'integer', value: 999 });
  const buffer = encode(msg);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 999);
  t.end();
});

test('encode and decode: type "s" (short form for string)', (t) => {
  const msg = new Message('/test', { type: 's', value: 'hello' });
  const buffer = encode(msg);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 'hello');
  t.end();
});

test('encode and decode: type "string" (long form)', (t) => {
  const msg = new Message('/test', { type: 'string', value: 'world' });
  const buffer = encode(msg);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 'world');
  t.end();
});

test('encode and decode: type "b" (short form for blob)', (t) => {
  const msg = new Message('/test', { type: 'b', value: Buffer.from([0xAA, 0xBB]) });
  const buffer = encode(msg);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value));
  t.same(decoded.args[0].value, Buffer.from([0xAA, 0xBB]));
  t.end();
});

test('encode and decode: type "blob" (long form)', (t) => {
  const msg = new Message('/test', { type: 'blob', value: Buffer.from([0xCC, 0xDD]) });
  const buffer = encode(msg);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value));
  t.same(decoded.args[0].value, Buffer.from([0xCC, 0xDD]));
  t.end();
});

test('encode and decode: type "T" (explicit true)', (t) => {
  const msg = new Message('/test', { type: 'T', value: true });
  const buffer = encode(msg);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, true);
  t.end();
});

test('encode and decode: type "F" (explicit false)', (t) => {
  const msg = new Message('/test', { type: 'F', value: false });
  const buffer = encode(msg);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, false);
  t.end();
});

test('encode and decode: type "boolean" with true value', (t) => {
  const msg = new Message('/test', { type: 'boolean', value: true });
  const buffer = encode(msg);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, true);
  t.end();
});

test('encode and decode: type "boolean" with false value', (t) => {
  const msg = new Message('/test', { type: 'boolean', value: false });
  const buffer = encode(msg);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, false);
  t.end();
});
