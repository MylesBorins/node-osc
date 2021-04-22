import { beforeEach, test } from 'tap';
import { bootstrap } from './util.mjs';

import { Server, Client } from 'node-osc';

beforeEach(bootstrap);

function flaky() {
  return process.release.lts === 'Dubnium' && process.platform === 'win32';
}

function skip(t) {
  t.skip(`flaky ~ ${t.name}`);
  t.end();
}

test('osc: argument message no callback', (t) => {
  if (flaky()) return skip(t);

  const oscServer = new Server(t.context.port, '0.0.0.0');
  const client = new Client('0.0.0.0', t.context.port);

  t.plan(1);

  oscServer.on('message', (msg) => {
    oscServer.close();
    client.close();
    t.same(msg, ['/test', 1, 2, 'testing'], 'We should receive expected payload');
  });

  client.send('/test', 1, 2, 'testing');
});

test('osc: client with callback and message as arguments', (t) => {
  if (flaky()) return skip(t);

  const oscServer = new Server(t.context.port, '0.0.0.0');
  const client = new Client('0.0.0.0', t.context.port);

  t.plan(2);

  oscServer.on('message', (msg) => {
    oscServer.close();
    t.same(msg, ['/test', 1, 2, 'testing'], 'We should receive expected payload');
  });

  client.send('/test', 1, 2, 'testing', (err) => {
    t.error(err, 'there should be no error');
    client.close();
  });
});
