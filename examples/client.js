/* eslint-disable no-console */

'use strict';
const { Client, Message } = require('node-osc');

const client = new Client('127.0.0.1', 3333);

const message = new Message('/address');
message.append('testing');
message.append('testing');
message.append(123);

client.send(message, (err) => {
  if (err) {
    console.error(new Error(err));
  }
  client.close();
});

// or
// client.send('/address', 'testing', 'testing', 123);

// or
// const msg = new Message('/address', 1, 2, 3);
// client.send(msg);
