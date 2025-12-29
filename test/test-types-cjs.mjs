import { test } from 'tap';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Only run in CJS mode (when transpiled to CJS in dist/)
const isCJS = __dirname.includes('/dist/');

test('types: TypeScript compilation with CJS types', { skip: !isCJS }, (t) => {
  // Always write to the source test directory, not dist
  const testRoot = resolve(__dirname, isCJS ? '../../test' : '.');
  const tsconfigPath = join(testRoot, 'fixtures', 'types', 'tsconfig.test.json');
  
  // Create a tsconfig for the test
  const tsconfig = {
    compilerOptions: {
      noEmit: true,
      skipLibCheck: true,
      module: 'commonjs',
      esModuleInterop: true,
      target: 'ES2022',
      moduleResolution: 'node',
      baseUrl: '.',
      paths: {
        '../../../dist/lib/*.js': ['../../../types/*.d.mts']
      }
    },
    include: ['test-cjs-types.ts']
  };
  
  writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  
  try {
    // Run TypeScript compiler in noEmit mode to check types only
    const cmd = 'npx tsc --project "' + tsconfigPath + '"';
    execSync(cmd, { 
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: join(testRoot, 'fixtures', 'types')
    });
    t.pass('CJS TypeScript types compile successfully');
  } catch (error) {
    t.fail('CJS TypeScript compilation failed: ' + error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.log('STDERR:', error.stderr);
  }

  t.end();
});
