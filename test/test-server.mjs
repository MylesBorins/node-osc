import { beforeEach, test } from 'tap';
import { bootstrap } from './util.mjs';

import { Server, Client } from 'node-osc';

beforeEach(bootstrap);

test('server: create and close', (t) => {
  t.plan(1);
  const oscServer = new Server(t.context.port, '127.0.0.1');
  oscServer.close((err) => {
    t.error(err);
  });
});

test('server: listen to message', (t) => {
  const oscServer = new Server(t.context.port);
  const client = new Client('127.0.0.1', t.context.port);

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

test('server: no defined host', (t) => {
  const oscServer = new Server(t.context.port);
  const client = new Client('127.0.0.1', t.context.port);

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

test('server: callback as second arg', (t) => {
  t.plan(4);
  const oscServer = new Server(t.context.port, () => {
    t.ok('callback called');
  });
  const client = new Client('127.0.0.1', t.context.port);

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
