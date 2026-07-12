/**
 * verify_permissions_v6.js — Auditoria V6
 *
 * CORREÇÕES v5 → v6:
 * [1] Detector de 403 robusto: usa page.evaluate em vez de locator CSS composto inválido
 * [2] Grava hash e screenshot de cada evidência com path confirmado
 * [3] Registra URL final, título, texto do elemento de bloqueio
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:3003';
const OUTPUT_DIR = '/Users/pedroguilherme/Pictures/PRINT REVISÃO MX';
const PERM_DIR = path.join(OUTPUT_DIR, '06_PERMISSOES_EVIDENCIAS');
const REPORTS_DIR = path.join(OUTPUT_DIR, '05_RELATORIOS');
const LOGS_DIR = path.join(OUTPUT_DIR, '09_LOGS_EXECUCAO');
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

// Expectativas de acesso: PERMITIDO | BLOQUEADO | REDIR
// Baseado no App.tsx (RoleSwitch + ForbiddenRoute + Navigate)
const PERM_MATRIX = [
  { route: '/home',                          v:'PERMITIDO', g:'PERMITIDO', d:'REDIR',    a:'REDIR'     },
  { route: '/vendedor/terminal-mx',          v:'PERMITIDO', g:'BLOQUEADO', d:'BLOQUEADO',a:'BLOQUEADO' },
  { route: '/carteira-clientes',             v:'PERMITIDO', g:'BLOQUEADO', d:'BLOQUEADO',a:'BLOQUEADO' },
  { route: '/meu-funil',                     v:'PERMITIDO', g:'BLOQUEADO', d:'BLOQUEADO',a:'BLOQUEADO' },
  { route: '/central-execucao',              v:'PERMITIDO', g:'BLOQUEADO', d:'BLOQUEADO',a:'BLOQUEADO' },
  { route: '/relatorios',                    v:'PERMITIDO', g:'BLOQUEADO', d:'BLOQUEADO',a:'BLOQUEADO' },
  { route: '/desenvolvimento',               v:'PERMITIDO', g:'BLOQUEADO', d:'BLOQUEADO',a:'BLOQUEADO' },
  { route: '/universidade-mx',               v:'PERMITIDO', g:'REDIR',     d:'REDIR',    a:'REDIR'     },
  { route: '/ranking',                       v:'PERMITIDO', g:'PERMITIDO', d:'PERMITIDO',a:'PERMITIDO' },
  { route: '/notificacoes',                  v:'PERMITIDO', g:'PERMITIDO', d:'PERMITIDO',a:'PERMITIDO' },
  { route: '/perfil',                        v:'PERMITIDO', g:'PERMITIDO', d:'PERMITIDO',a:'PERMITIDO' },
  { route: '/configuracoes',                 v:'PERMITIDO', g:'PERMITIDO', d:'PERMITIDO',a:'PERMITIDO' },
  { route: '/ajuda',                         v:'PERMITIDO', g:'BLOQUEADO', d:'BLOQUEADO',a:'BLOQUEADO' },
  { route: '/funil-vendas',                  v:'BLOQUEADO', g:'PERMITIDO', d:'PERMITIDO',a:'BLOQUEADO' },
  { route: '/metas',                         v:'BLOQUEADO', g:'PERMITIDO', d:'PERMITIDO',a:'BLOQUEADO' },
  { route: '/devolutivas',                   v:'PERMITIDO', g:'PERMITIDO', d:'PERMITIDO',a:'PERMITIDO' },
  { route: '/pdi',                           v:'REDIR',     g:'PERMITIDO', d:'PERMITIDO',a:'PERMITIDO' },
  { route: '/treinamentos',                  v:'REDIR',     g:'PERMITIDO', d:'PERMITIDO',a:'PERMITIDO' },
  { route: '/rotina',                        v:'BLOQUEADO', g:'PERMITIDO', d:'BLOQUEADO',a:'PERMITIDO' },
  { route: '/relatorio-matinal',             v:'BLOQUEADO', g:'PERMITIDO', d:'BLOQUEADO',a:'PERMITIDO' },
  { route: '/auditoria',                     v:'BLOQUEADO', g:'PERMITIDO', d:'BLOQUEADO',a:'PERMITIDO' },
  { route: '/lojas',                         v:'BLOQUEADO', g:'BLOQUEADO', d:'PERMITIDO',a:'PERMITIDO' },
  { route: '/lojas/mx-consultoria',          v:'BLOQUEADO', g:'PERMITIDO', d:'PERMITIDO',a:'PERMITIDO' },
  { route: '/organograma',                   v:'BLOQUEADO', g:'BLOQUEADO', d:'PERMITIDO',a:'PERMITIDO' },
  { route: '/banco-talentos',                v:'BLOQUEADO', g:'BLOQUEADO', d:'PERMITIDO',a:'PERMITIDO' },
  { route: '/painel',                        v:'BLOQUEADO', g:'BLOQUEADO', d:'BLOQUEADO',a:'PERMITIDO' },
  { route: '/simulacao',                     v:'BLOQUEADO', g:'BLOQUEADO', d:'BLOQUEADO',a:'PERMITIDO' },
  { route: '/agenda',                        v:'BLOQUEADO', g:'BLOQUEADO', d:'BLOQUEADO',a:'PERMITIDO' },
  { route: '/consultoria',                   v:'BLOQUEADO', g:'BLOQUEADO', d:'BLOQUEADO',a:'PERMITIDO' },
  { route: '/produtos',                      v:'BLOQUEADO', g:'BLOQUEADO', d:'BLOQUEADO',a:'PERMITIDO' },
  { route: '/configuracoes/operacional',     v:'BLOQUEADO', g:'BLOQUEADO', d:'BLOQUEADO',a:'PERMITIDO' },
  { route: '/configuracoes/consultoria-pmr', v:'BLOQUEADO', g:'BLOQUEADO', d:'BLOQUEADO',a:'PERMITIDO' },
  { route: '/configuracoes/reprocessamento', v:'BLOQUEADO', g:'BLOQUEADO', d:'BLOQUEADO',a:'PERMITIDO' },
  { route: '/relatorios/performance-vendas', v:'BLOQUEADO', g:'BLOQUEADO', d:'BLOQUEADO',a:'PERMITIDO' },
];

function csvField(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function csvRow(...fields) { return fields.map(csvField).join(','); }

function sha256(filePath) {
  if (!fs.existsSync(filePath)) return 'FILE_NOT_FOUND';
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

let logStream = null;
function log(msg) {
  const line = `[${new Date().toISOString()}] [PERM_V6] ${msg}`;
  console.log(line);
  if (logStream) logStream.write(line + '\n');
}

// [CORREÇÃO 1] Detectar bloqueio via page.evaluate (não locator composto)
async function detectBlockStatus(page) {
  return await page.evaluate(() => {
    const body = document.body.innerText || '';
    const title = document.title || '';

    // Texto explícito de bloqueio
    const blockedTexts = ['Acesso não autorizado', 'Não autorizado', 'Sem permissão', 'Forbidden'];
    const hasBlockText = blockedTexts.some(t => body.includes(t));
    const has403 = body.includes('403') && hasBlockText;

    // Extrair texto do elemento de bloqueio
    let blockElement = '';
    const forbidden = document.querySelector('[data-testid="forbidden"], [data-testid="unauthorized"]');
    if (forbidden) blockElement = forbidden.innerText?.trim()?.substring(0, 100) || '';
    else if (hasBlockText) {
      const lines = body.split('\n').filter(l => blockedTexts.some(t => l.includes(t)));
      blockElement = lines[0]?.trim()?.substring(0, 100) || '';
    }

    return {
      blocked: hasBlockText || has403,
      blockText: blockElement,
      title,
    };
  });
}

async function login(page, profile) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.locator('input[type="email"], #login-email').first().fill(profile.email);
  await page.locator('input[type="password"], #login-password').first().fill(profile.pass);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 });
  await page.waitForTimeout(2000);
}

async function run() {
  fs.mkdirSync(PERM_DIR, { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.mkdirSync(LOGS_DIR, { recursive: true });

  logStream = fs.createWriteStream(path.join(LOGS_DIR, `EXEC_PERM_${new Date().toISOString().replace(/[:.]/g, '-')}.log`));

  log('=== INÍCIO VERIFICAÇÃO DE PERMISSÕES V6 ===');

  const matrixRows = ['perfil,rota,acesso_esperado,url_final,redirecionado_para,resultado_real,is403,texto_bloqueio,titulo_pagina,conformidade,hash_evidencia,arquivo_evidencia,timestamp,versao'];

  const browser = await chromium.launch({ headless: true });

  for (const [profileKey, profileExpectedFn] of [
    ['VENDEDOR', r => r.v],
    ['GERENTE',  r => r.g],
    ['DONO',     r => r.d],
    ['ADMIN',    r => r.a],
  ]) {
    log(`\n═══ Permissões: ${profileKey} ═══`);
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();

    try {
      await login(page, PROFILES[profileKey]);
    } catch (e) {
      log(`❌ Falha login ${profileKey}: ${e.message}`);
      await context.close();
      continue;
    }

    for (const row of PERM_MATRIX) {
      const esperado = profileExpectedFn(row);
      const routeSlug = row.route.replace(/[^a-zA-Z0-9]/g, '_');
      const evidenceFile = `PERM_${profileKey}${routeSlug}.png`;
      const evidencePath = path.join(PERM_DIR, evidenceFile);

      try {
        await page.goto(`${BASE_URL}${row.route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);
      } catch (e) {
        log(`  ⚠️  Falha navegação ${row.route}: ${e.message}`);
        matrixRows.push(csvRow(profileKey, row.route, esperado, 'ERRO', '', 'FALHA_NAVEGACAO', 'N/A', '', '', 'NAO_CONFORME', '', '', new Date().toISOString(), SCRIPT_VERSION));
        continue;
      }

      const finalUrl = page.url().replace('http://localhost:3003', '');
      const routeBase = row.route.split('?')[0];
      const isRedirected = !finalUrl.startsWith(routeBase);
      const redirectedTo = isRedirected ? finalUrl : '';

      // [CORREÇÃO 1] Detecção robusta de bloqueio
      const blockStatus = await detectBlockStatus(page);
      const is403 = blockStatus.blocked;

      let resultadoReal = 'PERMITIDO';
      if (is403) resultadoReal = 'BLOQUEADO';
      else if (isRedirected) resultadoReal = 'REDIRECIONADO';

      const conformidade = (
        resultadoReal === esperado ||
        (esperado === 'REDIR' && resultadoReal === 'REDIRECIONADO') ||
        (esperado === 'BLOQUEADO' && resultadoReal === 'BLOQUEADO')
      ) ? 'CONFORME' : 'NAO_CONFORME';

      // Capturar evidência
      await page.screenshot({ path: evidencePath, clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height } });
      const hashEvidencia = sha256(evidencePath);
      const now = new Date().toISOString();

      matrixRows.push(csvRow(profileKey, row.route, esperado, finalUrl, redirectedTo,
        resultadoReal, is403 ? 'SIM' : 'NAO', blockStatus.blockText,
        blockStatus.title, conformidade, hashEvidencia, evidenceFile, now, SCRIPT_VERSION));

      const icon = conformidade === 'CONFORME' ? '✅' : '⚠️';
      log(`  ${icon} ${row.route} | esperado=${esperado} real=${resultadoReal} is403=${is403}`);
    }

    await context.close();
  }

  await browser.close();

  const matrixPath = path.join(REPORTS_DIR, 'MATRIZ_PERMISSOES_V6.csv');
  fs.writeFileSync(matrixPath, matrixRows.join('\n') + '\n');

  const total = matrixRows.length - 1;
  const conformes = matrixRows.filter(l => l.includes('CONFORME') && !l.includes('NAO_CONFORME')).length;
  log(`\n✅ MATRIZ_PERMISSOES_V6 gravada: ${total} registros`);
  log(`   CONFORME: ${conformes} | NAO_CONFORME: ${total - conformes}`);
  log('=== VERIFICAÇÃO DE PERMISSÕES V6 CONCLUÍDA ===');

  if (logStream) logStream.end();
}

run().catch(e => { console.error('[FATAL]', e); process.exit(1); });
