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

/**
 * Decode raw OSC data and sanitize it into a flat array or bundle structure.
 *
 * @param {Buffer} data - Raw OSC buffer to decode.
 * @param {Function} [customDecode] - Optional decode function to use instead of the default.
 * @returns {Array|Object} A message array (address + values) or a sanitized bundle object.
 * @throws {Error} If the decoded data is not a valid OSC message or bundle.
 */
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
