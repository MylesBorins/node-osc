'use strict';

const t = require('tap');
const test = t.test;

const getPort = require('get-port');

const osc = require('../lib');

t.beforeEach(async (done, t) => {
  t.context.port = await getPort();
});

test('osc: argument message no callback', (t) => {
  const oscServer = new osc.Server(t.context.port, '127.0.0.1');
  const client = new osc.Client('127.0.0.1', t.context.port);

  t.plan(1);

  oscServer.on('message', (msg) => {
    oscServer.close();
    client.close();
    t.deepEqual(msg, ['/test', 1, 2, 'testing'], 'We should receive expected payload');
  });

  client.send('/test', 1, 2, 'testing');
});

test('osc: client with callback and message as arguments', (t) => {
  const oscServer = new osc.Server(t.context.port, '127.0.0.1');
  const client = new osc.Client('127.0.0.1', t.context.port);

  t.plan(2);

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.deepEqual(msg, ['/test', 1, 2, 'testing'], 'We should receive expected payload');
  });

  client.send('/test', 1, 2, 'testing', (err) => {
    t.error(err, 'there should be no error');
    client.close();
  });
});


