/* eslint-disable no-console */
'use strict';

const { deprecate, inherits } = require('util');
const dgram = require('dgram');
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
    this.close = (cb) => {
        this._sock.close(cb);
    }; 
    this.kill = deprecate(
      this.close,
      'Client.kill() and Server.kill() are deprecated and will be removed in the next major version.\n'
      + 'Use Server.close() and Client.close().',
      'DEP0001'
    );
};

inherits(Server, events.EventEmitter);

module.exports = Server;
