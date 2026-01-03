// OSC 1.0 Protocol Implementation
// Based on http://opensoundcontrol.org/spec-1_0

// Helper functions for OSC encoding/decoding

import { Buffer } from 'node:buffer';

function padString(str) {
  const nullTerminated = str + '\0';
  const byteLength = Buffer.byteLength(nullTerminated);
  const padding = (4 - (byteLength % 4)) % 4;
  return nullTerminated + '\0'.repeat(padding);
}

function readString(buffer, offset) {
  let end = offset;
  while (end < buffer.length && buffer[end] !== 0) {
    end++;
  }
  if (end >= buffer.length) {
    throw new Error('Malformed Packet: Missing null terminator for string');
  }
  const str = buffer.subarray(offset, end).toString('utf8');
  // Find next 4-byte boundary
  const paddedLength = Math.ceil((end - offset + 1) / 4) * 4;
  return { value: str, offset: offset + paddedLength };
}

function writeInt32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(value, 0);
  return buffer;
}

function readInt32(buffer, offset) {
  if (offset + 4 > buffer.length) {
    throw new Error('Malformed Packet: Not enough bytes for int32');
  }
  const value = buffer.readInt32BE(offset);
  return { value, offset: offset + 4 };
}

function writeFloat32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeFloatBE(value, 0);
  return buffer;
}

function readFloat32(buffer, offset) {
  if (offset + 4 > buffer.length) {
    throw new Error('Malformed Packet: Not enough bytes for float32');
  }
  const value = buffer.readFloatBE(offset);
  return { value, offset: offset + 4 };
}

function writeBlob(value) {
  const length = value.length;
  const lengthBuffer = writeInt32(length);
  const padding = 4 - (length % 4);
  const paddingBuffer = Buffer.alloc(padding === 4 ? 0 : padding);
  return Buffer.concat([lengthBuffer, value, paddingBuffer]);
}

function readBlob(buffer, offset) {
  const lengthResult = readInt32(buffer, offset);
  const length = lengthResult.value;
  if (length < 0) {
    throw new Error('Malformed Packet: Invalid blob length');
  }
  if (lengthResult.offset + length > buffer.length) {
    throw new Error('Malformed Packet: Not enough bytes for blob');
  }
  const data = buffer.subarray(lengthResult.offset, lengthResult.offset + length);
  const padding = 4 - (length % 4);
  const nextOffset = lengthResult.offset + length + (padding === 4 ? 0 : padding);
  if (nextOffset > buffer.length) {
    throw new Error('Malformed Packet: Not enough bytes for blob padding');
  }
  return { value: data, offset: nextOffset };
}

function writeTimeTag(value) {
  // For now, treat timetag as a double (8 bytes)
  // OSC timetag is 64-bit: 32-bit seconds since 1900, 32-bit fractional
  const buffer = Buffer.alloc(8);
  if (value === 0 || value === null || value === undefined) {
    // Immediate execution
    buffer.writeUInt32BE(0, 0);
    buffer.writeUInt32BE(1, 4);
  } else if (typeof value === 'number') {
    // Convert to OSC timetag format
    const seconds = Math.floor(value);
    const fraction = Math.floor((value - seconds) * 0x100000000);
    buffer.writeUInt32BE(seconds + 2208988800, 0); // Add epoch offset (1900 vs 1970)
    buffer.writeUInt32BE(fraction, 4);
  } else {
    // If not a number, write zeros (immediate execution)
    buffer.writeUInt32BE(0, 0);
    buffer.writeUInt32BE(1, 4);
  }
  return buffer;
}

function readTimeTag(buffer, offset) {
  if (offset + 8 > buffer.length) {
    throw new Error('Malformed Packet: Not enough bytes for timetag');
  }
  const seconds = buffer.readUInt32BE(offset);
  const fraction = buffer.readUInt32BE(offset + 4);
  
  let value;
  if (seconds === 0 && fraction === 1) {
    // Immediate execution
    value = 0;
  } else {
    // Convert from OSC epoch (1900) to Unix epoch (1970)
    const unixSeconds = seconds - 2208988800;
    const fractionalSeconds = fraction / 0x100000000;
    value = unixSeconds + fractionalSeconds;
  }
  
  return { value, offset: offset + 8 };
}

