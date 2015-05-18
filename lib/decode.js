'use strict';

var jspack = require('jspack').jspack;

var pack = jspack.packTo;

function ShortBuffer(type, buf, requiredLength)
{
    this.type = 'ShortBuffer';
    var message = 'buffer [';
    for (var i = 0; i < buf.length; i++) {
        if (i) {
            message += ', ';
        }
        message += buf.charCodeAt(i);
    }
    message += '] too short for ' + type + ', ' + requiredLength + ' bytes required';
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
        if (end === data.length) {
            throw Error('OSC string not null terminated');
        }
        this.value = data.toString('ascii', 0, end);
        var nextData = parseInt(Math.ceil((end + 1) / 4.0) * 4);
        return data.slice(nextData);
    },
    encode: function (buf, pos) {
        var len = Math.ceil((this.value.length + 1) / 4.0) * 4;
        return pack('>' + len + 's', buf, pos, [ this.value ]);
    }
};

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
        return pack('>i', buf, pos, [ this.value ]);
    }
};

exports.TInt = TInt;

function TTime (value) { this.value = value; }

TTime.prototype = {
    typetag: 't',
    decode: function (data) {
        if (data.length < 8) {
            throw new ShortBuffer('time', data, 8);
        }
        var raw = jspack.Unpack('>LL', data.slice(0, 8));
        var secs = raw[0];
        var fracs = raw[1];
        this.value = secs + fracs / 4294967296;
        return data.slice(8);
    },
    encode: function (buf, pos) {
        return pack('>LL', buf, pos, this.value);
    }
};

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
        return pack('>f', buf, pos, [ this.value ]);
    }
};

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
        return pack('>i' + len + 's', buf, pos, [len, this.value]);
    }
};

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
        return pack('>d', buf, pos, [ this.value ]);
    }
};

exports.TDouble = TDouble;

// for each OSC type tag we use a specific constructor function to decode its respective data
var tagToConstructor = { 'i': function () { return new TInt(); },
                         'f': function () { return new TFloat(); },
                         's': function () { return new TString(); },
                         'b': function () { return new TBlob(); },
                         'd': function () { return new TDouble(); } };

function decode (data) {
    // this stores the decoded data as an array
    var message = [];

    // we start getting the <address> and <rest> of OSC msg /<address>\0<rest>\0<typetags>\0<data>
    var address = new TString();
    data = address.decode(data);

    // Checking if we received a bundle (typical for TUIO/OSC)
    if (address.value === '#bundle') {
        var time = new TTime();
        data = time.decode(data);

        message.push('#bundle');
        message.push(time.value);

        var length, part;
        while(data.length > 0) {
            length = new TInt();
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
        var typetags = new TString();
        data = typetags.decode(data);
        typetags = typetags.value;
        // so we start building our message list
        if (typetags[0] !== ',') {
            throw 'invalid type tag in incoming OSC message, must start with comma';
        }
        for (var i = 1; i < typetags.length; i++) {
            var constructor = tagToConstructor[typetags[i]];
            if (!constructor) {
                throw 'Unsupported OSC type tag ' + typetags[i] + ' in incoming message';
            }
            var argument = constructor();
            data = argument.decode(data);
            message.push(argument.value);
        }
    }

    return message;
}

module.exports = decode;
