import { test } from 'tap';
import { getPort } from './util.mjs';

import { createSocket } from 'node:dgram';
import { once } from 'node:events';

test('getPort: valid range', async (t) => {
  const port = await getPort(3000, 3500);
  t.ok(port >= 3000 && port <= 3500, 'port should be in range');
  const socket = createSocket('udp4');
  socket.bind(port, (err) => {
    t.error(err, 'port should be available');
  });
  await once(socket, 'listening');
  socket.close();
  await once(socket, 'close');
  t.end();
});

test('getPort: invalid range', async (t) => {
  t.rejects(() => getPort(3500, 3000), 'should throw an error for invalid range');
  t.end();
});

test('getPort: timeout', async (t) => {
  const sockets = [];
  for (let i = 3001; i <= 3002; i++) {
    const socket = createSocket('udp4');
    socket.bind(i);
    sockets.push(socket);
  }  
  await t.rejects(getPort(3001, 3002), {
    message: 'No port available'
  });
  sockets.forEach((socket) => socket.close());
  t.end();
});


