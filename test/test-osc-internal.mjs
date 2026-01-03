import { test } from 'tap';
import { encode, decode } from '../lib/osc.mjs';

test('osc: timetag encoding with non-number value', (t) => {
  // Test the else branch in writeTimeTag that writes zeros for non-number values
  const bundle = {
    oscType: 'bundle',
    timetag: 'immediate', // Non-number value
    elements: [
      {
        oscType: 'message',
        address: '/test',
        args: []
      }
    ]
  };
  
  const buffer = encode(bundle);
  const decoded = decode(buffer);
  
  t.equal(decoded.oscType, 'bundle', 'should decode as bundle');
  t.equal(decoded.timetag, 0, 'should decode timetag as 0 for immediate execution');
  t.end();
});

test('osc: timetag encoding with zero value', (t) => {
  const bundle = {
    oscType: 'bundle',
    timetag: 0,
    elements: [
      {
        oscType: 'message',
        address: '/test',
        args: []
      }
    ]
  };

  const buffer = encode(bundle);
  const decoded = decode(buffer);

  t.equal(decoded.timetag, 0, 'should encode 0 as immediate execution');
  t.end();
});

test('osc: timetag encoding with numeric epoch value', (t) => {
  const bundle = {
    oscType: 'bundle',
    timetag: 42,
    elements: [
      {
        oscType: 'message',
        address: '/test',
        args: []
      }
    ]
  };

  const buffer = encode(bundle);
  const decoded = decode(buffer);

  t.equal(decoded.timetag, 42, 'should preserve numeric timetag values');
  t.end();
});

test('osc: timetag with immediate execution values', (t) => {
  // Test readTimeTag with seconds === 0 && fraction === 1
  const bundle = {
    oscType: 'bundle',
    timetag: null, // This will trigger the non-number path
    elements: [
      {
        oscType: 'message',
        address: '/test',
        args: []
      }
    ]
  };
  
  const buffer = encode(bundle);
  const decoded = decode(buffer);
  
  t.equal(decoded.timetag, 0, 'should handle immediate execution timetag');
  t.end();
});

test('osc: argument encoding with unknown type', (t) => {
  // Test encodeArgument with unknown argument type to trigger line 122
  const message = {
    oscType: 'message',
    address: '/test',
    args: [
      {
        type: 'unknown',
        value: 'test'
      }
    ]
  };
  
  t.throws(() => {
    encode(message);
  }, /Unknown argument type: unknown/, 'should throw error for unknown argument type');
  t.end();
});

test('osc: argument encoding with boolean false', (t) => {
  // Test explicit boolean false encoding to cover lines 132-133
  const message = {
    oscType: 'message',
    address: '/test',
    args: [
      {
        type: 'boolean',
        value: false
      }
    ]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, false, 'should encode and decode false boolean');
  t.end();
});

