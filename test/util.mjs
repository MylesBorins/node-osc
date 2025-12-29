import { createServer } from 'node:net';
import { setImmediate } from 'node:timers/promises';

async function bootstrap(t) {
  const port = await getPort();
  t.context = {
    port
  };
}

async function getPort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(() => {
      const { port } = server.address();
      server.close(async () => {
        // Allow the event loop to process and ensure port is fully released
        // This prevents EACCES errors when immediately rebinding to the same port
        await setImmediate();
        resolve(port);
      });
    });
  });
}

export {
  bootstrap,
  getPort
};
