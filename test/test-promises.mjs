import { once } from 'node:events';
import { test } from 'tap';

import { Server, Client } from 'node-osc';

test('client: send with promise - array', async (t) => {
  const server = new Server(0, '127.0.0.1');
  await once(server, 'listening');
  const client = new Client('127.0.0.1', server.port);

  t.plan(1);

  server.on('message', (msg) => {
    server.close();
    t.same(msg, ['/test', 0, 1, 'testing', true], 'We should receive expected payload');
  });

  await client.send(['/test', 0, 1, 'testing', true]);
  await client.close();
});

test('client: array is not mutated when sent with promise', async (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  const client = new Client('127.0.0.1', oscServer.port);

  t.plan(2);

  const originalArray = ['/test', 0, 1, 'testing', true];
  const expectedArray = ['/test', 0, 1, 'testing', true];

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.same(msg, ['/test', 0, 1, 'testing', true], 'We should receive expected payload');
  });

  await client.send(originalArray);
  
  // Verify the original array was not mutated
  t.same(originalArray, expectedArray, 'Original array should not be mutated');
  
  await client.close();
});

test('client: send with promise - string', async (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  const client = new Client('127.0.0.1', oscServer.port);

  t.plan(1);

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.same(msg, ['/test'], 'We should receive expected payload');
  });

  await client.send('/test');
  await client.close();
});

test('client: send with promise - message object', async (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  const client = new Client('127.0.0.1', oscServer.port);

  t.plan(1);

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.same(msg, ['/test', 1, 2, 3, 'lol', false], 'we received the payload');
  });

  await client.send({
    address: '/test',
    args: [1, 2, 3, 'lol', false]
  });
  await client.close();
});

test('client: send with promise - multiple args', async (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  const client = new Client('127.0.0.1', oscServer.port);

  t.plan(1);

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.same(msg, ['/test', 1, 2, 'testing'], 'We should receive expected payload');
  });

  await client.send('/test', 1, 2, 'testing');
  await client.close();
});

test('client: send promise rejection on closed socket', async (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  const client = new Client('127.0.0.1', oscServer.port);

  t.plan(1);

  await client.close();
  await oscServer.close();

  try {
    await client.send('/boom');
    t.fail('Should have thrown an error');
  } catch (err) {
    t.equal(err.code, 'ERR_SOCKET_DGRAM_NOT_RUNNING', 'Should reject with correct error code');
  }
});

test('client: async/await usage', async (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  const client = new Client('127.0.0.1', oscServer.port);

  t.plan(1);

  const messagePromise = once(oscServer, 'message');

  await client.send('/async-test', 42, 'hello');
  const [receivedMessage] = await messagePromise;
  
  t.same(receivedMessage, ['/async-test', 42, 'hello'], 'Message received via async/await');

  await client.close();
  await oscServer.close();
});

test('server: close with promise', async (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  
  t.plan(1);

  await once(oscServer, 'listening');

  await oscServer.close();
  t.pass('Server closed successfully with promise');
});

test('server: no callback still emits listening event', async (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  
  t.plan(1);

  await once(oscServer, 'listening');
  t.pass('listening event emitted');

  await oscServer.close();
});

test('client and server: full async/await workflow', async (t) => {
  t.plan(3);
  const oscServer = new Server(0, '127.0.0.1');

  // Wait for server to be ready
  await once(oscServer, 'listening');
  t.pass('Server started');

  const client = new Client('127.0.0.1', oscServer.port);
  t.pass('Client created');

  // Set up message handler
  const messageReceived = once(oscServer, 'message');

  // Send message and wait for it to be received
  await client.send('/workflow', 'test', 123);
  const [msg] = await messageReceived;
  t.same(msg, ['/workflow', 'test', 123], 'Message received correctly');

  // Clean up
  await client.close();
  await oscServer.close();
});

test('client: multiple sends with promises', async (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  const client = new Client('127.0.0.1', oscServer.port);
  t.plan(3);

  const messages = [];
  oscServer.on('message', (msg) => {
    messages.push(msg);
  });

  await client.send('/msg1', 1);
  await client.send('/msg2', 2);
  await client.send('/msg3', 3);

  // Give a little time for all messages to be received
  await new Promise((resolve) => setTimeout(resolve, 100));

  t.equal(messages.length, 3, 'Received all three messages');
  t.same(messages[0], ['/msg1', 1], 'First message correct');
  t.same(messages[2], ['/msg3', 3], 'Last message correct');

  await client.close();
  await oscServer.close();
});

test('client: close promise rejection on error', async (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(1);

  // Mock the socket's close method to simulate an error
  const originalClose = client._sock.close.bind(client._sock);
  
  // Set up teardown to ensure socket is properly closed
  t.teardown(() => {
    // Restore original close method first
    client._sock.close = originalClose;
    // Then close the socket
    try {
      client._sock.close(() => {});
    } catch {
      // Socket might already be closed, that's ok
    }
  });
  
  client._sock.close = function(cb) {
    // Simulate an error being passed to callback
    if (cb) {
      const err = new Error('Mock close error');
      err.code = 'MOCK_ERROR';
      setImmediate(() => cb(err));
    }
  };

  try {
    await oscServer.close();
    await client.close();
    t.fail('Should have thrown an error');
  } catch (err) {
    t.equal(err.code, 'MOCK_ERROR', 'Should reject with mock error');
  }
});

test('server: close promise rejection on error', async (t) => {
  const oscServer = new Server(0, '127.0.0.1');

  t.plan(1);

  await once(oscServer, 'listening');

  // Mock the socket's close method to simulate an error
  const originalClose = oscServer._sock.close.bind(oscServer._sock);
  
  // Set up teardown to ensure socket is properly closed
  t.teardown(() => {
    // Restore original close method first
    oscServer._sock.close = originalClose;
    // Then close the socket
    try {
      oscServer._sock.close(() => {});
    } catch {
      // Socket might already be closed, that's ok
    }
  });
  
  oscServer._sock.close = function(cb) {
    // Simulate an error being passed to callback
    if (cb) {
      const err = new Error('Mock close error');
      err.code = 'MOCK_ERROR';
      setImmediate(() => cb(err));
    }
  };

  try {
    await oscServer.close();
    t.fail('Should have thrown an error');
  } catch (err) {
    t.equal(err.code, 'MOCK_ERROR', 'Should reject with mock error');
  }
});

test('client: send promise rejection on send error', async (t) => {
  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  const client = new Client('127.0.0.1', oscServer.port);

  t.plan(1);

  // Mock the socket's send method to simulate an error
  const originalSend = client._sock.send;
  client._sock.send = function(msg, offset, length, port, address, callback) {
    // Simulate an error being passed to callback
    const err = new Error('Mock send error');
    err.code = 'MOCK_SEND_ERROR';
    if (callback) {
      setImmediate(() => callback(err));
    }
  };

  t.teardown(async () => {
    client._sock.send = originalSend;
    await client.close();
    await oscServer.close();
  });

  try {
    await client.send('/test', 'data');
    t.fail('Should have thrown an error');
  } catch (err) {
    t.equal(err.code, 'MOCK_SEND_ERROR', 'Should reject with mock send error');
  }
});
