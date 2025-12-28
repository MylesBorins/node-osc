export default Client;
/**
 * OSC Client for sending messages and bundles over UDP.
 *
 * Extends EventEmitter and emits the following events:
 * - 'error': Emitted when a socket error occurs
 *
 * @class
 * @extends EventEmitter
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
declare class Client extends EventEmitter<[never]> {
    /**
     * Create an OSC Client.
     *
     * @param {string} host - The hostname or IP address of the OSC server.
     * @param {number} port - The port number of the OSC server.
     *
     * @example
     * const client = new Client('127.0.0.1', 3333);
     */
    constructor(host: string, port: number);
    host: string;
    port: number;
    _sock: import("dgram").Socket;
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
    close(cb?: Function): Promise<void> | undefined;
    _performSend(message: any, args: any, callback: any): void;
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
    send(...args: any[]): Promise<void> | undefined;
}
import { EventEmitter } from 'node:events';
//# sourceMappingURL=Client.d.mts.map