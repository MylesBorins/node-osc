var osc = require('./lib/osc');

var client = new osc.Client('127.0.0.1', 3333);
client.send('/oscAddress', 200);

