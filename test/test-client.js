'use strict';

const test = require('tap').test;

const osc = require('../lib');

test('client: with array', (t) => {
  const oscServer = new osc.Server(3333, '0.0.0.0');
  const client = new osc.Client('0.0.0.0', 3333);

  t.plan(2);

  oscServer.on('message', (msg) => {
    oscServer.kill();
    t.deepEqual(msg, ['/test', 0, 1, 'testing'], 'We should receive expected payload');
  });

  client.send(['/test', 0, 1, 'testing'], (err) => {
    t.error(err, 'there should be no error');
    client.kill();
  });
});

test('client: with string', (t) => {
  const oscServer = new osc.Server(3333, '0.0.0.0');
  const client = new osc.Client('0.0.0.0', 3333);

  t.plan(2);

  oscServer.on('message', (msg) => {
    oscServer.kill();
    t.deepEqual(msg, ['/test'], `We should receive expected payload: ${msg}`);
  });

  client.send('/test', (err) => {
    t.error(err, 'there should be no error');
    client.kill();
  });
});

test('client: with object', (t) => {
  const oscServer = new osc.Server(3333, '0.0.0.0');
  const client = new osc.Client('0.0.0.0', 3333);

  t.plan(2);

  oscServer.on('message', (msg) => {
    oscServer.kill();
    t.deepEqual(msg, ['/test', 1, 2, 3, 'lol'], `we received the payload: ${msg}`);
  });

  client.send({
    address: '/test',
    args: [
      1,
      2,
      3,
      'lol'
    ]
  }, (err) => {
    t.error(err, 'there should be no error');
    client.kill();
  });
});

test('client: failure', (t) => {
  const client = new osc.Client('0.0.0.0', 3333);

  t.plan(1);
  t.throws(() => {
    client.send(123, (err) => {
      t.error(err, 'there should be no error');
    });
  });
  client.kill();
});
