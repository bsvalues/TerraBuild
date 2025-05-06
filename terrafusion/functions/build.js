const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Functions to be packaged
const functions = [
  {
    name: 'rollback-function',
    source: 'rollback-function.js'
  },
  {
    name: 'canary-function',
    source: 'canary-function.js'
  }
];

// Create directory for zip files if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  fs.mkdirSync(path.join(__dirname, 'dist'));
}

// Package each function
functions.forEach(func => {
  const output = fs.createWriteStream(path.join(__dirname, `dist/${func.name}.zip`));
  const archive = archiver('zip', {
    zlib: { level: 9 } // Highest compression level
  });
  
  output.on('close', () => {
    console.log(`${func.name}.zip created: ${archive.pointer()} total bytes`);
  });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  archive.pipe(output);
  
  // Add the function file, renamed to index.js
  archive.file(path.join(__dirname, func.source), { name: 'index.js' });
  
  // Add node_modules
  archive.directory(path.join(__dirname, 'node_modules'), 'node_modules');
  
  archive.finalize();
});

console.log('Building Lambda function packages...');