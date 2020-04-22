'use strict';

const t = require('tap');
const test = t.test;

const getPort = require('get-port');

const osc = require('../');

t.beforeEach(async (done, t) => {
  t.context.port = await getPort({
    port: getPort.makeRange(3000, 3500)
  });
});

test('osc: argument message no callback', (t) => {
  const oscServer = new osc.Server(t.context.port, '127.0.0.1');
  const client = new osc.Client('127.0.0.1', t.context.port);

  oscServer.on('message', (msg) => {
    t.deepEqual(msg, ['/test', 1, 2, 'testing'], 'We should receive expected payload');
    oscServer.close(client.close(t.done));
  });

  client.send('/test', 1, 2, 'testing');
});

test('osc: client with callback and message as arguments', (t) => {
  const oscServer = new osc.Server(t.context.port, '127.0.0.1');
  const client = new osc.Client('127.0.0.1', t.context.port);

  oscServer.on('message', (msg) => {
    t.deepEqual(msg, ['/test', 1, 2, 'testing'], 'We should receive expected payload');
    client.close(oscServer.close(t.done));
  });

  client.send('/test', 1, 2, 'testing', (err) => {
    t.error(err, 'there should be no error');
  });
});
