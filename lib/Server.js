/* eslint-disable no-console */
'use strict';

const dgram = require('dgram');
const util = require('util');
const events = require('events');

const decode = require('./decode');

const Server = function(port, host) {
    let server;
    let decoded;
    events.EventEmitter.call(this);
    this.port = port;
    this.host = host;
    this._sock = dgram.createSocket({
      type: 'udp4',
      reuseAddr: true
    });
    this._sock.bind(port);
    server = this;
    this._sock.on('message', (msg, rinfo) => {
        try {
            decoded = decode(msg);
            // [<address>, <typetags>, <values>*]
        }
        catch (e) {
          const error = new Error(`can't decode incoming message: ${e.message}`);
          server.emit('error', error, rinfo);
        }

        if (decoded) {
            server.emit('message', decoded, rinfo);
            server.emit(decoded[0], decoded, rinfo);
        }
    });
    this.kill = () => {
        this._sock.close();
    };
};

util.inherits(Server, events.EventEmitter);

module.exports = Server;
