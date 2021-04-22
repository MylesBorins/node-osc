import { test } from 'tap';

import decode from 'node-osc/decode';

test('decode: no message', (t) => {
  const buf = Buffer.from('/test\0');
  t.same(decode(buf), ['/test'], 'should have just an address');
  t.end();
});

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

test('decode: invalid typetags', (t) => {
  t.throws(() => {
    const buf = Buffer.from('/test\0\0\0,R\0');
    decode(buf);
  }, /I don't understand the argument code R/);
  t.end();
});
