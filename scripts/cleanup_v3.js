import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

const TARGET_DIR = '/Users/pedroguilherme/Pictures/PRINT REVISÃO MX';
const BACKUP_FILE = '/Users/pedroguilherme/Pictures/BACKUP_V2_PRE_CLEANUP.zip';

// Segurança: whitelist de caminhos ou padrões autorizados para exclusão
const WHITELIST_TO_DELETE = [
  '05_RELATORIOS',
  '06_PENDENCIAS',
  '01_MODULO_VENDEDOR',
  '02_MODULO_GERENTE',
  '03_MODULO_DONO',
  '04_MODULO_ADMIN_MX',
  'MAPA_DE_TELAS_ADMIN_MX.csv',
  'MAPA_DE_TELAS_ADMIN.csv',
  'MAPA_DE_TELAS_DONO.csv',
  'MAPA_DE_TELAS_GERENTE.csv',
  'MAPA_DE_TELAS_VENDEDOR.csv',
  'CHECKLIST_AUDITORIA_ADMIN_MX.csv',
  'CHECKLIST_AUDITORIA_ADMIN.csv',
  'CHECKLIST_AUDITORIA_DONO.csv',
  'CHECKLIST_AUDITORIA_GERENTE.csv',
  'CHECKLIST_AUDITORIA_VENDEDOR.csv'
];

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function runCleanup() {
  log('Iniciando rotina de limpeza segura V3...');

  // 1. Criar BACKUP_V2_PRE_CLEANUP.zip fora da pasta de trabalho
  log(`Gerando backup em: ${BACKUP_FILE}`);
  if (fs.existsSync(BACKUP_FILE)) {
    fs.unlinkSync(BACKUP_FILE);
  }
  
  try {
    // Usando zip do sistema de forma segura
    execSync(`cd "${TARGET_DIR}/.." && zip -r -X "${BACKUP_FILE}" "PRINT REVISÃO MX" -x "*.DS_Store"`, { stdio: 'ignore' });
    log('Backup gerado com sucesso.');
  } catch (error) {
    log(`ERRO FATAL: Falha ao gerar backup. ${error.message}`);
    process.exit(1);
  }

  // 2. Gerar e validar SHA-256
  const fileBuffer = fs.readFileSync(BACKUP_FILE);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  const hex = hashSum.digest('hex');
  log(`SHA-256 do backup: ${hex}`);

  // 3. Testar a integridade do ZIP
  try {
    execSync(`unzip -t "${BACKUP_FILE}"`, { stdio: 'ignore' });
    log('Integridade do ZIP verificada com sucesso.');
  } catch (error) {
    log(`ERRO FATAL: Falha no teste de integridade do ZIP. ${error.message}`);
    process.exit(1);
  }

  // 4. Identificar arquivos para exclusão (Whitelist)
  const itemsToDelete = [];
  const items = fs.readdirSync(TARGET_DIR);

  for (const item of items) {
    if (item === '07_CAPTURAS_DESCARTADAS') continue; // PRESERVAR SEMPRE
    if (item === 'CLEANUP_DRY_RUN.csv') continue; // Será sobrescrito
    
    // Deletar se estiver na whitelist ou se for .DS_Store ou CRITICAL_*
    if (WHITELIST_TO_DELETE.includes(item) || item === '.DS_Store' || item.startsWith('CRITICAL_') || item.startsWith('000_')) {
      const fullPath = path.join(TARGET_DIR, item);
      // Validar segurança do caminho
      if (fullPath.includes('..') || !fullPath.startsWith(TARGET_DIR)) {
        log(`ERRO DE SEGURANÇA: Caminho inválido ${fullPath}`);
        process.exit(1);
      }
      itemsToDelete.push(fullPath);
    }
  }

  // Identificar pastas vazias que não estão na whitelist
  const findEmptyDirs = (dir) => {
    let emptyDirs = [];
    if (!fs.existsSync(dir)) return emptyDirs;
    const files = fs.readdirSync(dir);
    if (files.length === 0) {
      emptyDirs.push(dir);
    } else {
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          emptyDirs = emptyDirs.concat(findEmptyDirs(fullPath));
        }
      }
    }
    return emptyDirs;
  };

  const emptyDirs = findEmptyDirs(TARGET_DIR).filter(d => !d.includes('07_CAPTURAS_DESCARTADAS'));
  for (const d of emptyDirs) {
     if (!itemsToDelete.includes(d)) itemsToDelete.push(d);
  }

  // 5. Produzir CLEANUP_DRY_RUN.csv
  const dryRunCsvPath = path.join(TARGET_DIR, 'CLEANUP_DRY_RUN.csv');
  let csvContent = 'Acao,Caminho\n';
  itemsToDelete.forEach(p => csvContent += `REMOVER,${p}\n`);
  fs.writeFileSync(dryRunCsvPath, csvContent);
  log(`Dry-run listado em: ${dryRunCsvPath}`);

  // 6. Executar a limpeza por whitelist
  log('Executando limpeza...');
  for (const itemPath of itemsToDelete) {
    try {
      if (fs.existsSync(itemPath)) {
         fs.rmSync(itemPath, { recursive: true, force: true });
         log(`Removido: ${itemPath}`);
      }
    } catch (e) {
      log(`Aviso ao remover ${itemPath}: ${e.message}`);
    }
  }

  log('Limpeza concluída. Ambiente estéril pronto para V3.');
}

runCleanup().catch(err => {
  console.error(err);
  process.exit(1);
});
