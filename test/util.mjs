import { once } from 'node:events';
import { platform } from 'node:os';
import { Server } from '../lib/index.mjs';

async function bootstrap(t) {
  const server = new Server(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.port;
  await server.close();
  
  // On Windows, add a small delay to ensure port is released
  if (platform() === 'win32') {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  t.context = {
    port
  };
}

export {
  bootstrap
};
