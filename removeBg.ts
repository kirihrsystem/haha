import fs from 'fs';

function removeComponent(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/import LiveBackground from ['"]\..*LiveBackground['"];?\n?/g, '');
  content = content.replace(/<LiveBackground \/>/g, '');
  
  // also clean up any duplicate AnimatedBackground imports
  content = content.replace(/import AnimatedBackground from ['"]\..*AnimatedBackground['"];?\n?/g, '');
  content = content.replace(/<AnimatedBackground \/>/g, '');
  
  fs.writeFileSync(filePath, content);
}

const files = [
  'src/pages/Landing.tsx',
  'src/pages/Login.tsx',
  'src/pages/Signup.tsx',
  'src/pages/About.tsx',
  'src/components/Layout.tsx'
];

files.forEach(removeComponent);
console.log('Removed inner backgrounds');
