import { encode } from '../osc.mjs';
import Message from '../Message.mjs';

function normalizeMessage(message) {
  if (message instanceof Array) {
    return {
      address: message[0],
      args: message.slice(1)
    };
  }

  return message;
}

function performSend(sock, message, args, port, host, callback) {
  let mes;
  let buf;
  const normalizedMessage = normalizeMessage(message);

  try {
    switch (typeof normalizedMessage) {
      case 'object':
        buf = encode(normalizedMessage);
        sock.send(buf, 0, buf.length, port, host, callback);
        break;
      case 'string':
        mes = new Message(normalizedMessage);
        for (const arg of args) {
          mes.append(arg);
        }
        buf = encode(mes);
        sock.send(buf, 0, buf.length, port, host, callback);
        break;
      default:
        throw new TypeError('That Message Just Doesn\'t Seem Right');
    }
  }
  catch (e) {
    if (e.code !== 'ERR_SOCKET_DGRAM_NOT_RUNNING') throw e;
    const error = new ReferenceError('Cannot send message on closed socket.');
    error.code = e.code;
    callback(error);
  }
}

export default performSend;