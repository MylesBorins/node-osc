import { Buffer } from 'node:buffer';

function toBuffer(message) {
  const address = Buffer.from(message.address + '\0');
  const args = message.args.map(arg => {
    switch (arg.type) {
      case 'integer':
        return Buffer.from([0, 0, 0, arg.value]);
      case 'float':
        const buffer = Buffer.alloc(4);
        buffer.writeFloatBE(arg.value, 0);
        return buffer;
      case 'string':
        return Buffer.from(arg.value + '\0');
      case 'blob':
        const size = Buffer.alloc(4);
        size.writeUInt32BE(arg.value.length, 0);
        return Buffer.concat([size, arg.value]);
      default:
        throw new Error(`Unknown argument type: ${arg.type}`);
    }
  });
  return Buffer.concat([address, ...args]);
}

function fromBuffer(buffer) {
  const addressEnd = buffer.indexOf(0);
  const address = buffer.slice(0, addressEnd).toString();
  const args = [];
  let offset = addressEnd + 1;
  while (offset < buffer.length) {
    const type = buffer.readUInt8(offset);
    offset += 1;
    switch (type) {
      case 0:
        args.push({ type: 'integer', value: buffer.readInt32BE(offset) });
        offset += 4;
        break;
      case 1:
        args.push({ type: 'float', value: buffer.readFloatBE(offset) });
        offset += 4;
        break;
      case 2:
        const stringEnd = buffer.indexOf(0, offset);
        args.push({ type: 'string', value: buffer.slice(offset, stringEnd).toString() });
        offset = stringEnd + 1;
        break;
      case 3:
        const blobSize = buffer.readUInt32BE(offset);
        offset += 4;
        args.push({ type: 'blob', value: buffer.slice(offset, offset + blobSize) });
        offset += blobSize;
        break;
      default:
        throw new Error(`Unknown argument type: ${type}`);
    }
  }
  return { address, args };
}

export { toBuffer, fromBuffer };
