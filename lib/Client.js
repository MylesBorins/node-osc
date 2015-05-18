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
        switch (typeof message) {
            case 'object':
                buf = min.toBuffer(message);
                this._sock.send(buf, 0, buf.length, this.port, this.host);
                break;
            case 'string':
                mes = new Message(arguments[0]);
                for (var i = 1; i < arguments.length; i++) {
                    mes.append(arguments[i]);
                }
                buf = min.toBuffer(mes);
                this._sock.send(buf, 0, buf.length, this.port, this.host);
                break;
            default:
                throw new Error('That Message Just Doesn\'t Seem Right');
        }
    }
};

module.exports = Client;
