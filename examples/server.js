'use strict';
var osc = require('../lib');

var oscServer = new osc.Server(3333, '0.0.0.0');
oscServer.on('message', function (msg) {
    console.log('Message:');
    console.log(msg);
});
