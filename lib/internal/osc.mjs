import { Buffer } from 'node:buffer';

function toBuffer(message) {
  if (typeof message !== 'object' || !message.address) {
    throw new Error('Invalid OSC message');
  }

  const addressBuffer = toOSCString(message.address);
  const typeTagBuffer = toOSCString(',' + message.args.map(arg => getTypeTag(arg)).join(''));
  const argsBuffer = Buffer.concat(message.args.map(arg => toOSCArgument(arg)));

  return Buffer.concat([addressBuffer, typeTagBuffer, argsBuffer]);
}

function fromBuffer(buffer) {
  let offset = 0;

  const address = readOSCString(buffer, offset);
  offset += address.length + 4 - (address.length % 4);

  const typeTag = readOSCString(buffer, offset);
  offset += typeTag.length + 4 - (typeTag.length % 4);

  const args = [];
  for (let i = 1; i < typeTag.length; i++) {
    const type = typeTag[i];
    const arg = readOSCArgument(buffer, offset, type);
    args.push(arg.value);
    offset += arg.size;
  }

  return { address, args };
}

function toOSCString(str) {
  const buffer = Buffer.from(str + '\0');
  const padding = 4 - (buffer.length % 4);
  return Buffer.concat([buffer, Buffer.alloc(padding)]);
}

function readOSCString(buffer, offset) {
  let end = offset;
  while (buffer[end] !== 0) end++;
  return buffer.toString('ascii', offset, end);
}

function getTypeTag(arg) {
  switch (typeof arg) {
    case 'string': return 's';
    case 'number': return Number.isInteger(arg) ? 'i' : 'f';
    case 'object': return 'b';
    default: throw new Error('Unsupported argument type');
  }
}

function toOSCArgument(arg) {
  switch (typeof arg) {
    case 'string': return toOSCString(arg);
    case 'number': return Number.isInteger(arg) ? toOSCInt32(arg) : toOSCFloat32(arg);
    case 'object': return toOSCBlob(arg);
    default: throw new Error('Unsupported argument type');
  }
}

function readOSCArgument(buffer, offset, type) {
  switch (type) {
    case 's': return { value: readOSCString(buffer, offset), size: 4 * Math.ceil((buffer.indexOf(0, offset) - offset + 1) / 4) };
    case 'i': return { value: buffer.readInt32BE(offset), size: 4 };
    case 'f': return { value: buffer.readFloatBE(offset), size: 4 };
    case 'b': return readOSCBlob(buffer, offset);
    default: throw new Error('Unsupported argument type');
  }
}

function toOSCInt32(num) {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(num);
  return buffer;
}

function toOSCFloat32(num) {
  const buffer = Buffer.alloc(4);
  buffer.writeFloatBE(num);
  return buffer;
}

function toOSCBlob(blob) {
  const sizeBuffer = toOSCInt32(blob.length);
  const padding = 4 - (blob.length % 4);
  return Buffer.concat([sizeBuffer, blob, Buffer.alloc(padding)]);
}

function readOSCBlob(buffer, offset) {
  const size = buffer.readInt32BE(offset);
  const value = buffer.slice(offset + 4, offset + 4 + size);
  return { value, size: 4 + size + (4 - (size % 4)) };
}

export { toBuffer, fromBuffer };
