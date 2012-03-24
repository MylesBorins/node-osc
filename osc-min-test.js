var min = require('osc-min');
var dgram = require('dgram');

var socket = dgram.createSocket("udp4");
var buf = min.toBuffer("/address",[1,2,"test"], "[strict]");
console.log(buf);
socket.send(buf, 0, buf.length, 8080, "localhost");