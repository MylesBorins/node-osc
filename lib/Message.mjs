const typeTags = {
  s: 'string',
  f: 'float',
  i: 'integer',
  b: 'blob',
  m: 'midi'
};

/**
 * Represents a typed argument for an OSC message.
 * 
 * @class
 * @private
 */
class Argument {
  /**
   * @param {string} type - The type of the argument (string, float, integer, blob, boolean).
   * @param {*} value - The value of the argument.
   */
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}

/**
 * Represents an OSC message with an address and arguments.
 * 
 * OSC messages consist of an address pattern (string starting with '/')
 * and zero or more arguments of various types.
 * 
 * @class
 * 
 * @example
 * // Create a message with constructor arguments
 * const msg = new Message('/test', 1, 2, 'hello');
 * 
 * @example
 * // Create a message and append arguments
 * const msg = new Message('/test');
 * msg.append(1);
 * msg.append('hello');
 * msg.append(3.14);
 */
class Message {
  /**
   * Create an OSC Message.
   * 
   * @param {string} address - The OSC address pattern (e.g., '/oscillator/frequency').
   * @param {...*} args - Optional arguments to include in the message.
   * 
   * @example
   * const msg = new Message('/test');
   * 
   * @example
   * const msg = new Message('/test', 1, 2, 3);
   * 
   * @example
   * const msg = new Message('/synth', 'note', 60, 0.5);
   */
  constructor(address, ...args) {
    this.oscType = 'message';
    this.address = address;
    this.args = args;
  }
  
  /**
   * Append an argument to the message.
   * 
   * Automatically detects the type based on the JavaScript type:
   * - Integers are encoded as OSC integers
   * - Floats are encoded as OSC floats
   * - Strings are encoded as OSC strings
   * - Booleans are encoded as OSC booleans
   * - Buffers are encoded as OSC blobs
   * - Arrays are recursively appended
   * - Objects with a 'type' property are used as-is
   * 
   * @param {*} arg - The argument to append. Can be:
   *   - A primitive value (number, string, boolean)
   *   - A Buffer (encoded as blob)
   *   - An array of values (will be recursively appended)
   *   - An object with 'type' and 'value' properties for explicit type control
   * 
   * @throws {Error} If the argument type cannot be encoded.
   * 
   * @example
   * const msg = new Message('/test');
   * msg.append(42);           // Integer
   * msg.append(3.14);         // Float
   * msg.append('hello');      // String
   * msg.append(true);         // Boolean
   * 
   * @example
   * // Append multiple values at once
   * msg.append([1, 2, 3]);
   * 
   * @example
   * // Explicitly specify type
   * msg.append({ type: 'float', value: 42 });
   * msg.append({ type: 'blob', value: Buffer.from('data') });
   * 
   * @example
   * // MIDI messages (4 bytes: port, status, data1, data2)
   * msg.append({ type: 'midi', value: { port: 0, status: 144, data1: 60, data2: 127 } });
   * msg.append({ type: 'm', value: Buffer.from([0, 144, 60, 127]) });
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
