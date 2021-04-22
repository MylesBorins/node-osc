import { test } from 'tap';

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
  t.equal(str.typetag, 's');
  t.equal(str.value, 'come on fhqwhgads');
  t.end();
});

test('Type: string decode', async (t) => {
  const str = new TString();
  str.decode(Buffer.from('test\0/123\0'));
  t.equal(str.value, 'test');
  t.end();
});

test('Type: string bad message', async (t) => {
  t.throws(() => {
    const str = new TString();
    str.decode(Buffer.from('test'));
  }, 'OSC string not null terminated');
  t.end();
});

test('Type: int', async (t) => {
  const int = new TInt(13);
  t.equal(int.typetag, 'i');
  t.equal(int.value, 13);
  t.end();
});

test('Type: bad int decode', async (t) => {
  const int = new TInt('0');
  t.throws(() => {
    int.decode('01');
  }, 'buffer [48, 49] too short for int, 4 bytes requiredLength');
  t.end();
});

test('Type: float', async (t) => {
  const float = new TFloat(3.14);
  t.equal(float.typetag, 'f');
  t.equal(float.value, 3.14);
  t.end();
});

test('Type: bad float decode', async (t) => {
  const float = new TFloat(3.14);
  t.throws(() => {
    float.decode('01');
  }, 'buffer [48, 49] too short for int, 4 bytes requiredLength');
  t.end();
});

test('Type: double', async (t) => {
  const double = new TDouble(1337);
  t.equal(double.typetag, 'd');
  t.equal(double.value, 1337);
  t.end();
});

test('Type: bad double decode', async (t) => {
  const double = new TDouble(1337);
  t.throws(() => {
    double.decode('01');
  }, 'buffer [48, 49] too short for int, 4 bytes requiredLength');
  t.end();
});

test('Type: false', async (t) => {
  const f = new TFalse(false);
  t.equal(f.value, false);
  t.equal(f.decode(0, 0), 0, 'decode is passthourgh');
  t.end();
});

test('Type: true', async (t) => {
  const tt = new TTrue(true);
  t.equal(tt.value, true);
  t.equal(tt.decode(0, 0), 0, 'decode is passthourgh');
  t.end();
});

test('Type: time', async (t) => {
  const date = new Date();
  const time = new TTime(date);
  t.equal(time.typetag, 't');
  t.equal(time.value, date);
  t.end();
});

test('Type: time decode', async (t) => {
  const time = new TTime();
  time.decode(Buffer.from('12345.12345\0'));
  t.equal(time.typetag, 't');
  t.equal(time.value, 825373492.2077361);
  t.end();
});

test('Type: time bad buffer', async (t) => {
  const time = new TTime();
  t.throws(() => {
    time.decode(Buffer.from(''));
  }, /buffer \[\] too short for time, 8 bytes requiredLength/);
  t.end();
});
