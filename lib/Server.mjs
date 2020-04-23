import { createSocket } from 'dgram';
import { EventEmitter } from 'events';

import decode from './decode.mjs';

class Server extends EventEmitter {
  constructor(port, host, cb) {
    super();
    if (!cb) cb = () => {};
    let decoded;
    this.port = port;
    this.host = host;
    this._sock = createSocket({
      type: 'udp4',
      reuseAddr: true
    });
    this._sock.bind(port);
    this._sock.on('listening', () => {
      this.emit('listening');
      cb();
    });
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

export default Server;
