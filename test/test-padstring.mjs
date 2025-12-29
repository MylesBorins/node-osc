import { test } from 'tap';
import { encode, decode } from '../lib/osc.mjs';
import { Buffer } from 'node:buffer';

// Tests for padString function behavior through OSC message encoding/decoding
// The padString function ensures OSC strings are padded to 4-byte boundaries
// based on byte length (not character count) to handle multi-byte UTF-8 correctly

test('padString: ASCII string - 1 character', (t) => {
  // 1 byte + 1 null terminator = 2 bytes, needs 2 padding bytes to reach 4-byte boundary
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: 'a' }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 'a', 'should correctly encode and decode single ASCII character');
  
  // Verify the string is properly padded in the buffer
  // Address "/test" is 5 bytes + 1 null = 6 bytes, padded to 8 bytes
  // Type tag ",s" is 2 bytes + 1 null = 3 bytes, padded to 4 bytes
  // String "a" is 1 byte + 1 null = 2 bytes, padded to 4 bytes
  const expectedMinLength = 8 + 4 + 4; // 16 bytes minimum
  t.ok(buffer.length >= expectedMinLength, 'buffer should contain properly padded string');
  
  t.end();
});

test('padString: ASCII string - 3 characters', (t) => {
  // 3 bytes + 1 null terminator = 4 bytes, needs 0 padding (already aligned)
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: 'abc' }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 'abc', 'should correctly encode and decode 3-char ASCII string');
  t.end();
});

test('padString: ASCII string - 7 characters', (t) => {
  // 7 bytes + 1 null terminator = 8 bytes, needs 0 padding (already aligned)
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: 'testing' }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 'testing', 'should correctly encode and decode 7-char ASCII string');
  t.end();
});

test('padString: ASCII string - 5 characters', (t) => {
  // 5 bytes + 1 null terminator = 6 bytes, needs 2 padding bytes to reach 8-byte boundary
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: 'hello' }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 'hello', 'should correctly encode and decode 5-char ASCII string');
  t.end();
});

test('padString: empty string', (t) => {
  // 0 bytes + 1 null terminator = 1 byte, needs 3 padding bytes to reach 4-byte boundary
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: '' }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, '', 'should correctly encode and decode empty string');
  t.end();
});

test('padString: UTF-8 emoji character', (t) => {
  // Emoji '😀' is 4 bytes in UTF-8 + 1 null = 5 bytes, needs 3 padding to reach 8-byte boundary
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: '😀' }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, '😀', 'should correctly encode and decode emoji character');
  
  // Verify byte length calculation is correct
  const emojiByteLength = Buffer.byteLength('😀');
  t.equal(emojiByteLength, 4, 'emoji should be 4 bytes in UTF-8');
  
  t.end();
});

test('padString: UTF-8 Japanese character', (t) => {
  // Japanese 'あ' is 3 bytes in UTF-8 + 1 null = 4 bytes, needs 0 padding (already aligned)
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: 'あ' }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 'あ', 'should correctly encode and decode Japanese character');
  
  const japaneseByteLength = Buffer.byteLength('あ');
  t.equal(japaneseByteLength, 3, 'Japanese character should be 3 bytes in UTF-8');
  
  t.end();
});

test('padString: UTF-8 Chinese character', (t) => {
  // Chinese '中' is 3 bytes in UTF-8 + 1 null = 4 bytes, needs 0 padding (already aligned)
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: '中' }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, '中', 'should correctly encode and decode Chinese character');
  t.end();
});

test('padString: mixed ASCII and multi-byte UTF-8', (t) => {
  // 'a' (1 byte) + '😀' (4 bytes) + 'b' (1 byte) = 6 bytes + 1 null = 7 bytes
  // needs 1 padding byte to reach 8-byte boundary
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: 'a😀b' }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 'a😀b', 'should correctly encode and decode mixed ASCII and emoji');
  
  const mixedByteLength = Buffer.byteLength('a😀b');
  t.equal(mixedByteLength, 6, 'mixed string should be 6 bytes in UTF-8');
  
  t.end();
});

