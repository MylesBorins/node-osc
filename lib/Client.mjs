import Message from './Message.mjs';
import { createSocket } from 'dgram';
import { createConnection } from 'net';
import { toBuffer } from 'osc-min';

class Client {
  constructor(host, port, protocol='udp') {
    this.host = host;
    this.port = port;
    this._encode = toBuffer;
    this._protocol = protocol;
    if (this._protocol === 'udp') {
      this._sock = createSocket({
        type: 'udp4',
        reuseAddr: true
      });
    }
    if (this._protocol === 'tcp') {
      this._sock = new createConnection(this.port, this.host);
    }
  }
  close(cb) {
    if (this._protocol === 'udp') this._sock.close(cb);
    else if (this._protocol === 'tcp') this._sock.end(cb);
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
          buf = this._encode(message);
          if (this._protocol === 'udp')
            this._sock.send(buf, 0, buf.length, this.port, this.host, callback);
          else if (this._protocol === 'tcp')
            this._sock.write(buf, callback);
          break;
        case 'string':
          mes = new Message(args[0]);
          for (let i = 1; i < args.length; i++) {
            mes.append(args[i]);
          }
          buf = this._encode(mes);
          if (this._protocol === 'udp')
            this._sock.send(buf, 0, buf.length, this.port, this.host, callback);
          else if (this._protocol === 'tcp') {
            this._sock.write(buf, callback);
          }
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

export default Client;
