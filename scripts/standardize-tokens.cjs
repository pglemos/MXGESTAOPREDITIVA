const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /text-\[10px\]/g, replacement: 'text-mx-tiny' },
  { regex: /text-\[9px\]/g, replacement: 'text-mx-micro' },
  { regex: /tracking-\[0\.2em\]/g, replacement: 'tracking-mx-wide' },
  { regex: /tracking-\[0\.3em\]/g, replacement: 'tracking-mx-wider' },
  { regex: /tracking-\[0\.4em\]/g, replacement: 'tracking-mx-widest' },
  { regex: /max-w-\[420px\]/g, replacement: 'max-w-mx-aside' },
  { regex: /w-\[420px\]/g, replacement: 'w-mx-aside' },
  { regex: /lg:w-\[420px\]/g, replacement: 'lg:w-mx-aside' }
];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    replacements.forEach(r => {
      content = content.replace(r.regex, r.replacement);
    });
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  }
});
