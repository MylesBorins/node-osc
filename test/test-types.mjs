import { test } from './util.mjs';

import {
  TString,
  TInt,
  TTime,
  TFloat,
  // TBlob,
  TDouble,
  TTrue,
  TFalse
} from 'node-osc/types';

test('Type: string', async (t) => {
  const str = new TString('come on fhqwhgads');
  t.equals(str.typetag, 's');
  t.equals(str.value, 'come on fhqwhgads');
  t.done();
});

test('Type: string decode', async (t) => {
  const str = new TString();
  str.decode(Buffer.from('test\0/123\0'));
  t.equals(str.value, 'test');
  t.done();
});

test('Type: string bad message', async (t) => {
  t.throws(() => {
    const str = new TString();
    str.decode(Buffer.from('test'));
  }, 'OSC string not null terminated');
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

test('Type: false', async (t) => {
  const f = new TFalse(false);
  t.equals(f.value, false);
  t.equals(f.decode(0, 0), 0, 'decode is passthourgh');
  t.done();
});

test('Type: true', async (t) => {
  const tt = new TTrue(true);
  t.equals(tt.value, true);
  t.equals(tt.decode(0, 0), 0, 'decode is passthourgh');
  t.done();
});

test('Type: time', async (t) => {
  const date = new Date();
  const time = new TTime(date);
  t.equals(time.typetag, 't');
  t.equals(time.value, date);
  t.done();
});

test('Type: time decode', async (t) => {
  const time = new TTime();
  time.decode(Buffer.from('12345.12345\0'));
  t.equals(time.typetag, 't');
  t.equals(time.value, 825373492.2077361);
  t.done();
});

test('Type: time bad buffer', async (t) => {
  const time = new TTime();
  t.throws(() => {
    time.decode(Buffer.from(''));
  }, /buffer \[\] too short for time, 8 bytes requiredLength/);
  t.done();
});
