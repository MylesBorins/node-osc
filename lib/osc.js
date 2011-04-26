require.paths.unshift(__dirname + '/node-jspack');
var buffer = require('buffer');
var dgram = require('dgram');
var sys = require('sys');
var util = require('util');
var events = require('events');

var jspack = require('jspack').jspack;

////////////////////
// OSC Message
////////////////////

function Message (address) {
    this.address = address;
    this.typetags = '';
    this.args = [];

    for (var i = 1; i < arguments.length; i++) {
        var arg = arguments[i];
        switch (typeof arg) {
        case 'object':
            if (arg.typetag) {
                this.typetags += arg.typetag;
                this.args.push(arg);
            } else {
                throw new Error("don't know how to encode object " + arg)
            }
            break;
        case 'number':
            if (Math.floor(arg) == arg) {
                this.typetags += TInt.prototype.typetag;
                this.args.push(new TInt(Math.floor(arg)));
            } else {
                this.typetags += TFloat.prototype.typetag;
                this.args.push(new TFloat(arg));
            }
            break;
        case 'string':
            this.typetags += TString.prototype.typetag;
            this.args.push(new TString(arg));
            break;
        default:
            throw new Error("don't know how to encode " + arg);
        }
    }
}

Message.prototype = {
    toBinary: function () {
        var address = new TString(this.address);
        var binary = [];
        var pos = 0;
        pos = address.encode(binary, pos);
        if (this.typetags) {
            var typetags = new TString(',' + this.typetags);
            pos = typetags.encode(binary, pos);
            for (var i = 0; i < this.args.length; i++) {
                pos = this.args[i].encode(binary, pos);
            }
        }
        return binary;
    },
}
exports.Message = Message;

var Bundle = function (time) {
    this.timetag = time || 0;
    this.parts = [];
    for (var i = 1; i < arguments.length; i++) {
        this.append(arguments[i]);
    }
}

sys.inherits(Bundle, Message);

Bundle.prototype.append = function (arg) {
    var message;
    if (arg instanceof Message) {
        message = arg;
    } else {
        // cheesy
        var message = new Message;
        Message.apply(message, arguments);
    }
    this.parts.push(message);
}

Bundle.prototype.toBinary = function () {
    var buffer = [];
    var p = 0;
    p = (new TString('#bundle')).encode(buffer, p);
    p = (new TTime(this.timetag)).encode(buffer, p);
    for (var i = 0; i < this.parts.length; i++) {
        var binary = this.parts[i].toBinary();
        var length = binary.length;
        jspack.PackTo('>i', buffer, buffer.length, [length]);
        buffer = buffer.concat(binary);
    }
    return buffer;
}

exports.Bundle = Bundle;

////////////////////
// OSC Client
////////////////////

var Client = function (host, port) {
    this.port = port;
    this.host = host;
    this._sock = dgram.createSocket('udp4');
}

Client.prototype = {
    send: function () {
        var binary;
        if (arguments[0].toBinary) {
            binary = arguments[0].toBinary();
        } else {
            // cheesy
            var message = new Message;
            Message.apply(message, arguments)
            binary = Message.prototype.toBinary.call(message);
        }
        var b = new buffer.Buffer(binary, 'binary');
        this._sock.send(b, 0, b.length, this.port, this.host);
    }                                                       // 
}

exports.Client = Client;

////////////////////
// OSC Message encoding and decoding functions
////////////////////

function ShortBuffer(type, buf, requiredLength)
{
    this.type = "ShortBuffer";
    var message = "buffer [";
    for (var i = 0; i < buf.length; i++) {
        if (i) {
            message += ", ";
        }
        message += buf.charCodeAt(i);
    }
    message += "] too short for " + type + ", " + requiredLength + " bytes required";
    this.message = message;
}

function TString (value) { this.value = value; }
TString.prototype = {
    typetag: 's',
    decode: function (data) {
        var end = 0;
        while (data[end] && end < data.length) {
            end++;
        }
        if (end == data.length) {
            throw Error("OSC string not null terminated");
        }
        this.value = data.toString('ascii', 0, end);
        var nextData = parseInt(Math.ceil((end + 1) / 4.0) * 4);
        return data.slice(nextData);
    },
    encode: function (buf, pos) {
        var len = Math.ceil((this.value.length + 1) / 4.0) * 4;
        return jspack.PackTo('>' + len + 's', buf, pos, [ this.value ]);
    }
}
exports.TString = TString;

function TInt (value) { this.value = value; }
TInt.prototype = {
    typetag: 'i',
    decode: function (data) {
        if (data.length < 4) {
            throw new ShortBuffer('int', data, 4);
        }

        this.value = jspack.Unpack('>i', data.slice(0, 4))[0];
        return data.slice(4);
    },
    encode: function (buf, pos) {
        return jspack.PackTo('>i', buf, pos, [ this.value ]);
    }
}
exports.TInt = TInt;