test('osc: argument encoding with unsupported object', (t) => {
  // Test encodeArgument with unsupported object to trigger lines 139-142
  const message = {
    oscType: 'message',
    address: '/test',
    args: [
      { unsupported: 'object' } // Object without type/value properties
    ]
  };
  
  t.throws(() => {
    encode(message);
  }, /Don't know how to encode argument/, 'should throw error for unsupported object');
  t.end();
});

test('osc: argument encoding with undefined value', (t) => {
  // Test encodeArgument with undefined to trigger error case
  const message = {
    oscType: 'message',
    address: '/test',
    args: [undefined]
  };
  
  t.throws(() => {
    encode(message);
  }, /Don't know how to encode argument/, 'should throw error for undefined argument');
  t.end();
});

test('osc: argument decoding with unknown type tag', (t) => {
  // Test decodeArgument with unknown type tag to trigger line 161
  // We need to manually create a buffer with an invalid type tag
  const addressPart = '/test\0\0\0';
  const typeTagPart = ',X\0\0'; // X is not a valid OSC type tag
  const buffer = Buffer.from(addressPart + typeTagPart);
  
  t.throws(() => {
    decode(buffer);
  }, /I don't understand the argument code X/, 'should throw error for unknown type tag');
  t.end();
});

test('osc: null argument encoding and decoding', (t) => {
  // Test null argument handling (N type tag)
  // Since our current implementation doesn't directly support null in encoding,
  // let's test that we can at least decode it if we manually create the buffer
  const addressPart = '/test\0\0\0';
  const typeTagPart = ',N\0\0'; // N is null type tag
  const buffer = Buffer.from(addressPart + typeTagPart);
  
  const decoded = decode(buffer);
  t.equal(decoded.args[0].value, null, 'should decode null argument');
  t.end();
});

test('osc: double type argument encoding', (t) => {
  // Test double type argument which should fall back to float
  const message = {
    oscType: 'message',
    address: '/test',
    args: [
      {
        type: 'd',
        value: 3.14159
      }
    ]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Math.abs(decoded.args[0].value - 3.14159) < 0.001, 'should encode double as float');
  t.end();
});

test('osc: blob argument with Buffer', (t) => {
  // Test blob encoding with actual Buffer to ensure Buffer.isBuffer path is covered
  const testBuffer = Buffer.from('test data');
  const message = {
    oscType: 'message',
    address: '/test',
    args: [testBuffer] // Direct Buffer without type wrapper
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value), 'should decode as Buffer');
  t.equal(decoded.args[0].value.toString(), 'test data', 'should preserve blob content');
  t.end();
});

test('osc: float number encoding', (t) => {
  // Test encoding of float numbers to cover lines 132-133
  const message = {
    oscType: 'message',
    address: '/test',
    args: [3.14159] // Non-integer number should be encoded as float
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(typeof decoded.args[0].value === 'number', 'should decode as number');
  t.ok(!Number.isInteger(decoded.args[0].value), 'should be float, not integer');
  t.ok(Math.abs(decoded.args[0].value - 3.14159) < 0.001, 'should preserve float value');
  t.end();
});

test('osc: explicit integer type encoding', (t) => {
  // Test explicit integer type to cover line 102
  const message = {
    oscType: 'message',
    address: '/test',
    args: [
      {
        type: 'i',
        value: 42
      }
    ]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 42, 'should encode and decode integer');
  t.end();
});

test('osc: explicit float type encoding', (t) => {
  // Test explicit float type to cover line 105
  const message = {
    oscType: 'message',
    address: '/test',
    args: [
      {
        type: 'f',
        value: 3.14
      }
    ]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Math.abs(decoded.args[0].value - 3.14) < 0.001, 'should encode and decode float');
  t.end();
});

test('osc: explicit string type encoding', (t) => {
  // Test explicit string type to cover line 108
  const message = {
    oscType: 'message',
    address: '/test',
    args: [
      {
        type: 's',
        value: 'hello'
      }
    ]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 'hello', 'should encode and decode string');
  t.end();
});

test('osc: explicit blob type encoding', (t) => {
  // Test explicit blob type to cover line 111
  const testData = Buffer.from('blob data');
  const message = {
    oscType: 'message',
    address: '/test',
    args: [
      {
        type: 'b',
        value: testData
      }
    ]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value), 'should decode as Buffer');
  t.equal(decoded.args[0].value.toString(), 'blob data', 'should preserve blob data');
  t.end();
});

test('osc: explicit boolean true type encoding', (t) => {
  // Test explicit boolean true type to cover line 118
  const message = {
    oscType: 'message',
    address: '/test',
    args: [
      {
        type: 'T',
        value: true
      }
    ]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, true, 'should encode and decode boolean true');
  t.end();
});

test('osc: MIDI type encoding with Buffer', (t) => {
  // Test MIDI type with 4-byte Buffer
  const midiData = Buffer.from([0x01, 0x90, 0x3C, 0x7F]); // port 1, note on, middle C, velocity 127
  const message = {
    oscType: 'message',
    address: '/midi',
    args: [
      {
        type: 'm',
        value: midiData
      }
    ]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value), 'should decode as Buffer');
  t.equal(decoded.args[0].value.length, 4, 'should be 4 bytes');
  t.equal(decoded.args[0].value[0], 0x01, 'port id should match');
  t.equal(decoded.args[0].value[1], 0x90, 'status byte should match');
  t.equal(decoded.args[0].value[2], 0x3C, 'data1 should match');
  t.equal(decoded.args[0].value[3], 0x7F, 'data2 should match');
  t.end();
});

test('osc: MIDI type encoding with object', (t) => {
  // Test MIDI type with object format
  const message = {
    oscType: 'message',
    address: '/midi',
    args: [
      {
        type: 'midi',
        value: {
          port: 2,
          status: 0x80,
          data1: 0x40,
          data2: 0x00
        }
      }
    ]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value), 'should decode as Buffer');
  t.equal(decoded.args[0].value[0], 2, 'port should match');
  t.equal(decoded.args[0].value[1], 0x80, 'status should match');
  t.equal(decoded.args[0].value[2], 0x40, 'data1 should match');
  t.equal(decoded.args[0].value[3], 0x00, 'data2 should match');
  t.end();
});

