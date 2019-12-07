'use strict';

import { createSocket } from 'dgram';
import oscMin from 'osc-min';
import Message from './Message.mjs'

const { toBuffer } = oscMin;

class Client {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this._sock = createSocket({
      type: 'udp4',
      reuseAddr: true
    });
  }
  close(cb) {
    this._sock.close(cb);
  }
  send(...args) {
    let message = args[0];
    let callback = () => {};
    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop();
    }

    if (message instanceof Array) {
      message = {
        address: message[0],
        args: message.splice(1)
      };
    }
    
    let mes;
    let buf;
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
        throw new Error('That Message Just Doesn\'t Seem Right');
    }
  }
}

export default Client;
