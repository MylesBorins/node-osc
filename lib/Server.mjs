import { createSocket } from 'node:dgram';
import { EventEmitter } from 'node:events';

import decode from '#decode';

class Server extends EventEmitter {
  constructor(port, host='127.0.0.1', cb) {
    super();
    if (typeof host === 'function') {
      cb = host;
      host = '127.0.0.1';
    }
    
    let decoded;
    this.port = port;
    this.host = host;
    this._sock = createSocket({
      type: 'udp4',
      reuseAddr: true
    });
    this._sock.bind(port, host);
    
    // Support both callback and promise-based listening
    if (cb) {
      this._sock.on('listening', () => {
        this.emit('listening');
        cb();
      });
    } else {
      // For promise support, still emit the event but don't require a callback
      this._sock.on('listening', () => {
        this.emit('listening');
      });
    }
    
    this._sock.on('message', (msg, rinfo) => {
      try {
        decoded = decode(msg);
      }
      catch (e) {
        const error = new Error(`can't decode incoming message: ${e.message}`);
        this.emit('error', error, rinfo);
        return;
      }
      if (decoded.elements) {
        this.emit('bundle', decoded, rinfo);
      }
      else if (decoded) {
        this.emit('message', decoded, rinfo);
        this.emit(decoded[0], decoded, rinfo);
      }
    });
  }
  close(cb) {
    if (cb) {
      this._sock.close(cb);
    } else {
      return new Promise((resolve, reject) => {
        this._sock.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
}

export default Server;
