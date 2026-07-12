/**
 * review_visual_v6.js — Auditoria V6
 *
 * CORREÇÕES v5 → v6:
 * [1] loadingDetected e semanticOk são persistidos em `r` antes do CSV
 * [2] Asserção PADRAO verifica ausência de 403 explicitamente
 * [3] Separação de estados por rotas vs. por arquivos vs. por fatias no manifesto final
 * [4] Bloqueio por loading persistente não sobrescreve semanticOk = SIM incorretamente
 * [5] Estratégias de retentativa incluem ABA_FEEDBACK
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:3003';
const OUTPUT_DIR = '/Users/pedroguilherme/Pictures/PRINT REVISÃO MX';
const REPORTS_DIR = path.join(OUTPUT_DIR, '05_RELATORIOS');
const LOGS_DIR = path.join(OUTPUT_DIR, '09_LOGS_EXECUCAO');
const CHECKLIST_IN   = path.join(REPORTS_DIR, 'CHECKLIST_VALIDACAO_V6.csv');
const VISUAL_OUT     = path.join(REPORTS_DIR, 'CHECKLIST_REVISAO_VISUAL_V6.csv');
const RETRY_OUT      = path.join(REPORTS_DIR, 'RELATORIO_RETENTATIVAS_V6.csv');
const MANIFEST_FINAL = path.join(REPORTS_DIR, 'MANIFESTO_V6_FINAL.csv');
const SCRIPT_VERSION = '6.0.0';
const VIEWPORT = { width: 1440, height: 900 };
const AUDIT_PASSWORD = process.env.MX_AUDIT_PASSWORD || process.env.E2E_ROLE_PASSWORD;

if (!AUDIT_PASSWORD) {
  throw new Error('Defina MX_AUDIT_PASSWORD ou E2E_ROLE_PASSWORD para executar a auditoria.');
}

const PROFILES = {
  VENDEDOR: { email: 'vendedor@mxgestaopreditiva.com.br', pass: AUDIT_PASSWORD },
  GERENTE:  { email: 'gerente@mxgestaopreditiva.com.br',  pass: AUDIT_PASSWORD },
  DONO:     { email: 'dono@mxgestaopreditiva.com.br',     pass: AUDIT_PASSWORD },
  ADMIN:    { email: 'synvollt@gmail.com',                 pass: AUDIT_PASSWORD },
};

const FOLDER_MAP = {
  VENDEDOR: '01_MODULO_VENDEDOR',
  GERENTE:  '02_MODULO_GERENTE',
  DONO:     '03_MODULO_DONO',
  ADMIN:    '04_MODULO_ADMIN_MX',
};

// Asserções semânticas por estado
const ASSERTIONS = {
  'PADRAO': {
    seletor: 'main, #main-content',
    negateTexts: ['Acesso não autorizado', 'Não autorizado', '403 Forbidden', 'Sem permissão'],
    descricao: 'Conteúdo principal visível, sem 403',
  },
  'NOTIFICACOES_ABERTAS': {
    seletor: '[role="dialog"], [role="listbox"], .notification-panel',
    negateTexts: [],
    descricao: 'Painel de notificações aberto',
  },
  'MODAL_REGULARIZAR': {
    seletor: '[role="dialog"]',
    negateTexts: [],
    descricao: 'Modal aberto',
  },
  'ABA_PDI': {
    seletor: '[role="tabpanel"], [data-state="active"]',
    texts: ['PDI'],
    negateTexts: [],
    descricao: 'Aba PDI ativa',
  },
  'ABA_FEEDBACK': {
    seletor: '[role="tabpanel"], [data-state="active"]',
    negateTexts: [],
    descricao: 'Aba Feedback ativa',
  },
  'ABA_VENDEDOR': {
    seletor: null,
    texts: ['Vendedor'],
    negateTexts: [],
    descricao: 'Simulação Vendedor ativa',
  },
  'ABA_GERENTE': {
    seletor: null,
    texts: ['Gerente'],
    negateTexts: [],
    descricao: 'Simulação Gerente ativa',
  },
};

// Estratégias de retentativa por estado [CORREÇÃO 5]
const RETRY_STRATEGIES = {
  'NOTIFICACOES_ABERTAS': [
    { sel: 'button[aria-label="Notificações"]', label: 'aria-label exato' },
    { sel: 'button:has(svg[data-lucide="bell"])', label: 'ícone bell' },
    { sel: 'header button', label: 'botão no header', index: -1 },
  ],
  'MODAL_REGULARIZAR': [
    { sel: 'button:has-text("Regularizar")', label: 'texto exato' },
    { sel: '[data-action="regularizar"]', label: 'data-action' },
  ],
  'ABA_PDI': [
    { sel: '[role="tab"]:has-text("PDI")', label: 'tab PDI' },
    { sel: 'button:has-text("PDI")', label: 'button PDI' },
  ],
  'ABA_FEEDBACK': [
    { sel: '[role="tab"]:has-text("Feedback")', label: 'tab Feedback' },
    { sel: '[role="tab"]:has-text("Devolutiva")', label: 'tab Devolutiva' },
    { sel: '[role="tab"]:has-text("Devolutivas")', label: 'tab Devolutivas' },
    { sel: '[role="tab"]:nth-child(3)', label: 'terceira aba' },
  ],
  'ABA_VENDEDOR': [
    { sel: 'button:has-text("Vendedor")', label: 'botão Vendedor' },
    { sel: 'a:has-text("Vendedor")', label: 'link Vendedor' },
  ],
  'ABA_GERENTE': [
    { sel: 'button:has-text("Gerente")', label: 'botão Gerente' },
    { sel: 'a:has-text("Gerente")', label: 'link Gerente' },
  ],
};

function csvField(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function csvRow(...fields) { return fields.map(csvField).join(','); }

function sha256File(p) {
  if (!fs.existsSync(p)) return 'FILE_NOT_FOUND';
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

let logStream = null;
function log(msg) {
  const line = `[${new Date().toISOString()}] [REVIEW_V6] ${msg}`;
  console.log(line);
  if (logStream) logStream.write(line + '\n');
}

function parseChecklist() {
  if (!fs.existsSync(CHECKLIST_IN)) {
    log(`ERRO: Checklist não encontrado em ${CHECKLIST_IN}`);
    process.exit(1);
  }
  const lines = fs.readFileSync(CHECKLIST_IN, 'utf-8').split('\n');
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
    if (f.length < 15) continue;
    records.push({
      breakpoint: f[0],
      id: f[1],
      perfil: f[2],
      rota: f[3],
      pageName: f[4],
      estado: f[5],
      fileName: f[6],
      sha256Real: f[7],
      hashMatch: f[8],
      fileExists: f[9] === 'SIM',
      is403: f[10] === 'SIM',
      perfilVisual: f[11],
      statusCapture: f[12],
      statusAuto: f[13],
      validationNote: f[14] || '',
      sliceIndex: parseInt(f[15]) || 1,
      totalSlices: parseInt(f[16]) || 1,
      hasRealScroll: f[17] === 'SIM',
      isLastSlice: (f[18] || '').toUpperCase() === 'SIM',
    });
  }
  return records;
}

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

async function login(page, perfil) {
  const p = PROFILES[perfil];
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.locator('input[type="email"], #login-email').first().fill(p.email);
  await page.locator('input[type="password"], #login-password').first().fill(p.pass);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 });
  await page.waitForTimeout(2000);
}

// [CORREÇÃO 2] Verifica estado semântico incluindo ausência de 403
async function checkSemantics(page, estado) {
  const assertion = ASSERTIONS[estado] || ASSERTIONS['PADRAO'];

  // 1. Spinner
  const spinnerVisible = await page.locator('[role="progressbar"], .animate-spin').first().isVisible().catch(() => false);
  if (spinnerVisible) return { ok: false, loading: true, note: 'LOADING_DETECTADO: spinner ativo' };

  // 2. Skeleton
  const skeletonVisible = await page.locator('[data-skeleton], .skeleton, .animate-pulse').first().isVisible().catch(() => false);
  if (skeletonVisible) return { ok: false, loading: true, note: 'LOADING_DETECTADO: skeleton visível' };

  // 3. Textos negados (403 etc.)
  if (assertion.negateTexts?.length > 0) {
    const bodyText = await page.evaluate(() => document.body.innerText || '');
    for (const neg of assertion.negateTexts) {
      if (bodyText.includes(neg)) {
        return { ok: false, loading: false, note: `CONTEUDO_PROIBIDO: "${neg}" encontrado na página` };
      }
    }
  }

  // 4. Seletor esperado
  if (assertion.seletor) {
    const elVisible = await page.locator(assertion.seletor).first().isVisible({ timeout: 2000 }).catch(() => false);
    if (!elVisible) return { ok: false, loading: false, note: `Elemento esperado não encontrado: ${assertion.seletor}` };
  }

  // 5. Textos esperados
  if (assertion.texts?.length > 0) {
    const bodyText = await page.evaluate(() => document.body.innerText || '');
    for (const txt of assertion.texts) {
      if (!bodyText.includes(txt)) return { ok: false, loading: false, note: `Texto esperado não encontrado: "${txt}"` };
    }
  }

  return { ok: true, loading: false, note: assertion.descricao };
}

async function retryInteraction(page, rota, estado, retryLog) {
  const strategies = RETRY_STRATEGIES[estado] || [];
  for (let attempt = 1; attempt <= 3; attempt++) {
    for (const strategy of strategies) {
      try {
        await page.goto(`${BASE_URL}${rota}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);

        const locator = strategy.index === -1
          ? page.locator(strategy.sel).last()
          : page.locator(strategy.sel).first();

        const visible = await locator.isVisible({ timeout: 3000 });
        retryLog.push({ estado, tentativa: attempt, seletor: strategy.sel, label: strategy.label, encontrado: visible, resultado: visible ? 'CLICOU' : 'NAO_ENCONTRADO' });

        if (visible) {
          await locator.click({ force: false });
          await page.waitForTimeout(1200);
          const sem = await checkSemantics(page, estado);
          if (sem.ok) {
            retryLog[retryLog.length - 1].resultado = 'SUCESSO_CONFIRMADO';
            return true;
          }
        }
      } catch (e) {
        retryLog.push({ estado, tentativa: attempt, seletor: strategy.sel, label: strategy.label, encontrado: false, resultado: `ERRO: ${e.message.split('\n')[0]}` });
      }
    }
  }
  return false;
}

async function run() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.mkdirSync(LOGS_DIR, { recursive: true });

  logStream = fs.createWriteStream(path.join(LOGS_DIR, `EXEC_REVIEW_${new Date().toISOString().replace(/[:.]/g, '-')}.log`));
  log('=== INÍCIO REVISÃO VISUAL V6 ===');

  const records = parseChecklist();
  log(`Registros no checklist: ${records.length}`);

  const visualRows = [];
  const retryLog = [];

  const browser = await chromium.launch({ headless: true });

  // Agrupar por perfil
  const profileGroups = {};
  for (const r of records) {
    if (!profileGroups[r.perfil]) profileGroups[r.perfil] = [];
    profileGroups[r.perfil].push(r);
  }

  for (const [perfil, recs] of Object.entries(profileGroups)) {
    log(`\n═══ Revisão: ${perfil} ═══`);
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();

    try {
      await login(page, perfil);
    } catch (e) {
      log(`❌ Falha login ${perfil}: ${e.message}`);
      await context.close();
      for (const r of recs) { r.visualStatus = 'FALHA_LOGIN'; r.visualNote = e.message.split('\n')[0]; r.loadingDetected = false; r.semanticOk = false; }
      visualRows.push(...recs);
      continue;
    }

    for (const r of recs) {
      const filePath = findFile(r.perfil, r.pageName, r.fileName);
      const fileSize = filePath && fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;

      // [CORREÇÃO 1] Sempre inicializar antes de qualquer branch
      r.loadingDetected = false;
      r.semanticOk = false;
      r.visualStatus = 'BLOQUEADO_COM_EVIDENCIA';
      r.visualNote = '';

      if (!filePath || fileSize < 10000) {
        r.visualStatus = 'BLOQUEADO_COM_EVIDENCIA';
        r.visualNote = filePath ? `Arquivo muito pequeno: ${fileSize} bytes` : 'Arquivo não encontrado';
        log(`  ⚠️  ${r.fileName} → ${r.visualNote}`);
        visualRows.push(r);
        continue;
      }

      if (r.statusAuto === 'FALHA_INTERACAO') {
        log(`  🔄 Retentativa: ${r.fileName} (${r.estado})`);
        const success = await retryInteraction(page, r.rota, r.estado, retryLog).catch(() => false);

        if (success) {
          // Recapturar
          if (filePath) {
            await page.screenshot({ path: filePath, clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height } });
            r.sha256Real = sha256File(filePath);
          }
          r.visualStatus = 'RECAPTURADO_E_VALIDADO';
          r.visualNote = 'Interação bem-sucedida na retentativa.';
          r.loadingDetected = false;
          r.semanticOk = true;
        } else {
          r.visualStatus = 'BLOQUEADO_COM_EVIDENCIA';
          r.visualNote = `Falha após ${Math.min(retryLog.filter(l => l.estado === r.estado).length, 9)} tentativas com seletores distintos.`;
          r.loadingDetected = false;
          r.semanticOk = false;
        }
      } else if (r.statusAuto === 'VALIDACAO_AUTOMATICA_APROVADA') {
        try {
          await page.goto(`${BASE_URL}${r.rota}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await page.waitForTimeout(2500);

          const sem1 = await checkSemantics(page, r.estado);

          // [CORREÇÃO 1] Persistir valores em `r`
          r.loadingDetected = sem1.loading;
          r.semanticOk = sem1.ok;

          if (sem1.loading) {
            // Aguardar e re-verificar
            await page.waitForTimeout(4000);
            const sem2 = await checkSemantics(page, r.estado);
            r.loadingDetected = sem2.loading;
            r.semanticOk = sem2.ok;

            if (sem2.loading) {
              r.visualStatus = 'BLOQUEADO_COM_EVIDENCIA';
              r.visualNote = 'Loading persistente após duas verificações.';
            } else if (sem2.ok) {
              // Recapturar sem loading
              if (filePath) {
                await page.screenshot({ path: filePath, clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height } });
                r.sha256Real = sha256File(filePath);
              }
              r.visualStatus = 'REVISAO_VISUAL_AUTONOMA_APROVADA';
              r.visualNote = `Recapturado sem loading. ${sem2.note}`;
            } else {
              r.visualStatus = 'BLOQUEADO_COM_EVIDENCIA';
              r.visualNote = sem2.note;
            }
          } else if (!sem1.ok) {
            r.visualStatus = 'BLOQUEADO_COM_EVIDENCIA';
            r.visualNote = sem1.note;
          } else {
            r.visualStatus = 'REVISAO_VISUAL_AUTONOMA_APROVADA';
            r.visualNote = sem1.note;
          }
        } catch (e) {
          r.loadingDetected = false;
          r.semanticOk = false;
          r.visualStatus = 'BLOQUEADO_COM_EVIDENCIA';
          r.visualNote = `Erro na revisão: ${e.message.split('\n')[0]}`;
        }
      } else {
        // FALHA_SCROLL, FALHA_HASH, etc.
        r.loadingDetected = false;
        r.semanticOk = false;
        r.visualStatus = 'BLOQUEADO_COM_EVIDENCIA';
        r.visualNote = `Status automático mantido: ${r.statusAuto}`;
      }

      const icon = (r.visualStatus === 'REVISAO_VISUAL_AUTONOMA_APROVADA' || r.visualStatus === 'RECAPTURADO_E_VALIDADO') ? '✅' : '⚠️';
      log(`  ${icon} ${r.fileName} → ${r.visualStatus} | loading=${r.loadingDetected} semanticOk=${r.semanticOk}`);
      visualRows.push(r);
    }

    await context.close();
  }

  await browser.close();

  // ── Gerar CSVs ────────────────────────────────────────────────────────
  const now = new Date().toISOString();

  // Checklist revisão visual
  const visualHeader = 'breakpoint,id,perfil,rota,pageName,estado,fileName,sha256_final,statusAutomatico,statusVisual,loadingDetectado,semanticaOK,visualNote,sliceIndex,totalSlices,isLastSlice,timestamp,versao';
  const visualLines = [visualHeader];
  for (const r of visualRows) {
    visualLines.push(csvRow(
      r.breakpoint, r.id, r.perfil, r.rota, r.pageName, r.estado, r.fileName,
      r.sha256Real || 'N/A', r.statusAuto, r.visualStatus,
      r.loadingDetected ? 'SIM' : 'NAO',
      r.semanticOk ? 'SIM' : 'NAO',
      r.visualNote || '',
      r.sliceIndex, r.totalSlices, r.isLastSlice ? 'SIM' : 'NAO',
      now, SCRIPT_VERSION
    ));
  }
  fs.writeFileSync(VISUAL_OUT, visualLines.join('\n') + '\n');

  // Relatório de retentativas
  const retryHeader = 'estado,tentativa,seletor,label,encontrado,resultado,timestamp';
  const retryLines = [retryHeader];
  for (const r of retryLog) {
    retryLines.push(csvRow(r.estado, r.tentativa, r.seletor, r.label, r.encontrado ? 'SIM' : 'NAO', r.resultado, now));
  }
  fs.writeFileSync(RETRY_OUT, retryLines.join('\n') + '\n');

  // [CORREÇÃO 3] Manifesto final com separação rotas / estados / arquivos / fatias
  const finalHeader = 'breakpoint,id,perfil,rota,pageName,estado,sliceIndex,totalSlices,fileName,sha256_final,statusFinalOficial,statusVisual,visualNote,timestamp,versao';
  const finalLines = [finalHeader];

  const totals = { VALIDADO: 0, BLOQUEADO: 0, NAO_SE_APLICA: 0 };
  for (const r of visualRows) {
    let oficial;
    if (r.visualStatus === 'REVISAO_VISUAL_AUTONOMA_APROVADA' || r.visualStatus === 'RECAPTURADO_E_VALIDADO') {
      oficial = 'VALIDADO'; totals.VALIDADO++;
    } else if (r.visualStatus === 'NAO_SE_APLICA_JUSTIFICADO') {
      oficial = 'NAO_SE_APLICA'; totals.NAO_SE_APLICA++;
    } else {
      oficial = 'BLOQUEADO'; totals.BLOQUEADO++;
    }
    finalLines.push(csvRow(r.breakpoint, r.id, r.perfil, r.rota, r.pageName, r.estado,
      r.sliceIndex, r.totalSlices, r.fileName, r.sha256Real || 'N/A',
      oficial, r.visualStatus, r.visualNote || '',
      now, SCRIPT_VERSION));
  }
  fs.writeFileSync(MANIFEST_FINAL, finalLines.join('\n') + '\n');

  // Resumo
  log('\n═══ RESUMO FINAL V6 ═══');
  log(`  Registros totais (arquivos/fatias): ${visualRows.length}`);
  log(`  VALIDADO: ${totals.VALIDADO}`);
  log(`  BLOQUEADO: ${totals.BLOQUEADO}`);
  log(`  NAO_SE_APLICA: ${totals.NAO_SE_APLICA}`);
  const eq = totals.VALIDADO + totals.BLOQUEADO + totals.NAO_SE_APLICA;
  log(`  Equação: ${visualRows.length} = ${eq} → ${visualRows.length === eq ? '✅ FECHA' : '❌ NÃO FECHA'}`);
  log('STATUS: REVISAO_VISUAL_V6_CONCLUIDA. Próximo: node scripts/package_v6.js');

  if (logStream) logStream.end();
}

run().catch(e => { console.error('[FATAL]', e); process.exit(1); });
