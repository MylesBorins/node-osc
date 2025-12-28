import { createSocket } from 'node:dgram';
import { toBuffer } from '#osc';
import Message from './Message.mjs';

/**
 * OSC Client for sending messages and bundles over UDP.
 * 
 * @class
 * @example
 * // Create a client
 * const client = new Client('127.0.0.1', 3333);
 * 
 * // Send a message with callback
 * client.send('/oscAddress', 200, (err) => {
 *   if (err) console.error(err);
 *   client.close();
 * });
 * 
 * @example
 * // Send a message with async/await
 * const client = new Client('127.0.0.1', 3333);
 * await client.send('/oscAddress', 200);
 * await client.close();
 */
class Client {
  /**
   * Create an OSC Client.
   * 
   * @param {string} host - The hostname or IP address of the OSC server.
   * @param {number} port - The port number of the OSC server.
   * 
   * @example
   * const client = new Client('127.0.0.1', 3333);
   */
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this._sock = createSocket({
      type: 'udp4',
      reuseAddr: true
    });
  }
  /**
   * Close the client socket.
   * 
   * This method can be used with either a callback or as a Promise.
   * 
   * @param {Function} [cb] - Optional callback function called when socket is closed.
   * @returns {Promise<void>|undefined} Returns a Promise if no callback is provided.
   * 
   * @example
   * // With callback
   * client.close((err) => {
   *   if (err) console.error(err);
   * });
   * 
   * @example
   * // With async/await
   * await client.close();
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
  _performSend(message, args, callback) {
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
  /**
   * Send an OSC message or bundle to the server.
   * 
   * This method can be used with either a callback or as a Promise.
   * Messages can be sent in several formats:
   * - As separate arguments: address followed by values
   * - As a Message or Bundle object
   * - As an array: [address, ...values]
   * 
   * @param {...*} args - The message to send. Can be:
   *   - (address: string, ...values: any[], callback?: Function)
   *   - (message: Message|Bundle, callback?: Function)
   *   - (array: Array, callback?: Function)
   * @returns {Promise<void>|undefined} Returns a Promise if no callback is provided.
   * 
   * @throws {TypeError} If the message format is invalid.
   * @throws {ReferenceError} If attempting to send on a closed socket.
   * 
   * @example
   * // Send with address and arguments
   * client.send('/oscAddress', 200, 'hello', (err) => {
   *   if (err) console.error(err);
   * });
   * 
   * @example
   * // Send with async/await
   * await client.send('/oscAddress', 200, 'hello');
   * 
   * @example
   * // Send a Message object
   * const msg = new Message('/test', 1, 2, 3);
   * await client.send(msg);
   * 
   * @example
   * // Send a Bundle object
   * const bundle = new Bundle(['/one', 1], ['/two', 2]);
   * await client.send(bundle);
   */
  send(...args) {
    let message = args[0];
    let callback;
    
    // Convert array syntax to message object
    if (message instanceof Array) {
      message = {
        address: message[0],
        args: message.splice(1)
      };
    }
    
    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop();
      this._performSend(message, args, callback);
    }
    else {
      // No callback provided, return a Promise
      return new Promise((resolve, reject) => {
        callback = (err) => {
          if (err) reject(err);
          else resolve();
        };
        this._performSend(message, args, callback);
      });
    }
  }
}

export default Client;
