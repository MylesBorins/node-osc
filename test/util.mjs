import { createSocket } from 'node:dgram';

// A custom getPort function that returns a promise that resolves with a random port within a range that is available
function getPort(min = 3000, max = 3500) {
  return new Promise((resolve, reject) => {
    // Create a socket
    const socket = createSocket('udp4');
    // Generate a random port within the range
    const port = Math.floor(Math.random() * (max - min + 1)) + min;
    // Check if the port range is valid
    if (min >= max) {
      reject(new Error('Invalid port range'));
      return;
    }
    // Set a timeout to reject the promise if no port is found
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error('No port available'));
    }, 3000);
    // Try to bind the socket to the port
    socket.bind(port, (err) => {
      if (err) {
        // If there is an error, try again with a different port
        socket.close();
        resolve(getPort(min, max));
      } else {
        // If successful, clear the timeout, close the socket and resolve the promise with the port
        clearTimeout(timeout);
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
  bootstrap,
  getPort // Export the getPort function
};
