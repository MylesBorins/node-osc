'use strict';

const t = require('tap');
const test = t.test;

const getPort = require('get-port');
const semver = require('semver');

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

test('osc: instance of checks', async (t) => {
  if (semver.lt(process.version, '12.16.0')) {
    t.skip();
    return;
  }
  const oscToo = await import('node-osc');
  const m1 = new osc.Message('/address');
  const m2 = new oscToo.Message('/other-address');
  t.ok(m1 instanceof osc.Message);
  t.ok(m1 instanceof oscToo.Message);
  t.ok(m2 instanceof osc.Message);
  t.ok(m2 instanceof oscToo.Message);
  return;
});
