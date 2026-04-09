import fs from 'fs';
import path from 'path';

const PAGES_DIR = './src/pages';

const VIOLATION_PATTERNS = [
    { 
        name: 'Legacy Color', 
        regex: /(text|bg|border)-(indigo|slate|gray|blue|rose|emerald|amber|violet|red|green|blue|yellow)-[0-9]{2,3}/gi 
    },
    { 
        name: 'Manual HTML Text', 
        regex: /<(p|span|label|h1|h2|h3)[^>]*className=["'][^"]*(text-|bg-|font-|p-|m-|border-)[^"']*["']/gi 
    },
    {
        name: 'Arbitrary Value',
        regex: /-\[.*?\]/gi
    }
];

const auditResults = {};

function auditFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    
    // Ignorar código fora do retorno do componente
    const jsxOnly = content.split('return (')[1] || '';
    
    const fileViolations = [];

    VIOLATION_PATTERNS.forEach(pattern => {
        const matches = jsxOnly.match(pattern.regex);
        if (matches) {
            matches.forEach(match => {
                // Ignorar exceções permitidas (tokens MX e variantes atômicas)
                if (match.includes('mx-') || match.includes('brand-') || match.includes('status-') || match.includes('Typography')) return;
                fileViolations.push({ type: pattern.name, snippet: match.substring(0, 60) });
            });
        }
    });

    if (fileViolations.length > 0) {
        auditResults[fileName] = fileViolations;
    }
}

function walk(dir) {
    fs.readdirSync(dir).forEach(file => {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (file.endsWith('.tsx')) auditFile(full);
    });
}

console.log("🕵️ Auditoria de Interface Final...");
walk(PAGES_DIR);

const violators = Object.keys(auditResults);
console.log(`\nRelatório Final: ${violators.length} páginas com falha visual.`);

if (violators.length > 0) {
    fs.writeFileSync('audit_report.json', JSON.stringify(auditResults, null, 2));
    process.exit(1);
} else {
    console.log("✅ SISTEMA 100% ATÔMICO.");
    process.exit(0);
}
