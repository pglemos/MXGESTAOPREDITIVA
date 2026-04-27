import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

// Allowed MX tokens (base colors and semantic)
const ALLOWED_COLORS = [
  'mx-black', 'mx-white', 'mx-slate', 'mx-indigo', 'mx-emerald', 'mx-rose', 'mx-amber', 'mx-orange', 'mx-green',
  'brand-primary', 'brand-secondary', 'pure-black', 'off-white', 'electric-blue', 'mars-orange',
  'status-success', 'status-warning', 'status-error', 'status-info',
  'surface-main', 'surface-alt', 'surface-overlay',
  'border-subtle', 'border-default', 'border-strong', 'border-error',
  'text-primary', 'text-secondary', 'text-tertiary', 'text-on-brand',
  'white', 'black', 'transparent', 'current', 'inherit'
];

const ALLOWED_SPACING = [
  'mx-xs', 'mx-sm', 'mx-md', 'mx-lg', 'mx-xl', 'mx-2xl', 'mx-3xl', 'mx-4xl', 'full', 'auto', 'px'
];

const ALLOWED_RADIUS = [
  'mx-sm', 'mx-md', 'mx-lg', 'mx-xl', 'mx-2xl', 'mx-3xl', 'mx-full'
];

// Standard Tailwind colors to avoid
const FORBIDDEN_COLORS_REGEX = /-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|emerald|teal|cyan|sky|blue|indigo|violet|purple|pink|rose)-(\d+)/;

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if (file.endsWith(".tsx") || file.endsWith(".ts")) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

let violationsCount = 0;

function lintFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const classNameRegex = /className=(?:(?:"([^"]*)")|(?:{`([^`]*)`})|(?:"{([^}]*)}"))/g;
  
  lines.forEach((line, index) => {
    let match;
    const lineNumber = index + 1;
    
    // Reset regex for each line if needed or use line-based approach
    // Re-running regex on each line to get line numbers easily
    while ((match = classNameRegex.exec(line)) !== null) {
      const classString = match[1] || match[2] || match[3] || "";
      const classes = classString.split(/\s+/);

      classes.forEach(cls => {
        if (!cls) return;

        // 1. Catch arbitrary values: [...]
        if (cls.includes('[') && cls.includes(']')) {
          if (cls.includes('#') || /\d+(px|rem|em|%)|(\d+\/\d+)/.test(cls)) {
              console.error(`Violation at ${path.relative(ROOT_DIR, filePath)}:${lineNumber}: Arbitrary value found in class "${cls}"`);
              violationsCount++;
          }
        }

        // 2. Catch standard Tailwind colors without mx- prefix
        if (FORBIDDEN_COLORS_REGEX.test(cls)) {
          const isAllowed = ALLOWED_COLORS.some(allowed => cls.includes(allowed));
          if (!isAllowed) {
            console.error(`Violation at ${path.relative(ROOT_DIR, filePath)}:${lineNumber}: Non-MX color found in class "${cls}"`);
            violationsCount++;
          }
        }
        
        // 3. Catch raw numbers in spacing/sizing
        const spacingRegex = /^(p|m|gap|w|h|top|right|bottom|left|space|rounded)-(x-|y-|t-|b-|l-|r-)?(\d+)$/;
        if (spacingRegex.test(cls)) {
            const isAllowed = ALLOWED_SPACING.concat(ALLOWED_RADIUS).some(allowed => cls.endsWith(allowed));
            if (!isAllowed) {
              console.error(`Violation at ${path.relative(ROOT_DIR, filePath)}:${lineNumber}: Standard utility found in class "${cls}". Use mx- tokens instead.`);
              violationsCount++;
            }
        }
      });
    }
  });
}

const files = getAllFiles(SRC_DIR);
files.forEach(lintFile);

if (violationsCount > 0) {
  console.error(`\nFound ${violationsCount} atomic design violations.`);
  process.exit(1);
} else {
  console.log("No atomic design violations found.");
  process.exit(0);
}
