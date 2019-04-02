'use strict';

const test = require('tap').test;

const osc = require('../lib');

test('message: basic usage', (t) => {
  const oscServer = new osc.Server(3333, '0.0.0.0');
  const client = new osc.Client('0.0.0.0', 3333);
  const m = new osc.Message('/address');
  m.append('testing');
  m.append(123);
  m.append([456, 789]);
  
  oscServer.on('message', (msg) => {
    const expected = ['/address', 'testing', 123, 456, 789];
    t.deepEqual(msg, expected, `We reveived the payload: ${msg}`);
    oscServer.kill();
    t.end();
  });

  client.send(m, () => {
    client.kill();
  });
});

test('message: multiple args', (t) => {
  const oscServer = new osc.Server(3333, '0.0.0.0');
  const client = new osc.Client('0.0.0.0', 3333);
  const m = new osc.Message('/address', 'testing', 123);

  oscServer.on('message', (msg) => {
    const expected = ['/address', 'testing', 123];
    t.deepEqual(msg, expected, `We reveived the payload: ${msg}`);
    oscServer.kill();
    t.end();
  });

  client.send(m, () => {
    client.kill();
  });
});

test('message: object', (t) => {
  const oscServer = new osc.Server(3333, '0.0.0.0');
  const client = new osc.Client('0.0.0.0', 3333);
  const m = new osc.Message('/address');
  m.append({
    type: 'string',
    value: 'test'
  });

  oscServer.on('message', (msg) => {
    const expected = ['/address', 'test'];
    t.deepEqual(msg, expected, `We reveived the payload: ${msg}`);
    oscServer.kill();
    t.end();
  });

  client.send(m, () => {
    client.kill();
  });
});

test('message: float', (t) => {
  const oscServer = new osc.Server(3333, '0.0.0.0');
  const client = new osc.Client('0.0.0.0', 3333);
  const m = new osc.Message('/address');
  m.append(3.14);

  oscServer.on('message', (msg) => {
    const expected = [
      '/address',
      3.14
    ];
    t.equals(msg[0], expected[0], `We reveived the payload: ${msg}`);
    t.equals(msg[1][0], expected[1][0], 'pie please');
    oscServer.kill();
    t.end();
  });

  client.send(m, () => {
    client.kill();
  });
});

// test('message: boolean', (t) => {
//   const oscServer = new osc.Server(3333, '0.0.0.0');
//   const client = new osc.Client('0.0.0.0', 3333);
//   const m = new osc.Message('/address');
//   m.append(true);
//
//   oscServer.on('message', (msg) => {
//     const expected = ['/address', true];
//     t.deepEqual(msg, expected, `We reveived the payload: ${msg}`);
//     oscServer.kill();
//     t.end();
//   });
//
//   client.send(m, () => {
//     client.kill();
//   });
// });

test('message: error', (t) => {
  const m = new osc.Message('/address');
  t.plan(2);
  t.throws(() => {
    m.append({
      lol: 'it broken'
    });
  }, /don't know how to encode object/);
  t.throws(() => {
    m.append(undefined);
  }, /don't know how to encode/);
});
