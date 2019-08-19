'use strict';

const test = require('tap').test;

const { generatePort } = require('./util');

const osc = require('../lib');

test('osc: argument message no callback', (t) => {
  const port = generatePort();
  const oscServer = new osc.Server(port, '0.0.0.0');
  const client = new osc.Client('0.0.0.0', port);

  t.plan(1);

  oscServer.on('message', (msg) => {
    oscServer.close();
    client.close();
    t.deepEqual(msg, ['/test', 1, 2, 'testing'], 'We should receive expected payload');
  });

  client.send('/test', 1, 2, 'testing');
});

test('osc: client with callback and message as arguments', (t) => {
  const port = generatePort();
  const oscServer = new osc.Server(port, '0.0.0.0');
  const client = new osc.Client('0.0.0.0', port);

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


