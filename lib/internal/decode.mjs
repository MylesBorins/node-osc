import { decode } from '../osc.mjs';

function sanitizeMessage(decoded) {
  const message = [];
  message.push(decoded.address);
  const args = decoded.args ?? [];
  args.forEach(arg => {
    message.push(arg.value);
  });
  return message;
}

function sanitizeBundle(decoded) {
  decoded.elements = decoded.elements.map(element => {
    if (element.oscType === 'bundle') return sanitizeBundle(element);
    else if (element.oscType === 'message') return sanitizeMessage(element);
    throw new Error('Malformed Packet');
  });
  return decoded;
}

function decodeAndSanitize(data, customDecode = decode) {
  const decoded = customDecode(data);
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

export default decodeAndSanitize;
