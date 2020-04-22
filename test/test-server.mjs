import { createRequire } from 'module';
import { Server, Client } from 'node-osc';

import { beforeEach, tap, test } from './util.mjs';

const require = createRequire(import.meta.url);

tap.beforeEach(beforeEach);

test('server: instanceof check', (t) => {
  const ServerToo = require('node-osc').Server;
  const s1 = new Server('127.0.0.1', t.context.port);
  const s2 = new ServerToo('127.0.0.1', t.context.port);
  t.ok(s1 instanceof Server);
  t.ok(s1 instanceof ServerToo);
  t.ok(s2 instanceof Server);
  t.ok(s2 instanceof ServerToo);
  s1.close(s2.close(t.done));
});


test('server: create and close', (t) => {
  t.plan(1);
  const oscServer = new Server(t.context.port, '127.0.0.1');
  oscServer.close((err) => {
    t.error(err);
  });
});

test('client: listen to message', (t) => {
  const oscServer = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(3);

  t.tearDown(() => {
    oscServer.close();
    client.close();
  });

  oscServer.on('message', (msg) => {
    t.deepEqual(msg, ['/test'], 'We should receive expected payload');
  });
  
  oscServer.on('/test', (msg) => {
    t.deepEqual(msg, ['/test'], 'We should receive expected payload');
  });

  client.send('/test', (err) => {
    t.error(err, 'there should be no error');
  });
});

test('server: bad message', (t) => {
  t.plan(2);
  const oscServer = new Server(t.context.port, '127.0.0.1');
  t.throws(() => {
    oscServer._sock.emit('message', 'whoops');
  }, /can't decode incoming message:/);
  oscServer.close((err) => {
    t.error(err);
  });
});
