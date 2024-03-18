import { createSocket } from 'node:dgram';

// A custom getPort function that returns a promise that resolves with a random port within a range that is available
function getPort(min = 3000, max = 3500) {
  return new Promise((resolve) => {
    // Create a socket
    const socket = createSocket('udp4');
    // Generate a random port within the range
    const port = Math.floor(Math.random() * (max - min + 1)) + min;
    // Try to bind the socket to the port
    socket.bind(port, (err) => {
      if (err) {
        // If there is an error, try again with a different port
        socket.close();
        resolve(getPort(min, max));
      } else {
        // If successful, close the socket and resolve the promise with the port
        socket.close();
        resolve(port);
      }
    });
  });
}

async function bootstrap(t) {
  const port = await getPort(3000, 3500);
  t.context = {
    port
  };
}

export {
  bootstrap
};
