import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/Users/pedroguilherme/Pictures/PRINT REVISÃO MX';
const ALLOWED_ROOT = '/Users/pedroguilherme/Pictures';
const confirmed = process.argv.includes('--confirm-delete');

const directories = [
  '01_MODULO_VENDEDOR',
  '02_MODULO_GERENTE',
  '03_MODULO_DONO',
  '04_MODULO_ADMIN_MX',
  '05_RELATORIOS',
  '06_PERMISSOES_EVIDENCIAS',
  '07_CAPTURAS_DESCARTADAS'
];

function emptyDir(dirPath) {
  const resolved = path.resolve(dirPath);
  if (!resolved.startsWith(`${path.resolve(OUTPUT_DIR)}${path.sep}`)) {
    throw new Error(`Caminho fora da lista permitida: ${dirPath}`);
  }
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        emptyDir(curPath);
        fs.rmdirSync(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    }
  } else {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

try {
  if (!confirmed) throw new Error('Recusada exclusão sem --confirm-delete');
  for (const dir of directories) emptyDir(path.join(OUTPUT_DIR, dir));
  const legacyZip = path.join(ALLOWED_ROOT, 'ENTREGA_FINAL_AUDITORIA_V3.zip');
  if (fs.existsSync(legacyZip)) fs.unlinkSync(legacyZip);
  console.log('Ambiente limpo e preparado para a V5.');
} catch (error) {
  console.error(`[CLEANUP_V5] ${error.message}`);
  process.exitCode = 1;
}
