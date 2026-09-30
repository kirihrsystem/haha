import fs from 'fs';
import path from 'path';

function walk(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // High border-radius for squircles (iOS 26 feel)
  content = content.replace(/rounded-\[32px\]/g, 'rounded-[2.5rem]');
  content = content.replace(/rounded-\[24px\]/g, 'rounded-[2rem]');
  content = content.replace(/rounded-\[20px\]/g, 'rounded-[1.75rem]');
  content = content.replace(/rounded-2xl/g, 'rounded-[1.75rem]');
  content = content.replace(/rounded-xl/g, 'rounded-[1.5rem]');
  content = content.replace(/rounded-lg/g, 'rounded-[1.25rem]');
  
  // Make things hyper glassmorphic
  content = content.replace(/backdrop-blur-sm/g, 'backdrop-blur-xl');
  content = content.replace(/backdrop-blur-md/g, 'backdrop-blur-2xl');
  content = content.replace(/bg-white\/50/g, 'bg-white/40');
  content = content.replace(/bg-white\/80/g, 'bg-white/60');
  content = content.replace(/bg-white\/90/g, 'bg-white/70');
  
  // Shadow depth
  content = content.replace(/shadow-sm/g, 'shadow-lg shadow-black/5');
  content = content.replace(/shadow-md/g, 'shadow-xl shadow-black/5');
  
  fs.writeFileSync(file, content);
});

console.log('Applied iOS 26 styles');
