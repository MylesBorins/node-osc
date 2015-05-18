'use strict';

var types = require('./types');

var TInt = types.TInt;
var TFloat = types.TFloat;
var TString = types.TString;
var TBlob = types.TBlob;
var TDouble = types.TDouble;
var TTime = types.TTime;

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
