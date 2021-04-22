import { test } from 'tap';

import decode from 'node-osc/decode';

test('decode: empty', (t) => {
  const buf = Buffer.from('/test\0');
  t.same(decode(buf), [], 'should be empty array');
  t.end();
});

test('decode: valid', (t) => {
  const buf = Buffer.from('/test\0\0\0,s\0,testing\0');
  t.same(decode(buf), ['/test', 'testing'], 'should be empty array');
  t.end();
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
  t.end();
});

test('decode: valid', (t) => {
  const buf = Buffer.from('/test\0\0\0,s\0,testing\0');
  t.same(decode(buf), ['/test', 'testing'], 'should be empty array');
  t.end();
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
  t.end();
});