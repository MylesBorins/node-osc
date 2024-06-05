import { createServer } from 'node:net';

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
        resolve(port);
      });
    });
  });
}

export {
  bootstrap,
  getPort
};