function writeMidi(value) {
  // MIDI message is 4 bytes: port id, status byte, data1, data2
  const buffer = Buffer.alloc(4);
  
  if (Buffer.isBuffer(value)) {
    if (value.length !== 4) {
      throw new Error('MIDI message must be exactly 4 bytes');
    }
    value.copy(buffer);
  } else if (typeof value === 'object' && value !== null) {
    // Allow object format: { port: 0, status: 144, data1: 60, data2: 127 }
    buffer.writeUInt8(value.port || 0, 0);
    buffer.writeUInt8(value.status || 0, 1);
    buffer.writeUInt8(value.data1 || 0, 2);
    buffer.writeUInt8(value.data2 || 0, 3);
  } else {
    throw new Error('MIDI value must be a 4-byte Buffer or object with port, status, data1, data2 properties');
  }
  
  return buffer;
}

function readMidi(buffer, offset) {
  if (offset + 4 > buffer.length) {
    throw new Error('Not enough bytes for MIDI message');
  }
  
  const value = buffer.subarray(offset, offset + 4);
  return { value, offset: offset + 4 };
}

function encodeArgument(arg) {
  if (typeof arg === 'object' && arg.type && arg.value !== undefined) {
    // Explicit type specification
    switch (arg.type) {
      case 'i':
      case 'integer':
        return { tag: 'i', data: writeInt32(arg.value) };
      case 'f':
      case 'float':
        return { tag: 'f', data: writeFloat32(arg.value) };
      case 's':
      case 'string':
        return { tag: 's', data: Buffer.from(padString(arg.value)) };
      case 'b':
      case 'blob':
        return { tag: 'b', data: writeBlob(arg.value) };
      case 'd':
      case 'double':
        // For doubles, use float for now (OSC 1.0 doesn't have double)
        return { tag: 'f', data: writeFloat32(arg.value) };
      case 'T':
        return { tag: 'T', data: Buffer.alloc(0) };
      case 'F':
        return { tag: 'F', data: Buffer.alloc(0) };
      case 'boolean':
        return arg.value ? { tag: 'T', data: Buffer.alloc(0) } : { tag: 'F', data: Buffer.alloc(0) };
      case 'm':
      case 'midi':
        return { tag: 'm', data: writeMidi(arg.value) };
      default:
        throw new Error(`Unknown argument type: ${arg.type}`);
    }
  }
  
  // Infer type from JavaScript type
  switch (typeof arg) {
    case 'number':
      if (Number.isInteger(arg)) {
        return { tag: 'i', data: writeInt32(arg) };
      } else {
        return { tag: 'f', data: writeFloat32(arg) };
      }
    case 'string':
      return { tag: 's', data: Buffer.from(padString(arg)) };
    case 'boolean':
      return arg ? { tag: 'T', data: Buffer.alloc(0) } : { tag: 'F', data: Buffer.alloc(0) };
    default:
      if (Buffer.isBuffer(arg)) {
        return { tag: 'b', data: writeBlob(arg) };
      }
      throw new Error(`Don't know how to encode argument: ${arg}`);
  }
}

function decodeArgument(tag, buffer, offset) {
  switch (tag) {
    case 'i':
      return readInt32(buffer, offset);
    case 'f':
      return readFloat32(buffer, offset);
    case 's':
      return readString(buffer, offset);
    case 'b':
      return readBlob(buffer, offset);
    case 'T':
      return { value: true, offset };
    case 'F':
      return { value: false, offset };
    case 'N':
      return { value: null, offset };
    case 'm':
      return readMidi(buffer, offset);
    default:
      throw new Error(`I don't understand the argument code ${tag}`);
  }
}

/**
 * Encode an OSC message or bundle to a Buffer.
 * 
 * This low-level function converts OSC messages and bundles into binary format
 * for transmission or storage. Useful for sending OSC over custom transports
 * (WebSocket, TCP, HTTP), storing to files, or implementing custom OSC routers.
 * 
 * @param {Object} message - OSC message or bundle object with oscType property
 * @returns {Buffer} The encoded OSC data ready for transmission
 * 
 * @example
 * // Encode a message
 * import { Message, encode } from 'node-osc';
 * 
 * const message = new Message('/oscillator/frequency', 440);
 * const buffer = encode(message);
 * console.log('Encoded bytes:', buffer.length);
 * 
 * @example
 * // Encode a bundle
 * import { Bundle, encode } from 'node-osc';
 * 
 * const bundle = new Bundle(['/one', 1], ['/two', 2]);
 * const buffer = encode(bundle);
 * 
 * @example
 * // Send over WebSocket
 * const buffer = encode(message);
 * websocket.send(buffer);
 */
function encode(message) {
  if (message.oscType === 'bundle') {
    return encodeBundleToBuffer(message);
  } else {
    return encodeMessageToBuffer(message);
  }
}

