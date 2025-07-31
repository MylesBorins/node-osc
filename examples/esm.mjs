import { Client, Server } from 'node-osc';

const client = new Client('127.0.0.1', 3333);
var server = new Server(3333, '0.0.0.0');

server.on('listening', () => {
  console.log('OSC Server is Listening');
});

server.on('message', (msg, rinfo) => {
  console.log(`Message: ${msg}\nReceived from: ${rinfo.address}:${rinfo.port}`);
  server.close();
});

client.send('/hello', 'world', (err) => {
  if (err) console.error(err);
  client.close();
});