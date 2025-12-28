/**
 * Encode an OSC message or bundle to a Buffer.
 *
 * @param {Object} message - OSC message or bundle object
 * @returns {Buffer} The encoded OSC data
 */
export function encode(message: any): Buffer;
/**
 * Decode a Buffer containing OSC data into a message or bundle object.
 *
 * @param {Buffer} buffer - The Buffer containing OSC data
 * @returns {Object} The decoded OSC message or bundle
 */
export function decode(buffer: Buffer): any;
import { Buffer } from 'node:buffer';
//# sourceMappingURL=osc.d.mts.map