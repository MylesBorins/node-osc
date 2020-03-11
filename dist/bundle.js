'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var dgram = require('dgram');
var events = require('events');
var jspackMain = _interopDefault(require('jspack'));
var oscMin = _interopDefault(require('osc-min'));

class Argument {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}

class Message {
  constructor(address, ...args) {
    this.oscType = 'message';
    this.address = address;
    this.args = args;
  }
  
  append(arg) {
    let argOut;
    switch (typeof arg) {
    case 'object':
      if (arg instanceof Array) {
        arg.forEach(a => this.append(a));
      } else if (arg.type) {
        this.args.push(arg);
      } else {
        throw new Error(`don't know how to encode object ${arg}`);
      }
      break;
    case 'number':
      if (Math.floor(arg) === arg) {
        argOut = new Argument('integer', arg);
      } else {
        argOut = new Argument('float', arg);
      }
      break;
    case 'string':
      argOut = new Argument('string', arg);
      break;
    case 'boolean':
      argOut = new Argument('boolean', arg);
      break;
    default:
      throw new Error(`don't know how to encode ${arg}`);
    }
    if (argOut) this.args.push(argOut);
  }
}

const jspack = jspackMain.jspack;

class ShortBuffer {
  constructor(type, buf, requiredLength) {
    this.type = 'ShortBuffer';
    let message = 'buffer [';
    for (let i = 0; i < buf.length; i++) {
      if (i) {
        message += ', ';
      }
      message += buf.charCodeAt(i);
    }
    message += `] too short for ${type}, ${requiredLength} bytes requiredLength`;
    this.message = message;
  }
}

class TString {
  constructor(value) {
    this.value = value;
    this.typetag = 's';
  }
  decode(data) {
    let end = 0;
    while (data[end] && end < data.length) {
      end++;
    }
    if (end === data.length) {
      throw Error('OSC string not null terminated');
    }
    this.value = data.toString('ascii', 0, end);
    const nextData = parseInt(Math.ceil((end + 1) / 4.0) * 4);
    return data.slice(nextData);
  }
}

class TInt {
  constructor(value) {
    this.value = value;
    this.typetag = 'i';
  }
  decode(data) {
    if (data.length < 4) {
      throw new ShortBuffer('int', data, 4);
    }
    this.value = jspack.Unpack('>i', data.slice(0, 4))[0];
    return data.slice(4);
  }
}

class TFloat {
  constructor(value) {
    this.value = value;
    this.typetag = 'f';
  }
  decode(data) {
    if (data.length < 4) {
      throw new ShortBuffer('float', data, 4);
    }

    this.value = jspack.Unpack('>f', data.slice(0, 4))[0];
    return data.slice(4);
  }
}

class TDouble {
  constructor(value) {
    this.value = value;
    this.typetag = 'd';
  }
  decode(data) {
    if (data.length < 8) {
      throw new ShortBuffer('double', data, 8);
    }
    this.value = jspack.Unpack('>d', data.slice(0, 8))[0];
    return data.slice(8);
  }
}

class TTrue {
  constructor(value) {
    this.value = value;
    this.typetag = 'T';
  }
  decode(data) {
    this.value = true;
    return data;
  }
}

class TFalse {
  constructor(value) {
    this.value = value;
    this.typetag = 'F';
  }
  decode(data) {
    this.value = false;
    return data;
  }
}

class TBlob {
  constructor(value) {
    this.value = value;
    this.typetag = 'b';
  }
  decode(data) {
    const length = jspack.Unpack('>i', data.slice(0, 4))[0];
    const nextData = parseInt(Math.ceil((length) / 4.0) * 4) + 4;
    this.value = data.slice(4, length + 4);
    return data.slice(nextData);
  }
}

const tagToConstructor = { 
  i: TInt,
  f: TFloat,
  s: TString,
  b: TBlob,
  d: TDouble,
  T: TTrue,
  F: TFalse
};

function decode(data) {
    // this stores the decoded data as an array
    const message = [];

    // we start getting the <address> and <rest> of OSC msg /<address>\0<rest>\0<typetags>\0<data>
    const address = new TString();
    data = address.decode(data);
    if (data.length <= 0) {
      return message;
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

class Server extends events.EventEmitter {
  constructor(port, host) {
    super();
    let decoded;
    this.port = port;
    this.host = host;
    this._sock = dgram.createSocket({
      type: 'udp4',
      reuseAddr: true
    });
    this._sock.bind(port);
    this._sock.on('message', (msg, rinfo) => {
      try {
        decoded = decode(msg);
        // [<address>, <typetags>, <values>*]
      }
      catch (e) {
        const error = new Error(`can't decode incoming message: ${e.message}`);
        this.emit('error', error, rinfo);
      }

      if (decoded) {
        this.emit('message', decoded, rinfo);
        this.emit(decoded[0], decoded, rinfo);
      }
    });
  }
  close(cb) {
    this._sock.close(cb);
  }
}

const { toBuffer } = oscMin;

class Client {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this._sock = dgram.createSocket({
      type: 'udp4',
      reuseAddr: true
    });
  }
  close(cb) {
    this._sock.close(cb);
  }
  send(...args) {
    let message = args[0];
    let callback;
    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop();
    }
    else {
      callback = () => {};
    }

    if (message instanceof Array) {
      message = {
        address: message[0],
        args: message.splice(1)
      };
    }
    
    let mes;
    let buf;
    try {
      switch (typeof message) {
        case 'object':
          buf = toBuffer(message);
          this._sock.send(buf, 0, buf.length, this.port, this.host, callback);
          break;
        case 'string':
          mes = new Message(args[0]);
          for (let i = 1; i < args.length; i++) {
            mes.append(args[i]);
          }
          buf = toBuffer(mes);
          this._sock.send(buf, 0, buf.length, this.port, this.host, callback);
          break;
        default:
          throw new TypeError('That Message Just Doesn\'t Seem Right');
      }
    }
    catch (e) {
      if (e.code !== 'ERR_SOCKET_DGRAM_NOT_RUNNING') throw e;
      const error = new ReferenceError('Cannot send message on closed socket.');
      error.code = e.code;
      callback(error);
    }
  }
}

exports.Client = Client;
exports.Message = Message;
exports.Server = Server;
