'use strict';

const { deprecate } = require('util');
const dgram = require('dgram');

const min = require('osc-min');

const Message = require('./Message');

class Client {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this._sock = dgram.createSocket({
      type: 'udp4',
      reuseAddr: true
    });
    this.kill = deprecate(
      this.close,
      'Client.kill() and Server.kill() are deprecated and will be removed in the next major version.\n'
      + 'Use Server.close() and Client.close().',
      'DEP0001'
    );
  }
  close(cb) {
    this._sock.close(cb);
  }
  send(message) {
    let mes;
    let buf;
    let callback;
    let args = Array.prototype.slice.call(arguments);
    const last = args[args.length - 1];
    if (typeof last === 'function') {
      callback = args.pop();
    }
    else {
      callback = function () {};
    }
    if (message instanceof Array) {
      message = {
        address: message[0],
        args: message.splice(1)
      };
    }

    switch (typeof message) {
        case 'object':
            buf = min.toBuffer(message);
            this._sock.send(buf, 0, buf.length, this.port, this.host, callback);
            break;
        case 'string':
            mes = new Message(args[0]);
            for (let i = 1; i < args.length; i++) {
                mes.append(args[i]);
            }
            buf = min.toBuffer(mes);
            this._sock.send(buf, 0, buf.length, this.port, this.host, callback);
            break;
        default:
            throw new Error('That Message Just Doesn\'t Seem Right');
    }
  }
}

module.exports = Client;
