import { readdirSync } from 'fs';

const config = [{
  input: 'lib/index.mjs',
  output: {
    entryFileNames: '[name].js',
    dir: 'dist/lib',
    format: 'cjs',
  },
  preserveModules: true,
  external: [
    'dgram',
    'events',
    'osc-min',
    'jspack'
  ]
}];

const tests = readdirSync(new URL('./test', import.meta.url));

tests.forEach(test => {
  config.push({
    input: `test/${test}`,
    output: {
      entryFileNames: '[name].js',
      dir: 'dist/test',
      format: 'cjs',
    },
    preserveModules: true,
    external: [
      'get-port',
      'node-osc',
      'node-osc/decode',
      'node-osc/types',
      'tap'
    ]
  })
});

export default config;
