import { Buffer } from 'node:buffer';

function toBuffer(object) {
  if (typeof object !== 'object' || object === null) {
    throw new TypeError('Invalid OSC packet representation');
  }

  if (object.oscType === 'message') {
    return encodeMessage(object);
  } else if (object.oscType === 'bundle') {
    return encodeBundle(object);
  } else {
    throw new TypeError('Invalid OSC packet representation');
  }
}

function fromBuffer(buffer, strict = false) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('Invalid buffer');
  }

  const packet = decodePacket(buffer, 0, strict);
  if (packet.offset !== buffer.length) {
    throw new Error('Buffer contains extra data');
  }

  return packet.value;
}

function encodeMessage(message) {
  const address = encodeString(message.address);
  const typeTags = encodeString(',' + message.args.map(arg => getTypeTag(arg.type)).join(''));
  const args = Buffer.concat(message.args.map(arg => encodeArgument(arg)));

  return Buffer.concat([address, typeTags, args]);
}

function encodeBundle(bundle) {
  const timetag = encodeTimetag(bundle.timetag);
  const elements = Buffer.concat(bundle.elements.map(element => {
    const encoded = toBuffer(element);
    const size = Buffer.alloc(4);
    size.writeUInt32BE(encoded.length, 0);
    return Buffer.concat([size, encoded]);
  }));

  return Buffer.concat([encodeString('#bundle'), timetag, elements]);
}

function encodeString(str) {
  const length = Math.ceil((str.length + 1) / 4) * 4;
  const buffer = Buffer.alloc(length);
  buffer.write(str, 0, 'ascii');
  return buffer;
}

function encodeTimetag(timetag) {
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(timetag), 0);
  buffer.writeUInt32BE(Math.floor((timetag % 1) * 4294967296), 4);
  return buffer;
}

function encodeArgument(arg) {
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
      throw new TypeError(`Unknown argument type: ${arg.type}`);
  }
}

function encodeInt32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(value, 0);
  return buffer;
}

function encodeFloat32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeFloatBE(value, 0);
  return buffer;
}

function encodeBlob(value) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(value.length, 0);
  const padding = Buffer.alloc((4 - (value.length % 4)) % 4);
  return Buffer.concat([length, value, padding]);
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
      throw new TypeError(`Unknown argument type: ${type}`);
  }
}

function decodePacket(buffer, offset, strict) {
  const firstByte = buffer[offset];
  if (firstByte === 35) { // '#'
    return decodeBundle(buffer, offset, strict);
  } else if (firstByte === 47) { // '/'
    return decodeMessage(buffer, offset, strict);
  } else {
    throw new Error('Invalid OSC packet');
  }
}

function decodeMessage(buffer, offset, strict) {
  const address = decodeString(buffer, offset);
  offset += address.length;

  const typeTags = decodeString(buffer, offset);
  offset += typeTags.length;

  const args = [];
  for (let i = 1; i < typeTags.value.length; i++) {
    const typeTag = typeTags.value[i];
    const arg = decodeArgument(buffer, offset, typeTag, strict);
    offset = arg.offset;
    args.push(arg.value);
  }

  return {
    value: {
      oscType: 'message',
      address: address.value,
      args
    },
    offset
  };
}

function decodeBundle(buffer, offset, strict) {
  const timetag = decodeTimetag(buffer, offset + 8);
  offset += 16;

  const elements = [];
  while (offset < buffer.length) {
    const size = buffer.readUInt32BE(offset);
    offset += 4;
    const element = decodePacket(buffer, offset, strict);
    offset += size;
    elements.push(element.value);
  }

  return {
    value: {
      oscType: 'bundle',
      timetag: timetag.value,
      elements
    },
    offset
  };
}

function decodeString(buffer, offset) {
  let end = offset;
  while (buffer[end] !== 0) {
    end++;
  }
  const value = buffer.toString('ascii', offset, end);
  const length = Math.ceil((end - offset + 1) / 4) * 4;
  return { value, length };
}

function decodeTimetag(buffer, offset) {
  const seconds = buffer.readUInt32BE(offset);
  const fraction = buffer.readUInt32BE(offset + 4);
  const value = seconds + fraction / 4294967296;
  return { value, length: 8 };
}

function decodeArgument(buffer, offset, typeTag, strict) {
  switch (typeTag) {
    case 'i':
      return decodeInt32(buffer, offset);
    case 'f':
      return decodeFloat32(buffer, offset);
    case 's':
      return decodeString(buffer, offset);
    case 'b':
      return decodeBlob(buffer, offset);
    default:
      if (strict) {
        throw new Error(`Unknown type tag: ${typeTag}`);
      } else {
        return { value: null, offset };
      }
  }
}

function decodeInt32(buffer, offset) {
  const value = buffer.readInt32BE(offset);
  return { value, offset: offset + 4 };
}

function decodeFloat32(buffer, offset) {
  const value = buffer.readFloatBE(offset);
  return { value, offset: offset + 4 };
}

function decodeBlob(buffer, offset) {
  const length = buffer.readUInt32BE(offset);
  offset += 4;
  const value = buffer.slice(offset, offset + length);
  const padding = (4 - (length % 4)) % 4;
  return { value, offset: offset + length + padding };
}

export { toBuffer, fromBuffer };
