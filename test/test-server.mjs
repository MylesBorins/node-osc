import { once } from 'node:events';
import { test } from 'tap';

import { Server, Client } from 'node-osc';

test('server: create and close', async (t) => {
  t.plan(1);
  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  oscServer.close((err) => {
    t.error(err);
  });
});

test('server: listen to message', async (t) => {
  const oscServer = new Server(0);
  await once(oscServer, 'listening');
  const client = new Client('127.0.0.1', oscServer.port);

  t.plan(3);

  t.teardown(() => {
    oscServer.close();
    client.close();
  });

  oscServer.on('message', (msg) => {
    t.same(msg, ['/test'], 'We should receive expected payload');
  });
  
  oscServer.on('/test', (msg) => {
    t.same(msg, ['/test'], 'We should receive expected payload');
  });

  client.send('/test', (err) => {
    t.error(err, 'there should be no error');
  });
});

test('server: no defined host', async (t) => {
  const oscServer = new Server(0);
  await once(oscServer, 'listening');
  const client = new Client('127.0.0.1', oscServer.port);

  t.plan(3);

  t.teardown(() => {
    oscServer.close();
    client.close();
  });

  oscServer.on('message', (msg) => {
    t.same(msg, ['/test'], 'We should receive expected payload');
  });
  
  oscServer.on('/test', (msg) => {
    t.same(msg, ['/test'], 'We should receive expected payload');
  });

  client.send('/test', (err) => {
    t.error(err, 'there should be no error');
  });
});

test('server: callback as second arg', async (t) => {
  t.plan(4);
  const oscServer = new Server(0, () => {
    t.ok('callback called');
  });
  await once(oscServer, 'listening');
  const client = new Client('127.0.0.1', oscServer.port);

  t.teardown(() => {
    oscServer.close();
    client.close();
  });

  oscServer.on('message', (msg) => {
    t.same(msg, ['/test'], 'We should receive expected payload');
  });
  
  oscServer.on('/test', (msg) => {
    t.same(msg, ['/test'], 'We should receive expected payload');
  });

  client.send('/test', (err) => {
    t.error(err, 'there should be no error');
  });
});

test('server: send to remote port', async (t) => {
  const sender = new Server(0, '127.0.0.1');
  const receiver = new Server(0, '127.0.0.1');
  await Promise.all([once(sender, 'listening'), once(receiver, 'listening')]);

  t.plan(1);

  t.teardown(async () => {
    await Promise.all([sender.close(), receiver.close()]);
  });

  const receivedMessage = once(receiver, 'message');
  await sender.send(['/test', 1], receiver.port, '127.0.0.1');
  const [msg] = await receivedMessage;

  t.same(msg, ['/test', 1], 'server should send a message from its bound socket');
});

test('server: can receive and reply from within message handler', async (t) => {
  const requester = new Server(0, '127.0.0.1');
  const responder = new Server(0, '127.0.0.1');
  await Promise.all([once(requester, 'listening'), once(responder, 'listening')]);

  t.plan(3);

  t.teardown(async () => {
    await Promise.all([requester.close(), responder.close()]);
  });

  responder.on('message', (msg, rinfo) => {
    t.same(msg, ['/ping', 1], 'responder should receive the incoming message');
    responder.send(['/ack', 1], rinfo.port, rinfo.address, (err) => {
      t.error(err, 'responder should reply without error');
    });
  });

  const receivedReply = once(requester, 'message');
  await requester.send(['/ping', 1], responder.port, '127.0.0.1');
  const [reply] = await receivedReply;

  t.same(reply, ['/ack', 1], 'requester should receive the reply on the same socket');
});

test('server: send before listening returns a clear error', async (t) => {
  t.plan(3);

  const server = new Server(0, '127.0.0.1');

  t.throws(() => {
    server.send('/test', 3333, '127.0.0.1');
  }, /before server is listening/i, 'send without callback should throw before listening');

  server.send('/test', 3333, '127.0.0.1', (err) => {
    t.ok(err instanceof Error, 'send should fail with an Error before listening');
    t.match(err.message, /before server is listening/i, 'error message should explain the socket is not ready');
  });

  await once(server, 'listening');
  await server.close();
});

test('server: bad message', async (t) => {
  t.plan(2);
  const oscServer = new Server(0, '127.0.0.1');
  await once(oscServer, 'listening');
  t.throws(() => {
    oscServer._sock.emit('message', 'whoops');
  }, /can't decode incoming message:/);
  oscServer.close((err) => {
    t.error(err);
  });
});
