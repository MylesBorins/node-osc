import { test } from 'tap';
import { encode, decode } from 'node-osc';

// These tests are specifically designed to hit the case fall-through labels
// in the switch statement in osc.js to achieve 100% branch coverage.
// Lines 139 ('float'), 148 ('double'), and 155 ('midi') must be hit directly.

test('case label: float', (t) => {
  // Hit case 'float': at line 139 in dist/lib/osc.js
  const msg = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'float', value: 3.14 }]
  };
  
  const buf = encode(msg);
  const dec = decode(buf);
  
  t.ok(Math.abs(dec.args[0].value - 3.14) < 0.001);
  t.end();
});

test('case label: double', (t) => {
  // Hit case 'double': at line 148 in dist/lib/osc.js
  const msg = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'double', value: 2.718 }]
  };
  
  const buf = encode(msg);
  const dec = decode(buf);
  
  t.ok(Math.abs(dec.args[0].value - 2.718) < 0.001);
  t.end();
});

test('case label: midi', (t) => {
  // Hit case 'midi': at line 155 in dist/lib/osc.js
  const msg = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'midi', value: Buffer.from([1, 2, 3, 4]) }]
  };
  
  const buf = encode(msg);
  const dec = decode(buf);
  
  t.ok(Buffer.isBuffer(dec.args[0].value));
  t.end();
});

test('case label: F', (t) => {
  // Hit case 'F': for explicit false value
  const msg = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'F', value: false }]
  };
  
  const buf = encode(msg);
  const dec = decode(buf);
  
  t.equal(dec.args[0].value, false);
  t.end();
});

test('case label: f (short form)', (t) => {
  // Hit case 'f': (short form)
  const msg = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'f', value: 1.23 }]
  };
  
  const buf = encode(msg);
  const dec = decode(buf);
  
  t.ok(Math.abs(dec.args[0].value - 1.23) < 0.001);
  t.end();
});

test('case label: d (short form)', (t) => {
  // Hit case 'd': (short form)
  const msg = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'd', value: 4.56 }]
  };
  
  const buf = encode(msg);
  const dec = decode(buf);
  
  t.ok(Math.abs(dec.args[0].value - 4.56) < 0.001);
  t.end();
});

test('case label: m (short form)', (t) => {
  // Hit case 'm': (short form)
  const msg = {
    oscType: 'message',
    address: '/test',
    args: [{ type: 'm', value: Buffer.from([5, 6, 7, 8]) }]
  };
  
  const buf = encode(msg);
  const dec = decode(buf);
  
  t.ok(Buffer.isBuffer(dec.args[0].value));
  t.end();
});
