import { once } from 'node:events';
import { test } from 'tap';

import { Server, Client } from 'node-osc';

function flaky() {
  return process.release.lts === 'Dubnium' && process.platform === 'win32';
}

function skip(t) {
  t.skip(`flaky ~ ${t.name}`);
  t.end();
}

test('osc: argument message no callback', async (t) => {
  if (flaky()) return skip(t);

  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  const client = new Client('127.0.0.1', oscServer.port);

  t.plan(1);

  t.teardown(() => {
    oscServer.close();
    client.close();
  });

  oscServer.on('message', (msg) => {
    t.same(msg, ['/test', 1, 2, 'testing'], 'We should receive expected payload');
  });

  client.send('/test', 1, 2, 'testing');
});

test('osc: client with callback and message as arguments', async (t) => {
  if (flaky()) return skip(t);

  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  const client = new Client('127.0.0.1', oscServer.port);

  t.plan(2);

  t.teardown(() => {
    oscServer.close();
    client.close();
  });

  oscServer.on('message', (msg) => {
    t.same(msg, ['/test', 1, 2, 'testing'], 'We should receive expected payload');
  });

  client.send('/test', 1, 2, 'testing', (err) => {
    t.error(err, 'there should be no error');
  });
});
