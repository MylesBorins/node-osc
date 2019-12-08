export default {
  input: 'lib/index.mjs',
  output: {
    file: 'dist/bundle.js',
    format: 'cjs'
  },
  external: [
    'dgram',
    'events',
    'osc-min',
    'jspack'
  ]
};
