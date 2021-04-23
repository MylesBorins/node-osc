import { readdirSync as readdir, statSync as stat } from 'fs';

function walk(root, result=[]) {
  const rootURL = new URL(root, import.meta.url);
  const paths = readdir(rootURL);
  for (const path of paths) {
    const stats = stat(new URL(path, rootURL));
    if (stats.isDirectory()) {
      walk(`${root}${path}/`, result);
    }
    else {
      result.push({
        input: `${root}${path}`,
        dir: `dist/${root}`
      });
    }
  }
  return result;
}

function walkLib(config) {
  const files = walk('./lib/');
  files.forEach(({input, dir}) => {
    config.push({
      input,
      output: {
        entryFileNames: '[name].js',
        dir,
        format: 'cjs',
        exports: 'auto'
      },
      preserveModules: true,
      external: [
        'dgram',
        'events',
        'osc-min',
        '#internal/decode',
        '#internal/types',
        '#internal/warnings',
        'jspack'
      ]
    });
  });
}

function walkTest(config) {
  const tests = walk('./test/');
  tests.forEach(({input, dir}) => {
    config.push({
      input,
      output: {
        entryFileNames: '[name].js',
        dir,
        format: 'cjs',
      },
      preserveModules: true,
      external: [
        'dgram',
        'get-port',
        'node-osc',
        'osc-min',
        '#internal/decode',
        '#internal/types',
        'tap'
      ]
    })
  });
}

const config = [];

walkLib(config);
walkTest(config);

export default config;
