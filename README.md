# node-osc

A very basic OSC client (so far) implementation based heavily on [pyOSC](https://trac.v2.nl/wiki/pyOSC).

Install using npm

```
npm install node-osc
```

## Example

### Sending OSC messages:

```js
const { Client } = require('node-osc');

const client = new Client('127.0.0.1', 3333);
client.send('/oscAddress', 200, () => {
  client.close();
});
```
  
### Listening for OSC messages:

```js
var { Server } = require('../lib');

var oscServer = new Server(3333, '0.0.0.0');

oscServer.on('message', function (msg) {
  console.log(`Message: ${msg}`);
  oscServer.close();
});
```

### Now with ESM!

```js
import { Client, Server } from 'node-osc/esm.mjs'

const client = new Client('127.0.0.1', 3333);
var server = new Server(3333, '0.0.0.0');

server.on('message', function (msg) {
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
