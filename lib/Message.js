'use strict';

function Message(address) {
    this.oscType = 'message';
    this.address = address;
    this.args = [];

    for (var i = 1; i < arguments.length; i++) {
        this.append(arguments[i]);
    }
}

function Argument(type, value){
    this.type = type;
    this.value = value;
}

Message.prototype = {
    append: function (arg) {
        var argOut;
        switch (typeof arg) {
        case 'object':
            if (arg instanceof Array) {
                for (var i = 0; i < arg.length; i++) {
                    this.append(arg[i]);
                }
            } else if (arg.type) {
                this.args.push(arg);
            } else {
                throw new Error('don\'t know how to encode object ' + arg);
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
        default:
            throw new Error('don\'t know how to encode ' + arg);
        }
    }
};

module.exports = Message;
