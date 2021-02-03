import oscMin from 'osc-min';
import Message from './Message.mjs';
var net = require('net');

const { toBuffer } = oscMin;

class Client {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this._sock = new net.Socket();
    this._sock.connect(this.port, this.host){
      console.log('TCP connected to '+this.host);
    }
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
          this._sock.write(message);
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
