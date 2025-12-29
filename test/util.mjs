import { once } from 'node:events';
import { Server } from '../lib/index.mjs';

async function bootstrap(t) {
  const port = await getPort();
  t.context = {
    port
  };
}

/**
 * Get an available port by creating a temporary OSC Server.
 * This avoids TCP -> UDP binding race conditions by using UDP throughout.
 * 
 * @returns {Promise<number>} An available port number
 */
async function getPort() {
  // Create a temporary server on port 0 (let OS assign a free port)
  const server = new Server(0, '127.0.0.1');
  
  // Wait for the server to be listening
  await once(server, 'listening');
  
  // Get the assigned port
  const port = server._sock.address().port;
  
  // Close the server and wait for it to complete
  await server.close();
  
  return port;
}

export {
  bootstrap,
  getPort
};
