import { once } from 'node:events';
import { Server } from '../lib/index.mjs';

async function bootstrap(t) {
  const server = new Server(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.port;
  await server.close();
  
  t.context = {
    port
  };
}

export {
  bootstrap
};
