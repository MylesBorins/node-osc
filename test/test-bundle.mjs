import { once } from 'node:events';
import { test } from 'tap';

import { Client, Server, Bundle } from 'node-osc';

test('bundle: verbose bundle', async (t) => {
  const server = new Server(0, '127.0.0.1');
  await once(server, 'listening');
  const client = new Client('127.0.0.1', server.port);

  t.plan(2);

  t.teardown(() => {
    server.close();
    client.close();
  });

  server.on('bundle', (bundle) => {
    t.same(bundle.elements[0], ['/one', 1]);
    t.same(bundle.elements[1], ['/two', 2]);
  });

  client.send(new Bundle(1, {
    address: '/one',
    args: [
      1
    ]
  }, {
    address: '/two',
    args: [
      2
    ]
  }));
});

test('bundle: array syntax', async (t) => {
  const server = new Server(0, '127.0.0.1');
  await once(server, 'listening');
  const client = new Client('127.0.0.1', server.port);

  t.plan(2);

  t.teardown(() => {
    server.close();
    client.close();
  });

  server.on('bundle', (bundle) => {
    t.same(bundle.elements[0], ['/one', 1]);
    t.same(bundle.elements[1], ['/two', 2]);
  });

  client.send(new Bundle(
    ['/one', 1],
    ['/two', 2]
  ));
});

test('bundle: nested bundle', async (t) => {
  const server = new Server(0, '127.0.0.1');
  await once(server, 'listening');
  const client = new Client('127.0.0.1', server.port);

  t.plan(4);

  t.teardown(() => {
    server.close();
    client.close();
  });

  const payload = new Bundle(
    ['/one', 1],
    ['/two', 2],
    ['/three', 3]
  );
  
  payload.append(new Bundle(10,
    ['/four', 4]
  ));

  server.on('bundle', (bundle) => {
    t.same(bundle.elements[0], ['/one', 1]);
    t.same(bundle.elements[1], ['/two', 2]);
    t.same(bundle.elements[2], ['/three', 3]);
    t.same(bundle.elements[3].elements[0], ['/four', 4]);
  });

  client.send(payload);
});
