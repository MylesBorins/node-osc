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
  t.same(buffer.toString('ascii', 0, 5), '/test', 'should encode address');
  t.same(buffer.toString('ascii', 8, 10), ',s', 'should encode type tag');
  t.same(buffer.toString('ascii', 12, 19), 'testing', 'should encode string argument');
  t.same(buffer.readInt32BE(20), 123, 'should encode integer argument');
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
          { type: 'string', value: 'testing' }
        ]
      }
    ]
  };
  const buffer = toBuffer(bundle);
  t.same(buffer.toString('ascii', 0, 7), '#bundle', 'should encode bundle identifier');
  t.same(buffer.readUInt32BE(8), 1, 'should encode timetag seconds');
  t.same(buffer.readUInt32BE(12), 0, 'should encode timetag fraction');
  t.same(buffer.readUInt32BE(16), 20, 'should encode element size');
  t.same(buffer.toString('ascii', 20, 25), '/test', 'should encode element address');
  t.end();
});

test('fromBuffer: valid message', (t) => {
  const buffer = Buffer.from('/test\0\0\0,s\0\0testing\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0
