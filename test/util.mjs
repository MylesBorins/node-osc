import { createServer } from 'node:net';

// Delay in milliseconds for Windows to fully release a port after closing
// This prevents EACCES errors when immediately rebinding to the same port
const WINDOWS_PORT_RELEASE_DELAY_MS = 100;

async function bootstrap(t) {
  const port = await getPort();
  t.context = {
    port
  };
}

function getPort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(() => {
      const { port } = server.address();
      server.close(() => {
        // Add a small delay on Windows to allow the OS to fully release the port
        // This prevents EACCES errors when immediately rebinding to the same port
        if (process.platform === 'win32') {
          setTimeout(() => resolve(port), WINDOWS_PORT_RELEASE_DELAY_MS);
        } else {
          resolve(port);
        }
      });
    });
  });
}

export {
  bootstrap,
  getPort
};
