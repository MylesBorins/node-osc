import { readdirSync as readdir, statSync as stat } from 'fs';
import { join } from 'path';

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
        dir: join('dist/', root)
      });
    }
  }
  return result;
}

function walkLib(config) {
  // Build all lib files in a single pass
  const files = walk('./lib/');
  config.push({
    input: files.map(f => f.input),
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
      'node:buffer',
      'jspack',
      '#decode'
    ]
  });
}

function walkTest(config) {
  // Build all test files in a single pass, excluding fixtures
  const tests = walk('./test/').filter(t => !t.input.includes('/fixtures/'));
  config.push({
    input: tests.map(t => t.input),
    plugins: [],
    output: {
      entryFileNames: '[name].js',
      dir: 'dist/test',
      format: 'cjs',
      exports: 'auto',
      preserveModules: true,
      preserveModulesRoot: 'test'
    },
    external: [
      'node:dgram',
      'node:net',
      'node:buffer',
      'node:events',
      'node:child_process',
      'node:fs',
      'node:path',
      'node:url',
      'node-osc',
      'tap',
      '#decode'
    ]
  });
}

const config = [];

walkLib(config);
walkTest(config);

export default config;
