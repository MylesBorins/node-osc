'use strict';

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
    this.args = [];
    args.forEach(arg => this.append(arg));
  }
  
  append(arg) {
    var argOut;
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
        this.args.push(argOut);
      } else {
        argOut = new Argument('float', arg);
        this.args.push(argOut);
      }
      break;
    case 'string':
      argOut = new Argument('string', arg);
      this.args.push(argOut);
      break;
    case 'boolean':
      argOut = new Argument('boolean', arg);
      this.args.push(argOut);
      break;
    default:
      throw new Error(`don't know how to encode ${arg}`);
    }
  }
}

module.exports = Message;
