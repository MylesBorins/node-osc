const typeTags = {
  s: 'string',
  f: 'float',
  i: 'integer',
  b: 'blob'
};

/**
 * Represents a typed OSC argument
 * @class
 */
class Argument {
  /**
   * Create a typed argument
   * @param {string} type - The OSC type ('integer', 'float', 'string', 'boolean', 'blob', etc.)
   * @param {*} value - The value of the argument
   */
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}

/**
 * OSC Message
 * @class
 * @example
 * const msg = new Message('/address', 'arg1', 123);
 * msg.append('another arg');
 */
class Message {
  /**
   * Create a new OSC Message
   * @param {string} address - The OSC address pattern (e.g., '/synth/note')
   * @param {...*} args - Optional arguments to append to the message
   */
  constructor(address, ...args) {
    this.oscType = 'message';
    this.address = address;
    this.args = args;
  }
  
  /**
   * Append an argument to the message
   * @param {*} arg - Can be a number, string, boolean, Buffer, array, or typed object {type, value}
   * @example
   * msg.append('string');
   * msg.append(123);
   * msg.append(3.14);
   * msg.append(true);
   * msg.append({ type: 'blob', value: Buffer.from('data') });
   * msg.append([1, 2, 3]); // Appends multiple arguments
   */
  append(arg) {
    let argOut;
    switch (typeof arg) {
    case 'object':
      if (arg instanceof Array) {
        arg.forEach(a => this.append(a));
      } else if (arg.type) {
        if (typeTags[arg.type]) arg.type = typeTags[arg.type];
        this.args.push(arg);
      } else {
        throw new Error(`don't know how to encode object ${arg}`);
      }
      break;
    case 'number':
      if (Math.floor(arg) === arg) {
        argOut = new Argument('integer', arg);
      } else {
        argOut = new Argument('float', arg);
      }
      break;
    case 'string':
      argOut = new Argument('string', arg);
      break;
    case 'boolean':
      argOut = new Argument('boolean', arg);
      break;
    default:
      throw new Error(`don't know how to encode ${arg}`);
    }
    if (argOut) this.args.push(argOut);
  }
}

export default Message;
