import { Buffer } from 'node:buffer';

function toBuffer(object, strict = false) {
  if (typeof object !== 'object' || object === null) {
    throw new TypeError('Invalid OSC packet representation');
  }

  if (object.oscType === 'message') {
    return encodeMessage(object, strict);
  } else if (object.oscType === 'bundle') {
    return encodeBundle(object, strict);
  } else {
    throw new TypeError('Invalid OSC packet representation');
  }
}

function fromBuffer(buffer, strict = false) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('Invalid OSC packet buffer');
  }

  const packet = decodePacket(buffer, strict);
  if (packet.oscType === 'message') {
    return sanitizeMessage(packet);
  } else if (packet.oscType === 'bundle') {
    return sanitizeBundle(packet);
  } else {
    throw new Error('Malformed Packet');
  }
}

function encodeMessage(message, strict) {
  const address = encodeString(message.address);
  const typeTags = encodeString(',' + message.args.map(arg => getTypeTag(arg.type)).join(''));
  const args = message.args.map(arg => encodeArgument(arg, strict)).join('');
  return Buffer.concat([address, typeTags, Buffer.from(args)]);
}

function encodeBundle(bundle, strict) {
  const timetag = encodeTimetag(bundle.timetag);
  const elements = bundle.elements.map(element => {
    const encodedElement = toBuffer(element, strict);
    const size = Buffer.alloc(4);
    size.writeUInt32BE(encodedElement.length, 0);
    return Buffer.concat([size, encodedElement]);
  });
  return Buffer.concat([Buffer.from('#bundle\0'), timetag, ...elements]);
}

function decodePacket(buffer, strict) {
  const address = decodeString(buffer);
  if (address === '#bundle') {
    return decodeBundle(buffer, strict);
  } else {
    return decodeMessage(buffer, strict);
  }
}

function decodeMessage(buffer, strict) {
  const address = decodeString(buffer);
  const typeTags = decodeString(buffer).slice(1);
  const args = [];
  for (const tag of typeTags) {
    args.push(decodeArgument(buffer, tag, strict));
  }
  return { oscType: 'message', address, args };
}

function decodeBundle(buffer, strict) {
  const timetag = decodeTimetag(buffer);
  const elements = [];
  while (buffer.length > 0) {
    const size = buffer.readUInt32BE(0);
    const elementBuffer = buffer.slice(4, 4 + size);
    elements.push(decodePacket(elementBuffer, strict));
    buffer = buffer.slice(4 + size);
  }
  return { oscType: 'bundle', timetag, elements };
}

function encodeString(str) {
  const length = Buffer.byteLength(str);
  const paddedLength = Math.ceil((length + 1) / 4) * 4;
  const buffer = Buffer.alloc(paddedLength);
  buffer.write(str, 0, length, 'ascii');
  return buffer;
}

function decodeString(buffer) {
  const end = buffer.indexOf(0);
  const str = buffer.toString('ascii', 0, end);
  buffer = buffer.slice(Math.ceil((end + 1) / 4) * 4);
  return str;
}

function encodeArgument(arg, strict) {
  switch (arg.type) {
    case 'integer':
      return encodeInt32(arg.value);
    case 'float':
      return encodeFloat32(arg.value);
    case 'string':
      return encodeString(arg.value);
    case 'blob':
      return encodeBlob(arg.value);
    default:
      if (strict) {
        throw new TypeError(`Unknown argument type: ${arg.type}`);
      }
      return '';
  }
}

function decodeArgument(buffer, tag, strict) {
  switch (tag) {
    case 'i':
      return { type: 'integer', value: decodeInt32(buffer) };
    case 'f':
      return { type: 'float', value: decodeFloat32(buffer) };
    case 's':
      return { type: 'string', value: decodeString(buffer) };
    case 'b':
      return { type: 'blob', value: decodeBlob(buffer) };
    default:
      if (strict) {
        throw new TypeError(`Unknown argument type tag: ${tag}`);
      }
      return null;
  }
}

function encodeInt32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(value, 0);
  return buffer;
}

function decodeInt32(buffer) {
  const value = buffer.readInt32BE(0);
  buffer = buffer.slice(4);
  return value;
}

function encodeFloat32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeFloatBE(value, 0);
  return buffer;
}

function decodeFloat32(buffer) {
  const value = buffer.readFloatBE(0);
  buffer = buffer.slice(4);
  return value;
}

function encodeBlob(blob) {
  const size = Buffer.alloc(4);
  size.writeUInt32BE(blob.length, 0);
  const paddedLength = Math.ceil(blob.length / 4) * 4;
  const buffer = Buffer.alloc(paddedLength);
  blob.copy(buffer);
  return Buffer.concat([size, buffer]);
}

function decodeBlob(buffer) {
  const size = buffer.readUInt32BE(0);
  const blob = buffer.slice(4, 4 + size);
  buffer = buffer.slice(4 + size);
  return blob;
}

function encodeTimetag(timetag) {
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(timetag / 4294967296), 0);
  buffer.writeUInt32BE(timetag % 4294967296, 4);
  return buffer;
}

function decodeTimetag(buffer) {
  const seconds = buffer.readUInt32BE(0);
  const fraction = buffer.readUInt32BE(4);
  buffer = buffer.slice(8);
  return seconds * 4294967296 + fraction;
}

function getTypeTag(type) {
  switch (type) {
    case 'integer':
      return 'i';
    case 'float':
      return 'f';
    case 'string':
      return 's';
    case 'blob':
      return 'b';
    default:
      return '';
  }
}

function sanitizeMessage(decoded) {
  const message = [];
  message.push(decoded.address);
  decoded.args.forEach(arg => {
    message.push(arg.value);
  });
  return message;
}

function sanitizeBundle(decoded) {
  decoded.elements = decoded.elements.map(element => {
    if (element.oscType === 'bundle') return sanitizeBundle(element);
    else if (element.oscType === 'message') return sanitizeMessage(element);
  });
  return decoded;
}

export { toBuffer, fromBuffer };
