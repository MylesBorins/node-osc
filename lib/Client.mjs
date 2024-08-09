import { createSocket } from 'node:dgram';
import Message from './Message.mjs';

function toBuffer(message) {
  const address = Buffer.from(message.address + '\0');
  const args = message.args.map(arg => {
    switch (typeof arg) {
      case 'string':
        return Buffer.from(arg + '\0');
      case 'number':
        const buf = Buffer.alloc(4);
        if (Number.isInteger(arg)) {
          buf.writeInt32BE(arg);
        } else {
          buf.writeFloatBE(arg);
        }
        return buf;
      case 'boolean':
        return Buffer.from(arg ? 'T' : 'F');
      default:
        throw new Error(`Unsupported argument type: ${typeof arg}`);
    }
  });
  return Buffer.concat([address, ...args]);
}

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

export default Client;
