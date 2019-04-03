'use strict';

const test = require('tap').test;

const osc = require('../lib');

test('server: create and close', (t) => {
  t.plan(2);
  const oscServer = new osc.Server(3333, '0.0.0.0');
  oscServer.close((err) => {
    t.error(err);
  });
  t.ok(true);
});

test('server: legacy kill alias', (t) => {
  t.plan(2);
  const oscServer = new osc.Server(3333, '0.0.0.0');
  oscServer.close((err) => {
    t.error(err);
  });
  t.ok(true);
});