var osc = require('./lib/osc');

var oscServer = new osc.Server(3333, '0.0.0.0');
oscServer.on("message", function (msg, rinfo) {
	console.log("TUIO message:");
	console.log(msg);
});
