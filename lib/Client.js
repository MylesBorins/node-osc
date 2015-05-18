'use strict';

var dgram = require('dgram');

var min = require('osc-min');

var Message = require('./Message');

var Client = function (host, port) {
    this.host = host;
    this.port = port;
    this._sock = dgram.createSocket('udp4');
    this.kill = function() {
        this._sock.close();
    };
};

Client.prototype = {
    send: function (message) {
        var mes;
        var buf;
        var callback;
        var args = Array.prototype.slice.call(arguments);
        var last = args[args.length - 1];

        if (typeof last === 'function') {
          callback = args.pop();
        }
        else {
          callback = function () {};
        }


        switch (typeof message) {
            case 'object':
                buf = min.toBuffer(message);
                this._sock.send(buf, 0, buf.length, this.port, this.host, callback);
                break;
            case 'string':
                mes = new Message(args[0]);
                for (var i = 1; i < args.length; i++) {
                    mes.append(args[i]);
                }
                buf = min.toBuffer(mes);
                this._sock.send(buf, 0, buf.length, this.port, this.host, callback);
                break;
            default:
                throw new Error('That Message Just Doesn\'t Seem Right');
        }
    }
};

module.exports = Client;
