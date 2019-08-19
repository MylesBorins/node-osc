'use strict';

const test = require('tap').test;

const { generatePort } = require('./util');

const osc = require('../lib');

test('server: create and close', (t) => {
  const port = generatePort();
  t.plan(1);
  const oscServer = new osc.Server(port, '0.0.0.0');
  oscServer.close((err) => {
    t.error(err);
  });
});

test('client: listen to message', (t) => {
  const port = generatePort();
  const oscServer = new osc.Server(port, '0.0.0.0');
  const client = new osc.Client('0.0.0.0', port);

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
  const port = generatePort();
  t.plan(2);
  const oscServer = new osc.Server(port, '0.0.0.0');
  t.throws(() => {
    oscServer._sock.emit('message', 'whoops');
  }, /can't decode incoming message:/);
  oscServer.close((err) => {
    t.error(err);
  });
});

test('server: legacy kill alias', (t) => {
  const port = generatePort();
  t.plan(1);
  const oscServer = new osc.Server(port, '0.0.0.0');
  process.noDeprecation = true;
  oscServer.kill((err) => {
    process.noDeprecation = false;
    t.error(err);
  });
});
