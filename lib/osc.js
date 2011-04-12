require.paths.unshift(__dirname + '/node-jspack');
var buffer = require('buffer');
var dgram = require('dgram');
var sys = require('sys');

var jspack = require('jspack').jspack;

////////////////////
// OSC Message
////////////////////

var Message = function (address) {
    this.address = address;
    this.typetags = ',';
    this.message = [];
}

Message.prototype = {
    append: function (arg, typehint) {
        if (arg instanceof Array) {
            for (var i in arg) {
                this.append(arg[i], typehint);
            }
            return null;
        }
        if (typeof(arg) == 'object') {
            for (var k in arg) {
                this.append([k, arg[k]]);
            }
            return null;
        }
        
        if (typehint == 'b') {
            binary = OSCBlob(arg);
            tag = 'b';
        } else if (typehint == 't') {
            binary = OSCTimeTag(arg);
            tag = 't';
        } else {
            rv = OSCArgument(arg, typehint);
            tag = rv[0];
            binary = rv[1];
        }
        
        this.typetags += tag;
        this.message = this.message.concat(binary);
    },
    toBinary: function () {
        var binary = OSCString(this.address);
        binary = binary.concat(OSCString(this.typetags));
        binary = binary.concat(this.message);
        return binary;
    },
}
exports.Message = Message;

var Bundle = function (address, time) {
    Message.call(this, address);
    this.timetag = time || 0;
}

sys.inherits(Bundle, Message);

Bundle.prototype.append = function (arg, typehint) {
    var binary;
    if (arg instanceof Message) {
        binary = OSCBlob(arg.toBinary());
    } else {
        var msg = Message(this.address);
        if (typeof(arg) == 'Object') {
            if (arg.addr) {
                msg.address = arg.addr;
            }
            if (arg.args) {
                msg.append(arg.args, typehint);
            }
        } else {
            msg.append(arg, typehint);
        }
        binary = OSCBlob(msg.toBinary());
    }
    this.message += binary;
    this.typetags += 'b';
};

Bundle.prototype.toBinary = function () {
    var binary = OSCString('#bundle');
    binary = binary.concat(OSCTimeTag(this.timetag));
    binary = binary.concat(this.message);
    return binary;
};

exports.Bundle = Bundle;

////////////////////
// OSC Message Encoding Functions
////////////////////

var OSCString = function (next) {
    var len = Math.ceil((next.length + 1) / 4.0) * 4;
    var foo = jspack.Pack('>' + len + 's', [next]);
    return foo
}

var OSCBlob = function (next) {
    var binary;
    if (typeof(next) == 'String') {
        var len = Math.ceil((next.length) / 4.0) * 4;
        binary = jspack.Pack('>i' + len + 's', [len, next]);
    } else {
        binary = '';
    }
    return binary;
}

var OSCArgument = function (next, typehint) {
    var binary, tag;
    if (!typehint) {
        if (typeof(next) == 'number') {
            if (next.toString().indexOf('.') != -1) {
                binary = jspack.Pack('>f', [next]);
                tag = 'f';
            } else {
                binary = jspack.Pack('>i', [next]);
                tag = 'i';
            }
        } else {
            binary = OSCString(next);
            tag = 's';
        }
    } else if (typehint == 'd') {
        try {
            binary = jspack.Pack('>f', [parseFloat(next)]);
            tag = 'f';
        } catch (e) {
            binary = OSCString(next);
            tag = 's';
        }
    } else if (typehint == 'i') {
        try {
            binary = jspack.Pack('>i', [parseInt(next)]);
            tag = 'i';
        } catch (e) {
            binary = OSCString(next);
            tag = 's';
        }
    } else {
        binary = OSCString(next);
        tag = 's';
    }
    return [tag, binary];
}

var OSCTimeTag = function (time) {
    // Not Implemented Yet
    return jspack.Pack('>LL', 0, 1);
}

////////////////////
// OSC Client
////////////////////

var Client = function (port, host) {
    this.port = port;
    this.host = host;
    this._sock = dgram.createSocket('udp4');
}

