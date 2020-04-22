export default {
  input: 'lib/index.mjs',
  output: {
    file: 'dist/bundle.js',
    format: 'cjs'
  },
  external: [
    'dgram',
    'events',
    'module',
    'osc-min',
    'jspack',
    '../util/index.js'
  ]
};
