'use strict';

const t = require('tap');
const test = t.test;

const getPort = require('get-port');

const osc = require('../lib');

t.beforeEach(async (done, t) => {
  t.context.port = await getPort();
});

test('server: create and close', (t) => {
  t.plan(1);
  const oscServer = new osc.Server(t.context.port, '127.0.0.1');
  oscServer.close((err) => {
    t.error(err);
  });
});

test('client: listen to message', (t) => {
  const oscServer = new osc.Server(t.context.port, '127.0.0.1');
  const client = new osc.Client('127.0.0.1', t.context.port);

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
  const oscServer = new osc.Server(t.context.port, '127.0.0.1');
  t.throws(() => {
    oscServer._sock.emit('message', 'whoops');
  }, /can't decode incoming message:/);
  oscServer.close((err) => {
    t.error(err);
  });
});
