'use strict';

const { deprecate } = require('util');

const {
  TInt,
  TFloat,
  TString,
  TBlob,
  TDouble,
  TTime,
  TTrue,
  TFalse
} = require('./types');

const tagToConstructor = { 
  i: TInt,
  f: TFloat,
  s: TString,
  b: TBlob,
  d: TDouble,
  T: TTrue,
  F: TFalse
};

/* istanbul ignore next */
function decodeBundle(data, message) {
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
  return message;
}

const deprecatedDecodeBundle = deprecate(
  decodeBundle,
  'Decoding TUIO is planned to be deprecated. Please open an issue if you rely on this feature.',
  'DEP0002'
);

function decode(data) {
    // this stores the decoded data as an array
    const message = [];

    // we start getting the <address> and <rest> of OSC msg /<address>\0<rest>\0<typetags>\0<data>
    const address = new TString();
    data = address.decode(data);

    if (data.length <= 0) {
      return message;
    }

    // Checking if we received a bundle (typical for TUIO/OSC)
    /* istanbul ignore if  */
    if (address.value === '#bundle') {
      return deprecatedDecodeBundle(data, message);
    }

    message.push(address.value);

    // if we have rest, maybe we have some typetags... let see...

    // now we advance on the old rest, getting <typetags>
    var typetags = new TString();
    data = typetags.decode(data);
    typetags = typetags.value;
    // so we start building our message list
    if (typetags[0] !== ',') {
        throw new Error('invalid type tag in incoming OSC message, must start with comma');
    }
    for (var i = 1; i < typetags.length; i++) {
        var constructor = tagToConstructor[typetags[i]];
        if (!constructor) {
            throw new Error('Unsupported OSC type tag ' + typetags[i] + ' in incoming message');
        }
        var argument = new constructor();
        data = argument.decode(data);
        message.push(argument.value);
    }

    return message;
}

module.exports = decode;
