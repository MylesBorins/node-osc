import { fromBuffer } from 'osc-min';

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
