import { beforeEach, test } from 'tap';

import { Client, Server, Bundle } from 'node-osc';

import { bootstrap } from './util.mjs';
beforeEach(bootstrap);

test('bundle: verbose bundle', (t) => {
  const server = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

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

test('bundle: array syntax', (t) => {
  const server = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

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

test('bundle: nested bundle', (t) => {
  const server = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

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