test('osc: MIDI type with invalid buffer length', (t) => {
  // Test MIDI type with wrong buffer length
  const message = {
    oscType: 'message',
    address: '/midi',
    args: [
      {
        type: 'm',
        value: Buffer.from([0x90, 0x3C]) // Only 2 bytes
      }
    ]
  };
  
  t.throws(() => {
    encode(message);
  }, /MIDI message must be exactly 4 bytes/, 'should throw error for wrong buffer length');
  t.end();
});

test('osc: MIDI type with invalid value type', (t) => {
  // Test MIDI type with invalid value
  const message = {
    oscType: 'message',
    address: '/midi',
    args: [
      {
        type: 'm',
        value: 'invalid'
      }
    ]
  };
  
  t.throws(() => {
    encode(message);
  }, /MIDI value must be a 4-byte Buffer or object/, 'should throw error for invalid value type');
  t.end();
});

test('osc: MIDI type with partial object', (t) => {
  // Test MIDI type with object having only some properties (should default others to 0)
  const message = {
    oscType: 'message',
    address: '/midi',
    args: [
      {
        type: 'm',
        value: {
          status: 0x90,
          data1: 0x3C
          // port and data2 should default to 0
        }
      }
    ]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value[0], 0, 'port should default to 0');
  t.equal(decoded.args[0].value[1], 0x90, 'status should match');
  t.equal(decoded.args[0].value[2], 0x3C, 'data1 should match');
  t.equal(decoded.args[0].value[3], 0, 'data2 should default to 0');
  t.end();
});

test('osc: MIDI type decoding with insufficient buffer data', (t) => {
  // Test the error case in readMidi when buffer doesn't have enough bytes
  // This manually crafts a malformed OSC buffer with MIDI type tag but insufficient data
  
  // Create a minimal OSC message buffer with MIDI type but truncated data
  // OSC Format: address + typetags + arguments
  // Address: "/m" (padded to 4 bytes)
  const address = Buffer.from('/m\0\0', 'ascii'); // 4 bytes
  
  // Type tags: ",m" (padded to 4 bytes) 
  const typeTags = Buffer.from(',m\0\0', 'ascii'); // 4 bytes
  
  // MIDI data: only 2 bytes instead of required 4
  const insufficientMidiData = Buffer.from([0x90, 0x3C]); // Only 2 bytes, need 4
  
  // Combine into malformed OSC buffer
  const malformedBuffer = Buffer.concat([address, typeTags, insufficientMidiData]);
  
  t.throws(() => {
    decode(malformedBuffer);
  }, /Not enough bytes for MIDI message/, 'should throw error when MIDI data is truncated');
  t.end();
});

test('osc: MIDI type with falsy status and data1 values', (t) => {
  // Test MIDI type with object having undefined/falsy status and data1 (should default to 0)
  const message = {
    oscType: 'message',
    address: '/midi',
    args: [
      {
        type: 'm',
        value: {
          port: 5,
          data2: 0x40
          // status and data1 are undefined, should default to 0
        }
      }
    ]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value[0], 5, 'port should match');
  t.equal(decoded.args[0].value[1], 0, 'status should default to 0');
  t.equal(decoded.args[0].value[2], 0, 'data1 should default to 0');
  t.equal(decoded.args[0].value[3], 0x40, 'data2 should match');
  t.end();
});

