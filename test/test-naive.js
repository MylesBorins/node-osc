'use strict';

var test = require('tape');

var osc = require('../lib');

test('osc: message', function (t) {
  var oscServer = new osc.Server(3333, '0.0.0.0');
  var client = new osc.Client('0.0.0.0', 3333);

  oscServer.on('message', function (msg) {
    t.deepEqual(msg, ['/test', 1, 2, 'testing'], 'We should receive expected payload');
    oscServer.kill();
    client.kill();
    t.end();
  });

  client.send('/test', 1, 2, 'testing');
});

test('osc: message', function (t) {
  var oscServer = new osc.Server(3333, '0.0.0.0');
  var client = new osc.Client('0.0.0.0', 3333);
  var m = new osc.Message('/address');
  m.append('testing');
  m.append('testing');
  m.append(123);

  oscServer.on('message', function (msg) {
    t.deepEqual(msg, ['/address', 'testing', 'testing', 123], 'We should receive expected payload');
    oscServer.kill();
    client.kill();
    t.end();
  });

  client.send(m);
});
