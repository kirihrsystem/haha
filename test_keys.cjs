const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.tsx');

let duplicateCount = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  
  // Find cases where key uses just an ID but inside a map where it could be duplicated across renders
  const mapRegex = /\.map\(\(([^)]+)\)\s*=>[^{]*key=\{([^}]+)\}/g;
  
  let match;
  while ((match = mapRegex.exec(content)) !== null) {
      const varName = match[1].split(',')[0].trim(); // Get 'log' from '(log, index)' or '(log)'
      const keyStr = match[2];
      
      // If key is just varName.id (e.g. log.id), flag it as a potential issue unless it's in specific safe files
      if (keyStr === `${varName}.id`) {
          console.log(`Potential key issue in ${file}: .map((${match[1]}) => ... key={${keyStr}}`);
          duplicateCount++;
      }
  }
}
if (duplicateCount === 0) {
    console.log("No obvious id-only map keys found.");
} else {
    console.log(`Found ${duplicateCount} potential issues.`);
}
