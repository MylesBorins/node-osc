import { readdirSync as readdir, statSync as stat } from 'fs';

// Borrowed from the rollup docs
// https://github.com/rollup/rollup/blob/d0db53459be43c5cc806cb91f14e82217950ba42/docs/05-plugin-development.md#renderdynamicimport
function retainImportExpressionPlugin() {
  return {
    name: 'retain-import-expression',
    resolveDynamicImport(specifier) {
      if (specifier === 'get-port') return false;
      return null;
    },
    renderDynamicImport({ targetModuleId }) {
      if (targetModuleId === 'get-port') {
        return {
          left: 'import(',
          right: ')'
        };
      }
    }
  };
}

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
        preserveModules: true,
        exports: 'auto'
      },
      external: [
        'node:dgram',
        'node:events',
        'osc-min',
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
      plugins: [retainImportExpressionPlugin()],
      output: {
        entryFileNames: '[name].js',
        dir,
        format: 'cjs',
        exports: 'auto',
        preserveModules: true
      },
      external: [
        'node:dgram',
        'get-port',
        'node-osc',
        'osc-min',
        'tap'
      ]
    })
  });
}

const config = [];

walkLib(config);
walkTest(config);

export default config;
