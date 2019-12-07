class Argument {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}

class Message {
  constructor(address, ...args) {
    this.oscType = 'message';
    this.address = address;
    this.args = args;
  }
  
  append(arg) {
    let argOut;
    switch (typeof arg) {
    case 'object':
      if (arg instanceof Array) {
        arg.forEach(a => this.append(a));
      } else if (arg.type) {
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
