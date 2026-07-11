/**
 * capture_mx_v5.js — Auditoria V5 Definitiva
 *
 * Versão: 5.0.0
 *
 * Correções vs V3:
 * - Escopo completo restaurado: todas as rotas reais do App.tsx
 * - Full-page via fatias _P01, _P02 com rollagem real do main#main-content
 * - SCROLL_EVIDENCE_V5.csv com scrollTop/scrollHeight/clientHeight por fatia
 * - CSV com escaping adequado (quoting de todos os campos de texto)
 * - Scripts incluídos no pacote final
 * - Separação clara: este script NÃO valida — apenas captura
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ── Configurações ──────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:3003';
const OUTPUT_DIR = '/Users/pedroguilherme/Pictures/PRINT REVISÃO MX';
const REPORTS_DIR = path.join(OUTPUT_DIR, '05_RELATORIOS');
const SCRIPT_VERSION = '5.0.0';
const VIEWPORT = { width: 1440, height: 900 }; // Desktop canônico para cobertura funcional
const SCROLL_TOLERANCE = 4; // px de tolerância para fim de página

// ── Credenciais ─────────────────────────────────────────────────────────────
const PROFILES = Object.fromEntries([
  ['VENDEDOR', '01_MODULO_VENDEDOR'],
  ['GERENTE', '02_MODULO_GERENTE'],
  ['DONO', '03_MODULO_DONO'],
  ['ADMIN', '04_MODULO_ADMIN_MX'],
].map(([role, folder]) => [role, {
  email: process.env[`MX_${role}_EMAIL`],
  pass: process.env[`MX_${role}_PASSWORD`],
  folder,
}]));

function requireProfiles() {
  const missing = Object.entries(PROFILES).flatMap(([role, profile]) => [
    !profile.email && `MX_${role}_EMAIL`,
    !profile.pass && `MX_${role}_PASSWORD`,
  ]).filter(Boolean);
  if (missing.length > 0) throw new Error(`Variáveis obrigatórias ausentes: ${missing.join(', ')}`);
}

// ── Mapa completo de rotas por perfil ─────────────────────────────────────
// Formato: { id, route, label, pageName, interactions, permittedFor }
// interactions: lista de ações que geram estados alternativos
const SCENARIO_MAP = [
  // ─── VENDEDOR ───────────────────────────────────────────────────────────
  {
    id: 'VENDEDOR_HOME', profile: 'VENDEDOR', route: '/home',
    label: 'Dashboard Home', pageName: '01_DASHBOARD',
    interactions: [
      { id: 'NOTIFICACOES', action: 'click', selector: 'button[aria-label="Notificações"], button:has(svg[data-lucide="bell"])', waitFor: 'text=Notificações', label: 'NOTIFICACOES_ABERTAS' },
    ]
  },
  {
    id: 'VENDEDOR_TERMINAL', profile: 'VENDEDOR', route: '/vendedor/terminal-mx',
    label: 'Terminal MX (Fechamento)', pageName: '02_TERMINAL_MX',
    interactions: [
      { id: 'MODAL_REGULARIZAR', action: 'click', selector: 'button:has-text("Regularizar")', waitFor: '[role="dialog"]', label: 'MODAL_REGULARIZAR' },
    ]
  },
  {
    id: 'VENDEDOR_CARTEIRA', profile: 'VENDEDOR', route: '/carteira-clientes',
    label: 'Carteira de Clientes', pageName: '03_CARTEIRA_CLIENTES',
    interactions: []
  },
  {
    id: 'VENDEDOR_FUNIL', profile: 'VENDEDOR', route: '/meu-funil',
    label: 'Meu Funil', pageName: '04_MEU_FUNIL',
    interactions: []
  },
  {
    id: 'VENDEDOR_CENTRAL', profile: 'VENDEDOR', route: '/central-execucao',
    label: 'Central de Execução', pageName: '05_CENTRAL_EXECUCAO',
    interactions: []
  },
  {
    id: 'VENDEDOR_RELATORIOS', profile: 'VENDEDOR', route: '/relatorios',
    label: 'Relatórios Vendedor', pageName: '06_RELATORIOS',
    interactions: []
  },
  {
    id: 'VENDEDOR_DESENVOLVIMENTO', profile: 'VENDEDOR', route: '/desenvolvimento',
    label: 'Desenvolvimento', pageName: '07_DESENVOLVIMENTO',
    interactions: [
      { id: 'TAB_PDI', action: 'click', selector: '[role="tab"]:has-text("PDI")', waitFor: 'text=PDI', label: 'ABA_PDI' },
      { id: 'TAB_FEEDBACK', action: 'click', selector: '[role="tab"]:has-text("Feedback"), [role="tab"]:has-text("Devolutiva")', waitFor: null, label: 'ABA_FEEDBACK' },
    ]
  },
  {
    id: 'VENDEDOR_UNIVERSIDADE', profile: 'VENDEDOR', route: '/universidade-mx',
    label: 'Universidade MX', pageName: '08_UNIVERSIDADE_MX',
    interactions: []
  },
  {
    id: 'VENDEDOR_RANKING', profile: 'VENDEDOR', route: '/ranking',
    label: 'Ranking', pageName: '09_RANKING',
    interactions: []
  },
  {
    id: 'VENDEDOR_NOTIFICACOES', profile: 'VENDEDOR', route: '/notificacoes',
    label: 'Notificações', pageName: '10_NOTIFICACOES',
    interactions: []
  },
  {
    id: 'VENDEDOR_PERFIL', profile: 'VENDEDOR', route: '/perfil',
    label: 'Meu Perfil', pageName: '11_PERFIL',
    interactions: []
  },
  {
    id: 'VENDEDOR_CONFIG', profile: 'VENDEDOR', route: '/configuracoes',
    label: 'Configurações', pageName: '12_CONFIGURACOES',
    interactions: []
  },
  {
    id: 'VENDEDOR_AJUDA', profile: 'VENDEDOR', route: '/ajuda',
    label: 'Ajuda', pageName: '13_AJUDA',
    interactions: []
  },

  // ─── GERENTE ────────────────────────────────────────────────────────────
  {
    id: 'GERENTE_HOME', profile: 'GERENTE', route: '/home',
    label: 'Dashboard Gerente', pageName: '01_DASHBOARD',
    interactions: []
  },
  {
    id: 'GERENTE_EQUIPE', profile: 'GERENTE', route: '/lojas/mx-consultoria?tab=equipe',
    label: 'Equipe', pageName: '02_EQUIPE',
    interactions: []
  },
  {
    id: 'GERENTE_FUNIL', profile: 'GERENTE', route: '/funil-vendas',
    label: 'Funil de Vendas', pageName: '03_FUNIL_VENDAS',
    interactions: []
  },
  {
    id: 'GERENTE_METAS', profile: 'GERENTE', route: '/metas',
    label: 'Metas', pageName: '04_METAS',
    interactions: []
  },
  {
    id: 'GERENTE_DEVOLUTIVAS', profile: 'GERENTE', route: '/devolutivas',
    label: 'Devolutivas / Feedback', pageName: '05_DEVOLUTIVAS',
    interactions: []
  },
  {
    id: 'GERENTE_PDI', profile: 'GERENTE', route: '/pdi',
    label: 'PDI', pageName: '06_PDI',
    interactions: []
  },
  {
    id: 'GERENTE_TREINAMENTOS', profile: 'GERENTE', route: '/treinamentos',
    label: 'Treinamentos', pageName: '07_TREINAMENTOS',
    interactions: []
  },
  {
    id: 'GERENTE_ROTINA', profile: 'GERENTE', route: '/rotina',
    label: 'Rotina do Gerente', pageName: '08_ROTINA',
    interactions: []
  },
  {
    id: 'GERENTE_RELMATINAL', profile: 'GERENTE', route: '/relatorio-matinal',
    label: 'Relatório Matinal', pageName: '09_RELATORIO_MATINAL',
    interactions: []
  },
  {
    id: 'GERENTE_AUDITORIA', profile: 'GERENTE', route: '/auditoria',
    label: 'Auditoria / Diagnóstico IA', pageName: '10_AUDITORIA_IA',
    interactions: []
  },
  {
    id: 'GERENTE_NOTIFICACOES', profile: 'GERENTE', route: '/notificacoes',
    label: 'Notificações', pageName: '11_NOTIFICACOES',
    interactions: []
  },
  {
    id: 'GERENTE_PERFIL', profile: 'GERENTE', route: '/perfil',
    label: 'Perfil', pageName: '12_PERFIL',
    interactions: []
  },
  {
    id: 'GERENTE_CONFIG', profile: 'GERENTE', route: '/configuracoes',
    label: 'Configurações', pageName: '13_CONFIGURACOES',
    interactions: []
  },

  // ─── DONO ───────────────────────────────────────────────────────────────
  {
    id: 'DONO_SELECAO', profile: 'DONO', route: '/lojas',
    label: 'Seleção de Loja', pageName: '01_SELECAO_LOJA',
    interactions: []
  },
  {
    id: 'DONO_PLANEJAMENTO', profile: 'DONO', route: '/lojas/mx-consultoria?ownerSection=planejamento',
    label: 'Cockpit Dono — Planejamento', pageName: '02_PLANEJAMENTO',
    interactions: []
  },
  {
    id: 'DONO_RESULTADOS', profile: 'DONO', route: '/lojas/mx-consultoria?ownerSection=resultados',
    label: 'Cockpit Dono — Resultados', pageName: '03_RESULTADOS',
    interactions: []
  },
  {
    id: 'DONO_PLANO_ACAO', profile: 'DONO', route: '/lojas/mx-consultoria?ownerSection=plano-acao',
    label: 'Cockpit Dono — Plano de Ação', pageName: '04_PLANO_ACAO',
    interactions: []
  },
  {
    id: 'DONO_ALERTAS', profile: 'DONO', route: '/lojas/mx-consultoria?ownerSection=alertas',
    label: 'Cockpit Dono — Alertas', pageName: '05_ALERTAS',
    interactions: []
  },
  {
    id: 'DONO_BENCHMARKING', profile: 'DONO', route: '/lojas/mx-consultoria?ownerSection=benchmarking',
    label: 'Cockpit Dono — Benchmarking', pageName: '06_BENCHMARKING',
    interactions: []
  },
  {
    id: 'DONO_DEPARTAMENTOS', profile: 'DONO', route: '/lojas/mx-consultoria?ownerSection=departamentos',
    label: 'Cockpit Dono — Departamentos', pageName: '07_DEPARTAMENTOS',
    interactions: []
  },
  {
    id: 'DONO_FUNIL', profile: 'DONO', route: '/funil-vendas',
    label: 'Funil de Vendas', pageName: '08_FUNIL_VENDAS',
    interactions: []
  },
  {
    id: 'DONO_METAS', profile: 'DONO', route: '/metas',
    label: 'Metas', pageName: '09_METAS',
    interactions: []
  },
  {
    id: 'DONO_ORGANOGRAMA', profile: 'DONO', route: '/organograma',
    label: 'Organograma', pageName: '10_ORGANOGRAMA',
    interactions: []
  },
  {
    id: 'DONO_BANCO_TALENTOS', profile: 'DONO', route: '/banco-talentos',
    label: 'Banco de Talentos', pageName: '11_BANCO_TALENTOS',
    interactions: []
  },
  {
    id: 'DONO_NOTIFICACOES', profile: 'DONO', route: '/notificacoes',
    label: 'Notificações', pageName: '12_NOTIFICACOES',
    interactions: []
  },
  {
    id: 'DONO_PERFIL', profile: 'DONO', route: '/perfil',
    label: 'Perfil', pageName: '13_PERFIL',
    interactions: []
  },
  {
    id: 'DONO_CONFIG', profile: 'DONO', route: '/configuracoes',
    label: 'Configurações', pageName: '14_CONFIGURACOES',
    interactions: []
  },

  // ─── ADMIN ──────────────────────────────────────────────────────────────
  {
    id: 'ADMIN_PAINEL', profile: 'ADMIN', route: '/painel',
    label: 'Painel Consultor', pageName: '01_PAINEL_CONSULTOR',
    interactions: []
  },
  {
    id: 'ADMIN_LOJAS', profile: 'ADMIN', route: '/lojas',
    label: 'Lojas', pageName: '02_LOJAS',
    interactions: []
  },
  {
    id: 'ADMIN_SIMULACAO', profile: 'ADMIN', route: '/simulacao',
    label: 'Simulação', pageName: '03_SIMULACAO',
    interactions: [
      { id: 'TAB_VENDEDOR', action: 'click', selector: 'button:has-text("Vendedor"), a:has-text("Vendedor")', waitFor: null, label: 'ABA_VENDEDOR' },
      { id: 'TAB_GERENTE', action: 'click', selector: 'button:has-text("Gerente"), a:has-text("Gerente")', waitFor: null, label: 'ABA_GERENTE' },
    ]
  },
  {
    id: 'ADMIN_AGENDA', profile: 'ADMIN', route: '/agenda',
    label: 'Agenda Admin', pageName: '04_AGENDA',
    interactions: []
  },
  {
    id: 'ADMIN_CONSULTORIA', profile: 'ADMIN', route: '/consultoria',
    label: 'Consultoria', pageName: '05_CONSULTORIA',
    interactions: []
  },
  {
    id: 'ADMIN_CONSULTORIA_CLIENTES', profile: 'ADMIN', route: '/consultoria/clientes',
    label: 'Consultoria — Clientes', pageName: '06_CONSULTORIA_CLIENTES',
    interactions: []
  },
  {
    id: 'ADMIN_PRODUTOS', profile: 'ADMIN', route: '/produtos',
    label: 'Produtos Digitais', pageName: '07_PRODUTOS',
    interactions: []
  },
  {
    id: 'ADMIN_RELATORIO_MATINAL', profile: 'ADMIN', route: '/relatorio-matinal',
    label: 'Relatório Matinal', pageName: '08_RELATORIO_MATINAL',
    interactions: []
  },
  {
    id: 'ADMIN_PERF_VENDAS', profile: 'ADMIN', route: '/relatorios/performance-vendas',
    label: 'Performance de Vendas', pageName: '09_PERF_VENDAS',
    interactions: []
  },
  {
    id: 'ADMIN_TREINAMENTOS', profile: 'ADMIN', route: '/treinamentos',
    label: 'Treinamentos', pageName: '10_TREINAMENTOS',
    interactions: []
  },
  {
    id: 'ADMIN_AUDITORIA', profile: 'ADMIN', route: '/auditoria',
    label: 'Auditoria / Diagnóstico IA', pageName: '11_AUDITORIA_IA',
    interactions: []
  },
  {
    id: 'ADMIN_CONFIG_OPERACIONAL', profile: 'ADMIN', route: '/configuracoes/operacional',
    label: 'Config. Operacional', pageName: '12_CONFIG_OPERACIONAL',
    interactions: []
  },
  {
    id: 'ADMIN_CONFIG_PMR', profile: 'ADMIN', route: '/configuracoes/consultoria-pmr',
    label: 'Parâmetros PMR', pageName: '13_PARAMETROS_PMR',
    interactions: []
  },
  {
    id: 'ADMIN_REPROCESSAMENTO', profile: 'ADMIN', route: '/configuracoes/reprocessamento',
    label: 'Reprocessamento', pageName: '14_REPROCESSAMENTO',
    interactions: []
  },
  {
    id: 'ADMIN_ORGANOGRAMA', profile: 'ADMIN', route: '/organograma',
    label: 'Organograma', pageName: '15_ORGANOGRAMA',
    interactions: []
  },
  {
    id: 'ADMIN_PDI', profile: 'ADMIN', route: '/pdi',
    label: 'PDI', pageName: '16_PDI',
    interactions: []
  },
  {
    id: 'ADMIN_DEVOLUTIVAS', profile: 'ADMIN', route: '/devolutivas',
    label: 'Devolutivas', pageName: '17_DEVOLUTIVAS',
    interactions: []
  },
  {
    id: 'ADMIN_NOTIFICACOES', profile: 'ADMIN', route: '/notificacoes',
    label: 'Notificações', pageName: '18_NOTIFICACOES',
    interactions: []
  },
  {
    id: 'ADMIN_PERFIL', profile: 'ADMIN', route: '/perfil',
    label: 'Perfil', pageName: '19_PERFIL',
    interactions: []
  },
  {
    id: 'ADMIN_CONFIG', profile: 'ADMIN', route: '/configuracoes',
    label: 'Configurações Gerais', pageName: '20_CONFIGURACOES',
    interactions: []
  },
];

// ── Helpers CSV (safe quoting) ─────────────────────────────────────────────
function csvField(val) {
  const s = String(val ?? '');
  // Obrigatório fazer quote se contiver vírgula, aspas ou newlines
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
function csvRow(...fields) {
  return fields.map(csvField).join(',');
}

function sha256(filePath) {
  if (!fs.existsSync(filePath)) return 'FILE_NOT_FOUND';
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] [CAPTURE_V5] ${msg}`);
}

// ── Lógica principal de rolagem e captura por fatias ──────────────────────
async function captureFullPage(page, filePrefix, outputFolder) {
  const results = [];

  // Aguardar carregamento inicial (sem skeleton loading)
  await page.waitForTimeout(2500);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(500);

  // Detectar loading spinner e aguardar
  const spinnerSel = '[role="progressbar"], .animate-spin, svg.animate-spin';
  const hasSpinner = await page.locator(spinnerSel).first().isVisible().catch(() => false);
  if (hasSpinner) {
    log(`  ⏳ Aguardando spinner desaparecer em ${filePrefix}...`);
    await page.waitForFunction(() => {
      const spinners = document.querySelectorAll('[role="progressbar"], .animate-spin, svg.animate-spin');
      return spinners.length === 0 || Array.from(spinners).every(el => !el.isConnected || window.getComputedStyle(el).display === 'none');
    }, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);
  }

  // Identificar contêiner principal de rolagem
  const scrollInfo = await page.evaluate(() => {
    // Prioridade: main#main-content
    const FORBIDDEN_SELECTORS = ['nav', 'aside', '[role="navigation"]', '[aria-hidden="true"]'];

    let mainEl = document.querySelector('main#main-content');
    if (!mainEl) mainEl = document.querySelector('main[id]');
    if (!mainEl) mainEl = document.querySelector('main');

    // Verificar se é o contêiner correto (não sidebar)
    if (mainEl) {
      const rect = mainEl.getBoundingClientRect();
      const bodyWidth = document.body.clientWidth;
      // Rejeitar se menos de 60% da largura total (provavelmente sidebar)
      if (rect.width < bodyWidth * 0.6) mainEl = null;
    }

    const target = mainEl || document.documentElement;

    return {
      selector: mainEl ? `main#${mainEl.id || 'main-content'}` : 'document',
      clientHeight: target.clientHeight,
      scrollHeight: target.scrollHeight,
      scrollWidth: target.scrollWidth,
    };
  });

  const { scrollHeight, clientHeight } = scrollInfo;
  const sliceStep = clientHeight - 50; // 50px de overlap para continuidade
  const totalSlices = Math.ceil(scrollHeight / sliceStep);

  log(`  📐 scroll: clientH=${clientHeight} scrollH=${scrollHeight} total_fatias=${totalSlices}`);

  for (let sliceIdx = 0; sliceIdx < totalSlices; sliceIdx++) {
    const requestedScrollTop = sliceIdx * sliceStep;

    // Executar rolagem
    const realScrollTop = await page.evaluate(({ top, forbidden }) => {
      let el = document.querySelector('main#main-content') || document.querySelector('main') || document.documentElement;
      const rect = el.getBoundingClientRect();
      const bodyWidth = document.body.clientWidth;
      if (rect.width < bodyWidth * 0.6) el = document.documentElement;
      el.scrollTop = top;
      return el.scrollTop;
    }, { top: requestedScrollTop, forbidden: [] });

    await page.waitForTimeout(300);

    const suffix = totalSlices === 1 ? '' : `_P${String(sliceIdx + 1).padStart(2, '0')}`;
    const fileName = `${filePrefix}${suffix}.png`;
    const filePath = path.join(outputFolder, fileName);

    // Screenshot do viewport atual
    await page.screenshot({ path: filePath, clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height } });

    const hash = sha256(filePath);
    const isLastSlice = realScrollTop + clientHeight >= scrollHeight - SCROLL_TOLERANCE;

    results.push({
      fileName, filePath, hash, sliceIdx: sliceIdx + 1, totalSlices,
      requestedScrollTop, realScrollTop, clientHeight, scrollHeight,
      scrollSelector: scrollInfo.selector,
      isLastSlice,
    });

    log(`  ✅ ${fileName} | scrollTop=${realScrollTop}/${scrollHeight} | hash=${hash.substring(0, 8)}...`);

    // Condição de término: chegou no final
    if (isLastSlice) break;
  }

  return results;
}

// ── Autenticação ─────────────────────────────────────────────────────────
async function login(page, profile) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  await page.locator('input[type="email"], #login-email, input[placeholder*="email" i]').first().fill(profile.email);
  await page.locator('input[type="password"], #login-password').first().fill(profile.pass);
  await page.locator('button[type="submit"]').first().click();

  // Aguardar redirecionamento pós-login
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 });
  await page.waitForTimeout(1500);
}

// ── Pipeline principal ───────────────────────────────────────────────────
async function run() {
  log('=== INÍCIO CAPTURA V5 ===');
  requireProfiles();

  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  // Streams de CSV
  const manifestRows = ['id,perfil,rota,pageName,estado,fileName,sha256_hash,status,scrollSelector,sliceIndex,totalSlices,requestedScrollTop,realScrollTop,clientHeight,scrollHeight,isLastSlice,timestamp,versao'];
  const scrollRows = ['id,fileName,sliceIndex,totalSlices,requestedScrollTop,realScrollTop,clientHeight,scrollHeight,scrollSelector,hash,isLastSlice,timestamp'];

  const browser = await chromium.launch({ headless: true });

  // Processar por perfil (sessão separada por perfil)
  const profileGroups = {};
  for (const scenario of SCENARIO_MAP) {
    if (!profileGroups[scenario.profile]) profileGroups[scenario.profile] = [];
    profileGroups[scenario.profile].push(scenario);
  }

  for (const [profileName, scenarios] of Object.entries(profileGroups)) {
    const profileCfg = PROFILES[profileName];
    log(`\n═══ Perfil: ${profileName} ═══`);

    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();

    try {
      await login(page, profileCfg);
      log(`  Autenticado como ${profileName}`);
    } catch (e) {
      log(`  ❌ FALHA LOGIN ${profileName}: ${e.message}`);
      await context.close();
      continue;
    }

    for (const scenario of scenarios) {
      log(`\n  → Rota: ${scenario.route} (${scenario.label})`);

      const folderPath = path.join(OUTPUT_DIR, profileCfg.folder, scenario.pageName);
      fs.mkdirSync(folderPath, { recursive: true });

      // Navegar para a rota
      try {
        await page.goto(`${BASE_URL}${scenario.route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2000);
      } catch (e) {
        log(`  ❌ Falha de navegação para ${scenario.route}: ${e.message}`);
        const now = new Date().toISOString();
        manifestRows.push(csvRow(scenario.id, profileName, scenario.route, scenario.pageName, 'PADRAO', 'N/A', 'N/A', 'FALHA_NAVEGACAO', 'N/A', 0, 0, 0, 0, 0, 0, false, now, SCRIPT_VERSION));
        continue;
      }

      // Detectar redirecionamento (rota proibida para o perfil)
      const finalUrl = page.url();
      const wasRedirected = !finalUrl.includes(scenario.route.replace(/\?.*/, '').replace('/lojas/mx-consultoria', ''));

      // Capturar estado PADRAO
      const filePrefix = `${profileName}_${scenario.pageName}_PADRAO`;
      let sliceResults = [];
      try {
        sliceResults = await captureFullPage(page, filePrefix, folderPath);
      } catch (e) {
        log(`  ❌ Falha captura ${filePrefix}: ${e.message}`);
        const now = new Date().toISOString();
        manifestRows.push(csvRow(scenario.id, profileName, scenario.route, scenario.pageName, 'PADRAO', filePrefix + '.png', 'N/A', 'FALHA_CAPTURA', 'N/A', 0, 0, 0, 0, 0, 0, false, now, SCRIPT_VERSION));
        continue;
      }

      const now = new Date().toISOString();
      for (const s of sliceResults) {
        const status = wasRedirected ? 'REDIRECIONADO' : 'CAPTURADO';
        manifestRows.push(csvRow(scenario.id, profileName, scenario.route, scenario.pageName, 'PADRAO', s.fileName, s.hash, status, s.scrollSelector, s.sliceIdx, s.totalSlices, s.requestedScrollTop, s.realScrollTop, s.clientHeight, s.scrollHeight, s.isLastSlice, now, SCRIPT_VERSION));
        scrollRows.push(csvRow(scenario.id, s.fileName, s.sliceIdx, s.totalSlices, s.requestedScrollTop, s.realScrollTop, s.clientHeight, s.scrollHeight, s.scrollSelector, s.hash, s.isLastSlice, now));
      }

      // Capturar estados de interação
      for (const interaction of scenario.interactions) {
        log(`    🖱️  Interação: ${interaction.label}`);

        // Resetar para a rota original antes de interagir
        try {
          await page.goto(`${BASE_URL}${scenario.route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await page.waitForTimeout(2000);
        } catch (e) {
          log(`    ❌ Falha reset rota: ${e.message}`);
          continue;
        }

        let interactionStatus = 'CAPTURADO';
        let interactionMessage = '';

        // Tentar a ação até 3 vezes
        let interactionSuccess = false;
        const selectorVariants = interaction.selector.split(',').map(s => s.trim());

        for (let attempt = 1; attempt <= 3 && !interactionSuccess; attempt++) {
          for (const sel of selectorVariants) {
            try {
              const el = page.locator(sel).first();
              const isVisible = await el.isVisible({ timeout: 3000 });
              if (isVisible) {
                await el.click({ force: false });
                if (interaction.waitFor) {
                  await page.waitForSelector(interaction.waitFor, { timeout: 5000 });
                }
                await page.waitForTimeout(800);
                interactionSuccess = true;
                break;
              }
            } catch (e) {
              interactionMessage = `Tentativa ${attempt} / seletor "${sel}": ${e.message.split('\n')[0]}`;
            }
          }
          if (!interactionSuccess) await page.waitForTimeout(500);
        }

        if (!interactionSuccess) {
          interactionStatus = 'FALHA_INTERACAO';
          log(`    ⚠️  Falha na interação ${interaction.label} após 3 tentativas`);
        }

        const intPrefix = `${profileName}_${scenario.pageName}_${interaction.label}`;
        let intSlices = [];
        try {
          intSlices = await captureFullPage(page, intPrefix, folderPath);
        } catch (e) {
          log(`    ❌ Falha captura interação ${intPrefix}: ${e.message}`);
        }

        const intNow = new Date().toISOString();
        for (const s of intSlices) {
          manifestRows.push(csvRow(
            `${scenario.id}_${interaction.id}`, profileName, scenario.route, scenario.pageName,
            interaction.label, s.fileName, s.hash, interactionStatus,
            s.scrollSelector, s.sliceIdx, s.totalSlices, s.requestedScrollTop,
            s.realScrollTop, s.clientHeight, s.scrollHeight, s.isLastSlice,
            intNow, SCRIPT_VERSION
          ));
          scrollRows.push(csvRow(
            `${scenario.id}_${interaction.id}`, s.fileName, s.sliceIdx, s.totalSlices,
            s.requestedScrollTop, s.realScrollTop, s.clientHeight, s.scrollHeight,
            s.scrollSelector, s.hash, s.isLastSlice, intNow
          ));
        }
      }
    }

    await context.close();
  }

  await browser.close();

  // Gravar CSVs
  const manifestPath = path.join(REPORTS_DIR, 'MANIFESTO_V5_PRIMARIO.csv');
  const scrollPath = path.join(REPORTS_DIR, 'SCROLL_EVIDENCE_V5.csv');

  fs.writeFileSync(manifestPath, manifestRows.join('\n') + '\n');
  fs.writeFileSync(scrollPath, scrollRows.join('\n') + '\n');

  log(`\n✅ MANIFESTO gravado: ${manifestPath} (${manifestRows.length - 1} registros)`);
  log(`✅ SCROLL_EVIDENCE gravado: ${scrollPath} (${scrollRows.length - 1} registros)`);
  log('=== CAPTURA V5 CONCLUÍDA. Próximo passo: node scripts/verify_permissions_v5.js ===');
}

run().catch(e => {
  console.error('[FATAL]', e);
  process.exit(1);
});
