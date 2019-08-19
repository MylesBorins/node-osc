'use strict';

const test = require('tap').test;

const { generatePort } = require('./util');

const osc = require('../lib');

test('client: with array', (t) => {
  const port = generatePort();
  const oscServer = new osc.Server(port, '0.0.0.0');
  const client = new osc.Client('0.0.0.0', port);

  t.plan(2);

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.deepEqual(msg, ['/test', 0, 1, 'testing', true], 'We should receive expected payload');
  });

  client.send(['/test', 0, 1, 'testing', true], (err) => {
    t.error(err, 'there should be no error');
    client.close();
  });
});

test('client: with string', (t) => {
  const port = generatePort();
  const oscServer = new osc.Server(port, '0.0.0.0');
  const client = new osc.Client('0.0.0.0', port);

  t.plan(2);

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.deepEqual(msg, ['/test'], `We should receive expected payload: ${msg}`);
  });

  client.send('/test', (err) => {
    t.error(err, 'there should be no error');
    client.close();
  });
});

test('client: with object', (t) => {
  const port = generatePort();
  const oscServer = new osc.Server(port, '0.0.0.0');
  const client = new osc.Client('0.0.0.0', port);

  t.plan(2);

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.deepEqual(msg, ['/test', 1, 2, 3, 'lol', false], `we received the payload: ${msg}`);
  });

  client.send({
    address: '/test',
    args: [
      1,
      2,
      3,
      'lol',
      false
    ]
  }, (err) => {
    t.error(err, 'there should be no error');
    client.close();
  });
});

test('client: failure', (t) => {
  const port = generatePort();
  const client = new osc.Client('0.0.0.0', port);

  t.plan(1);
  t.throws(() => {
    client.send(123, (err) => {
      t.error(err, 'there should be no error');
    });
  });
  client.close();
});
