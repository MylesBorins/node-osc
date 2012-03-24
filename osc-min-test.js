var min = require('osc-min');
var dgram = require('dgram');
var socket = dgram.createSocket("udp4");

////////////////////
// OSC Message
////////////////////


function Message(address) {
	this.oscType = "message";
	this.address = address;
	this.args = [];
	
    for (var i = 1; i < arguments.length; i++) {
		this.append(arguments[i]);
    }
}

Message.prototype = {
    append: function (arg) {
        switch (typeof arg) {
        case 'object':
            if (arg.type) {
				this.args.push(arg);
            } else {
                throw new Error("don't know how to encode object " + arg)
            }
            break;
        case 'number':
			if (Math.floor(arg) == arg) {
                var argOut = new Argument('integer', arg);
				this.args.push(argOut);
            } else {
                var argOut = new Argument('float', arg);
				this.args.push(argOut);
            }
            break;
        case 'string':
			var argOut = new Argument('string', arg);
			this.args.push(argOut);
            break;
        default:
            throw new Error("don't know how to encode " + arg);
        }	
	}
}

exports.Message = Message;

function Argument(type, value){
	this.type = type;
	this.value = value;
}

////////////////////
// OSC Client
////////////////////

var Client = function (host, port) {
    this.host = host;
    this.port = port;
    this._sock = dgram.createSocket('udp4');
}

Client.prototype = {
    send: function (message) {
        var buf = min.toBuffer(message);
		socket.send(buf, 0, buf.length, this.port, this.host);
    }                                                  
}

exports.Client = Client;


// var mes = new Message("/address", 12, 2.2);
// var buf =  min.toBuffer(mes);
// socket.send(buf, 0, buf.length, 8080, "localhost");
var client = new Client('localhost', 8080);
var msg = new Message('/address', 12, 2);
client.send(msg);