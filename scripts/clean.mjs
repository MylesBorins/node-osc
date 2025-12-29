#!/usr/bin/env node
import { rmSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = join(__dirname, '..', 'dist');

try {
  rmSync(distPath, { recursive: true, force: true });
  console.log('Cleaned dist directory');
} catch (err) {
  // Ignore errors if directory doesn't exist
  if (err.code !== 'ENOENT') {
    console.error('Error cleaning dist:', err);
    process.exit(1);
  }
}
