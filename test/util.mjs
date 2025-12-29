import { createServer } from 'node:net';
import { setImmediate } from 'node:timers/promises';

async function bootstrap(t) {
  const port = await getPort();
  t.context = {
    port
  };
}

async function getPort() {
  const server = createServer();
  server.unref();
  
  const port = await new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(() => {
      const { port } = server.address();
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve(port);
        }
      });
    });
  });
  
  // Allow the event loop to process and ensure port is fully released
  // This prevents EACCES errors when immediately rebinding to the same port
  await setImmediate();
  
  return port;
}

export {
  bootstrap,
  getPort
};
