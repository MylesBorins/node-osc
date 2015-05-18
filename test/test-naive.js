'use strict';

var test = require('tape');

var osc = require('../lib');

test('osc: argument message no callback', function (t) {
  var oscServer = new osc.Server(3333, '0.0.0.0');
  var client = new osc.Client('0.0.0.0', 3333);

  t.plan(1);

  oscServer.on('message', function (msg) {
    oscServer.kill();
    client.kill();
    t.deepEqual(msg, ['/test', 1, 2, 'testing'], 'We should receive expected payload');
  });

  client.send('/test', 1, 2, 'testing');
});

test('osc: client with callback and message as arguments', function (t) {
  var oscServer = new osc.Server(3333, '0.0.0.0');
  var client = new osc.Client('0.0.0.0', 3333);

  t.plan(2);

  oscServer.on('message', function (msg) {
    oscServer.kill();
    t.deepEqual(msg, ['/test', 1, 2, 'testing'], 'We should receive expected payload');
  });

  client.send('/test', 1, 2, 'testing', function (err) {
    t.error(err, 'there should be no error');
    client.kill();
  });
});

test('osc: client with callback message as object', function (t) {
  var oscServer = new osc.Server(3333, '0.0.0.0');
  var client = new osc.Client('0.0.0.0', 3333);
  var m = new osc.Message('/address');
  m.append('testing');
  m.append('testing');
  m.append(123);

  oscServer.on('message', function (msg) {
    t.deepEqual(msg, ['/address', 'testing', 'testing', 123], 'We should receive expected payload');
    oscServer.kill();
    t.end();
  });

  client.send(m, function () {
    client.kill();
  });
});
