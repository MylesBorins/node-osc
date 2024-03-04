async function bootstrap(t) {
  const {default: getPorts, portNumbers} = await import('get-port');
  const port = await getPorts({
    port: portNumbers(3000, 3500)
  });
  t.context = {
    port
  };
}

export {
  bootstrap
};
