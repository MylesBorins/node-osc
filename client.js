var osc = require('./lib/osc');
var min = require('osc-min');
var dgram = require('dgram');

var test = dgram.createSocket("udp4");
var client = new osc.Client('127.0.0.1', 3333);
var msg =  new osc.Message('/address')
msg.append(0);
msg.append("hi");
console.log(msg);
buf = min.toBuffer(msg);
console.log(buf);
test.send(buf, 0, buf.length, 8080, "localhost");
// client.send('/oscAddress', 200);

