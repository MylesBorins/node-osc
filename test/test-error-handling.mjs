import { once } from 'node:events';
import { test } from 'tap';

import { Server, Client } from 'node-osc';

test('server: socket error event is emitted', async (t) => {
  t.plan(1);
  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  
  oscServer.on('error', (err) => {
    t.ok(err, 'error event should be emitted');
    oscServer.close();
  });
  
  // Simulate a socket error
  oscServer._sock.emit('error', new Error('test socket error'));
});

test('server: error listener can be added before listening', async (t) => {
  t.plan(2);
  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  
  oscServer.on('error', (err) => {
    t.ok(err, 'error event should be emitted');
    t.equal(err.message, 'socket test error', 'error message should match');
  });
  
  t.teardown(() => {
    oscServer.close();
  });
  
  // Simulate a socket error
  oscServer._sock.emit('error', new Error('socket test error'));
});

test('client: socket error event is emitted', (t) => {
  t.plan(1);
  const client = new Client('127.0.0.1', 9999);
  
  client.on('error', (err) => {
    t.ok(err, 'error event should be emitted');
    client.close();
  });
  
  // Simulate a socket error
  client._sock.emit('error', new Error('test client error'));
});

test('client: error listener can be added at construction', (t) => {
  t.plan(2);
  const client = new Client('127.0.0.1', 9999);
  
  client.on('error', (err) => {
    t.ok(err, 'error event should be emitted');
    t.equal(err.message, 'client socket error', 'error message should match');
  });
  
  t.teardown(() => {
    client.close();
  });
  
  // Simulate a socket error
  client._sock.emit('error', new Error('client socket error'));
});

test('client: is an EventEmitter instance', (t) => {
  t.plan(1);
  const client = new Client('127.0.0.1', 9999);
  
  t.ok(typeof client.on === 'function', 'client should have EventEmitter methods');
  
  client.close();
});

test('server: multiple error listeners can be attached', async (t) => {
  t.plan(2);
  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  
  oscServer.on('error', (err) => {
    t.ok(err, 'first listener should receive error');
  });
  
  oscServer.on('error', (err) => {
    t.ok(err, 'second listener should receive error');
  });
  
  t.teardown(() => {
    oscServer.close();
  });
  
  // Simulate a socket error
  oscServer._sock.emit('error', new Error('multi listener test'));
});

test('client: multiple error listeners can be attached', (t) => {
  t.plan(2);
  const client = new Client('127.0.0.1', 9999);
  
  client.on('error', (err) => {
    t.ok(err, 'first listener should receive error');
  });
  
  client.on('error', (err) => {
    t.ok(err, 'second listener should receive error');
  });
  
  t.teardown(() => {
    client.close();
  });
  
  // Simulate a socket error
  client._sock.emit('error', new Error('multi listener test'));
});
