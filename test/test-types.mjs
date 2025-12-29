import { test } from 'tap';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Only run in ESM mode (not when transpiled to CJS in dist/)
// Normalize path separators for cross-platform compatibility
const normalizedPath = __dirname.replace(/\\/g, '/');
const isESM = !normalizedPath.includes('/dist/');

test('types: TypeScript compilation', (t) => {
  let tsconfigPath;
  const testRoot = resolve(__dirname, isESM ?  '.': '../../test');
  if (isESM) {
    tsconfigPath = join(testRoot, 'fixtures', 'types', 'tsconfig-esm.test.json');
  }
  else {
    tsconfigPath = join(testRoot, 'fixtures', 'types', 'tsconfig-cjs.test.json');
  }
  
  try {
    // Run TypeScript compiler with Top-Level Await support
    const cmd = 'npx tsc --project "' + tsconfigPath + '"';
    execSync(cmd, { 
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: join(testRoot, 'fixtures', 'types')
    });
    t.pass('TypeScript types compile successfully with Top-Level Await');
  } catch (error) {
    t.fail('TypeScript compilation failed: ' + error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.log('STDERR:', error.stderr);
  }

  t.end();
});
