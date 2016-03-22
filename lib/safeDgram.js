'use strict';

var dgram = require('dgram');

var semver = require('semver');

function safeDgram() {
  if (semver.gt(process.version, '0.12.0')) {
    return dgram.createSocket({
      type: 'udp4',
      reuseAddr: true
    });
  }
  return dgram.createSocket('udp4');
}

module.exports = safeDgram;
