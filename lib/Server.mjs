import { createSocket } from 'node:dgram';
import { EventEmitter } from 'node:events';

import decode from '#decode';

/**
 * OSC Server for receiving messages and bundles
 * @class
 * @extends EventEmitter
 * @fires Server#message
 * @fires Server#bundle
 * @fires Server#error
 * @fires Server#listening
 * @example
 * const server = new Server(3333, '0.0.0.0', () => {
 *   console.log('OSC Server is listening');
 * });
 * 
 * server.on('message', (msg, rinfo) => {
 *   console.log('Message:', msg);
 * });
 * 
 * server.on('error', (error, rinfo) => {
 *   console.error('Error:', error.message);
 * });
 */
class Server extends EventEmitter {
  /**
   * Create a new OSC Server
   * @param {number} port - The port to listen on
   * @param {string} [host='127.0.0.1'] - The host address to bind to
   * @param {Function} [cb] - Optional callback function called when server is listening
   * @fires Server#listening
   */
  constructor(port, host='127.0.0.1', cb) {
    super();
    if (typeof host === 'function') {
      cb = host;
      host = '127.0.0.1';
    }
    if (!cb) cb = () => {};
    let decoded;
    this.port = port;
    this.host = host;
    this._sock = createSocket({
      type: 'udp4',
      reuseAddr: true
    });
    this._sock.bind(port, host);
    this._sock.on('listening', () => {
      this.emit('listening');
      cb();
    });
    this._sock.on('message', (msg, rinfo) => {
      try {
        decoded = decode(msg);
      }
      catch (e) {
        const error = new Error(`can't decode incoming message: ${e.message}`);
        /**
         * Error event
         * @event Server#error
         * @type {object}
         * @property {Error} error - The error that occurred
         * @property {object} rinfo - Remote address info
         */
        this.emit('error', error, rinfo);
        return;
      }
      if (decoded.elements) {
        /**
         * Bundle event - Emitted when a bundle is received
         * @event Server#bundle
         * @type {object}
         * @property {object} bundle - The decoded bundle with elements and timetag
         * @property {object} rinfo - Remote address info
         */
        this.emit('bundle', decoded, rinfo);
      }
      else if (decoded) {
        /**
         * Message event - Emitted when a message is received
         * @event Server#message
         * @type {array}
         * @property {array} msg - The decoded message as [address, ...args]
         * @property {object} rinfo - Remote address info
         */
        this.emit('message', decoded, rinfo);
        this.emit(decoded[0], decoded, rinfo);
      }
    });
  }
  /**
   * Close the server socket
   * @param {Function} [cb] - Optional callback function called when the socket is closed
   */
  close(cb) {
    this._sock.close(cb);
  }
}

export default Server;
