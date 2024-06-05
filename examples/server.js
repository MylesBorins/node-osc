'use strict';
var { Server } = require('node-osc');

var oscServer = new Server(3333, '0.0.0.0');

oscServer.on('message', function (msg) {
  console.log(`Message: ${msg}`);
  oscServer.close();
});
