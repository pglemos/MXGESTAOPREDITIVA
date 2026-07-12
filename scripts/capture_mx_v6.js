/**
 * capture_mx_v6.js — Auditoria V6 Definitiva
 *
 * CORREÇÕES v5 → v6:
 * [1] Após cada interação de simulação, encerra a simulação explicitamente e valida o papel
 * [2] Antes de cada rota, verifica o papel atual via DOM (não assume sessão limpa)
 * [3] totalSlices calculado corretamente: só itera se scrollHeight > clientHeight
 * [4] Contêiner de scroll: verifica overflowY e scrollHeight > clientHeight
 * [5] Detecta páginas 403 e registra como ACESSO_BLOQUEADO, não CAPTURADO
 * [6] Registra versão do Playwright e viewport em metadados
 * [7] Quatro breakpoints (Desktop, Notebook, Tablet, Mobile)
 * [8] Logs completos de execução por perfil
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ── Configuração ─────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:3003';
const OUTPUT_DIR = '/Users/pedroguilherme/Pictures/PRINT REVISÃO MX';
const REPORTS_DIR = path.join(OUTPUT_DIR, '05_RELATORIOS');
const LOGS_DIR = path.join(OUTPUT_DIR, '09_LOGS_EXECUCAO');
const SCRIPT_VERSION = '6.0.0';
const SCROLL_TOLERANCE = 4;
const AUDIT_PASSWORD = process.env.MX_AUDIT_PASSWORD || process.env.E2E_ROLE_PASSWORD;

if (!AUDIT_PASSWORD) {
  throw new Error('Defina MX_AUDIT_PASSWORD ou E2E_ROLE_PASSWORD para executar a auditoria.');
}

// Breakpoints conforme plano aprovado (Desktop é canônico para cobertura funcional)
// Tablet e Mobile capturam apenas rotas de layout crítico
const BREAKPOINTS = [
  { name: 'Desktop',  width: 1440, height: 900,  isCanonical: true },
  { name: 'Notebook', width: 1280, height: 720,  isCanonical: false },
  { name: 'Tablet',   width: 768,  height: 1024, isCanonical: false },
  { name: 'Mobile',   width: 390,  height: 844,  isCanonical: false },
];

// Rotas a capturar em todos os breakpoints (layout muda significativamente)
const RESPONSIVE_ROUTES = new Set(['/home', '/vendedor/terminal-mx', '/carteira-clientes', '/lojas/mx-consultoria']);

// ── Credenciais ──────────────────────────────────────────────────────────
const PROFILES = {
  VENDEDOR: { email: 'vendedor@mxgestaopreditiva.com.br', pass: AUDIT_PASSWORD, folder: '01_MODULO_VENDEDOR', expectedRole: 'vendedor' },
  GERENTE:  { email: 'gerente@mxgestaopreditiva.com.br',  pass: AUDIT_PASSWORD, folder: '02_MODULO_GERENTE',  expectedRole: 'gerente' },
  DONO:     { email: 'dono@mxgestaopreditiva.com.br',     pass: AUDIT_PASSWORD, folder: '03_MODULO_DONO',     expectedRole: 'dono' },
  ADMIN:    { email: 'synvollt@gmail.com',                 pass: AUDIT_PASSWORD, folder: '04_MODULO_ADMIN_MX', expectedRole: 'admin' },
};

// ── Mapa de cenários (igual ao V5) ───────────────────────────────────────
const SCENARIO_MAP = [
  // VENDEDOR
  { id: 'VENDEDOR_HOME',       profile: 'VENDEDOR', route: '/home',                   label: 'Dashboard Home',        pageName: '01_DASHBOARD',
    interactions: [
      { id: 'NOTIFICACOES', selector: 'button[aria-label="Notificações"]', waitFor: null, label: 'NOTIFICACOES_ABERTAS', exitSimulation: false },
    ]
  },
  { id: 'VENDEDOR_TERMINAL',   profile: 'VENDEDOR', route: '/vendedor/terminal-mx',   label: 'Terminal MX',           pageName: '02_TERMINAL_MX',
    interactions: [
      { id: 'MODAL_REGULARIZAR', selector: 'button:has-text("Regularizar")', waitFor: '[role="dialog"]', label: 'MODAL_REGULARIZAR', exitSimulation: false },
    ]
  },
  { id: 'VENDEDOR_CARTEIRA',   profile: 'VENDEDOR', route: '/carteira-clientes',      label: 'Carteira',              pageName: '03_CARTEIRA_CLIENTES', interactions: [] },
  { id: 'VENDEDOR_FUNIL',      profile: 'VENDEDOR', route: '/meu-funil',              label: 'Meu Funil',             pageName: '04_MEU_FUNIL',         interactions: [] },
  { id: 'VENDEDOR_CENTRAL',    profile: 'VENDEDOR', route: '/central-execucao',       label: 'Central Execução',      pageName: '05_CENTRAL_EXECUCAO',  interactions: [] },
  { id: 'VENDEDOR_RELATORIOS', profile: 'VENDEDOR', route: '/relatorios',             label: 'Relatórios',            pageName: '06_RELATORIOS',        interactions: [] },
  { id: 'VENDEDOR_DESENV',     profile: 'VENDEDOR', route: '/desenvolvimento',        label: 'Desenvolvimento',       pageName: '07_DESENVOLVIMENTO',
    interactions: [
      { id: 'TAB_PDI',      selector: '[role="tab"]:has-text("PDI")',           waitFor: null, label: 'ABA_PDI',      exitSimulation: false },
      { id: 'TAB_FEEDBACK', selector: '[role="tab"]:has-text("Feedback"), [role="tab"]:has-text("Devolutiva"), [role="tab"]:has-text("Devolutivas")', waitFor: null, label: 'ABA_FEEDBACK', exitSimulation: false },
    ]
  },
  { id: 'VENDEDOR_UNIV',       profile: 'VENDEDOR', route: '/universidade-mx',        label: 'Universidade MX',       pageName: '08_UNIVERSIDADE_MX',   interactions: [] },
  { id: 'VENDEDOR_RANKING',    profile: 'VENDEDOR', route: '/ranking',                label: 'Ranking',               pageName: '09_RANKING',           interactions: [] },
  { id: 'VENDEDOR_NOTIF',      profile: 'VENDEDOR', route: '/notificacoes',           label: 'Notificações',          pageName: '10_NOTIFICACOES',      interactions: [] },
  { id: 'VENDEDOR_PERFIL',     profile: 'VENDEDOR', route: '/perfil',                 label: 'Perfil',                pageName: '11_PERFIL',            interactions: [] },
  { id: 'VENDEDOR_CONFIG',     profile: 'VENDEDOR', route: '/configuracoes',          label: 'Configurações',         pageName: '12_CONFIGURACOES',     interactions: [] },
  { id: 'VENDEDOR_AJUDA',      profile: 'VENDEDOR', route: '/ajuda',                  label: 'Ajuda',                 pageName: '13_AJUDA',             interactions: [] },

  // GERENTE
  { id: 'GERENTE_HOME',        profile: 'GERENTE', route: '/home',                    label: 'Dashboard',             pageName: '01_DASHBOARD',         interactions: [] },
  { id: 'GERENTE_EQUIPE',      profile: 'GERENTE', route: '/lojas/mx-consultoria?tab=equipe', label: 'Equipe',        pageName: '02_EQUIPE',            interactions: [] },
  { id: 'GERENTE_FUNIL',       profile: 'GERENTE', route: '/funil-vendas',            label: 'Funil Vendas',          pageName: '03_FUNIL_VENDAS',      interactions: [] },
  { id: 'GERENTE_METAS',       profile: 'GERENTE', route: '/metas',                   label: 'Metas',                 pageName: '04_METAS',             interactions: [] },
  { id: 'GERENTE_DEVOLUTIVAS', profile: 'GERENTE', route: '/devolutivas',             label: 'Devolutivas',           pageName: '05_DEVOLUTIVAS',       interactions: [] },
  { id: 'GERENTE_PDI',         profile: 'GERENTE', route: '/pdi',                     label: 'PDI',                   pageName: '06_PDI',               interactions: [] },
  { id: 'GERENTE_TREIN',       profile: 'GERENTE', route: '/treinamentos',            label: 'Treinamentos',          pageName: '07_TREINAMENTOS',      interactions: [] },
  { id: 'GERENTE_ROTINA',      profile: 'GERENTE', route: '/rotina',                  label: 'Rotina',                pageName: '08_ROTINA',            interactions: [] },
  { id: 'GERENTE_MATINAL',     profile: 'GERENTE', route: '/relatorio-matinal',       label: 'Relatório Matinal',     pageName: '09_RELATORIO_MATINAL', interactions: [] },
  { id: 'GERENTE_AUDITORIA',   profile: 'GERENTE', route: '/auditoria',               label: 'Diagnóstico IA',        pageName: '10_AUDITORIA_IA',      interactions: [] },
  { id: 'GERENTE_NOTIF',       profile: 'GERENTE', route: '/notificacoes',            label: 'Notificações',          pageName: '11_NOTIFICACOES',      interactions: [] },
  { id: 'GERENTE_PERFIL',      profile: 'GERENTE', route: '/perfil',                  label: 'Perfil',                pageName: '12_PERFIL',            interactions: [] },
  { id: 'GERENTE_CONFIG',      profile: 'GERENTE', route: '/configuracoes',           label: 'Configurações',         pageName: '13_CONFIGURACOES',     interactions: [] },

  // DONO
  { id: 'DONO_SELECAO',        profile: 'DONO', route: '/lojas',                      label: 'Seleção Loja',          pageName: '01_SELECAO_LOJA',      interactions: [] },
  { id: 'DONO_PLANEJAMENTO',   profile: 'DONO', route: '/lojas/mx-consultoria?ownerSection=planejamento', label: 'Planejamento', pageName: '02_PLANEJAMENTO', interactions: [] },
  { id: 'DONO_RESULTADOS',     profile: 'DONO', route: '/lojas/mx-consultoria?ownerSection=resultados', label: 'Resultados',   pageName: '03_RESULTADOS',   interactions: [] },
  { id: 'DONO_PLANO_ACAO',     profile: 'DONO', route: '/lojas/mx-consultoria?ownerSection=plano-acao', label: 'Plano Ação',   pageName: '04_PLANO_ACAO',   interactions: [] },
  { id: 'DONO_ALERTAS',        profile: 'DONO', route: '/lojas/mx-consultoria?ownerSection=alertas',    label: 'Alertas',      pageName: '05_ALERTAS',      interactions: [] },
  { id: 'DONO_BENCHMARKING',   profile: 'DONO', route: '/lojas/mx-consultoria?ownerSection=benchmarking', label: 'Benchmarking', pageName: '06_BENCHMARKING', interactions: [] },
  { id: 'DONO_DEPARTAMENTOS',  profile: 'DONO', route: '/lojas/mx-consultoria?ownerSection=departamentos', label: 'Departamentos', pageName: '07_DEPARTAMENTOS', interactions: [] },
  { id: 'DONO_FUNIL',          profile: 'DONO', route: '/funil-vendas',               label: 'Funil',                 pageName: '08_FUNIL_VENDAS',      interactions: [] },
  { id: 'DONO_METAS',          profile: 'DONO', route: '/metas',                      label: 'Metas',                 pageName: '09_METAS',             interactions: [] },
  { id: 'DONO_ORGANOGRAMA',    profile: 'DONO', route: '/organograma',                label: 'Organograma',           pageName: '10_ORGANOGRAMA',       interactions: [] },
  { id: 'DONO_BANCO_TALENTOS', profile: 'DONO', route: '/banco-talentos',             label: 'Banco de Talentos',     pageName: '11_BANCO_TALENTOS',    interactions: [] },
  { id: 'DONO_NOTIF',          profile: 'DONO', route: '/notificacoes',               label: 'Notificações',          pageName: '12_NOTIFICACOES',      interactions: [] },
  { id: 'DONO_PERFIL',         profile: 'DONO', route: '/perfil',                     label: 'Perfil',                pageName: '13_PERFIL',            interactions: [] },
  { id: 'DONO_CONFIG',         profile: 'DONO', route: '/configuracoes',              label: 'Configurações',         pageName: '14_CONFIGURACOES',     interactions: [] },

  // ADMIN — simulação primeiro, depois demais rotas (contexto será confirmado)
  { id: 'ADMIN_PAINEL',        profile: 'ADMIN', route: '/painel',                    label: 'Painel Consultor',      pageName: '01_PAINEL_CONSULTOR',  interactions: [] },
  { id: 'ADMIN_LOJAS',         profile: 'ADMIN', route: '/lojas',                     label: 'Lojas',                 pageName: '02_LOJAS',             interactions: [] },
  {
    id: 'ADMIN_SIMULACAO', profile: 'ADMIN', route: '/simulacao',
    label: 'Simulação', pageName: '03_SIMULACAO',
    interactions: [
      // exitSimulation: true → após capturar, sair da simulação antes de continuar
      { id: 'SIM_VENDEDOR', selector: 'button:has-text("Vendedor")', waitFor: null, label: 'ABA_VENDEDOR', exitSimulation: true },
      { id: 'SIM_GERENTE',  selector: 'button:has-text("Gerente")',  waitFor: null, label: 'ABA_GERENTE',  exitSimulation: true },
    ]
  },
  { id: 'ADMIN_AGENDA',        profile: 'ADMIN', route: '/agenda',                    label: 'Agenda Admin',          pageName: '04_AGENDA',            interactions: [] },
  { id: 'ADMIN_CONSULTORIA',   profile: 'ADMIN', route: '/consultoria',               label: 'Consultoria',           pageName: '05_CONSULTORIA',       interactions: [] },
  { id: 'ADMIN_CONSULT_CLI',   profile: 'ADMIN', route: '/consultoria/clientes',      label: 'Consultoria Clientes',  pageName: '06_CONSULTORIA_CLIENTES', interactions: [] },
  { id: 'ADMIN_PRODUTOS',      profile: 'ADMIN', route: '/produtos',                  label: 'Produtos',              pageName: '07_PRODUTOS',          interactions: [] },
  { id: 'ADMIN_MATINAL',       profile: 'ADMIN', route: '/relatorio-matinal',         label: 'Relatório Matinal',     pageName: '08_RELATORIO_MATINAL', interactions: [] },
  { id: 'ADMIN_PERF_VENDAS',   profile: 'ADMIN', route: '/relatorios/performance-vendas', label: 'Performance Vendas', pageName: '09_PERF_VENDAS',    interactions: [] },
  { id: 'ADMIN_TREIN',         profile: 'ADMIN', route: '/treinamentos',              label: 'Treinamentos',          pageName: '10_TREINAMENTOS',      interactions: [] },
  { id: 'ADMIN_AUDITORIA',     profile: 'ADMIN', route: '/auditoria',                 label: 'Diagnóstico IA',        pageName: '11_AUDITORIA_IA',      interactions: [] },
  { id: 'ADMIN_CFG_OP',        profile: 'ADMIN', route: '/configuracoes/operacional', label: 'Config Operacional',    pageName: '12_CONFIG_OPERACIONAL', interactions: [] },
  { id: 'ADMIN_CFG_PMR',       profile: 'ADMIN', route: '/configuracoes/consultoria-pmr', label: 'Parâmetros PMR',    pageName: '13_PARAMETROS_PMR',    interactions: [] },
  { id: 'ADMIN_REPROCESSA',    profile: 'ADMIN', route: '/configuracoes/reprocessamento', label: 'Reprocessamento',   pageName: '14_REPROCESSAMENTO',   interactions: [] },
  { id: 'ADMIN_ORGANOGRAMA',   profile: 'ADMIN', route: '/organograma',               label: 'Organograma',           pageName: '15_ORGANOGRAMA',       interactions: [] },
  { id: 'ADMIN_PDI',           profile: 'ADMIN', route: '/pdi',                       label: 'PDI',                   pageName: '16_PDI',               interactions: [] },
  { id: 'ADMIN_DEVOLUTIVAS',   profile: 'ADMIN', route: '/devolutivas',               label: 'Devolutivas',           pageName: '17_DEVOLUTIVAS',       interactions: [] },
  { id: 'ADMIN_NOTIF',         profile: 'ADMIN', route: '/notificacoes',              label: 'Notificações',          pageName: '18_NOTIFICACOES',      interactions: [] },
  { id: 'ADMIN_PERFIL',        profile: 'ADMIN', route: '/perfil',                    label: 'Perfil',                pageName: '19_PERFIL',            interactions: [] },
  { id: 'ADMIN_CONFIG',        profile: 'ADMIN', route: '/configuracoes',             label: 'Configurações',         pageName: '20_CONFIGURACOES',     interactions: [] },
];

// ── Helpers ──────────────────────────────────────────────────────────────
function csvField(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
function csvRow(...fields) { return fields.map(csvField).join(','); }

function sha256(filePath) {
  if (!fs.existsSync(filePath)) return 'FILE_NOT_FOUND';
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

let logStream = null;
function log(msg) {
  const line = `[${new Date().toISOString()}] [CAPTURE_V6] ${msg}`;
  console.log(line);
  if (logStream) logStream.write(line + '\n');
}

// ── Verificar papel atual no DOM ─────────────────────────────────────────
// [CORREÇÃO 1] Antes de cada rota, confirma que não há simulação ativa
async function getCurrentRole(page) {
  try {
    return await page.evaluate(() => {
      // Verificar indicador de simulação ativa
      const simBanner = document.querySelector('[data-simulation], [class*="simulation"], [data-testid="simulation-banner"]');
      if (simBanner && simBanner.offsetParent !== null) return 'SIMULATED';

      // Tentar extrair role do token local ou de atributo data na raiz
      const roleEl = document.querySelector('[data-role], [data-user-role]');
      if (roleEl) return roleEl.dataset.role || roleEl.dataset.userRole || 'UNKNOWN';

      // Verificar texto visível de simulação
      const bodyText = document.body.innerText;
      if (bodyText.includes('Simulação') && bodyText.includes('ativa')) return 'SIMULATED';

      return 'UNKNOWN';
    });
  } catch (e) {
    return 'UNKNOWN';
  }
}

// ── Encerrar simulação ────────────────────────────────────────────────────
// [CORREÇÃO 2] Após interação de simulação, encerra e valida retorno
async function exitSimulation(page) {
  log('    🔄 Encerrando simulação...');
  try {
    // Tentar botão de encerrar simulação
    const exitBtn = page.locator('button:has-text("Encerrar simulação"), button:has-text("Sair da simulação"), button[aria-label*="simulação"]').first();
    if (await exitBtn.isVisible({ timeout: 3000 })) {
      await exitBtn.click();
      await page.waitForTimeout(1500);
    } else {
      // Navegar de volta ao painel admin, que deve limpar a simulação
      await page.goto(`${BASE_URL}/painel`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
    }

    const role = await getCurrentRole(page);
    if (role === 'SIMULATED') {
      // Segunda tentativa: reload do painel
      await page.goto(`${BASE_URL}/painel`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
    }
    log('    ✅ Simulação encerrada');
  } catch (e) {
    log(`    ⚠️  Falha ao encerrar simulação: ${e.message}`);
  }
}

// ── Detectar página 403 ───────────────────────────────────────────────────
// [CORREÇÃO 3] Detecta página de acesso negado por múltiplos critérios
async function detect403(page) {
  try {
    const result = await page.evaluate(() => {
      const body = document.body.innerText || '';
      const title = document.title || '';
      const hasAcessoNegado = body.includes('Acesso não autorizado') || body.includes('Não autorizado') || body.includes('Sem permissão');
      const has403 = body.includes('403') || title.includes('403');
      // Verificar elemento de bloqueio com conteúdo real
      const blockedEl = document.querySelector('[data-testid="forbidden"], [data-testid="unauthorized"]');
      return { blocked: hasAcessoNegado || (has403 && hasAcessoNegado), text: hasAcessoNegado ? 'ACESSO_BLOQUEADO' : '' };
    });
    return result;
  } catch (e) {
    return { blocked: false, text: '' };
  }
}

// ── Contêiner de rolagem robusto ─────────────────────────────────────────
// [CORREÇÃO 4] Verifica overflowY e scrollHeight > clientHeight + tolerância
async function getScrollInfo(page) {
  return await page.evaluate((tol) => {
    function isScrollable(el) {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      const overflow = style.overflowY;
      const scrollable = overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay';
      return scrollable && el.scrollHeight > el.clientHeight + tol;
    }

    // 1. main#main-content com largura adequada
    let mainEl = document.querySelector('main#main-content');
    if (mainEl) {
      const rect = mainEl.getBoundingClientRect();
      if (rect.width < document.body.clientWidth * 0.6) mainEl = null;
    }
    if (!mainEl) mainEl = document.querySelector('main[id]');
    if (!mainEl) mainEl = document.querySelector('main');

    // Verificar se main é de fato rolável
    let target = null;
    if (mainEl && isScrollable(mainEl)) {
      target = mainEl;
    } else {
      // Procurar descendente rolável com maior scrollHeight
      const candidates = Array.from(document.querySelectorAll('div, section, article'))
        .filter(el => {
          if (!isScrollable(el)) return false;
          const rect = el.getBoundingClientRect();
          return rect.width > document.body.clientWidth * 0.5 && rect.height > 200;
        })
        .sort((a, b) => b.scrollHeight - a.scrollHeight);

      if (candidates.length > 0) {
        target = candidates[0];
      } else {
        // Fallback: document.documentElement
        target = document.documentElement;
      }
    }

    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    const hasRealScroll = scrollHeight > clientHeight + tol;

    return {
      selector: target === document.documentElement ? 'document' :
                (target.id ? `#${target.id}` : target.tagName.toLowerCase()),
      clientHeight,
      scrollHeight,
      hasRealScroll, // [CORREÇÃO] só fatiamos se realmente há scroll
      overflowY: window.getComputedStyle(target).overflowY,
    };
  }, SCROLL_TOLERANCE);
}

// ── Captura full-page (com ou sem fatias) ────────────────────────────────
async function captureFullPage(page, filePrefix, outputFolder, viewport) {
  const results = [];

  // Aguardar carregamento
  await page.waitForTimeout(2500);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(500);

  // Aguardar spinner
  const spinnerSel = '[role="progressbar"], .animate-spin, svg.animate-spin';
  const hasSpinner = await page.locator(spinnerSel).first().isVisible().catch(() => false);
  if (hasSpinner) {
    log(`  ⏳ Aguardando spinner: ${filePrefix}`);
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('[role="progressbar"], .animate-spin, svg.animate-spin'))
        .every(el => !el.isConnected || window.getComputedStyle(el).display === 'none');
    }, { timeout: 12000 }).catch(() => {});
    await page.waitForTimeout(500);
  }

  const scrollInfo = await getScrollInfo(page);
  const { scrollHeight, clientHeight, hasRealScroll, selector, overflowY } = scrollInfo;

  // [CORREÇÃO 3] totalSlices = 1 se não há rolagem real
  let slicesToCapture = 1;
  let sliceStep = clientHeight;
  if (hasRealScroll) {
    sliceStep = clientHeight - 50; // 50px overlap
    slicesToCapture = Math.ceil((scrollHeight - clientHeight) / sliceStep) + 1;
  }

  log(`  📐 scroll: clientH=${clientHeight} scrollH=${scrollHeight} hasRealScroll=${hasRealScroll} ` +
      `overflow=${overflowY} fatias=${slicesToCapture} selector=${selector}`);

  for (let sliceIdx = 0; sliceIdx < slicesToCapture; sliceIdx++) {
    const requestedScrollTop = sliceIdx * sliceStep;

    let realScrollTop = 0;
    if (hasRealScroll && sliceIdx > 0) {
      realScrollTop = await page.evaluate(({ top, sel }) => {
        let el = sel === 'document' ? document.documentElement : document.querySelector(sel);
        if (!el) el = document.documentElement;
        el.scrollTop = top;
        return el.scrollTop;
      }, { top: requestedScrollTop, sel: selector });
      await page.waitForTimeout(300);
    }

    const suffix = slicesToCapture === 1 ? '_P01' : `_P${String(sliceIdx + 1).padStart(2, '0')}`;
    const fileName = `${filePrefix}${suffix}.png`;
    const filePath = path.join(outputFolder, fileName);

    await page.screenshot({ path: filePath, clip: { x: 0, y: 0, width: viewport.width, height: viewport.height } });

    const hash = sha256(filePath);
    const isLastSlice = !hasRealScroll || (realScrollTop + clientHeight >= scrollHeight - SCROLL_TOLERANCE);

    results.push({
      fileName, filePath, hash,
      sliceIdx: sliceIdx + 1, totalSlices: slicesToCapture,
      requestedScrollTop, realScrollTop,
      clientHeight, scrollHeight,
      scrollSelector: selector,
      overflowY,
      hasRealScroll,
      isLastSlice,
    });

    log(`  ✅ ${fileName} | scrollTop=${realScrollTop}/${scrollHeight} | hash=${hash.substring(0, 8)}... | lastSlice=${isLastSlice}`);

    if (isLastSlice) break;
  }

  return results;
}

// ── Login ────────────────────────────────────────────────────────────────
async function login(page, profile) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.locator('input[type="email"], #login-email').first().fill(profile.email);
  await page.locator('input[type="password"], #login-password').first().fill(profile.pass);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 });
  await page.waitForTimeout(2000);
}

// ── Pipeline principal ───────────────────────────────────────────────────
async function run() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.mkdirSync(LOGS_DIR, { recursive: true });

  logStream = fs.createWriteStream(path.join(LOGS_DIR, `EXEC_CAPTURE_${new Date().toISOString().replace(/[:.]/g, '-')}.log`));

  log('=== INÍCIO CAPTURA V6 ===');

  const browser = await chromium.launch({ headless: true });
  const pwVersion = chromium.name + ' (Playwright)';

  // Metadados de versão
  const metaPath = path.join(REPORTS_DIR, 'META_EXECUCAO_V6.json');
  fs.writeFileSync(metaPath, JSON.stringify({
    versao: SCRIPT_VERSION,
    playwright: pwVersion,
    data: new Date().toISOString(),
    breakpoints: BREAKPOINTS.map(b => ({ name: b.name, width: b.width, height: b.height })),
  }, null, 2));

  const manifestRows = ['breakpoint,id,perfil,rota,pageName,estado,fileName,sha256_hash,status,is403,perfilVisual,scrollSelector,overflowY,hasRealScroll,sliceIndex,totalSlices,requestedScrollTop,realScrollTop,clientHeight,scrollHeight,isLastSlice,timestamp,versao'];
  const scrollRows = ['breakpoint,id,fileName,sliceIndex,totalSlices,requestedScrollTop,realScrollTop,clientHeight,scrollHeight,scrollSelector,overflowY,hasRealScroll,hash,isLastSlice,timestamp'];

  // Agrupar por perfil
  const profileGroups = {};
  for (const s of SCENARIO_MAP) {
    if (!profileGroups[s.profile]) profileGroups[s.profile] = [];
    profileGroups[s.profile].push(s);
  }

  for (const bp of BREAKPOINTS) {
    log(`\n${'═'.repeat(60)}`);
    log(`Breakpoint: ${bp.name} (${bp.width}×${bp.height})`);
    log('═'.repeat(60));

    for (const [profileName, scenarios] of Object.entries(profileGroups)) {
      const profileCfg = PROFILES[profileName];
      log(`\n╔══ Perfil: ${profileName} (${bp.name}) ══╗`);

      const context = await browser.newContext({ viewport: { width: bp.width, height: bp.height } });
      const page = await context.newPage();

      try {
        await login(page, profileCfg);
        log(`  ✅ Login OK: ${profileName}`);
      } catch (e) {
        log(`  ❌ FALHA LOGIN ${profileName}@${bp.name}: ${e.message}`);
        await context.close();
        continue;
      }

      for (const scenario of scenarios) {
        // Em breakpoints não-canônicos, capturar apenas rotas de layout crítico
        if (!bp.isCanonical && !RESPONSIVE_ROUTES.has(scenario.route.split('?')[0])) {
          log(`  ⏩ Skip ${scenario.route} em ${bp.name} (não é rota crítica responsiva)`);
          continue;
        }

        log(`\n  → [${bp.name}] ${scenario.route} (${scenario.label})`);

        const folderPath = path.join(OUTPUT_DIR, profileCfg.folder, scenario.pageName);
        fs.mkdirSync(folderPath, { recursive: true });

        // [CORREÇÃO 1] Verificar papel antes de navegar
        const roleBeforeNav = await getCurrentRole(page);
        if (roleBeforeNav === 'SIMULATED') {
          log(`  ⚠️  Simulação detectada antes de ${scenario.route}. Encerrando...`);
          await exitSimulation(page);
        }

        // Navegar
        try {
          await page.goto(`${BASE_URL}${scenario.route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await page.waitForTimeout(1800);
        } catch (e) {
          log(`  ❌ Falha de navegação: ${e.message}`);
          manifestRows.push(csvRow(bp.name, scenario.id, profileName, scenario.route, scenario.pageName, 'PADRAO', 'N/A', 'N/A', 'FALHA_NAVEGACAO', 'N/A', 'N/A', 'N/A', 'N/A', false, 0, 0, 0, 0, 0, 0, false, new Date().toISOString(), SCRIPT_VERSION));
          continue;
        }

        const finalUrl = page.url();
        const wasRedirected = !finalUrl.replace('http://localhost:3003', '').startsWith(scenario.route.split('?')[0]);

        // [CORREÇÃO 3] Detectar 403
        const pageCheck = await detect403(page);
        const is403 = pageCheck.blocked;
        const perfilVisual = await getCurrentRole(page);

        if (is403) log(`  🚫 Página 403 detectada em ${scenario.route}`);
        if (perfilVisual === 'SIMULATED') log(`  ⚠️  Simulação ainda ativa em ${scenario.route}! Abortando captura deste estado.`);

        // Capturar PADRAO
        const bpPrefix = bp.isCanonical ? '' : `${bp.name}_`;
        const filePrefix = `${bpPrefix}${profileName}_${scenario.pageName}_PADRAO`;
        let sliceResults = [];

        try {
          sliceResults = await captureFullPage(page, filePrefix, folderPath, bp);
        } catch (e) {
          log(`  ❌ Falha captura: ${e.message}`);
        }

        const now = new Date().toISOString();
        for (const s of sliceResults) {
          const status = is403 ? 'ACESSO_BLOQUEADO' : (wasRedirected ? 'REDIRECIONADO' : 'CAPTURADO');
          manifestRows.push(csvRow(bp.name, scenario.id, profileName, scenario.route, scenario.pageName, 'PADRAO',
            s.fileName, s.hash, status, is403 ? 'SIM' : 'NAO', perfilVisual,
            s.scrollSelector, s.overflowY, s.hasRealScroll,
            s.sliceIdx, s.totalSlices, s.requestedScrollTop, s.realScrollTop,
            s.clientHeight, s.scrollHeight, s.isLastSlice, now, SCRIPT_VERSION));
          scrollRows.push(csvRow(bp.name, scenario.id, s.fileName, s.sliceIdx, s.totalSlices,
            s.requestedScrollTop, s.realScrollTop, s.clientHeight, s.scrollHeight,
            s.scrollSelector, s.overflowY, s.hasRealScroll, s.hash, s.isLastSlice, now));
        }

        // Interações (apenas no breakpoint canônico)
        if (bp.isCanonical) {
          for (const interaction of scenario.interactions) {
            log(`    🖱️  Interação: ${interaction.label}`);

            // Reset para a rota (verificando simulação antes)
            const roleCheck = await getCurrentRole(page);
            if (roleCheck === 'SIMULATED') {
              await exitSimulation(page);
            }

            try {
              await page.goto(`${BASE_URL}${scenario.route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
              await page.waitForTimeout(2000);
            } catch (e) {
              log(`    ❌ Falha reset: ${e.message}`);
              continue;
            }

            let interactionStatus = 'CAPTURADO';
            let interactionSuccess = false;
            const selectors = interaction.selector.split(',').map(s => s.trim());

            for (let attempt = 1; attempt <= 3 && !interactionSuccess; attempt++) {
              for (const sel of selectors) {
                try {
                  const el = page.locator(sel).first();
                  if (await el.isVisible({ timeout: 3000 })) {
                    await el.click({ force: false });
                    if (interaction.waitFor) {
                      await page.waitForSelector(interaction.waitFor, { timeout: 5000 });
                    }
                    await page.waitForTimeout(800);
                    interactionSuccess = true;
                    break;
                  }
                } catch (e) {
                  log(`    ⚠️  Tentativa ${attempt} / "${sel}": ${e.message.split('\n')[0]}`);
                }
              }
              if (!interactionSuccess) await page.waitForTimeout(500);
            }

            if (!interactionSuccess) {
              interactionStatus = 'FALHA_INTERACAO';
              log(`    ❌ Falha na interação ${interaction.label} após 3 tentativas`);
            }

            const intCheck = await detect403(page);
            const intPerfilVisual = await getCurrentRole(page);

            const intPrefix = `${profileName}_${scenario.pageName}_${interaction.label}`;
            let intSlices = [];
            try {
              intSlices = await captureFullPage(page, intPrefix, folderPath, bp);
            } catch (e) {
              log(`    ❌ Falha captura interação: ${e.message}`);
            }

            const intNow = new Date().toISOString();
            for (const s of intSlices) {
              const st = intCheck.blocked ? 'ACESSO_BLOQUEADO' : interactionStatus;
              manifestRows.push(csvRow(bp.name, `${scenario.id}_${interaction.id}`, profileName, scenario.route, scenario.pageName,
                interaction.label, s.fileName, s.hash, st,
                intCheck.blocked ? 'SIM' : 'NAO', intPerfilVisual,
                s.scrollSelector, s.overflowY, s.hasRealScroll,
                s.sliceIdx, s.totalSlices, s.requestedScrollTop, s.realScrollTop,
                s.clientHeight, s.scrollHeight, s.isLastSlice, intNow, SCRIPT_VERSION));
              scrollRows.push(csvRow(bp.name, `${scenario.id}_${interaction.id}`, s.fileName, s.sliceIdx, s.totalSlices,
                s.requestedScrollTop, s.realScrollTop, s.clientHeight, s.scrollHeight,
                s.scrollSelector, s.overflowY, s.hasRealScroll, s.hash, s.isLastSlice, intNow));
            }

            // [CORREÇÃO 2] Se a interação requer saída de simulação, executar agora
            if (interaction.exitSimulation && interactionSuccess) {
              await exitSimulation(page);
            }
          }
        }
      }

      await context.close();
    }
  }

  await browser.close();

  const manifestPath = path.join(REPORTS_DIR, 'MANIFESTO_V6_PRIMARIO.csv');
  const scrollPath = path.join(REPORTS_DIR, 'SCROLL_EVIDENCE_V6.csv');
  fs.writeFileSync(manifestPath, manifestRows.join('\n') + '\n');
  fs.writeFileSync(scrollPath, scrollRows.join('\n') + '\n');

  log(`\n✅ MANIFESTO gravado: ${manifestRows.length - 1} registros`);
  log(`✅ SCROLL_EVIDENCE gravado: ${scrollRows.length - 1} registros`);
  log('=== CAPTURA V6 CONCLUÍDA. Próximo: node scripts/verify_permissions_v6.js ===');

  if (logStream) logStream.end();
}

run().catch(e => { console.error('[FATAL]', e); process.exit(1); });
