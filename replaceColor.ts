import fs from 'fs';
import path from 'path';

function replaceInFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/pink-500/g, 'blue-600');
  content = content.replace(/pink-600/g, 'blue-700');
  content = content.replace(/pink-400/g, 'blue-500');
  content = content.replace(/pink-100/g, 'blue-100');
  content = content.replace(/pink-50/g, 'blue-50');
  content = content.replace(/pink-700/g, 'blue-800');
  content = content.replace(/rose-600/g, 'sky-600');
  content = content.replace(/rose-500/g, 'sky-500');
  content = content.replace(/rose-400/g, 'sky-400');
  content = content.replace(/amber-500/g, 'blue-600');
  content = content.replace(/amber-400/g, 'blue-500');
  content = content.replace(/amber-600/g, 'blue-700');
  content = content.replace(/orange-600/g, 'sky-600');
  content = content.replace(/orange-500/g, 'sky-500');
  content = content.replace(/orange-400/g, 'sky-400');
  content = content.replace(/bg-\[\#151B2B\]/g, 'bg-slate-900');
  content = content.replace(/bg-\[\#0B0F19\]/g, 'bg-slate-950');
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
