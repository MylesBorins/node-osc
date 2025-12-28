import { createSocket } from 'node:dgram';
import { toBuffer } from '#osc';
import Message from './Message.mjs';

/**
 * OSC Client for sending messages and bundles to a remote server
 * @class
 * @example
 * const client = new Client('127.0.0.1', 3333);
 * client.send('/address', 'value', (err) => {
 *   if (err) console.error(err);
 *   client.close();
 * });
 */
class Client {
  /**
   * Create a new OSC Client
   * @param {string} host - The hostname or IP address of the OSC server
   * @param {number} port - The port number of the OSC server
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
   * Close the client socket
   * @param {Function} [cb] - Optional callback function called when the socket is closed
   */
  close(cb) {
    this._sock.close(cb);
  }
  /**
   * Send an OSC message or bundle
   * @param {...*} args - Can be a Message, Bundle, array [address, ...args], or address string followed by arguments
   * @param {Function} [callback] - Optional callback function with error parameter
   * @example
   * // Send with address and arguments
   * client.send('/address', 'value', 123, callback);
   * 
   * // Send a Message object
   * const msg = new Message('/address', 'value');
   * client.send(msg, callback);
   * 
   * // Send an array
   * client.send(['/address', 'value', 123], callback);
   * 
   * // Send a Bundle
   * const bundle = new Bundle(['/one', 1], ['/two', 2]);
   * client.send(bundle, callback);
   */
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
