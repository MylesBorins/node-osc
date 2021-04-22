import {createSocket} from 'dgram';

import osc from 'osc-min';
import { beforeEach, test } from 'tap';

import { Server } from 'node-osc';

import { bootstrap } from './util.mjs';

beforeEach(bootstrap);

test('bundle: simple bundle', (t) => {
  t.plan(1);

  t.teardown(() => {
    oscServer.close();
    socket.close();
  });
  const payload = {
    timetag: 1,
    elements: [
      {
        address: '/heartbeat',
        args: [
          123
        ]
      }
    ]
  };

  const oscServer = new Server(t.context.port, '127.0.0.1');
  
  const socket = createSocket({
    type: 'udp4',
    reuseAddr: true
  });

  oscServer.on('bundle', (bundle) => {
    t.same(bundle.elements[0], ['/heartbeat', 123]);
  });
  
  const buf = osc.toBuffer(payload);

  socket.send(buf, 0, buf.length, t.context.port, '127.0.0.1');
});

test('bundle: nested bundle', (t) => {
  t.plan(1);

  t.teardown(() => {
    oscServer.close();
    socket.close();
  });
  
  const payload = {
    timetag: 1,
    elements: [{
      timetag: 1,
      elements: [
        {
          address: '/heartbeat',
          args: [
            123
          ]
        }
      ]
    }]
  };

  const oscServer = new Server(t.context.port, '127.0.0.1');
  
  const socket = createSocket({
    type: 'udp4',
    reuseAddr: true
  });

  oscServer.on('bundle', (bundle) => {
    t.same(bundle.elements[0].elements[0], ['/heartbeat', 123]);
  });
  
  const buf = osc.toBuffer(payload);

  socket.send(buf, 0, buf.length, t.context.port, '127.0.0.1');
});