function TTime (value) { this.value = value; }
TTime.prototype = {
    typetag: 't',
    decode: function (data) {
        if (data.length < 8) {
            throw new ShortBuffer('time', data, 8);
        }
        this.value = jspack.Unpack('>LL', data.slice(0, 8))[0];
        return data.slice(8);
    },
    encode: function (buf, pos) {
        return jspack.PackTo('>LL', buf, pos, this.value);
    }
}
exports.TTime = TTime;

function TFloat (value) { this.value = value; }
TFloat.prototype = {
    typetag: 'f',
    decode: function (data) {
        if (data.length < 4) {
            throw new ShortBuffer('float', data, 4);
        }

        this.value = jspack.Unpack('>f', data.slice(0, 4))[0];
        return data.slice(4);
    },
    encode: function (buf, pos) {
        return jspack.PackTo('>f', buf, pos, [ this.value ]);
    }
}
exports.TFloat = TFloat;

function TBlob (value) { this.value = value; }
TBlob.prototype = {
    typetag: 'b',
    decode: function (data) {
        var length = jspack.Unpack('>i', data.slice(0, 4))[0];
        var nextData = parseInt(Math.ceil((length) / 4.0) * 4) + 4;
        this.value = data.slice(4, length + 4);
        return data.slice(nextData);
    },
    encode: function (buf, pos) {
        var len = Math.ceil((this.value.length) / 4.0) * 4;
        return jspack.PackTo('>i' + len + 's', buf, pos, [len, this.value]);
    }
}
exports.TBlob = TBlob;

function TDouble (value) { this.value = value; }
TDouble.prototype = {
    typetag: 'd',
    decode: function (data) {
        if (data.length < 8) {
            throw new ShortBuffer('double', data, 8);
        }
        this.value = jspack.Unpack('>d', data.slice(0, 8))[0];
        return data.slice(8);
    },
    encode: function (buf, pos) {
        return jspack.PackTo('>d', buf, pos, [ this.value ]);
    }
}
exports.TDouble = TDouble;

// for each OSC type tag we use a specific constructor function to decode its respective data
var tagToConstructor = { 'i': function () { return new TInt },
                         'f': function () { return new TFloat },
                         's': function () { return new TString },
                         'b': function () { return new TBlob },
                         'd': function () { return new TDouble } };

function decode (data) {
    // this stores the decoded data as an array
    var message = [];

    // we start getting the <address> and <rest> of OSC msg /<address>\0<rest>\0<typetags>\0<data>
    var address = new TString;
    data = address.decode(data);

    // Checking if we received a bundle (typical for TUIO/OSC)
    if (address.value == '#bundle') {
        var time = new TTime;
        data = time.decode(data);

        var length, part;
        while(data.length > 0) {
            length = new TInt;
            data = length.decode(data);

            part = data.slice(0, length.value);
            //message = message.concat(decode(part));
            message.push(decode(part));

            data = data.slice(length.value, data.length);
        }

    } else if (data.length > 0) {
        message.push(address.value);

        // if we have rest, maybe we have some typetags... let see...

        // now we advance on the old rest, getting <typetags>
        var typetags = new TString;
        data = typetags.decode(data);
        typetags = typetags.value;
        // so we start building our message list
        if (typetags[0] != ',') {
            throw "invalid type tag in incoming OSC message, must start with comma";
        }
        for (var i = 1; i < typetags.length; i++) {
            var constructor = tagToConstructor[typetags[i]];
            if (!constructor) {
                throw "Unsupported OSC type tag " + typetags[i] + " in incoming message";
            }
            var argument = constructor();
            data = argument.decode(data);
            message.push(argument.value);
        }
    }

    return message;
};


////////////////////
// OSC Server
////////////////////

var Server = function(port, host) {
    events.EventEmitter.call(this);
    var _callbacks = [];
    this.port = port;
    this.host = host;
    this._sock = dgram.createSocket('udp4');
    this._sock.bind(port);
    var server = this;
    this._sock.on('message', function (msg, rinfo) {
        // on every message sent through the UDP socket...
        // we decode the message getting a beautiful array with the form:
        // [<address>, <typetags>, <values>*]
        var decoded = decode(msg);
        try {
            if (decoded) {
                server.emit('message', decoded, rinfo);
                server.emit(decoded[0], decoded, rinfo);
            }
        }
        catch (e) {
            console.log("can't decode incoming message: " + e.message);
        }
    });
}

util.inherits(Server, events.EventEmitter);

exports.Server = Server;