function fromBuffer(buffer) {
  let offset = 0;

  function readInt32() {
    const value = buffer.readInt32BE(offset);
    offset += 4;
    return value;
  }

  function readFloat32() {
    const value = buffer.readFloatBE(offset);
    offset += 4;
    return value;
  }

  function readString() {
    const start = offset;
    while (buffer[offset] !== 0) {
      offset++;
    }
    const value = buffer.toString('ascii', start, offset);
    offset += 4 - (offset % 4);
    return value;
  }

  function readBlob() {
    const size = readInt32();
    const value = buffer.slice(offset, offset + size);
    offset += size + (4 - (size % 4));
    return value;
  }

  function readTimetag() {
    const seconds = readInt32();
    const fraction = readInt32();
    return { seconds, fraction };
  }

  function readArguments(typeTag) {
    const args = [];
    for (let i = 0; i < typeTag.length; i++) {
      switch (typeTag[i]) {
        case 'i':
          args.push(readInt32());
          break;
        case 'f':
          args.push(readFloat32());
          break;
        case 's':
          args.push(readString());
          break;
        case 'b':
          args.push(readBlob());
          break;
        case 't':
          args.push(readTimetag());
          break;
        default:
          throw new Error(`Unsupported argument type: ${typeTag[i]}`);
      }
    }
    return args;
  }

  function readMessage() {
    const address = readString();
    const typeTag = readString().slice(1);
    const args = readArguments(typeTag);
    return { oscType: 'message', address, args };
  }

  function readBundle() {
    const timetag = readTimetag();
    const elements = [];
    while (offset < buffer.length) {
      const size = readInt32();
      const elementBuffer = buffer.slice(offset, offset + size);
      offset += size;
      elements.push(fromBuffer(elementBuffer));
    }
    return { oscType: 'bundle', timetag, elements };
  }

  if (buffer[0] === 35 && buffer[1] === 98 && buffer[2] === 117 && buffer[3] === 110 && buffer[4] === 100 && buffer[5] === 108 && buffer[6] === 101) {
    offset += 8;
    return readBundle();
  } else {
    return readMessage();
  }
}

function sanitizeMessage(decoded) {
  const message = [];
  message.push(decoded.address);
  decoded.args.forEach(arg => {
    message.push(arg);
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

function decode(data) {
  const decoded = fromBuffer(data);
  if (decoded.oscType === 'bundle') {
    return sanitizeBundle(decoded);
  }
  else if (decoded.oscType === 'message') {
    return sanitizeMessage(decoded);
  }
  else {
    throw new Error ('Malformed Packet');
  }
}

export default decode;
