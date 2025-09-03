import { readdirSync as readdir, statSync as stat } from 'fs';
import { join } from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';

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
        input: join(root, path),
        dir: join('dist/', root.replace('./', ''))
      });
    }
  }
  return result;
}

function walkLib(config) {
  const files = walk('./lib/');
  files.forEach(({input}) => {
    config.push({
      input,
      plugins: [nodeResolve()],
      output: {
        entryFileNames: '[name].js',
        dir: 'dist/lib',
        format: 'cjs',
        preserveModules: true,
        preserveModulesRoot: 'lib',
        exports: 'auto'
      },
      external: [
        'node:dgram',
        'node:events',
        'jspack',
        '#decode'
      ]
    });
  });
}

function walkTest(config) {
  const tests = walk('./test/');
  tests.forEach(({input, dir}) => {
    config.push({
      input,
      plugins: [],
      output: {
        entryFileNames: '[name].js',
        dir,
        format: 'cjs',
        exports: 'auto',
        preserveModules: true
      },
      external: [
        'node:dgram',
        'node:net',
        'node-osc',
        'tap',
        '#decode'
      ]
    });
  });
}

const config = [];

walkLib(config);
walkTest(config);

export default config;
