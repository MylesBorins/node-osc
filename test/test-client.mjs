import { beforeEach, test } from 'tap';
import { bootstrap } from './util.mjs';

import { Server, Client } from 'node-osc';

beforeEach(bootstrap);

test('client: with array', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(2);

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.same(msg, ['/test', 0, 1, 'testing', true], 'We should receive expected payload');
  });

  client.send(['/test', 0, 1, 'testing', true], (err) => {
    t.error(err, 'there should be no error');
    client.close();
  });
});

test('client: array is not mutated when sent', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(3);

  const originalArray = ['/test', 0, 1, 'testing', true];
  const expectedArray = ['/test', 0, 1, 'testing', true];

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.same(msg, ['/test', 0, 1, 'testing', true], 'We should receive expected payload');
    // Verify the original array was not mutated
    t.same(originalArray, expectedArray, 'Original array should not be mutated');
  });

  client.send(originalArray, (err) => {
    t.error(err, 'there should be no error');
    client.close();
  });
});

test('client: with string', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(2);

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.same(msg, ['/test'], `We should receive expected payload: ${msg}`);
  });

  client.send('/test', (err) => {
    t.error(err, 'there should be no error');
    client.close();
  });
});

test('client: with Message object', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(2);

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.same(msg, ['/test', 1, 2, 3, 'lol', false], `we received the payload: ${msg}`);
  });

  client.send({
    address: '/test',
    args: [
      1,
      2,
      3,
      'lol',
      false
    ]
  }, (err) => {
    t.error(err, 'there should be no error');
    client.close();
  });
});

test('client: with Bundle object', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(2);

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.same(msg, ['/test', 1, 2, 3, 'lol', false], `we received the payload: ${msg}`);
  });

  client.send({
    address: '/test',
    args: [
      1,
      2,
      3,
      'lol',
      false
    ]
  }, (err) => {
    t.error(err, 'there should be no error');
    client.close();
  });
});

test('client: failure', (t) => {
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(2);

  t.throws(() => {
    client.send(123, (err) => {
      t.error(err, 'there should be no error');
    });
  });
  client.close();
  client.send('/boom', (err) => {
    t.equal(err.code, 'ERR_SOCKET_DGRAM_NOT_RUNNING');
  });
});

test('client: close with callback', (t) => {
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(1);

  client.close((err) => {
    t.error(err, 'close should not error');
  });
});

test('client: send bundle with non-numeric timetag', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(2);

  oscServer.on('bundle', (bundle) => {
    oscServer.close();
    t.equal(bundle.timetag, 0, 'should receive immediate execution timetag as 0');
    t.ok(bundle.elements.length > 0, 'should have elements');
    client.close();
  });

  // Send bundle with non-numeric timetag (will be encoded as immediate execution)
  const bundle = {
    oscType: 'bundle',
    timetag: 'immediate', // Non-numeric, will trigger the else branch in writeTimeTag
    elements: [
      {
        oscType: 'message',
        address: '/test1',
        args: [{ type: 'i', value: 42 }]
      }
    ]
  };
  
  client.send(bundle);
});

test('client: send bundle with null timetag', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(2);

  oscServer.on('bundle', (bundle) => {
    oscServer.close();
    t.equal(bundle.timetag, 0, 'should receive immediate execution timetag as 0');
    t.ok(bundle.elements.length > 0, 'should have elements');
    client.close();
  });

  // Send bundle with null timetag (will be encoded as immediate execution)
  const bundle = {
    oscType: 'bundle',
    timetag: null, // Null, will trigger the else branch in writeTimeTag
    elements: [
      {
        oscType: 'message',
        address: '/test2',
        args: [{ type: 's', value: 'hello' }]
      }
    ]
  };
  
  client.send(bundle);
});

test('client: send message with float type arg', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(2);

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.equal(msg[0], '/float-test', 'should receive address');
    t.ok(Math.abs(msg[1] - 9.876) < 0.001, 'should receive float value');
    client.close();
  });

  // Send raw message with 'float' type to hit that case label
  client.send({
    oscType: 'message',
    address: '/float-test',
    args: [{ type: 'float', value: 9.876 }]
  });
});

test('client: send message with blob type arg', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(2);

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.equal(msg[0], '/blob-test', 'should receive address');
    t.ok(Buffer.isBuffer(msg[1]), 'should receive blob as buffer');
    client.close();
  });

  // Send raw message with 'blob' type to hit that case label
  client.send({
    oscType: 'message',
    address: '/blob-test',
    args: [{ type: 'blob', value: Buffer.from([0xAA, 0xBB]) }]
  });
});

test('client: send message with double type arg', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(2);

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.equal(msg[0], '/double-test', 'should receive address');
    t.ok(Math.abs(msg[1] - 1.23456789) < 0.001, 'should receive double value as float');
    client.close();
  });

  // Send raw message with 'double' type to hit that case label
  client.send({
    oscType: 'message',
    address: '/double-test',
    args: [{ type: 'double', value: 1.23456789 }]
  });
});

test('client: send message with midi type arg', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(2);

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.equal(msg[0], '/midi-test', 'should receive address');
    t.ok(Buffer.isBuffer(msg[1]), 'should receive MIDI as buffer');
    client.close();
  });

  // Send raw message with 'midi' type to hit that case label
  client.send({
    oscType: 'message',
    address: '/midi-test',
    args: [{ type: 'midi', value: Buffer.from([0x00, 0x90, 0x40, 0x60]) }]
  });
});