Client.prototype = {
    send: function (msg) {
        var binary = msg.toBinary();
        var b = new buffer.Buffer(binary, 'binary');
        this._sock.send(b, 0, b.length, this.port, this.host);
    },
    sendSimple: function (address, data) {
        var msg = new Message(address);
        msg.append(data);
        this.send(msg);
    },
}

exports.Client = Client;

////////////////////
// OSC Message Decoding Functions
////////////////////

var _readString = function (data) {
    var data = data.toString('utf8');
    var length = data.search('\0');
    var nextData = parseInt(Math.ceil((length + 1) / 4.0) * 4);
    return [data.substring(0, length), data.substr(nextData)];
};

var _readInt = function (data) {
    if (data.length < 4) {
        console.log('Error: too few bytes for int ' + data + data.length);
        rest = data;
        value = 0;
    } else {
        value = jspack.Unpack('>i', new Buffer(data.substring(0,4)));
        if (value == undefined) {
            value = 0;
        }
        rest = data.substr(4);
    }
    return [value, rest];
};

var _readFloat = function (data) {
    if (data.length < 4) {
        console.log('Error: too few bytes for float ' + data + data.length);
        rest = data;
        value = 0;
    } else {
        value = jspack.Unpack('>f', new Buffer(data.substring(0,4)));
        if (value == undefined) {
            value = 0;
        }
        rest = data.substr(4);
    }
    return [value, rest];
};

var _readBlob = function (data) {
    var length = fdpack.Unpack('>i', new Buffer(data.substring(0,4)));
    var nextData = parseInt(Math.ceil((length) / 4.0) * 4) + 4;
    return [data.substring(4, length + 4), data.substr(nextData)]
};

var _readDouble = function (data) {
    if (data.length < 8) {
        console.log('Error: too few bytes for double ' + data + data.length);
        rest = data;
        value = 0;
    } else {
        value = jspack.Unpack('>d', new Buffer(data.substring(0,8)));
        if (value == undefined) {
            value = 0;
        }
        rest = data.substr(8);
    }
    return [value, rest];
};

var decodeOSC = function (data) {
    // for each tag we use a specific function to decode it's respective data
    var table = {'i':_readInt, 'f':_readFloat, 's':_readString, 'b':_readBlob, 'd':_readDouble};

    // this stores the decoded data as an array
    var decoded = [];

    // we start getting the <address> and <rest> of OSC msg /<address>\0<rest>\0<typetags>\0<data>
    var pair = _readString(data);
    var address = pair[0];
    var rest = pair[1];

    // if we have rest, maybe we have some typetags... let see...
    if (rest.length > 0) {
        // now we advance on the old rest, getting <typetags>
        var pair = _readString(rest);
        var typetags = pair[0];
        var rest = pair[1];
        // so we start building our decoded list
        decoded.push(address);
        decoded.push(typetags.substr(1));
        
        // typetag-string need to start with the magic ,
        if (typetags[0] == ',') {
            // for each tag...
            for (var t=0; t<typetags.substr(1).length; t++) {
                // we call the right function to decode that and store
                // the value on the decoded array
                var pair = table[typetags.substr(1)[t]](rest);
                rest = pair[1];
                decoded.push(pair[0]);
            }
        } else {
            console.log('OSC Message typetag-string lacks the magic ,');
        }
    }

    return decoded;
};

////////////////////
// OSC Server
////////////////////

var Server = function(port, host) {
    var _callbacks = [];
    this.port = port;
    this.host = host;
    this._sock = dgram.createSocket('udp4');
    this._sock.bind(port);
    this._sock.on('message', function (msg, rinfo) {
        // on every message sent through the UDP socket...
        // we decode the message getting a beautiful array with the form:
        // [<address>, <typetags>, <values>*]
        var decoded = decodeOSC(msg);

        // and we run along the callbacks list
        for (var c=0; c<_callbacks.length; c++) {
            // if the msg address equals to one of callbacks adresses...
            if (_callbacks[c].address == decoded[0]) {
                // we call the respective callback function, passing
                // the list of <values> of the message
                _callbacks[c].callback(decoded.slice(2));
            }
        }
    });

    this.addMsgHandler = function(address, callback) {
        _callbacks.push({'address': '/' + address.replace('/', ''),
                         'callback': callback});
    };

}

exports.Server = Server;