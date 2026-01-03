import { test } from 'tap';

import decode from '#decode';

test('decode: valid', (t) => {
  const buf = Buffer.from('/test\0\0\0,s\0,testing\0');
  t.same(decode(buf), ['/test', 'testing'], 'should be empty array');
  t.end();
});

test('decode: valid', (t) => {
  const buf = Buffer.from('/test\0\0\0,s\0,testing\0');
  t.same(decode(buf), ['/test', 'testing'], 'should be empty array');
  t.end();
});

test('decode: malformed packet', (t) => {
  t.throws(() => {
    const buf = Buffer.from('/test\0\0');
    decode(buf);
  }, /Malformed Packet/);
  t.end();
});

test('decode: invalid typetags', (t) => {
  t.throws(() => {
    const buf = Buffer.from('/test\0\0\0,R\0');
    decode(buf);
  }, /I don't understand the argument code R/);
  t.end();
});

test('decode: malformed OSC structure', (t) => {
  // Try to create a scenario that might trigger the "else" case in decode
  // This tests an edge case where the buffer might be parsed but not create a valid OSC structure
  t.throws(() => {
    // Create a buffer that's too short to be valid
    const buf = Buffer.from('\0\0\0\0');
    decode(buf);
  }, /Malformed Packet/);
  t.end();
});

test('decode: corrupted buffer', (t) => {
  // Test with a buffer that could potentially cause fromBuffer to return unexpected results
  t.throws(() => {
    // Create a malformed buffer that might not parse correctly
    const buf = Buffer.from('invalid');
    decode(buf);
  }, /(Malformed Packet|Cannot read|out of range)/);
  t.end();
});

// This test attempts to exercise edge cases in the decode function
test('decode: edge case with manually crafted invalid structure', (t) => {
  // Since the decode function has a defensive else clause, let's try to trigger it
  // by creating a buffer that might result in an unexpected object structure
  
  // Try with an empty buffer
  t.throws(() => {
    const buf = Buffer.alloc(0);
    decode(buf);
  }, /(Malformed Packet|Cannot read|out of range)/);
  
  // Try with a buffer containing only null bytes
  t.throws(() => {
    const buf = Buffer.alloc(16, 0);
    decode(buf);
  }, /(Malformed Packet|Cannot read|out of range)/);
  
  t.end();
});

test('decode: malformed structure with unexpected oscType', async (t) => {
  // Test the defensive else clause by providing a custom fromBuffer function
  // that returns an object with an invalid oscType
  
  const mockFromBuffer = () => ({
    oscType: 'invalid',
    data: 'test'
  });
  
  t.throws(() => {
    decode(Buffer.from('test'), mockFromBuffer);
  }, /Malformed Packet/, 'should throw for invalid oscType');
  
  // Test with undefined oscType
  const mockFromBufferUndefined = () => ({
    data: 'test'
    // missing oscType property
  });
  
  t.throws(() => {
    decode(Buffer.from('test'), mockFromBufferUndefined);
  }, /Malformed Packet/, 'should throw for undefined oscType');
  
  // Test with null oscType
  const mockFromBufferNull = () => ({
    oscType: null,
    data: 'test'
  });
  
  t.throws(() => {
    decode(Buffer.from('test'), mockFromBufferNull);
  }, /Malformed Packet/, 'should throw for null oscType');
  
  t.end();
});

test('decode: message without args defaults to empty array', (t) => {
  const mockFromBuffer = () => ({
    oscType: 'message',
    address: '/test'
  });

  t.same(
    decode(Buffer.from('test'), mockFromBuffer),
    ['/test'],
    'should default args to empty array'
  );
  t.end();
});

test('decode: bundle element must be message or bundle', (t) => {
  const mockFromBuffer = () => ({
    oscType: 'bundle',
    elements: [
      {
        oscType: 'message',
        address: '/ok',
        args: []
      },
      {
        oscType: 'nope'
      }
    ]
  });

  t.throws(() => {
    decode(Buffer.from('test'), mockFromBuffer);
  }, /Malformed Packet/, 'should throw for invalid bundle element');
  t.end();
});
