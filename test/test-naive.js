'use strict';

var test = require('tape');

var osc = require('../lib');

test('osc: message', function (t) {
  var oscServer = new osc.Server(3333, '0.0.0.0');
  var client = new osc.Client('0.0.0.0', 3333);

  oscServer.on('message', function (msg) {
    console.log('Message: ' + msg);
    t.ok(msg, 'this should exist');
    oscServer.kill();
    client.kill();
    t.end();
  });

  client.send('/test', 1, 2.3, 'testing');
});