function encodeMessageToBuffer(message) {
  // OSC Message format:
  // Address pattern (padded string)
  // Type tag string (padded string starting with ,)
  // Arguments (encoded according to type tags)
  
  const address = padString(message.address);
  const addressBuffer = Buffer.from(address);
  
  const encodedArgs = message.args.map(encodeArgument);
  const typeTags = ',' + encodedArgs.map(arg => arg.tag).join('');
  const typeTagsBuffer = Buffer.from(padString(typeTags));
  
  const argumentBuffers = encodedArgs.map(arg => arg.data);
  
  return Buffer.concat([addressBuffer, typeTagsBuffer, ...argumentBuffers]);
}

function encodeBundleToBuffer(bundle) {
  // OSC Bundle format:
  // "#bundle" (padded string)
  // Timetag (8 bytes)
  // Elements (each prefixed with size)
  
  const bundleString = padString('#bundle');
  const bundleStringBuffer = Buffer.from(bundleString);
  
  const timetagBuffer = writeTimeTag(bundle.timetag);
  
  const elementBuffers = bundle.elements.map(element => {
    let elementBuffer;
    if (element.oscType === 'bundle') {
      elementBuffer = encodeBundleToBuffer(element);
    } else {
      elementBuffer = encodeMessageToBuffer(element);
    }
    const sizeBuffer = writeInt32(elementBuffer.length);
    return Buffer.concat([sizeBuffer, elementBuffer]);
  });
  
  return Buffer.concat([bundleStringBuffer, timetagBuffer, ...elementBuffers]);
}

/**
 * Decode a Buffer containing OSC data into a message or bundle object.
 * 
 * This low-level function parses binary OSC data back into JavaScript objects.
 * Useful for receiving OSC over custom transports, reading from files,
 * or implementing custom OSC routers.
 * 
 * @param {Buffer} buffer - The Buffer containing OSC data
 * @returns {Object} The decoded OSC message or bundle. Messages have
 *   {oscType: 'message', address: string, args: Array}, bundles have
 *   {oscType: 'bundle', timetag: number, elements: Array}
 * @throws {Error} If the buffer contains malformed OSC data
 * 
 * @example
 * // Decode received data
 * import { decode } from 'node-osc';
 * 
 * const decoded = decode(buffer);
 * if (decoded.oscType === 'message') {
 *   console.log('Address:', decoded.address);
 *   console.log('Arguments:', decoded.args);
 * }
 * 
 * @example
 * // Round-trip encode/decode
 * import { Message, encode, decode } from 'node-osc';
 * 
 * const original = new Message('/test', 42, 'hello');
 * const buffer = encode(original);
 * const decoded = decode(buffer);
 * console.log(decoded.address); // '/test'
 */
function decode(buffer) {
  // Check if it's a bundle or message
  if (buffer.length >= 8 && buffer.subarray(0, 8).toString() === '#bundle\0') {
    return decodeBundleFromBuffer(buffer);
  } else {
    return decodeMessageFromBuffer(buffer);
  }
}

function decodeMessageFromBuffer(buffer) {
  let offset = 0;
  
  // Read address pattern
  const addressResult = readString(buffer, offset);
  const address = addressResult.value;
  offset = addressResult.offset;
  
  // Read type tag string
  const typeTagsResult = readString(buffer, offset);
  const typeTags = typeTagsResult.value;
  offset = typeTagsResult.offset;
  
  if (!typeTags.startsWith(',')) {
    throw new Error('Malformed Packet');
  }
  
  const tags = typeTags.slice(1); // Remove leading comma
  const args = [];
  
  for (const tag of tags) {
    const argResult = decodeArgument(tag, buffer, offset);
    args.push({ value: argResult.value });
    offset = argResult.offset;
  }
  
  return {
    oscType: 'message',
    address,
    args
  };
}

function decodeBundleFromBuffer(buffer) {
  let offset = 8; // Skip "#bundle\0"
  
  // Read timetag
  const timetagResult = readTimeTag(buffer, offset);
  const timetag = timetagResult.value;
  offset = timetagResult.offset;
  
  const elements = [];
  
  while (offset < buffer.length) {
    // Read element size
    const sizeResult = readInt32(buffer, offset);
    const size = sizeResult.value;
    offset = sizeResult.offset;
    if (size <= 0 || offset + size > buffer.length) {
      throw new Error('Malformed Packet');
    }
    
    // Read element data
    const elementBuffer = buffer.subarray(offset, offset + size);
    const element = decode(elementBuffer);
    elements.push(element);
    offset += size;
  }
  
  return {
    oscType: 'bundle',
    timetag,
    elements
  };
}

export { encode, decode };
