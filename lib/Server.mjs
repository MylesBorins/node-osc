import { createSocket } from 'node:dgram';
import { EventEmitter } from 'node:events';
import performSend from './internal/send.mjs';

import decode from '#decode';

function createSocketNotReadyError() {
  return new Error('Cannot send message before server is listening. Wait for the "listening" event.');
}

/**
 * OSC Server for receiving messages and bundles over UDP.
 * 
 * Emits the following events:
 * - 'listening': Emitted when the server starts listening
 * - 'message': Emitted when an OSC message is received (receives msg array and rinfo object)
 * - 'bundle': Emitted when an OSC bundle is received (receives bundle object and rinfo object)
 * - 'error': Emitted when a socket error or decoding error occurs (receives error and rinfo)
 * - Address-specific events: Emitted for each message address (e.g., '/test')
 * 
 * @class
 * @extends EventEmitter
 * 
 * @fires Server#listening
 * @fires Server#message
 * @fires Server#bundle
 * @fires Server#error
 * 
 * @example
 * // Create and listen for messages
 * const server = new Server(3333, '0.0.0.0', () => {
 *   console.log('Server is listening');
 * });
 * 
 * server.on('message', (msg, rinfo) => {
 *   console.log('Message:', msg);
 *   console.log('From:', rinfo.address, rinfo.port);
 * });
 * 
 * @example
 * // Using async/await with events.once
 * import { once } from 'node:events';
 * 
 * const server = new Server(3333, '0.0.0.0');
 * await once(server, 'listening');
 * 
 * server.on('message', (msg) => {
 *   console.log('Message:', msg);
 * });
 * 
 * @example
 * // Listen for specific OSC addresses
 * server.on('/note', (msg) => {
 *   const [address, pitch, velocity] = msg;
 *   console.log(`Note: ${pitch}, Velocity: ${velocity}`);
 * });
 */
class Server extends EventEmitter {
  /**
   * Create an OSC Server.
   * 
   * @param {number} port - The port to listen on.
   * @param {string} [host='127.0.0.1'] - The host address to bind to. Use '0.0.0.0' to listen on all interfaces.
   * @param {Function} [cb] - Optional callback function called when server starts listening.
   * 
   * @example
   * // Basic server
   * const server = new Server(3333);
   * 
   * @example
   * // Server on all interfaces with callback
   * const server = new Server(3333, '0.0.0.0', () => {
   *   console.log('Server started');
   * });
   * 
   * @example
   * // Host parameter can be omitted, callback as second parameter
   * const server = new Server(3333, () => {
   *   console.log('Server started on 127.0.0.1');
   * });
   */
  constructor(port, host='127.0.0.1', cb) {
    super();
    if (typeof host === 'function') {
      cb = host;
      host = '127.0.0.1';
    }
    
    let decoded;
    this.port = port;
    this.host = host;
    this._isListening = false;
    this._isClosed = false;
    this._sock = createSocket({
      type: 'udp4',
      reuseAddr: true
    });
    this._sock.bind(port, host);
    
    // Update port and emit listening event when socket is ready
    this._sock.on('listening', () => {
      // Update port with actual bound port (important when using port 0)
      this._isListening = true;
      this._isClosed = false;
      this.port = this._sock.address().port;
      this.emit('listening');
      if (cb) cb();
    });
    
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
    
    this._sock.on('error', (err) => {
      this.emit('error', err);
    });

    this._sock.on('close', () => {
      this._isListening = false;
      this._isClosed = true;
    });
  }
  /**
   * Send an OSC message or bundle from the server's bound socket.
   * 
   * This method can be used with either a callback or as a Promise.
   * 
   * @param {import('./Message.mjs').default|import('./Bundle.mjs').default|Array|string} message - The message, bundle, address, or array to send.
   * @param {number} port - The remote port to send to.
   * @param {string} host - The remote host to send to.
   * @param {Function} [cb] - Optional callback function called when send completes.
   * @returns {Promise<void>|undefined} Returns a Promise if no callback is provided.
   * 
   * @throws {Error} If the server socket is not yet listening.
   * @throws {TypeError} If the message format is invalid.
   * @throws {ReferenceError} If attempting to send on a closed socket.
   * 
   * @example
   * // Send an address-only message
   * await server.send('/ping', 9000, '127.0.0.1');
   * 
   * @example
   * // Send an array message
   * server.send(['/ack', 1], 9000, '192.168.1.42', (err) => {
   *   if (err) console.error(err);
   * });
   */
  send(message, port, host, cb) {
    if (!this._isListening && !this._isClosed) {
      const error = createSocketNotReadyError();

      if (cb) {
        cb(error);
        return;
      }

      throw error;
    }

    if (cb) {
      performSend(this._sock, message, [], port, host, cb);
    }
    else {
      return new Promise((resolve, reject) => {
        const callback = (err) => {
          if (err) reject(err);
          else resolve();
        };

        performSend(this._sock, message, [], port, host, callback);
      });
    }
  }
  /**
   * Close the server socket.
   * 
   * This method can be used with either a callback or as a Promise.
   * 
   * @param {Function} [cb] - Optional callback function called when socket is closed.
   * @returns {Promise<void>|undefined} Returns a Promise if no callback is provided.
   * 
   * @example
   * // With callback
   * server.close((err) => {
   *   if (err) console.error(err);
   * });
   * 
   * @example
   * // With async/await
   * await server.close();
   */
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