test('osc: MIDI type with explicit zero status and data1 values', (t) => {
  // Test MIDI type with object having explicit 0 values for status and data1
  const message = {
    oscType: 'message',
    address: '/midi',
    args: [
      {
        type: 'm',
        value: {
          port: 3,
          status: 0,
          data1: 0,
          data2: 0x60
        }
      }
    ]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value[0], 3, 'port should match');
  t.equal(decoded.args[0].value[1], 0, 'status should be 0');
  t.equal(decoded.args[0].value[2], 0, 'data1 should be 0');
  t.equal(decoded.args[0].value[3], 0x60, 'data2 should match');
  t.end();

});
test('osc: timetag encoding with numeric value and fractions', (t) => {
  // Test writeTimeTag with actual numeric timetag (lines 70-74)
  const bundle = {
    oscType: 'bundle',
    timetag: 1234567890.5, // Numeric value with fractional part
    elements: [
      {
        oscType: 'message',
        address: '/test',
        args: []
      }
    ]
  };
  
  const buffer = encode(bundle);
  const decoded = decode(buffer);
  
  t.equal(decoded.oscType, 'bundle', 'should decode as bundle');
  t.ok(Math.abs(decoded.timetag - 1234567890.5) < 0.01, 'should preserve numeric timetag with fractions');
  t.end();
});

test('osc: timetag decoding with actual timestamp', (t) => {
  // Test readTimeTag with non-zero, non-immediate values (lines 92-96)
  // We encode a bundle with a real timestamp, then decode it
  const bundle = {
    oscType: 'bundle',
    timetag: 1609459200.25, // A real timestamp: 2021-01-01 00:00:00.25
    elements: [
      {
        oscType: 'message',
        address: '/timestamp',
        args: [{ type: 'i', value: 123 }]
      }
    ]
  };
  
  const buffer = encode(bundle);
  const decoded = decode(buffer);
  
  t.equal(decoded.oscType, 'bundle', 'should decode as bundle');
  t.ok(decoded.timetag > 0, 'timetag should be positive');
  t.ok(Math.abs(decoded.timetag - 1609459200.25) < 0.01, 'should preserve timestamp value');
  t.end();
});

test('osc: inferred integer encoding from raw number', (t) => {
  // Test line 167: encoding raw integer without type wrapper
  const message = {
    oscType: 'message',
    address: '/test',
    args: [42] // Raw integer, not wrapped
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 42, 'should encode and decode raw integer');
  t.end();
});

test('osc: inferred float encoding from raw number', (t) => {
  // Test line 169: encoding raw float without type wrapper
  const message = {
    oscType: 'message',
    address: '/test',
    args: [3.14159] // Raw float, not wrapped
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Math.abs(decoded.args[0].value - 3.14159) < 0.001, 'should encode and decode raw float');
  t.end();
});

test('osc: inferred string encoding from raw string', (t) => {
  // Test line 172: encoding raw string without type wrapper
  const message = {
    oscType: 'message',
    address: '/test',
    args: ['hello world'] // Raw string, not wrapped
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 'hello world', 'should encode and decode raw string');
  t.end();
});

test('osc: inferred boolean true encoding from raw boolean', (t) => {
  // Test line 174 (true branch): encoding raw boolean true
  const message = {
    oscType: 'message',
    address: '/test',
    args: [true] // Raw boolean true, not wrapped
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, true, 'should encode and decode raw boolean true');
  t.end();
});

test('osc: inferred boolean false encoding from raw boolean', (t) => {
  // Test line 174 (false branch): encoding raw boolean false
  const message = {
    oscType: 'message',
    address: '/test',
    args: [false] // Raw boolean false, not wrapped
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, false, 'should encode and decode raw boolean false');
  t.end();
});

