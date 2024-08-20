import { test } from 'tap';
import { toBuffer, fromBuffer } from '#osc';

test('toBuffer: valid message', (t) => {
  const message = {
    oscType: 'message',
    address: '/test',
    args: [
      { type: 'string', value: 'testing' },
      { type: 'integer', value: 123 }
    ]
  };
  const buffer = toBuffer(message);
  t.type(buffer, Buffer, 'should return a Buffer');
  t.end();
});

test('toBuffer: valid bundle', (t) => {
  const bundle = {
    oscType: 'bundle',
    timetag: 1,
    elements: [
      {
        oscType: 'message',
        address: '/test',
        args: [
          { type: 'string', value: 'testing' },
          { type: 'integer', value: 123 }
        ]
      }
    ]
  };
  const buffer = toBuffer(bundle);
  t.type(buffer, Buffer, 'should return a Buffer');
  t.end();
});

test('toBuffer: invalid packet', (t) => {
  t.throws(() => {
    toBuffer(null);
  }, /Invalid OSC packet representation/);
  t.end();
});

test('fromBuffer: valid message', (t) => {
  const buffer = Buffer.from('/test\0\0\0,s\0,testing\0');
  const message = fromBuffer(buffer);
  t.same(message, ['/test', 'testing'], 'should return the expected message');
  t.end();
});

test('fromBuffer: valid bundle', (t) => {
  const buffer = Buffer.from('#bundle\0\0\0\0\0\0\0\0\0\0\0\0/test\0\0\0,s\0,testing\0');
  const bundle = fromBuffer(buffer);
  t.same(bundle.elements[0], ['/test', 'testing'], 'should return the expected bundle');
  t.end();
});

test('fromBuffer: malformed packet', (t) => {
  t.throws(() => {
    const buffer = Buffer.from('/test\0\0');
    fromBuffer(buffer);
  }, /Malformed Packet/);
  t.end();
});
