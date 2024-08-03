import { test } from 'tap';
import { toBuffer, fromBuffer } from '../lib/internal/transport.mjs';

test('toBuffer: encodes OSC message to buffer', (t) => {
  const message = {
    address: '/test',
    args: [
      { type: 'integer', value: 123 },
      { type: 'float', value: 3.14 },
      { type: 'string', value: 'hello' },
      { type: 'blob', value: Buffer.from('world') }
    ]
  };
  const buffer = toBuffer(message);
  t.type(buffer, Buffer, 'should return a buffer');
  t.end();
});

test('fromBuffer: decodes buffer to OSC message', (t) => {
  const buffer = Buffer.concat([
    Buffer.from('/test\0'),
    Buffer.from([0, 0, 0, 123]),
    Buffer.from([0, 0, 0, 0, 64, 9, 30, 184]),
    Buffer.from('hello\0'),
    Buffer.from([0, 0, 0, 5]),
    Buffer.from('world')
  ]);
  const message = fromBuffer(buffer);
  t.same(message, {
    address: '/test',
    args: [
      { type: 'integer', value: 123 },
      { type: 'float', value: 3.14 },
      { type: 'string', value: 'hello' },
      { type: 'blob', value: Buffer.from('world') }
    ]
  }, 'should decode buffer to OSC message');
  t.end();
});
