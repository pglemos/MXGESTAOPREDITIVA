/**
 * validate_mx_v6.js — Auditoria V6
 * Valida tecnicamente os resultados do capture_mx_v6.js
 * Corrige: totalSlices != arquivos reais, detecção de 403 como CAPTURADO
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const OUTPUT_DIR = '/Users/pedroguilherme/Pictures/PRINT REVISÃO MX';
const MANIFEST = path.join(OUTPUT_DIR, '05_RELATORIOS', 'MANIFESTO_V6_PRIMARIO.csv');
const CHECKLIST_OUT = path.join(OUTPUT_DIR, '05_RELATORIOS', 'CHECKLIST_VALIDACAO_V6.csv');
const SCRIPT_VERSION = '6.0.0';

const FOLDER_MAP = { VENDEDOR: '01_MODULO_VENDEDOR', GERENTE: '02_MODULO_GERENTE', DONO: '03_MODULO_DONO', ADMIN: '04_MODULO_ADMIN_MX' };

function csvField(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function csvRow(...fields) { return fields.map(csvField).join(','); }

function sha256File(p) {
  if (!fs.existsSync(p)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

function log(msg) { console.log(`[${new Date().toISOString()}] [VALIDATE_V6] ${msg}`); }

function findFile(perfil, pageName, fileName) {
  const folder = FOLDER_MAP[perfil];
  if (!folder) return null;
  const direct = path.join(OUTPUT_DIR, folder, pageName, fileName);
  if (fs.existsSync(direct)) return direct;
  const base = path.join(OUTPUT_DIR, folder);
  if (!fs.existsSync(base)) return null;
  for (const sub of fs.readdirSync(base)) {
    const p = path.join(base, sub, fileName);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function parseManifest() {
  if (!fs.existsSync(MANIFEST)) { log('ERRO: Manifesto não encontrado. Execute capture_mx_v6.js.'); process.exit(1); }
  const lines = fs.readFileSync(MANIFEST, 'utf-8').split('\n');
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const f = [];
    let field = '', inQ = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') { if (inQ && line[c+1] === '"') { field += '"'; c++; } else inQ = !inQ; }
      else if (ch === ',' && !inQ) { f.push(field); field = ''; }
      else field += ch;
    }
    f.push(field);
    if (f.length < 14) continue;
    records.push({
      breakpoint: f[0], id: f[1], perfil: f[2], rota: f[3], pageName: f[4], estado: f[5],
      fileName: f[6], capturedHash: f[7], statusCapture: f[8],
      is403: f[9] === 'SIM',
      perfilVisual: f[10],
      scrollSelector: f[11],
      overflowY: f[12],
      hasRealScroll: f[13] === 'true',
      sliceIndex: parseInt(f[14]) || 1,
      totalSlices: parseInt(f[15]) || 1,
      requestedScrollTop: parseInt(f[16]) || 0,
      realScrollTop: parseInt(f[17]) || 0,
      clientHeight: parseInt(f[18]) || 0,
      scrollHeight: parseInt(f[19]) || 0,
      isLastSlice: f[20] === 'true',
      timestamp: f[21], versao: f[22],
    });
  }
  return records;
}

function run() {
  log('=== INÍCIO VALIDAÇÃO AUTOMÁTICA V6 ===');
  const records = parseManifest();
  log(`Registros lidos: ${records.length}`);

  // Passo 1: verificar arquivos e hashes
  for (const r of records) {
    const filePath = findFile(r.perfil, r.pageName, r.fileName);
    r.filePath = filePath;
    r.realHash = filePath ? sha256File(filePath) : null;
    r.fileExists = !!filePath;
    r.hashMatch = r.realHash === r.capturedHash;

    if (!r.fileExists)         r.statusAuto = 'FALHA_ARQUIVO_AUSENTE';
    else if (!r.hashMatch)     r.statusAuto = 'FALHA_HASH_DIVERGENTE';
    else if (r.is403)          r.statusAuto = 'ACESSO_BLOQUEADO_403';
    else if (r.perfilVisual === 'SIMULATED') r.statusAuto = 'CONTAMINACAO_SIMULACAO';
    else if (r.statusCapture === 'FALHA_INTERACAO') r.statusAuto = 'FALHA_INTERACAO';
    else if (['FALHA_CAPTURA','FALHA_NAVEGACAO'].includes(r.statusCapture)) r.statusAuto = r.statusCapture;
    else r.statusAuto = 'VALIDACAO_AUTOMATICA_APROVADA';
  }

  // Passo 2: detectar fatias com hash idêntico (FALHA_SCROLL)
  const byScenario = {};
  for (const r of records) {
    const key = `${r.breakpoint}__${r.perfil}__${r.rota}__${r.estado}`;
    if (!byScenario[key]) byScenario[key] = [];
    byScenario[key].push(r);
  }
  for (const group of Object.values(byScenario)) {
    group.sort((a, b) => a.sliceIndex - b.sliceIndex);
    for (let i = 1; i < group.length; i++) {
      if (group[i].realHash && group[i-1].realHash && group[i].realHash === group[i-1].realHash) {
        if (group[i].statusAuto === 'VALIDACAO_AUTOMATICA_APROVADA') {
          group[i].statusAuto = 'FALHA_SCROLL';
          group[i].validationNote = `Hash idêntico à fatia anterior (${group[i-1].fileName})`;
          log(`⚠️  FALHA_SCROLL: ${group[i].fileName}`);
        }
      }
    }
  }

  // Passo 3: detectar interação com hash idêntico ao PADRAO
  const byPage = {};
  for (const r of records) {
    const key = `${r.breakpoint}__${r.perfil}__${r.rota}__slice${r.sliceIndex}`;
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
        }
      }
    }
  }

  // Passo 4: verificar scroll incompleto
  for (const group of Object.values(byScenario)) {
    const last = group[group.length - 1];
    if (last && last.hasRealScroll && !last.isLastSlice && last.statusAuto === 'VALIDACAO_AUTOMATICA_APROVADA') {
      last.statusAuto = 'FALHA_SCROLL_INCOMPLETO';
      last.validationNote = `scrollTop=${last.realScrollTop} clientH=${last.clientHeight} scrollH=${last.scrollHeight}`;
    }
  }

  // Resumo
  const totals = {};
  for (const r of records) { totals[r.statusAuto] = (totals[r.statusAuto] || 0) + 1; }
  log('\nResumo por status:');
  for (const [k, v] of Object.entries(totals)) log(`  ${k}: ${v}`);

  // Gravar
  const header = 'breakpoint,id,perfil,rota,pageName,estado,fileName,sha256_real,hashMatch,fileExists,is403,perfilVisual,statusCapture,statusAutomatico,validationNote,sliceIndex,totalSlices,hasRealScroll,isLastSlice,statusRevisaoVisual,timestamp,versao';
  const rows = [header];
  const now = new Date().toISOString();
  for (const r of records) {
    rows.push(csvRow(
      r.breakpoint, r.id, r.perfil, r.rota, r.pageName, r.estado, r.fileName,
      r.realHash || 'N/A', r.hashMatch ? 'OK' : 'DIVERGENTE', r.fileExists ? 'SIM' : 'NAO',
      r.is403 ? 'SIM' : 'NAO', r.perfilVisual || 'UNKNOWN',
      r.statusCapture, r.statusAuto, r.validationNote || '',
      r.sliceIndex, r.totalSlices, r.hasRealScroll ? 'SIM' : 'NAO',
      r.isLastSlice ? 'SIM' : 'NAO', 'PENDENTE_REVISAO_VISUAL', now, SCRIPT_VERSION
    ));
  }

  fs.writeFileSync(CHECKLIST_OUT, rows.join('\n') + '\n');
  log(`\n✅ CHECKLIST_VALIDACAO_V6 gravado: ${rows.length - 1} registros`);
  log('STATUS: VALIDACAO_V6_CONCLUIDA. Próximo: node scripts/verify_permissions_v6.js && node scripts/review_visual_v6.js');
}

run();
