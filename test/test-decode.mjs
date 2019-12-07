import { test } from './util.mjs';

import decode from '../lib/decode.mjs';

test('decode: empty', (t) => {
  const buf = Buffer.from('/test\0');
  t.deepEquals(decode(buf), [], 'should be empty array');
  t.done();
});

test('decode: valid', (t) => {
  const buf = Buffer.from('/test\0\0\0,s\0,testing\0');
  t.deepEquals(decode(buf), ['/test', 'testing'], 'should be empty array');
  t.done();
});

test('decode: invalid typetags', (t) => {
  t.throws(() => {
    const buf = Buffer.from('/test\0iii\0');
    decode(buf);
  }, /invalid type tag in incoming OSC message, must start with comma/);
  t.throws(() => {
    const buf = Buffer.from('/test\0\0\0,R\0');
    decode(buf);
  }, /Unsupported OSC type tag/);
  t.done();
});

test('decode: valid', (t) => {
  const buf = Buffer.from('/test\0\0\0,s\0,testing\0');
  t.deepEquals(decode(buf), ['/test', 'testing'], 'should be empty array');
  t.done();
});

test('decode: invalid typetags', (t) => {
  t.throws(() => {
    const buf = Buffer.from('/test\0iii\0');
    decode(buf);
  }, /invalid type tag in incoming OSC message, must start with comma/);
  t.throws(() => {
    const buf = Buffer.from('/test\0\0\0,R\0');
    decode(buf);
  }, /Unsupported OSC type tag/);
  t.done();
});