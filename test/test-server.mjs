import { once } from 'node:events';
import { test } from 'tap';

import { Server, Client } from 'node-osc';

test('server: create and close', async (t) => {
  t.plan(1);
  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  oscServer.close((err) => {
    t.error(err);
  });
});

test('server: listen to message', async (t) => {
  const oscServer = new Server(0);
  await once(oscServer, 'listening');
  const client = new Client('127.0.0.1', oscServer.port);

  t.plan(3);

  t.teardown(() => {
    oscServer.close();
    client.close();
  });

  oscServer.on('message', (msg) => {
    t.same(msg, ['/test'], 'We should receive expected payload');
  });
  
  oscServer.on('/test', (msg) => {
    t.same(msg, ['/test'], 'We should receive expected payload');
  });

  client.send('/test', (err) => {
    t.error(err, 'there should be no error');
  });
});

test('server: no defined host', async (t) => {
  const oscServer = new Server(0);
  await once(oscServer, 'listening');
  const client = new Client('127.0.0.1', oscServer.port);

  t.plan(3);

  t.teardown(() => {
    oscServer.close();
    client.close();
  });

  oscServer.on('message', (msg) => {
    t.same(msg, ['/test'], 'We should receive expected payload');
  });
  
  oscServer.on('/test', (msg) => {
    t.same(msg, ['/test'], 'We should receive expected payload');
  });

  client.send('/test', (err) => {
    t.error(err, 'there should be no error');
  });
});

test('server: callback as second arg', async (t) => {
  t.plan(4);
  const oscServer = new Server(0, () => {
    t.ok('callback called');
  });
  await once(oscServer, 'listening');
  const client = new Client('127.0.0.1', oscServer.port);

  t.teardown(() => {
    oscServer.close();
    client.close();
  });

  oscServer.on('message', (msg) => {
    t.same(msg, ['/test'], 'We should receive expected payload');
  });
  
  oscServer.on('/test', (msg) => {
    t.same(msg, ['/test'], 'We should receive expected payload');
  });

  client.send('/test', (err) => {
    t.error(err, 'there should be no error');
  });
});

test('server: bad message', async (t) => {
  t.plan(2);
  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  t.throws(() => {
    oscServer._sock.emit('message', 'whoops');
  }, /can't decode incoming message:/);
  oscServer.close((err) => {
    t.error(err);
  });
});
