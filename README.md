# node-osc

A no frills [Open Sound Control](http://opensoundcontrol.org/introduction-osc) client. Heavily inspired by [pyOSC](https://trac.v2.nl/wiki/pyOSC).

Install using npm

```
npm install node-osc
```

## Written using ESM supports CJS

If you are using Node.js 10+ you can use this library.

## Example

### Sending OSC messages:

```js
import { Client } from 'node-osc';

const client = new Client('127.0.0.1', 3333);
client.send('/oscAddress', 200, () => {
  client.close();
});
```
  
### Listening for OSC messages:

```js
import { Server } from 'node-osc';

var oscServer = new Server(3333, '0.0.0.0', () => {
  console.log('OSC Server is listening');
});

oscServer.on('message', function (msg) {
  console.log(`Message: ${msg}`);
  oscServer.close();
});
```

### CJS API

This just works due to conditional exports, isn't that cool!

```js
const { Client, Server } = require('node-osc');

const client = new Client('127.0.0.1', 3333);
var server = new Server(3333, '0.0.0.0');

server.on('listening', () => {
  console.log('OSC Server is listening.);
})

server.on('message', (msg) => {
  console.log(`Message: ${msg}`);
  server.close();
});

client.send('/hello', 'world', (err) => {
  if (err) console.error(err);
  client.close();
});
```

## License

LGPL.  Please see the file lesser.txt for details.
