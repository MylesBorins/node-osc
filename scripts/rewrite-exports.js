const {
  readdirSync,
  readFileSync,
  writeFileSync
} = require('fs');

const { join } = require('path');

const root = join(__dirname, '..', 'dist', 'test');
const tests = readdirSync(root);

console.log('reading files');

const files = tests.map(test => {
  const testPath = `${root}/${test}`;
  return {
    path: testPath,
    src: readFileSync(testPath, 'utf-8')
  };
});

console.log('processing files');

const processedFiles = files.map(file => {
  return {
    path: file.path,
    src: file.src
      .replace('\'node-osc\'', '\'../lib/index.js\'')
      .replace('\'node-osc\/types\'', '\'../lib/types.js\'')
      .replace('\'node-osc\/decode\'', '\'../lib/decode.js\'')
  }
})

console.log('writing files');

processedFiles.forEach(file => {
  writeFileSync(file.path, file.src);
});

console.log('all done!');
