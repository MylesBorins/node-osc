import getPort from 'get-port';

async function bootstrap(t) {
  t.context.port = await getPort({
    port: getPort.makeRange(3000, 3500)
  });
}

export {
  bootstrap
};
