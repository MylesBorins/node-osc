import tap from 'tap';
import getPort from 'get-port';

const { test } = tap;

async function beforeEach(done, t) {
  t.context.port = await getPort({
    port: getPort.makeRange(3000, 3100)
  });
}

export {
  beforeEach,
  tap,
  test
};
