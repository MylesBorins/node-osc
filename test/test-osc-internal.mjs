import { test } from 'tap';
import { toBuffer, fromBuffer } from '#osc';

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
  
  const buffer = toBuffer(bundle);
  const decoded = fromBuffer(buffer);
  
  t.equal(decoded.oscType, 'bundle', 'should decode as bundle');
  t.equal(decoded.timetag, 0, 'should decode timetag as 0 for immediate execution');
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
  
  const buffer = toBuffer(bundle);
  const decoded = fromBuffer(buffer);
  
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
    toBuffer(message);
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
  
  const buffer = toBuffer(message);
  const decoded = fromBuffer(buffer);
  
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
    toBuffer(message);
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
    toBuffer(message);
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
    fromBuffer(buffer);
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
  
  const decoded = fromBuffer(buffer);
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
  
  const buffer = toBuffer(message);
  const decoded = fromBuffer(buffer);
  
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
  
  const buffer = toBuffer(message);
  const decoded = fromBuffer(buffer);
  
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
  
  const buffer = toBuffer(message);
  const decoded = fromBuffer(buffer);
  
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
  
  const buffer = toBuffer(message);
  const decoded = fromBuffer(buffer);
  
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
  
  const buffer = toBuffer(message);
  const decoded = fromBuffer(buffer);
  
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
  
  const buffer = toBuffer(message);
  const decoded = fromBuffer(buffer);
  
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
  
  const buffer = toBuffer(message);
  const decoded = fromBuffer(buffer);
  
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
  
  const buffer = toBuffer(message);
  const decoded = fromBuffer(buffer);
  
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
  
  const buffer = toBuffer(message);
  const decoded = fromBuffer(buffer);
  
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
  
  const buffer = toBuffer(message);
  const decoded = fromBuffer(buffer);
  
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
    toBuffer(message);
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
    toBuffer(message);
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
  
  const buffer = toBuffer(message);
  const decoded = fromBuffer(buffer);
  
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
    fromBuffer(malformedBuffer);
  }, /Not enough bytes for MIDI message/, 'should throw error when MIDI data is truncated');
  t.end();
});