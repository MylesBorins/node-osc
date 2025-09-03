import { test } from 'tap';
import { toBuffer, fromBuffer } from '../lib/internal/osc.mjs';

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