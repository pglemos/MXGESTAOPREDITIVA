/**
 * validate_mx_v5.js — Auditoria V5 Definitiva
 *
 * Versão: 5.0.0
 *
 * Valida tecnicamente (SEM browser) os resultados do capture_mx_v5.js:
 * - Relê o MANIFESTO_V5_PRIMARIO.csv
 * - Verifica existência dos arquivos
 * - Calcula hashes reais e compara
 * - Detecta FALHA_SCROLL (fatias consecutivas com hash idêntico)
 * - Detecta FALHA_INTERACAO (estado interativo com hash idêntico ao PADRAO)
 * - Verifica que lastSlice foi atingido
 * - Gera CHECKLIST_VALIDACAO_V5.csv com escape CSV correto
 * - NÃO marca VALIDADO — apenas VALIDACAO_AUTOMATICA_APROVADA
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const OUTPUT_DIR = '/Users/pedroguilherme/Pictures/PRINT REVISÃO MX';
const MANIFEST = path.join(OUTPUT_DIR, '05_RELATORIOS', 'MANIFESTO_V5_PRIMARIO.csv');
const CHECKLIST_OUT = path.join(OUTPUT_DIR, '05_RELATORIOS', 'CHECKLIST_VALIDACAO_V5.csv');
const SCRIPT_VERSION = '5.0.0';

const FOLDER_MAP = {
  VENDEDOR: '01_MODULO_VENDEDOR',
  GERENTE:  '02_MODULO_GERENTE',
  DONO:     '03_MODULO_DONO',
  ADMIN:    '04_MODULO_ADMIN_MX',
};

function csvField(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
function csvRow(...fields) { return fields.map(csvField).join(','); }

function sha256File(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function log(msg) { console.log(`[${new Date().toISOString()}] [VALIDATE_V5] ${msg}`); }

function findFile(perfil, pageName, fileName) {
  const folder = FOLDER_MAP[perfil];
  if (!folder) return null;
  const candidatePath = path.join(OUTPUT_DIR, folder, pageName, fileName);
  if (fs.existsSync(candidatePath)) return candidatePath;

  // Busca recursiva como fallback
  const baseDir = path.join(OUTPUT_DIR, folder);
  if (!fs.existsSync(baseDir)) return null;
  const subdirs = fs.readdirSync(baseDir);
  for (const sub of subdirs) {
    const p = path.join(baseDir, sub, fileName);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function parseManifest() {
  if (!fs.existsSync(MANIFEST)) {
    log('ERRO: Manifesto primário não encontrado. Execute capture_mx_v5.js primeiro.');
    process.exit(1);
  }

  const lines = fs.readFileSync(MANIFEST, 'utf-8').split('\n');
  const records = [];

  // Parse linha a linha com CSV básico
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Tokenize respeitando quoting
    const fields = [];
    let field = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        if (inQuotes && line[c + 1] === '"') { field += '"'; c++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(field); field = '';
      } else {
        field += ch;
      }
    }
    fields.push(field);

    if (fields.length < 10) continue;
    records.push({
      id: fields[0], perfil: fields[1], rota: fields[2], pageName: fields[3],
      estado: fields[4], fileName: fields[5], capturedHash: fields[6],
      statusCapture: fields[7], scrollSelector: fields[8],
      sliceIndex: parseInt(fields[9]) || 0,
      totalSlices: parseInt(fields[10]) || 0,
      requestedScrollTop: parseInt(fields[11]) || 0,
      realScrollTop: parseInt(fields[12]) || 0,
      clientHeight: parseInt(fields[13]) || 0,
      scrollHeight: parseInt(fields[14]) || 0,
      isLastSlice: fields[15] === 'true',
      timestamp: fields[16], versao: fields[17],
    });
  }

  return records;
}

async function run() {
  log('=== INÍCIO VALIDAÇÃO AUTOMÁTICA V5 ===');
  const records = parseManifest();
  log(`Registros lidos do manifesto: ${records.length}`);

  const results = [];

  // ── Passo 1: Verificar existência e hash de cada arquivo ──────────────
  for (const r of records) {
    const filePath = findFile(r.perfil, r.pageName, r.fileName);
    r.filePath = filePath;
    r.realHash = filePath ? sha256File(filePath) : null;
    r.fileExists = !!filePath;
    r.hashMatch = r.realHash === r.capturedHash;

    if (!r.fileExists) {
      r.statusAuto = 'FALHA_ARQUIVO_AUSENTE';
    } else if (!r.hashMatch) {
      r.statusAuto = 'FALHA_HASH_DIVERGENTE';
    } else if (r.statusCapture === 'FALHA_INTERACAO' || r.statusCapture === 'FALHA_CAPTURA' || r.statusCapture === 'FALHA_NAVEGACAO') {
      r.statusAuto = r.statusCapture;
    } else {
      r.statusAuto = 'VALIDACAO_AUTOMATICA_APROVADA';
    }
  }

  // ── Passo 2: Detectar FALHA_SCROLL (fatias consecutivas com hash idêntico) ─
  const byScenario = {};
  for (const r of records) {
    const key = `${r.perfil}_${r.rota}_${r.estado}`;
    if (!byScenario[key]) byScenario[key] = [];
    byScenario[key].push(r);
  }

  for (const group of Object.values(byScenario)) {
    group.sort((a, b) => a.sliceIndex - b.sliceIndex);
    for (let i = 1; i < group.length; i++) {
      const prev = group[i - 1];
      const curr = group[i];
      if (curr.realHash && prev.realHash && curr.realHash === prev.realHash) {
        curr.statusAuto = 'FALHA_SCROLL';
        curr.validationNote = `Hash idêntico à fatia anterior (${prev.fileName})`;
        log(`⚠️  FALHA_SCROLL: ${curr.fileName} == ${prev.fileName}`);
      }
    }
  }

  // ── Passo 3: Detectar FALHA_INTERACAO (hash igual ao PADRAO do mesmo estado) ─
  const byPage = {};
  for (const r of records) {
    const key = `${r.perfil}_${r.rota}_slice${r.sliceIndex}`;
    if (!byPage[key]) byPage[key] = {};
    byPage[key][r.estado] = r;
  }

  for (const pageMap of Object.values(byPage)) {
    const padrao = pageMap['PADRAO'];
    for (const [estado, r] of Object.entries(pageMap)) {
      if (estado !== 'PADRAO' && padrao && r.realHash && padrao.realHash && r.realHash === padrao.realHash) {
        if (r.statusAuto === 'VALIDACAO_AUTOMATICA_APROVADA') {
          r.statusAuto = 'FALHA_INTERACAO';
          r.validationNote = `Hash idêntico ao PADRAO (${padrao.fileName})`;
          log(`⚠️  FALHA_INTERACAO: ${r.fileName} == ${padrao.fileName}`);
        }
      }
    }
  }

  // ── Passo 4: Verificar que a última fatia foi realmente atingida ────────
  for (const group of Object.values(byScenario)) {
    const lastSlice = group[group.length - 1];
    if (lastSlice && lastSlice.totalSlices > 1 && !lastSlice.isLastSlice) {
      // A última fatia registrada não chegou ao fim
      if (lastSlice.statusAuto === 'VALIDACAO_AUTOMATICA_APROVADA') {
        lastSlice.statusAuto = 'FALHA_SCROLL_INCOMPLETO';
        lastSlice.validationNote = `Rolagem não atingiu o final: scrollTop=${lastSlice.realScrollTop} clientH=${lastSlice.clientHeight} scrollH=${lastSlice.scrollHeight}`;
        log(`⚠️  FALHA_SCROLL_INCOMPLETO: ${lastSlice.fileName}`);
      }
    }
  }

  // ── Resumo ─────────────────────────────────────────────────────────────
  const totals = {};
  for (const r of records) { totals[r.statusAuto] = (totals[r.statusAuto] || 0) + 1; }
  log('\nResumo:');
  for (const [k, v] of Object.entries(totals)) log(`  ${k}: ${v}`);

  // ── Gravar Checklist ───────────────────────────────────────────────────
  const header = 'id,perfil,rota,pageName,estado,fileName,sha256_real,hashMatch,fileExists,statusCapture,statusAutomatico,validationNote,sliceIndex,totalSlices,isLastSlice,statusRevisaoVisual,timestamp,versao';
  const rows = [header];
  const now = new Date().toISOString();
  for (const r of records) {
    rows.push(csvRow(
      r.id, r.perfil, r.rota, r.pageName, r.estado, r.fileName,
      r.realHash || 'N/A', r.hashMatch ? 'OK' : 'DIVERGENTE', r.fileExists ? 'SIM' : 'NAO',
      r.statusCapture, r.statusAuto, r.validationNote || '',
      r.sliceIndex, r.totalSlices, r.isLastSlice ? 'SIM' : 'NAO',
      'PENDENTE_REVISAO_VISUAL', now, SCRIPT_VERSION
    ));
  }

  fs.writeFileSync(CHECKLIST_OUT, rows.join('\n') + '\n');
  log(`\n✅ CHECKLIST_VALIDACAO_V5 gravado: ${CHECKLIST_OUT} (${rows.length - 1} registros)`);
  log('STATUS: VALIDACAO_AUTOMATICA_CONCLUIDA. Próximo: node scripts/review_visual_v5.js');
}

run().catch(e => { console.error('[FATAL]', e); process.exit(1); });
