import { beforeEach, test } from 'tap';

import { Client, Server, Bundle } from 'node-osc';

import { bootstrap } from './util.mjs';
beforeEach(bootstrap);

test('bundle: verbose bundle', (t) => {
  const server = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(2);

  t.teardown(() => {
    server.close();
    client.close();
  });

  server.on('bundle', (bundle) => {
    t.same(bundle.elements[0], ['/one', 1]);
    t.same(bundle.elements[1], ['/two', 2]);
  });

  client.send(new Bundle(1, {
    address: '/one',
    args: [
      1
    ]
  }, {
    address: '/two',
    args: [
      2
    ]
  }));
});

test('bundle: array syntax', (t) => {
  const server = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(2);

  t.teardown(() => {
    server.close();
    client.close();
  });

  server.on('bundle', (bundle) => {
    t.same(bundle.elements[0], ['/one', 1]);
    t.same(bundle.elements[1], ['/two', 2]);
  });

  client.send(new Bundle(
    ['/one', 1],
    ['/two', 2]
  ));
});

test('bundle: nested bundle', (t) => {
  const server = new Server(t.context.port, '127.0.0.1');
  const client = new Client('127.0.0.1', t.context.port);

  t.plan(4);

  t.teardown(() => {
    server.close();
    client.close();
  });

  const payload = new Bundle(
    ['/one', 1],
    ['/two', 2],
    ['/three', 3]
  );
  
  payload.append(new Bundle(10,
    ['/four', 4]
  ));

  server.on('bundle', (bundle) => {
    t.same(bundle.elements[0], ['/one', 1]);
    t.same(bundle.elements[1], ['/two', 2]);
    t.same(bundle.elements[2], ['/three', 3]);
    t.same(bundle.elements[3].elements[0], ['/four', 4]);
  });

  client.send(payload);
});


test('bundle: with non-numeric timetag (immediate execution)', (t) => {
  // This tests lib/osc.js lines 76-79 via public API
  const bundle = new Bundle('immediate', ['/test', 123]);
  
  // Bundle should use immediate timetag
  t.equal(bundle.timetag, 'immediate', 'should store immediate timetag');
  t.end();
});

test('bundle: with null timetag (immediate execution)', (t) => {
  // This also tests lib/osc.js lines 76-79 via public API
  const bundle = new Bundle(null, ['/test', 456]);
  
  t.equal(bundle.timetag, null, 'should store null timetag');
  t.end();
});

test('bundle: encoding with non-numeric timetag via raw object', async (t) => {
  // This tests lib/osc.js lines 76-79 via Client sending
  const { Client } = await import('./lib/index.mjs');
  const { encode } = await import('./lib/osc.mjs');
  
  // Create a raw bundle object with non-numeric timetag
  const rawBundle = {
    oscType: 'bundle',
    timetag: 'immediate',
    elements: [
      {
        oscType: 'message',
        address: '/test',
        args: [{ type: 'i', value: 123 }]
      }
    ]
  };
  
  // Encode it (this will hit the non-numeric timetag path)
  const buffer = encode(rawBundle);
  t.ok(Buffer.isBuffer(buffer), 'should encode to buffer');
  t.end();
});

test('bundle: decoding immediate execution timetag', async (t) => {
  // This tests lib/osc.js lines 89-90 (readTimeTag with immediate execution)
  const { encode, decode } = await import('./lib/osc.mjs');
  
  // Create and encode a bundle with non-numeric timetag (becomes 0,1)

test('bundle: encoding with non-numeric timetag via raw object', async (t) => {
  // This tests lib/osc.js lines 76-79 via Client sending
  const { Client } = await import('./lib/index.mjs');
  const { encode } = await import('./lib/osc.mjs');
  
  // Create a raw bundle object with non-numeric timetag
  const rawBundle = {
    oscType: 'bundle',
    timetag: 'immediate',
    elements: [
      {
        oscType: 'message',
        address: '/test',
        args: [{ type: 'i', value: 123 }]
      }
    ]
  };
  
  // Encode it (this will hit the non-numeric timetag path)
  const buffer = encode(rawBundle);
  t.ok(Buffer.isBuffer(buffer), 'should encode to buffer');
  t.end();
});

test('bundle: decoding immediate execution timetag', async (t) => {
  // This tests lib/osc.js lines 89-90 (readTimeTag with immediate execution)
  const { encode, decode } = await import('./lib/osc.mjs');
  
  // Create and encode a bundle with non-numeric timetag (becomes 0,1)
  const rawBundle = {
    oscType: 'bundle',
    timetag: null,
    elements: [
      {
        oscType: 'message',
        address: '/immediate',
        args: []
      }
    ]
  };
  
  const buffer = encode(rawBundle);
  const decoded = decode(buffer);
  
  t.equal(decoded.timetag, 0, 'should decode immediate execution timetag as 0');
  t.end();
});