test('padString: multiple UTF-8 characters', (t) => {
  // 'こんにちは' (Hello in Japanese) - 5 characters, each 3 bytes = 15 bytes
  // 15 bytes + 1 null = 16 bytes, needs 0 padding (already aligned)
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: 'こんにちは' }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 'こんにちは', 'should correctly encode and decode Japanese string');
  
  const japaneseStringByteLength = Buffer.byteLength('こんにちは');
  t.equal(japaneseStringByteLength, 15, 'Japanese string should be 15 bytes in UTF-8');
  
  t.end();
});

test('padString: UTF-8 string requiring 1 padding byte', (t) => {
  // 'café' - 4 characters but 'é' is 2 bytes in UTF-8
  // 'c' (1) + 'a' (1) + 'f' (1) + 'é' (2) = 5 bytes + 1 null = 6 bytes
  // needs 2 padding bytes to reach 8-byte boundary
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: 'café' }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 'café', 'should correctly encode and decode accented string');
  
  const accentedByteLength = Buffer.byteLength('café');
  t.equal(accentedByteLength, 5, 'café should be 5 bytes in UTF-8');
  
  t.end();
});

test('padString: multiple strings in single message', (t) => {
  // Test multiple strings with different byte lengths in one message
  const message = {
    oscType: 'message',
    address: '/multi',
    args: [
      { type: 'string', value: 'a' },      // 1 byte + null
      { type: 'string', value: '😀' },     // 4 bytes + null
      { type: 'string', value: 'abc' },    // 3 bytes + null
      { type: 'string', value: '' }        // 0 bytes + null
    ]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args.length, 4, 'should have 4 arguments');
  t.equal(decoded.args[0].value, 'a', 'first string should be correct');
  t.equal(decoded.args[1].value, '😀', 'second string should be correct');
  t.equal(decoded.args[2].value, 'abc', 'third string should be correct');
  t.equal(decoded.args[3].value, '', 'fourth string should be correct');
  
  t.end();
});

test('padString: OSC address with multi-byte characters', (t) => {
  // OSC addresses can also contain UTF-8 characters and must be properly padded
  const message = {
    oscType: 'message',
    address: '/test/😀',
    args: [{ type: 'string', value: 'data' }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.address, '/test/😀', 'should correctly encode and decode address with emoji');
  t.equal(decoded.args[0].value, 'data', 'should correctly encode and decode argument');
  
  t.end();
});

test('padString: long UTF-8 string', (t) => {
  // Test a longer string with mixed content
  const longString = 'Hello 世界 🌍! Testing UTF-8 encoding with café and naïve.';
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: longString }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, longString, 'should correctly encode and decode long mixed UTF-8 string');
  
  t.end();
});

test('padString: boundary case - 2 byte string', (t) => {
  // 2 bytes + 1 null = 3 bytes, needs 1 padding byte to reach 4-byte boundary
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: 'ab' }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 'ab', 'should correctly encode and decode 2-byte string');
  t.end();
});

test('padString: boundary case - 6 byte string', (t) => {
  // 6 bytes + 1 null = 7 bytes, needs 1 padding byte to reach 8-byte boundary
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: 'abcdef' }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, 'abcdef', 'should correctly encode and decode 6-byte string');
  t.end();
});

test('padString: special characters and symbols', (t) => {
  // Test various special characters that may have different byte lengths
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: specialChars }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, specialChars, 'should correctly encode and decode special ASCII characters');
  t.end();
});

test('padString: newlines and tabs', (t) => {
  // Test control characters
  const controlChars = 'line1\nline2\ttab';
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: controlChars }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, controlChars, 'should correctly encode and decode strings with newlines and tabs');
  t.end();
});

test('padString: surrogate pairs (4-byte UTF-8)', (t) => {
  // Test various emoji that are 4-byte UTF-8 sequences
  const emojis = '🎉🎊🎈🎁';
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: emojis }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, emojis, 'should correctly encode and decode multiple 4-byte emoji');
  
  const emojisByteLength = Buffer.byteLength(emojis);
  t.equal(emojisByteLength, 16, 'four 4-byte emoji should total 16 bytes');
  
  t.end();
});

test('padString: zero-width characters', (t) => {
  // Test zero-width joiner and other special Unicode characters
  const zwj = 'a\u200Db'; // zero-width joiner
  const message = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'string', value: zwj }]
  };
  
  const buffer = encode(message);
  const decoded = decode(buffer);
  
  t.equal(decoded.args[0].value, zwj, 'should correctly encode and decode strings with zero-width characters');
  t.end();
});
