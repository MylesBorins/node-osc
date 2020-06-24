import { beforeEach, tap, test } from './util.mjs';

import { Server, Client, Message } from 'node-osc';

tap.beforeEach(beforeEach);

test('message: basic usage', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);
  const m = new Message('/address');
  m.append('testing');
  m.append(123);
  m.append([456, 789]);
  
  oscServer.on('message', (msg) => {
    const expected = ['/address', 'testing', 123, 456, 789];
    t.deepEqual(msg, expected, `We reveived the payload: ${msg}`);
    oscServer.close();
    t.end();
  });

  client.send(m, () => {
    client.close();
  });
});

test('message: multiple args', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);
  const m = new Message('/address', 'testing', 123, true);

  oscServer.on('message', (msg) => {
    const expected = ['/address', 'testing', 123, true];
    t.deepEqual(msg, expected, `We reveived the payload: ${msg}`);
    oscServer.close();
    t.end();
  });

  client.send(m, () => {
    client.close();
  });
});

test('message: object', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);
  const m = new Message('/address');
  m.append({
    type: 'string',
    value: 'test'
  });
  m.append({
    type: 'double',
    value: 100
  });

  oscServer.on('message', (msg) => {
    const expected = ['/address', 'test', 100];
    t.deepEqual(msg, expected, `We reveived the payload: ${msg}`);
    oscServer.close();
    t.end();
  });

  client.send(m, () => {
    client.close();
  });
});

test('message: float', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);
  const m = new Message('/address');
  m.append(3.14);

  oscServer.on('message', (msg) => {
    const expected = [
      '/address',
      3.14
    ];
    t.equals(msg[0], expected[0], `We reveived the payload: ${msg}`);
    t.equals(msg[1][0], expected[1][0], 'pie please');
    oscServer.close();
    t.end();
  });

  client.send(m, () => {
    client.close();
  });
});

test('message: boolean', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);
  const m = new Message('/address');
  m.append(true);

  oscServer.on('message', (msg) => {
    const expected = [
      '/address',
      true
    ];
    t.same(msg, expected, `We reveived the payload: ${msg}`);
    oscServer.close();
    t.end();
  });

  client.send(m, () => {
    client.close();
  });
});

test('message: blob', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);
  const m = new Message('/address');
  const buf = Buffer.from('test');
  m.append({
    type: 'blob',
    value: buf
  });

  oscServer.on('message', (msg) => {
    const expected = [
      '/address',
      buf
    ];
    t.same(msg, expected, `We reveived the payload: ${msg}`);
    oscServer.close();
    t.end();
  });

  client.send(m, () => {
    client.close();
  });
});

// test('message: timetag', (t) => {
//   const oscServer = new osc.Server(3333, '127.0.0.1');
//   const client = new osc.Client('127.0.0.1', 3333);
//   const m = new osc.Message('/address');z
//
//   oscServer.on('message', (msg) => {
//     const expected = [
//       '/address'
//     ];
//     t.same(msg, expected, `We reveived the payload: ${msg}`);
//     oscServer.close();
//     t.end();
//   });
//
//   client.send(m, () => {
//     client.close();
//   });
// });

test('message: error', (t) => {
  const m = new Message('/address');
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
