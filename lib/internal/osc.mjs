import { Buffer } from 'node:buffer';

function toBuffer(message) {
  if (typeof message !== 'object') {
    throw new TypeError('Message must be an object');
  }

  const address = message.address;
  const args = message.args || [];

  const addressBuffer = encodeString(address);
  const typeTagBuffer = encodeString(',' + args.map(arg => getTypeTag(arg)).join(''));
  const argsBuffer = Buffer.concat(args.map(arg => encodeArg(arg)));

  return Buffer.concat([addressBuffer, typeTagBuffer, argsBuffer]);
}

function fromBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('Buffer must be a Buffer');
  }

  let offset = 0;

  const address = decodeString(buffer, offset);
  offset += address.length + 4 - (address.length % 4);

  const typeTag = decodeString(buffer, offset);
  offset += typeTag.length + 4 - (typeTag.length % 4);

  const args = [];
  for (let i = 1; i < typeTag.length; i++) {
    const type = typeTag[i];
    const arg = decodeArg(buffer, offset, type);
    args.push(arg.value);
    offset += arg.size;
  }

  return {
    address,
    args
  };
}

function encodeString(str) {
  const length = str.length + 1;
  const paddedLength = length + (4 - (length % 4));
  const buffer = Buffer.alloc(paddedLength);
  buffer.write(str, 0, 'ascii');
  return buffer;
}

function decodeString(buffer, offset) {
  let end = offset;
  while (buffer[end] !== 0) {
    end++;
  }
  return buffer.toString('ascii', offset, end);
}

function getTypeTag(arg) {
  switch (typeof arg) {
    case 'string':
      return 's';
    case 'number':
      return Number.isInteger(arg) ? 'i' : 'f';
    case 'object':
      if (Buffer.isBuffer(arg)) {
        return 'b';
      }
      throw new TypeError('Unsupported argument type');
    default:
      throw new TypeError('Unsupported argument type');
  }
}

function encodeArg(arg) {
  switch (typeof arg) {
    case 'string':
      return encodeString(arg);
    case 'number':
      return Number.isInteger(arg) ? encodeInt32(arg) : encodeFloat32(arg);
    case 'object':
      if (Buffer.isBuffer(arg)) {
        return encodeBlob(arg);
      }
      throw new TypeError('Unsupported argument type');
    default:
      throw new TypeError('Unsupported argument type');
  }
}

function decodeArg(buffer, offset, type) {
  switch (type) {
    case 's':
      return { value: decodeString(buffer, offset), size: 4 * Math.ceil((buffer.indexOf(0, offset) - offset + 1) / 4) };
    case 'i':
      return { value: buffer.readInt32BE(offset), size: 4 };
    case 'f':
      return { value: buffer.readFloatBE(offset), size: 4 };
    case 'b':
      const length = buffer.readInt32BE(offset);
      return { value: buffer.slice(offset + 4, offset + 4 + length), size: 4 + length + (4 - (length % 4)) };
    default:
      throw new TypeError('Unsupported argument type');
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

function encodeBlob(blob) {
  const length = blob.length;
  const paddedLength = length + (4 - (length % 4));
  const buffer = Buffer.alloc(4 + paddedLength);
  buffer.writeInt32BE(length, 0);
  blob.copy(buffer, 4);
  return buffer;
}

export { toBuffer, fromBuffer };