test('osc: bundle with only message elements (no nested bundles)', (t) => {
  // Test line 252: encoding message elements in bundle (else branch)
  const bundle = {
    oscType: 'bundle',
    timetag: 0,
    elements: [
      {
        oscType: 'message',
        address: '/msg1',
        args: [{ type: 'i', value: 1 }]
      },
      {
        oscType: 'message',
        address: '/msg2',
        args: [{ type: 'i', value: 2 }]
      }
    ]
  };
  
  const buffer = encode(bundle);
  const decoded = decode(buffer);
  
  t.equal(decoded.oscType, 'bundle', 'should decode as bundle');
  t.equal(decoded.elements.length, 2, 'should have 2 elements');
  t.equal(decoded.elements[0].oscType, 'message', 'first element should be message');
  t.equal(decoded.elements[1].oscType, 'message', 'second element should be message');
  t.end();
});

test('osc: malformed packet with missing comma in type tags', (t) => {
  // Test lines 292-293: decoding malformed packet without comma in type tags
  const addressBuf = Buffer.from('/test\0\0\0', 'utf8');
  const malformedTypeTagsBuf = Buffer.from('iXX\0', 'utf8'); // Missing leading comma
  const buffer = Buffer.concat([addressBuf, malformedTypeTagsBuf]);
  
  t.throws(() => {
    decode(buffer);
  }, /Malformed Packet/, 'should throw on malformed type tags');
  t.end();
});

test('osc: bundle with nested bundle element', (t) => {
  // Test line 252: encoding bundle elements in bundle (if branch)
  const innerBundle = {
    oscType: 'bundle',
    timetag: 0,
    elements: [
      {
        oscType: 'message',
        address: '/inner',
        args: [{ type: 'i', value: 99 }]
      }
    ]
  };
  
  const outerBundle = {
    oscType: 'bundle',
    timetag: 0,
    elements: [
      {
        oscType: 'message',
        address: '/outer',
        args: [{ type: 's', value: 'test' }]
      },
      innerBundle
    ]
  };
  
  const buffer = encode(outerBundle);
  const decoded = decode(buffer);
  
  t.equal(decoded.oscType, 'bundle', 'should decode as bundle');
  t.equal(decoded.elements.length, 2, 'should have 2 elements');
  t.equal(decoded.elements[0].oscType, 'message', 'first element should be message');
  t.equal(decoded.elements[1].oscType, 'bundle', 'second element should be bundle');
  t.equal(decoded.elements[1].elements[0].address, '/inner', 'nested bundle should have correct message');
  t.end();
});

test('osc: explicit integer type name', (t) => {
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'integer', value: 999 }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 999);
  t.end();
});

test('osc: explicit float type name', (t) => {
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'float', value: 1.414 }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Math.abs(decoded.args[0].value - 1.414) < 0.001);
  t.end();
});

test('osc: explicit string type name', (t) => {
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: 'test string' }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 'test string');
  t.end();
});

test('osc: explicit blob type name', (t) => {
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'blob', value: Buffer.from([0xAA, 0xBB]) }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Buffer.isBuffer(decoded.args[0].value));
  t.same(decoded.args[0].value, Buffer.from([0xAA, 0xBB]));
  t.end();
});

test('osc: explicit double type name', (t) => {
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'double', value: 2.718281828 }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.ok(Math.abs(decoded.args[0].value - 2.718281828) < 0.001);
  t.end();
});

test('osc: malformed packet with missing string terminator', (t) => {
  const buffer = Buffer.from('/test', 'utf8');

  t.throws(() => {
    decode(buffer);
  }, /Malformed Packet: Missing null terminator for string/, 'should throw on unterminated string');
  t.end();
});

test('osc: malformed packet with truncated int32 argument', (t) => {
  const address = Buffer.from('/i\0\0', 'ascii');
  const typeTags = Buffer.from(',i\0\0', 'ascii');
  const truncated = Buffer.from([0x00, 0x01]);
  const buffer = Buffer.concat([address, typeTags, truncated]);

  t.throws(() => {
    decode(buffer);
  }, /Malformed Packet: Not enough bytes for int32/, 'should throw on truncated int32');
  t.end();
});

