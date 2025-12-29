import { test } from 'tap';

import { Server, Client, Message } from 'node-osc';

function round(num) {
  return Math.round(num * 100) / 100;
}

test('message: basic usage', (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  const client = new Client('127.0.0.1', 0);
  const m = new Message('/address');
  m.append('testing');
  m.append(123);
  m.append([456, 789]);
  
  oscServer.on('message', (msg) => {
    const expected = ['/address', 'testing', 123, 456, 789];
    t.same(msg, expected, `We reveived the payload: ${msg}`);
    oscServer.close();
    t.end();
  });

  client.send(m, () => {
    client.close();
  });
});

test('message: multiple args', (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  const client = new Client('127.0.0.1', 0);
  const m = new Message('/address', 'testing', 123, true);

  oscServer.on('message', (msg) => {
    const expected = ['/address', 'testing', 123, true];
    t.same(msg, expected, `We reveived the payload: ${msg}`);
    oscServer.close();
    t.end();
  });

  client.send(m, () => {
    client.close();
  });
});

test('message: object', (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  const client = new Client('127.0.0.1', 0);
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
    t.same(msg, expected, `We reveived the payload: ${msg}`);
    oscServer.close();
    t.end();
  });

  client.send(m, () => {
    client.close();
  });
});

test('message: float', (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  const client = new Client('127.0.0.1', 0);
  const m = new Message('/address');
  m.append(3.14);

  oscServer.on('message', (msg) => {
    const expected = [
      '/address',
      3.14
    ];
    t.equal(msg[0], expected[0], `We reveived the payload: ${msg}`);
    t.equal(round(msg[1]), expected[1], 'pie please');
    oscServer.close();
    t.end();
  });

  client.send(m, () => {
    client.close();
  });
});

test('message: alias messages', (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  const client = new Client('127.0.0.1', 0);
  const m = new Message('/address');
  m.append({
    type: 'i',
    value: 123
  });
  m.append({
    type: 'f',
    value: 3.14
  });

  oscServer.on('message', (msg) => {
    const expected = [
      '/address',
      123,
      3.14
    ];
    t.equal(msg[0], expected[0], `We reveived the payload: ${msg}`);
    t.equal(msg[1], expected[1], 'easy as abc');
    t.ok(Number.isInteger(msg[1]), 'the first value is an int');
    t.equal(round(msg[2]), expected[2], 'pie please');
    t.ok(msg[2] % 1 !== 0, 'the second value is a float');
    oscServer.close();
    t.end();
  });

  client.send(m, () => {
    client.close();
  });
});

test('message: boolean', (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  const client = new Client('127.0.0.1', 0);
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
  const oscServer = new Server(0, '127.0.0.1');
  const client = new Client('127.0.0.1', 0);
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

test('message: Buffer as blob', (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  const client = new Client('127.0.0.1', 0);
  const m = new Message('/address');
  const buf = Buffer.from('test buffer data');
  // Directly append Buffer without wrapping in object
  m.append(buf);

  oscServer.on('message', (msg) => {
    const expected = [
      '/address',
      buf
    ];
    t.same(msg, expected, `We received the buffer payload: ${msg}`);
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
//   const m = new osc.Message('/address');
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

test('message: Buffer with multiple arguments', (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  const client = new Client('127.0.0.1', 0);
  const m = new Message('/address');
  const buf1 = Buffer.from('first');
  const buf2 = Buffer.from('second');

  m.append('string');
  m.append(42);
  m.append(buf1);
  m.append(3.14);
  m.append(buf2);

  oscServer.on('message', (msg) => {
    t.equal(msg[0], '/address', 'Address matches');
    t.equal(msg[1], 'string', 'String matches');
    t.equal(msg[2], 42, 'Integer matches');
    t.same(msg[3], buf1, 'First buffer matches');
    t.equal(round(msg[4]), 3.14, 'Float matches');
    t.same(msg[5], buf2, 'Second buffer matches');
    oscServer.close();
    t.end();
  });

  client.send(m, () => {
    client.close();
  });
});

test('message: Buffer in constructor', (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  const client = new Client('127.0.0.1', 0);
  const buf = Buffer.from('constructor buffer');
  const m = new Message('/address', 'test', buf, 123);

  oscServer.on('message', (msg) => {
    const expected = [
      '/address',
      'test',
      buf,
      123
    ];
    t.same(msg, expected, `We received the constructor buffer payload: ${msg}`);
    oscServer.close();
    t.end();
  });

  client.send(m, () => {
    client.close();
  });
});

test('message: Buffer in array', (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  const client = new Client('127.0.0.1', 0);
  const m = new Message('/address');
  const buf1 = Buffer.from('array1');
  const buf2 = Buffer.from('array2');

  m.append([buf1, 'string', buf2, 456]);

  oscServer.on('message', (msg) => {
    const expected = [
      '/address',
      buf1,
      'string',
      buf2,
      456
    ];
    t.same(msg, expected, `We received the array with buffers: ${msg}`);
    oscServer.close();
    t.end();
  });

  client.send(m, () => {
    client.close();
  });
});

test('message: empty Buffer', (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  const client = new Client('127.0.0.1', 0);
  const m = new Message('/address');
  const buf = Buffer.from('');
  
  m.append(buf);

  oscServer.on('message', (msg) => {
    const expected = [
      '/address',
      buf
    ];
    t.same(msg, expected, `We received the empty buffer: ${msg}`);
    oscServer.close();
    t.end();
  });

  client.send(m, () => {
    client.close();
  });
});

test('message: large Buffer', (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  const client = new Client('127.0.0.1', 0);
  const m = new Message('/address');
  const buf = Buffer.alloc(1024, 'x');
  
  m.append(buf);

  oscServer.on('message', (msg) => {
    t.equal(msg[0], '/address', 'Address matches');
    t.ok(Buffer.isBuffer(msg[1]), 'Second element is a Buffer');
    t.equal(msg[1].length, 1024, 'Buffer size matches');
    t.same(msg[1], buf, 'Buffer content matches');
    oscServer.close();
    t.end();
  });

  client.send(m, () => {
    client.close();
  });
});

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
