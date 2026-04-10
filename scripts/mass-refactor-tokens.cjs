const fs = require('fs');
const path = require('path');

const replacements = [
  // Major Layout Scales
  { regex: /(?<=[\s'"`])(p|m|gap|w|h|top|right|bottom|left|space)-(x-|y-|t-|b-|l-|r-)?10(?=[\s'"`])/g, replacement: '$1-$2mx-10' },
  { regex: /(?<=[\s'"`])(p|m|gap|w|h|top|right|bottom|left|space)-(x-|y-|t-|b-|l-|r-)?14(?=[\s'"`])/g, replacement: '$1-$2mx-14' },
  { regex: /(?<=[\s'"`])(p|m|gap|w|h|top|right|bottom|left|space)-(x-|y-|t-|b-|l-|r-)?20(?=[\s'"`])/g, replacement: '$1-$2mx-20' },
  { regex: /(?<=[\s'"`])(p|m|gap|w|h|top|right|bottom|left|space)-(x-|y-|t-|b-|l-|r-)?48(?=[\s'"`])/g, replacement: '$1-$2mx-48' },
  { regex: /(?<=[\s'"`])(p|m|gap|w|h|top|right|bottom|left|space)-(x-|y-|t-|b-|l-|r-)?64(?=[\s'"`])/g, replacement: '$1-$2mx-64' },
  { regex: /(?<=[\s'"`])(p|m|gap|w|h|top|right|bottom|left|space)-(x-|y-|t-|b-|l-|r-)?96(?=[\s'"`])/g, replacement: '$1-$2mx-96' },

  // Remaining Arbitrary Cleanup
  { regex: /rounded-\[3rem\]/g, replacement: 'rounded-mx-3xl' },
  { regex: /rounded-\[2\.5rem\]/g, replacement: 'rounded-mx-2xl' },
  { regex: /rounded-\[2rem\]/g, replacement: 'rounded-mx-xl' },
  { regex: /text-\[7px\]/g, replacement: 'text-mx-micro' },
  { regex: /text-\[6px\]/g, replacement: 'text-mx-micro' },
  
  // Hard-coded Indigo/Red cleanup
  { regex: /text-indigo-400/g, replacement: 'text-brand-primary/80' },
  { regex: /bg-indigo-400/g, replacement: 'bg-brand-primary/80' },
  { regex: /text-red-500/g, replacement: 'text-status-error' },
  { regex: /bg-red-50/g, replacement: 'bg-status-error-surface' }
];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (f === 'node_modules' || f === '.git' || f === 'dist') return;
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    replacements.forEach(r => {
      content = content.replace(r.regex, r.replacement);
    });
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Final Refactor: ${filePath}`);
    }
  }
});
