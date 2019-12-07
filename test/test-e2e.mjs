import { Server, Client } from 'node-osc';

import { beforeEach, tap, test } from './util.mjs';

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

test('osc: client with callback and message as arguments', (t) => {
  const oscServer = new Server(t.context.port, '0.0.0.0');
  const client = new Client('0.0.0.0', t.context.port);

  t.plan(2);

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.deepEqual(msg, ['/test', 1, 2, 'testing'], 'We should receive expected payload');
  });

  client.send('/test', 1, 2, 'testing', (err) => {
    t.error(err, 'there should be no error');
    client.close();
  });
});