test('osc: malformed packet with truncated float32 argument', (t) => {
  const address = Buffer.from('/f\0\0', 'ascii');
  const typeTags = Buffer.from(',f\0\0', 'ascii');
  const truncated = Buffer.from([0x3f, 0x80, 0x00]);
  const buffer = Buffer.concat([address, typeTags, truncated]);

  t.throws(() => {
    decode(buffer);
  }, /Malformed Packet: Not enough bytes for float32/, 'should throw on truncated float32');
  t.end();
});

test('osc: malformed packet with invalid blob length', (t) => {
  const address = Buffer.from('/b\0\0', 'ascii');
  const typeTags = Buffer.from(',b\0\0', 'ascii');
  const length = Buffer.alloc(4);
  length.writeInt32BE(-1, 0);
  const buffer = Buffer.concat([address, typeTags, length]);

  t.throws(() => {
    decode(buffer);
  }, /Malformed Packet: Invalid blob length/, 'should throw on negative blob length');
  t.end();
});

test('osc: malformed packet with truncated blob data', (t) => {
  const address = Buffer.from('/b\0\0', 'ascii');
  const typeTags = Buffer.from(',b\0\0', 'ascii');
  const length = Buffer.alloc(4);
  length.writeInt32BE(4, 0);
  const data = Buffer.from([0x01, 0x02]);
  const buffer = Buffer.concat([address, typeTags, length, data]);

  t.throws(() => {
    decode(buffer);
  }, /Malformed Packet: Not enough bytes for blob/, 'should throw on truncated blob data');
  t.end();
});

test('osc: malformed packet with missing blob padding', (t) => {
  const address = Buffer.from('/b\0\0', 'ascii');
  const typeTags = Buffer.from(',b\0\0', 'ascii');
  const length = Buffer.alloc(4);
  length.writeInt32BE(3, 0);
  const data = Buffer.from([0x01, 0x02, 0x03]);
  const buffer = Buffer.concat([address, typeTags, length, data]);

  t.throws(() => {
    decode(buffer);
  }, /Malformed Packet: Not enough bytes for blob padding/, 'should throw on missing blob padding');
  t.end();
});

test('osc: malformed bundle with invalid element size', (t) => {
  const bundleHeader = Buffer.from('#bundle\0', 'ascii');
  const timetag = Buffer.alloc(8);
  const size = Buffer.alloc(4);
  size.writeInt32BE(0, 0);
  const buffer = Buffer.concat([bundleHeader, timetag, size]);

  t.throws(() => {
    decode(buffer);
  }, /Malformed Packet/, 'should throw on invalid bundle element size');
  t.end();
});

test('osc: malformed bundle with oversized element size', (t) => {
  const bundleHeader = Buffer.from('#bundle\0', 'ascii');
  const timetag = Buffer.alloc(8);
  const size = Buffer.alloc(4);
  size.writeInt32BE(12, 0);
  const buffer = Buffer.concat([bundleHeader, timetag, size, Buffer.from([0x01, 0x02])]);

  t.throws(() => {
    decode(buffer);
  }, /Malformed Packet/, 'should throw on oversized bundle element size');
  t.end();
});

test('osc: blob padding when length is multiple of 4', (t) => {
  // Test writeBlob line 52: padding === 4 branch (should use 0)
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'b', value: Buffer.from([1, 2, 3, 4]) }] // length 4
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.same(decoded.args[0].value, Buffer.from([1, 2, 3, 4]));
  t.end();
});

test('osc: blob padding when length is not multiple of 4', (t) => {
  // Test writeBlob line 52: padding !== 4 branch (should use padding value)
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'b', value: Buffer.from([1, 2, 3]) }] // length 3
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.same(decoded.args[0].value, Buffer.from([1, 2, 3]));
  t.end();
});

test('osc: boolean type true value', (t) => {
  // Test boolean case ternary: true branch
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'boolean', value: true }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, true);
  t.end();
});

test('osc: boolean type false value', (t) => {
  // Test boolean case ternary: false branch
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'boolean', value: false }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, false);
  t.end();
});

test('osc: explicit T type', (t) => {
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'T', value: true }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, true);
  t.end();
});

test('osc: explicit F type', (t) => {
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'F', value: false }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, false);
  t.end();
});
