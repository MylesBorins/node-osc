export default Server;
/**
 * OSC Server for receiving messages and bundles over UDP.
 *
 * Extends EventEmitter and emits the following events:
 * - 'listening': Emitted when the server starts listening
 * - 'message': Emitted when an OSC message is received
 * - 'bundle': Emitted when an OSC bundle is received
 * - 'error': Emitted when a socket error or decoding error occurs
 * - Address-specific events: Emitted for each message address (e.g., '/test')
 *
 * @class
 * @extends EventEmitter
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
 * // Using async/await
 * const server = new Server(3333, '0.0.0.0');
 *
 * await new Promise((resolve) => {
 *   server.on('listening', resolve);
 * });
 *
 * server.on('message', (msg) => {
 *   console.log('Message:', msg);
 * });
 */
declare class Server extends EventEmitter<[never]> {
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
    constructor(port: number, host?: string, cb?: Function);
    port: number;
    host: string;
    _sock: import("dgram").Socket;
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
    close(cb?: Function): Promise<void> | undefined;
}
import { EventEmitter } from 'node:events';
//# sourceMappingURL=Server.d.mts.map