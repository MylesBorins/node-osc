import { test } from 'tap';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Only run tests in ESM mode (skip when run as CJS from dist/)
const isESM = !__dirname.includes('/dist/');

test('types: TypeScript compilation with ESM types', { skip: !isESM }, (t) => {
  const tsconfigPath = join(__dirname, 'fixtures', 'types', 'tsconfig.test.json');
  
  // Create a tsconfig for the test that includes path mappings to find types
  const tsconfig = {
    compilerOptions: {
      noEmit: true,
      skipLibCheck: true,
      esModuleInterop: true,
      module: 'ES2022',
      target: 'ES2022',
      moduleResolution: 'node',
      baseUrl: '.',
      paths: {
        '../../../lib/*.mjs': ['../../../types/*.d.mts']
      }
    },
    include: ['test-esm-types.ts']
  };
  
  writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  
  try {
    // Run TypeScript compiler with Top-Level Await support
    const cmd = 'npx tsc --project "' + tsconfigPath + '"';
    execSync(cmd, { 
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: join(__dirname, 'fixtures', 'types')
    });
    t.pass('ESM TypeScript types compile successfully with Top-Level Await');
  } catch (error) {
    t.fail('ESM TypeScript compilation failed: ' + error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.log('STDERR:', error.stderr);
  }

  t.end();
});

test('types: TypeScript compilation with CJS types', { skip: !isESM }, (t) => {
  const tsconfigPath = join(__dirname, 'fixtures', 'types', 'tsconfig.test.json');
  
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
        '../../../lib/*.mjs': ['../../../types/*.d.mts']
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
      cwd: join(__dirname, 'fixtures', 'types')
    });
    t.pass('CJS TypeScript types compile successfully');
  } catch (error) {
    t.fail('CJS TypeScript compilation failed: ' + error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.log('STDERR:', error.stderr);
  }

  t.end();
});
