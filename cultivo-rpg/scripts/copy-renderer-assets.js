const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/renderer');
const destDir = path.join(__dirname, '../dist/renderer');
const files = ['index.html', 'style.css'];

fs.mkdirSync(destDir, { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
}
