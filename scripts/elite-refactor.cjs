const fs = require('fs');
const path = require('path');

const replacements = [
  // Spacing scales
  { regex: /(?<=[\s'"`])(p|m|gap|w|h|top|right|bottom|left|space)-(x-|y-|t-|b-|l-|r-)?5(?=[\s'"`])/g, replacement: '$1-$2mx-5' },
  { regex: /(?<=[\s'"`])(p|m|gap|w|h|top|right|bottom|left|space)-(x-|y-|t-|b-|l-|r-)?7(?=[\s'"`])/g, replacement: '$1-$2mx-7' },
  { regex: /(?<=[\s'"`])(p|m|gap|w|h|top|right|bottom|left|space)-(x-|y-|t-|b-|l-|r-)?9(?=[\s'"`])/g, replacement: '$1-$2mx-9' },
  { regex: /(?<=[\s'"`])(p|m|gap|w|h|top|right|bottom|left|space)-(x-|y-|t-|b-|l-|r-)?11(?=[\s'"`])/g, replacement: '$1-$2mx-11' },
  { regex: /(?<=[\s'"`])(w|h)-28(?=[\s'"`])/g, replacement: '$1-mx-28' },
  { regex: /(?<=[\s'"`])(w|h)-40(?=[\s'"`])/g, replacement: '$1-mx-xl' }, // generic mapping

  // Elite Widths
  { regex: /min-w-\[1000px\]/g, replacement: 'min-w-mx-elite-table' },
  { regex: /min-w-\[1200px\]/g, replacement: 'min-w-mx-elite-wide' },
  { regex: /max-w-\[1600px\]/g, replacement: 'max-w-mx-elite-canvas' },
  { regex: /min-w-\[320px\]/g, replacement: 'min-w-mx-card-sm' },
  { regex: /lg:w-\[480px\]/g, replacement: 'lg:w-mx-card-lg' },
  { regex: /w-\[400px\]/g, replacement: 'w-mx-card-md' },

  // Elite Heights
  { regex: /min-h-\[500px\]/g, replacement: 'min-h-mx-section-lg' },
  { regex: /h-\[450px\]/g, replacement: 'h-mx-section-md' },
  { regex: /min-h-\[400px\]/g, replacement: 'min-h-mx-section-sm' },
  { regex: /h-\[400px\]/g, replacement: 'h-mx-section-sm' },
  { regex: /h-\[300px\]/g, replacement: 'h-mx-80' }, // closest

  // Visuals & Radius
  { regex: /rounded-\[4rem\]/g, replacement: 'rounded-mx-4xl' },
  { regex: /shadow-\[0_0_20px_rgba\(79,70,229,0\.5\)\]/g, replacement: 'shadow-mx-glow-brand' },
  { regex: /shadow-\[0_0_20px_rgba\(255,255,255,0\.5\)\]/g, replacement: 'shadow-mx-glow-white' },
  
  // Specific cleanups
  { regex: /border-mx-blue-100/g, replacement: 'border-status-info/20' },
  { regex: /bg-emerald-50/g, replacement: 'bg-status-success-surface' },
  { regex: /text-emerald-600/g, replacement: 'text-status-success' }
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
      console.log(`Elite Refactor: ${filePath}`);
    }
  }
});
