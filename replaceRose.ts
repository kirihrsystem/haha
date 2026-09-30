import fs from 'fs';
import path from 'path';

function replaceInFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/rose-700/g, 'red-700');
  content = content.replace(/rose-100/g, 'red-100');
  content = content.replace(/rose-50/g, 'red-50');
  fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir: string) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (fullPath.includes('node_modules')) return;
      walkDir(fullPath);
    } else {
      if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
        replaceInFile(fullPath);
      }
    }
  });
}

walkDir('./src');
console.log('Colors replaced format');
