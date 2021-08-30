# node-osc

A no frills [Open Sound Control](http://opensoundcontrol.org) client and server.
Heavily inspired by [pyOSC](https://trac.v2.nl/wiki/pyOSC).

Install using npm

```
npm install node-osc
```

## Written using ESM supports CJS

Supports the latest versions of Node.js 12, 14, and 16 in both ESM + CJS

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

### Sending OSC bundles:

```js
import { Bundle, Client } from 'node-osc';

// a bundle without an explicit time tag
const bundle = new Bundle(['/one', 1], ['/two', 2], ['/three', 3]);

// a bundle with a timetag of 10
bundle.append(new Bundle(10, ['/four', 4]));

const client = new Client('127.0.0.1', 3333);
client.send(bundle));
```

### Listening for OSC bundles:

**WARNING**: Bundle support is Experimental and subject to change at any point. 

```js
import { Server } from 'node-osc';

var oscServer = new Server(3333, '0.0.0.0', () => {
  console.log('OSC Server is listening');
});

oscServer.on('bundle', function (bundle) {
  bundle.elements.forEach((element, i) => {
    console.log(`Timestamp: ${bundle.timetag[i]}`);
    console.log(`Message: ${element}`);
  });
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
  console.log('OSC Server is listening.');
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

## Typescript 

To install type definitions for node-osc:  
   
`npm install --save @types/node-osc`  or  `yarn add @types/node-osc`  

The types should then be automatically included by the compiler.  


## License

LGPL.  Please see the file lesser.txt for details.
