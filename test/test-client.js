'use strict';

const t = require('tap');
const test = t.test;

const getPort = require('get-port');

const osc = require('../lib');

t.beforeEach(async (done, t) => {
  t.context.port = await getPort({port: getPort.makeRange(3000, 3100)});
});

test('client: with array', (t) => {
  const oscServer = new osc.Server(t.context.port, '127.0.0.1');
  const client = new osc.Client('127.0.0.1', t.context.port);

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
  const oscServer = new osc.Server(t.context.port, '127.0.0.1');
  const client = new osc.Client('127.0.0.1', t.context.port);

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
  const oscServer = new osc.Server(t.context.port, '127.0.0.1');
  const client = new osc.Client('127.0.0.1', t.context.port);

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
  const client = new osc.Client('127.0.0.1', t.context.port);

  t.plan(2);

  t.throws(() => {
    client.send(123, (err) => {
      t.error(err, 'there should be no error');
    });
  });
  client.close();
  client.send('/boom', (err) => {
    t.equals(err.code, 'ERR_SOCKET_DGRAM_NOT_RUNNING');
  });
});
