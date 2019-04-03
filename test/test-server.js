'use strict';

const test = require('tap').test;

const osc = require('../lib');

test('server: create and close', (t) => {
  t.plan(1);
  const oscServer = new osc.Server(3333, '0.0.0.0');
  oscServer.close((err) => {
    t.error(err);
  });
});

test('server: bad message', (t) => {
  t.plan(2);
  const oscServer = new osc.Server(3333, '0.0.0.0');
  t.throws(() => {
    oscServer._sock.emit('message', 'whoops');
  }, /can't decode incoming message:/);
  oscServer.close((err) => {
    t.error(err);
  });
});

test('server: legacy kill alias', (t) => {
  t.plan(1);
  const oscServer = new osc.Server(3333, '0.0.0.0');
  oscServer.kill((err) => {
    t.error(err);
  });
});
