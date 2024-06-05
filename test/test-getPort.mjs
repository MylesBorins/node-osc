import { test } from 'tap';
import { getPort } from './util.mjs';
import { createServer } from 'node:net';

test('getPort function returns an available port', async (t) => {
  const port = await getPort();
  t.plan(2);
  t.type(port, 'number', 'getPort should return a number');

  const server = createServer();
  server.listen(port, () => {
    t.pass('Port is usable');
  });
  server.on('close', () => {
    t.pass('Server closed');
  });
  server.close();
});
