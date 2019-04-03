'use strict';

var test = require('tap').test;

var {
  TString,
  TInt,
  // TTime,
  TFloat,
  // TBlob,
  TDouble,
  // TTrue,
  // TFalse
} = require('../lib/types.js');

test('Type: string', async (t) => {
  const str = new TString('come on fhqwhgads');
  t.equals(str.typetag, 's');
  t.equals(str.value, 'come on fhqwhgads');
  t.done();
});

test('Type: int', async (t) => {
  const int = new TInt(13);
  t.equals(int.typetag, 'i');
  t.equals(int.value, 13);
  t.done();
});

test('Type: bad int decode', async (t) => {
  const int = new TInt('0');
  t.throws(() => {
    int.decode('01');
  }, 'buffer [48, 49] too short for int, 4 bytes requiredLength');
  t.done();
});

test('Type: float', async (t) => {
  const float = new TFloat(3.14);
  t.equals(float.typetag, 'f');
  t.equals(float.value, 3.14);
  t.done();
});

test('Type: bad float decode', async (t) => {
  const float = new TFloat(3.14);
  t.throws(() => {
    float.decode('01');
  }, 'buffer [48, 49] too short for int, 4 bytes requiredLength');
  t.done();
});

test('Type: double', async (t) => {
  const double = new TDouble(1337);
  t.equals(double.typetag, 'd');
  t.equals(double.value, 1337);
  t.done();
});

test('Type: bad double decode', async (t) => {
  const double = new TDouble(1337);
  t.throws(() => {
    double.decode('01');
  }, 'buffer [48, 49] too short for int, 4 bytes requiredLength');
  t.done();
});

// test('Type: false', async (t) => {
//   const f = new TFalse(false);
//   t.equals(f.value, false);
//   // t.equals(f.encode(0, 0), 'test', 'decode is passthourgh');
//   t.done();
// });
//
// test('Type: true', async (t) => {
//   const tt = new TTrue(true);
//   t.equals(tt.value, true);
//   t.done();
// });