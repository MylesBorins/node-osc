import { createServer } from 'node:net';
import { setImmediate } from 'node:timers/promises';
import { platform } from 'node:os';

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
      resolve(server.address().port);
    });
  });
  
  await new Promise((resolve) => {
    server.close(() => resolve());
  });
  
  // Allow the event loop to process and ensure port is fully released
  // This prevents EACCES errors when immediately rebinding to the same port
  await setImmediate();
  
  // On Windows, add an additional delay to ensure the port is fully released
  // Windows can take longer to release ports from TIME_WAIT state
  if (platform() === 'win32') {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return port;
}

export {
  bootstrap,
  getPort
};
