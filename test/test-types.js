'use strict';

var test = require('tap').test;

var {
  TString,
  // TInt,
  // TTime,
  // TFloat,
  // TBlob,
  // TDouble,
  TTrue,
  TFalse
} = require('../lib/types.js');

test('Type: string', async (t) => {
  const str = new TString('come on fhqwhgads');
  t.equals(str.typetag, 's');
  t.done();
});

test('Type: false', async (t) => {
  const f = new TFalse(false);
  t.equals(f.value, false);
  // t.equals(f.encode(0, 0), 'test', 'decode is passthourgh');
  t.done();
});

test('Type: true', async (t) => {
  const tt = new TTrue(true);
  t.equals(tt.value, true);
  t.done();
});