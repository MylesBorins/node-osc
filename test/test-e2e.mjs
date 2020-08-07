import { beforeEach, tap, test } from './util.mjs';

import { Server, Client } from 'node-osc';

tap.beforeEach(beforeEach);

test('osc: argument message no callback', (t) => {
  const oscServer = new Server(t.context.port, '0.0.0.0');
  const client = new Client('0.0.0.0', t.context.port);

  t.plan(1);

  oscServer.on('message', (msg) => {
    oscServer.close();
    client.close();
    t.deepEqual(msg, ['/test', 1, 2, 'testing'], 'We should receive expected payload');
  });

  client.send('/test', 1, 2, 'testing');
});
