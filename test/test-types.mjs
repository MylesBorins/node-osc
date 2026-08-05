import { test } from 'tap';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { exec } from 'node:child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Only run in ESM mode (not when transpiled to CJS in dist/)
// Normalize path separators for cross-platform compatibility
const normalizedPath = __dirname.replace(/\\/g, '/');
const isESM = !normalizedPath.includes('/dist/');

const execAsync = promisify(exec);

test('types: TypeScript compilation', async (t) => {
  let tsconfigPath;
  const testRoot = resolve(__dirname, isESM ? '.': '../../test');
  if (isESM) {
    tsconfigPath = join(testRoot, 'fixtures', 'types', 'tsconfig-esm.test.json');
  }
  else {
    tsconfigPath = join(testRoot, 'fixtures', 'types', 'tsconfig-cjs.test.json');
  }
  
  // Calculate path to TypeScript based on project root, not test file location
  // For ESM: __dirname is in test/, for CJS: __dirname is in dist/test/
  const projectRoot = isESM
    ? join(__dirname, '..')
    : join(__dirname, '..', '..');
  const tscPath = join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');
  const fixturesDir = join(testRoot, 'fixtures', 'types');
  
  // Run tsc via shell with env -i to ensure no hooks are inherited
  const cmd = `env -i PATH="${process.env.PATH}" HOME="${process.env.HOME}" "${process.execPath}" "${tscPath}" --project "${tsconfigPath}"`;
  
  await execAsync(cmd, { cwd: fixturesDir, timeout: 30000 });
  t.pass('TypeScript types compile successfully');
});
