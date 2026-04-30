# Epic: Technical Debt Resolution — MX Performance

**Epic ID:** EPIC-TD-001
**Status:** PLANNING
**Total Story Points:** 71h (31 OPEN + 4 RESOLVED + 1 DEFERRED + 3 agrupamentos)
**Sprints:** 3
**Budget Aprovado:** ~45h (gap de +26h identificado — ver Seção de Orçamento)
**Owner:** @pm (Morgan)
**Baseado em:** Technical Debt Assessment v2.1 FINAL + DB Specialist Review + UX Specialist Review + QA Review

---

## Stack & Contexto

| Item | Valor |
|------|-------|
| Framework | React 19 + TypeScript |
| Backend | Supabase PG17 |
| Estilização | Tailwind v4 |
| Hosting | Vercel |
| Roles | Admin, Dono, Gerente, Vendedor |
| Quality Gates | `npm run lint`, `npm run typecheck`, `npm test` |
| Débitos totais | 39 (31 OPEN, 4 RESOLVED, 1 DEFERRED, 3 agrupamentos) |

---

## Stories

### Sprint 1 — P1 (Estabilização Crítica)

**Objetivo:** Estabelecer fundações de segurança (baseline DB), tipagem (strict mode), e acessibilidade bloqueante (focus traps, skip nav, contraste, lang).
**Horas estimadas:** ~20.5h
**Débitos:** 7 stories (DB-08, SYS-01, SYS-05, UX-01+UX-12, UX-02, UX-14, UX-11)

---

#### STORY-TD-001: Baseline Migrations — 17 Tabelas Legadas
- **Débito:** DB-08
- **Prioridade:** P1
- **Estimativa:** 5h
- **Descrição:** As 17 tabelas core pré-existentes (`users`, `stores`, `memberships`, `daily_checkins`, `goals`, `benchmarks`, `devolutivas`, `pdis`, `notificacoes`, `notification_reads`, `trainings`, `training_progress`, `produtos_digitais`, `roles`, `user_roles`, `goal_logs`, `audit_logs`) foram criadas antes do sistema de migrations versionadas. Um `supabase db reset` não recria o schema completo, impedindo disaster recovery e onboarding.
- **Critérios de Aceitação:**
  1. `supabase db dump --schema public` executado e commitado como migration `00000000000000_baseline_legacy_schema.sql`
  2. Todas as 17 tabelas + 4 views + indexes + constraints + policies + triggers capturados no dump
  3. Migrations existentes (40+) marcadas como applied em `supabase_migrations.schema_migrations`
  4. `supabase db reset` em ambiente limpo recria 100% do schema (46 tabelas, 86 FKs, 113 indexes, 107 policies)
  5. `supabase db diff` contra produção retorna zero diferenças
  6. CI pipeline valida com `supabase db push --dry-run`
- **Dependências:** Nenhuma — início imediato
- **Notas Técnicas:** Usar `supabase db dump` (não CREATE TABLE manual). O dump captura estado atual com shadow columns e triggers legados — comportamento correto para baseline. Migrations subsequentes devem ser idempotentes (`IF NOT EXISTS`, `IF EXISTS`). Validar com `ANALYZE` e `REINDEX` antes do dump. Risco CR-08 (QA Review): se baseline impreciso, todas as migrations futuras falham.

---

#### STORY-TD-002: TypeScript Strict Mode ON
- **Débito:** SYS-01
- **Prioridade:** P1
- **Estimativa:** 4h
- **Descrição:** `tsconfig.json` possui `"strict": false`. Habilitar strict mode para eliminar casts implícitos e habilitar refactoring seguro em todos os domínios.
- **Critérios de Aceitação:**
  1. `tsconfig.json` com `"strict": true`
  2. Zero erros `noImplicitAny` após migration
  3. `npm run typecheck` passa sem erros
  4. Build de produção (`npm run build`) completa sem warnings de tipo
  5. Zero `@ts-ignore` novos introduzidos
- **Dependências:** Nenhuma — início imediato
- **Notas Técnicas:** Habilitar gradual: `noImplicitAny` → `strictNullChecks` → `strict` (recomendação QA CR-07). Pode expor bugs ocultos — tempo incluído na estimativa. WizardPDI usa state local com casts implícitos que podem quebrar (SYS-01 → UX-01/UX-12).

---

#### STORY-TD-003: Tailwind v4 Migration Validation
- **Débito:** SYS-05
- **Prioridade:** P1 (promovido de P2 pela QA Review)
- **Estimativa:** 3h
- **Descrição:** A migration para Tailwind v4 pode estar incompleta. A engine de parsing mudou (`@theme` block). Tokens novos (UX-05) e animações CSS (UX-03) dependem de uma base Tailwind funcional.
- **Critérios de Aceitação:**
  1. [x] Auditoria completa de classes v3 vs v4 no codebase
  2. [x] Classes v3 migradas ou aliases criados
  3. [x] `tailwind.config.ts` compatível com v4 CSS-first
  4. [x] `npm run build` gera bundle sem warnings de classes não resolvidas
  5. [x] Todos os tokens `@theme` são resolvidos pelo JIT
  6. [x] Visual regression: nenhuma mudança visual em produção após validação
- **Dependências:** Nenhuma — início imediato
- **Notas Técnicas:** SYS-05 é pré-requisito (gating item) para UX-05 (contrast tokens), UX-03 (reduced motion CSS) e UX-10 (print tokens). Se `--color-text-label` não for reconhecido pelo JIT, todas as 40+ correções de contraste falham em runtime (QA Review CR-04). Promovido para Sprint 1 pela QA.

---

#### STORY-TD-004: Focus Traps + Labels — WizardPDI e Mobile Menu
- **Débito:** UX-01 + UX-12 (agrupado)
- **Prioridade:** P1
- **Estimativa:** 6h (economia de 2h por agrupamento)
- **Descrição:** Dois modais centrais sem focus trap: mobile menu (`Layout.tsx:307-365`) e WizardPDI (`WizardPDI.tsx:154-432`). O WizardPDI também possui 10+ campos de formulário sem label programático (`select`, `textarea`, `input[type=range]`, `input[type=date]`). Viola WCAG 2.4.3, 2.1.2, 1.3.1 e 3.3.2 (Level A).
- **Critérios de Aceitação:**
  1. [x] Focus trap ativo no mobile menu — Tab/Shift+Tab cicla apenas entre elementos do menu
  2. [x] Focus trap ativo no WizardPDI — Tab/Shift+Tab cicla apenas entre campos do wizard
  3. [x] Escape fecha ambos os modais
  4. [x] Focus retorna ao trigger element ao fechar
  5. [x] Todos os inputs do WizardPDI com `<label>` associado via `htmlFor` ou `aria-labelledby`
  6. [x] `select` de colaborador, cargo, tipo de meta, competência, impacto, custo — todos com label
  7. [x] `input[type=range]` com `aria-label` descritivo e `aria-valuemin`/`aria-valuemax`
  8. [x] `input[type=date]` de revisão e conclusão com label
  9. [x] `textarea` de meta com label
  10. [x] Teste manual: navegação completa por teclado no WizardPDI sem perder foco
- **Dependências:** SYS-01 recomendado antes (tipagem segura nos handlers)
- **Notas Técnicas:** WizardPDI: usar `Dialog.Root` + `Dialog.Portal` + `Dialog.Overlay` + `Dialog.Content` do `@radix-ui/react-dialog` (já disponível no bundle, v1.1.15). Mobile menu: hook custom `useFocusTrap(containerRef, isActive)` com ~40 linhas (0 bytes adicionais). Não usar `focus-trap-react` (4.2KB gzipped, over-engineering para 2 pontos). Refatorar apenas markup/ARIA, preservar lógica de estado intacta.

---

#### STORY-TD-005: Skip Navigation Link
- **Débito:** UX-02
- **Prioridade:** P1
- **Estimativa:** 1h
- **Descrição:** Nenhum skip link encontrado no `Layout.tsx`. Usuários de teclado devem tabular por ~30+ elementos interativos antes de alcançar o conteúdo principal. Viola WCAG 2.4.1 Bypass Blocks (Level A).
- **Critérios de Aceitação:**
  1. Link "Pular para conteúdo principal" visível em focus (primeiro Tab após load)
  2. Link ancorado ao `<main id="main-content">`
  3. Presente em todas as páginas com layout autenticado (`Layout.tsx`)
  4. Implementado como `<a href="#main-content" class="sr-only focus:not-sr-only ...">` como primeiro filho do container raiz
  5. Screen reader anuncia o link corretamente
- **Dependências:** Nenhuma — início imediato
- **Notas Técnicas:** Implementar como primeiro filho do `<div className="min-h-screen">` em `Layout.tsx:139`. Usar classes Tailwind `sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50`.

---

#### STORY-TD-006: HTML lang="pt-BR"
- **Débito:** UX-14
- **Prioridade:** P1
- **Estimativa:** 0.5h
- **Descrição:** Elemento `<html>` sem atributo `lang`. Screen readers tentam pronunciar conteúdo português com fonética incorreta. Viola WCAG 3.1.1 Language of Page (Level A).
- **Critérios de Aceitação:**
  1. `<html lang="pt-BR">` presente no `index.html`
  2. Screen reader identifica idioma como português brasileiro
  3. axe-core scan reporta zero violações para 3.1.1
- **Dependências:** Nenhuma — início imediato
- **Notas Técnicas:** Correção em `index.html`. Verificar se o Supabase Auth ou Vite plugins não sobrescrevem o atributo. Trivial, zero risco.

---

#### STORY-TD-007: Mobile Nav Contrast Fix
- **Débito:** UX-11
- **Prioridade:** P1
- **Estimativa:** 1h
- **Descrição:** Mobile bottom nav (`Layout.tsx:368-428`) usa `text-white/40` sobre `bg-mx-black` (#0A0A0B) para ícones inativos. Contraste resultante ≈ 2.1:1 — falha WCAG AA (requer 4.5:1). Afeta 100% dos usuários mobile em todas as 4 roles.
- **Critérios de Aceitação:**
  1. Ícones inativos da mobile bottom nav com contraste ≥ 4.5:1 sobre fundo escuro
  2. Migrar de `text-white/40` para `text-white/70` (contraste ≈ 5.8:1, PASS AA)
  3. Validado com Chrome DevTools contrast checker ou axe-core
  4. Aparência visual mantida (ícones inativos distinguíveis de ativos)
- **Dependências:** Nenhuma — início imediato
- **Notas Técnicas:** Arquivo: `Layout.tsx:374,384,395,414,424`. Substituição direta de classe. Não requer novo token.

---

### Sprint 2 — P2 (Performance e Acessibilidade)

**Objetivo:** Performance DB (indexes, PII, FKs), conformidade WCAG AA (motion, labels, contraste), print tokens.
**Horas estimadas:** ~27h
**Débitos:** 8 stories
**Pré-requisito:** Sprint 1 concluída (DB-08 baseline, SYS-05 Tailwind validado, SYS-01 strict mode)

---

#### STORY-TD-008: PDI 360 Indexes (7 B-TREE)
- **Débito:** DB-05
- **Prioridade:** P2
- **Estimativa:** 3h
- **Descrição:** As tabelas transacionais do PDI 360 (`pdi_sessoes`, `pdi_metas`, `pdi_avaliacoes_competencia`, `pdi_plano_acao`, `pdi_objetivos_pessoais`) foram criadas sem índices além das PKs. As RPCs `get_pdi_print_bundle()` e `create_pdi_session_bundle()` farão Seq Scans.
- **Critérios de Aceitação:**
  1. 6 B-TREE indexes criados: `(colaborador_id)`, `(gerente_id)` em `pdi_sessoes`; `(sessao_id)` em `pdi_avaliacoes_competencia`, `pdi_plano_acao`, `pdi_metas`, `pdi_objetivos_pessoais`
  2. 1 partial index: `pdi_plano_acao(status, data_conclusao) WHERE status IN ('pendente', 'em_andamento')`
  3. `EXPLAIN ANALYZE` nas RPCs PDI confirma Index Scan (não Seq Scan)
  4. Tempo de query PDI ≤ 200ms em produção
  5. Migration versionada e validada
- **Dependências:** DB-08 (baseline migrations)
- **Notas Técnicas:** Não indexar `pdi_sessoes(status)` (baixa cardinalidade). Não indexar `competencia_id` em child tables (lookup raro, filtra por `sessao_id` primeiro). Migration usa `CREATE INDEX IF NOT EXISTS`. Criação < 1 segundo com volumes atuais.

---

#### STORY-TD-009: PII Encryption — users.phone
- **Débito:** DB-09
- **Prioridade:** P2
- **Estimativa:** 4h
- **Descrição:** `users.phone` armazena PII em plaintext. Cifrar com `pgcrypto` para proteger dados em repouso. `users.email` mantido plaintext (necessário para `process_import_data` com `WHERE email ILIKE`). `tokens_oauth_consultoria` já protegido por AES-256-GCM nas Edge Functions.
- **Critérios de Aceitação:**
  1. [x] `users.phone` cifrado com `pgcrypto.encrypt()` usando `current_setting('app.crypto_key')` (não hardcoded)
  2. [x] Função de decriptação `decrypt_phone()` acessível apenas via Service Role
  3. [x] RPC `process_import_data` com busca por email funciona normalmente (email não cifrado)
  4. [x] RLS policies testadas com workflow `test-as-user`
  5. [x] Zero regressão em queries de autenticação
  6. [x] Frontend `/perfil` renderiza phone decriptado apenas para o próprio usuário
- **Dependências:** DB-08 (baseline migrations)
- **Notas Técnicas:** Usar `pgcrypto` (não pgsodium) — menor impacto em queries RLS, complexidade baixa. Chave via `current_setting('app.crypto_key')` com custom GUC. `users.email` NÃO cifrar — necessário para importação e busca. `stores.manager_email` NÃO cifrar — dado corporativo.

---

#### STORY-TD-010: Legacy FK ON DELETE Actions
- **Débito:** DB-12
- **Prioridade:** P2
- **Estimativa:** 4h
- **Descrição:** FKs das tabelas legadas usam comportamento default `ON DELETE NO ACTION`. Análise caso a caso para definir ação semântica correta (CASCADE, SET NULL, ou manter NO ACTION).
- **Critérios de Aceitação:**
  1. Todas as FKs legadas com `ON DELETE` explícito documentado
  2. `daily_checkins.store_id → stores(id)`: CASCADE
  3. `daily_checkins.user_id → users(id)`: SET NULL (preserva dados históricos)
  4. `devolutivas.store_id → stores(id)`: CASCADE
  5. `devolutivas.seller_id → users(id)`: SET NULL
  6. `devolutivas.manager_id → users(id)`: SET NULL
  7. `pdis.store_id → stores(id)`: CASCADE
  8. `pdis.seller_id → users(id)`: SET NULL
  9. `pdis.manager_id → users(id)`: SET NULL
  10. `goals.store_id → stores(id)`: CASCADE
  11. `goals.user_id → users(id)`: CASCADE
  12. `notificacoes.recipient_id → users(id)`: CASCADE
  13. `goal_logs.goal_id → goals(id)`: CASCADE
  14. Cascade testado em staging sem órfãos
  15. Migration versionada e validada
  16. RLS regression test com `test-as-user` workflow
- **Dependências:** DB-08 (baseline migrations)
- **Notas Técnicas:** Sistema usa soft-delete (`active = false`) para lojas e desativação para usuários — risco prático baixo. Manter `NO ACTION` onde CASCADE não é semanticamente necessário. Workflow `test-as-user` obrigatório pós-migration (QA Review R-06).

---

#### STORY-TD-011: OAuth State Cleanup Cron
- **Débito:** DB-14
- **Prioridade:** P2
- **Estimativa:** 2h
- **Descrição:** `estados_oauth_google_consultoria` acumula states consumidos e expirados sem cleanup. Agendar `pg_cron` para remover states com mais de 1h.
- **Critérios de Aceitação:**
  1. [x] Cron job `cleanup-oauth-states` agendado via `pg_cron` (execução a cada 15 minutos)
  2. [x] Remove states onde `consumed_at IS NOT NULL OR expires_at < now()` E `created_at < now() - interval '1 hour'`
  3. [x] Log de cleanup registrado (rows removidas por execução)
  4. [x] Testado com volume de produção em staging
  5. [x] Extensão `pg_cron` já disponível no Supabase (usada pelas funções `configure_*_cron()`)
- **Dependências:** Nenhuma
- **Notas Técnicas:** Usar `SELECT cron.schedule('cleanup-oauth-states', '*/15 * * * *', $$ DELETE ... $$)`. Solução simples — 2h inclui teste.

---

#### STORY-TD-012: Reduced Motion (CSS + MotionConfig)
- **Débito:** UX-03
- **Prioridade:** P2
- **Estimativa:** 4h
- **Descrição:** Nenhuma ocorrência de `prefers-reduced-motion` no codebase. A aplicação usa `motion/react` (v12) extensivamente + classes CSS de animação (`animate-spin`, `animate-pulse`, `.animate-float`). Viola WCAG 2.3.3 Animation from Interactions (Level AAA).
- **Critérios de Aceitação:**
  1. CSS global `@media (prefers-reduced-motion: reduce)` em `index.css` suprime animações CSS (`animation-duration: 0.01ms`, `transition-duration: 0.01ms`, `scroll-behavior: auto`)
  2. `.animate-float` com `animation: none !important` no media query
  3. `MotionConfig` com `reducedMotion="user"` no componente raiz (`App.tsx`) envolvendo `<Layout />`
  4. Spring animations, layout animations e transforms desabilitados quando preferência ativa
  5. Loading spinners permanecem funcionais (manter `animation-duration` mínimo, não `none`)
  6. `prefers-reduced-motion: reduce` testado via DevTools emulation em 3 cenários: Login, Layout (drawer/menu), WizardPDI
- **Dependências:** SYS-05 (Tailwind v4 validado)
- **Notas Técnicas:** Abordagem híbrida em 2 camadas (UX Specialist): (1) CSS global cobre `animate-spin`, `animate-pulse`, `.animate-float` e qualquer `transition-all` inline — 308+ ocorrências sem intervenção por arquivo; (2) `MotionConfig reducedMotion="user"` resolve em 1 ponto para todos os componentes `<motion.*>`. Não usar hook `useReducedMotion()` individualmente (~15 arquivos).

---

#### STORY-TD-013: Label Associations — Login + WizardPDI
- **Débito:** UX-04 + UX-12 (parcial WizardPDI labels complementar ao STORY-TD-004)
- **Prioridade:** P2
- **Estimativa:** 5h (grouped)
- **Descrição:** Labels em Login (`Login.tsx:170-193`) e campos remanescentes do WizardPDI sem associação programática. Login tem `<label>E-mail</label>` sem `htmlFor` e `<input>` sem `id`. WizardPDI tratado parcialmente em STORY-TD-004 — esta story cobre ajustes finais e campos secundários.
- **Critérios de Aceitação:**
  1. `Login.tsx`: label "E-mail" com `htmlFor` vinculado ao input com `id` correspondente
  2. `Login.tsx`: label "Senha" com `htmlFor` vinculado ao input com `id` correspondente
  3. WizardPDI: todos os campos remanescentes com label programático
  4. axe-core scan: zero violações 1.3.1 e 3.3.2 em Login e WizardPDI
  5. Screen reader anuncia labels corretamente em ambos os formulários
- **Dependências:** UX-01 (focus trap — STORY-TD-004)
- **Notas Técnicas:** Login: corrigir `htmlFor`/`id` nos labels existentes (não migrar para FormField nesta story — ver STORY-TD-019). WizardPDI: complementar labels dos campos tratados no STORY-TD-004. Validar com axe-core.

---

#### STORY-TD-014: Contrast Fix — Novo Token + 40+ Instâncias
- **Débito:** UX-05
- **Prioridade:** P2 (P1 original, movido para após SYS-05)
- **Estimativa:** 4h
- **Descrição:** `text-text-tertiary` (#94a3b8) com `opacity-40` resulta em contraste ≈ 1.43:1 (FALHA CRÍTICA WCAG AA). 40+ ocorrências em 10 arquivos. Criar novo token `--color-text-label: #64748b` e substituir todas as instâncias.
- **Critérios de Aceitação:**
  1. [x] Novo token `--color-text-label: #64748b` adicionado no bloco `@theme` do Tailwind
  2. [x] Novo tone `"label": "text-[#64748b]"` no Typography
  3. [x] Todas as ~40 instâncias de `text-text-tertiary opacity-40` substituídas por `text-text-label` (sem opacity)
  4. [x] Labels de seção: `tone="muted"` + `opacity-40` → `tone="label"` ou classe `text-text-label`
  5. [x] Timestamps e metadados: usar `text-text-secondary` sem opacity (7.12:1)
  6. [x] Empty states: manter `text-text-tertiary` **sem opacity** (exceção WCAG para large text com `font-black`)
  7. [x] Contraste ≥ 4.5:1 em dark mode e light mode para todos os textos corrigidos
  8. [x] Zero violações WCAG AA para contraste de texto
- **Dependências:** SYS-05 (STORY-TD-003 — Tailwind v4 deve reconhecer o novo token no JIT)
- **Notas Técnicas:** `#64748b` (Slate 500) sobre `#ffffff` = 5.62:1 (PASS AA 4.5:1, PASS AAA 7:1 para large). Arquivos afetados: `MXScoreCard.tsx`, `DataGrid.tsx`, `MorningReport.tsx`, `Notificacoes.tsx`, `GerenteFeedback.tsx`, `GerenteTreinamentos.tsx`, `Equipe.tsx`, `Configuracoes.tsx`, `Perfil.tsx`, `SalesPerformance.tsx`. Se SYS-05 não validou, esta story NÃO pode iniciar (QA Review CR-04).

---

#### STORY-TD-015: Print Component Token Migration
- **Débito:** UX-10
- **Prioridade:** P2
- **Estimativa:** 4h
- **Descrição:** `PrintableFeedback.tsx` e `WeeklyStoreReport.tsx` usam cores hardcoded (`#335c67`, `#dc2626`, `#059669`, etc.) que divergem dos tokens MX do design system. Divergências são bugs de marca em relatórios impressos que circulam fisicamente.
- **Critérios de Aceitação:**
  1. [x] Cores hardcoded migradas para tokens MX correspondentes
  2. [x] `.header-blue { background: #335c67 }` → `bg-brand-secondary`
  3. [x] `.status-bom { color: #059669 }` → `text-status-success`
  4. [x] `.status-abaixo { color: #dc2626 }` → `text-status-error`
  5. [x] `.legacy-table td { border: 1px solid #d1d5db }` → `border-border-strong`
  6. [x] Novos tokens print-safe adicionados: `--color-print-highlight: #facc15`, `--color-print-gold: #fef3c7`
  7. [x] `@media print` existente mantido (overrides de padding/background)
  8. [x] Visual output de impressão inalterado (tokens resolvem para mesmos valores hex)
- **Dependências:** SYS-05 (STORY-TD-003 — Tailwind v4)
- **Notas Técnicas:** Os prints rodam dentro do app como componentes React — têm acesso aos tokens CSS. A separação via `<style>` hardcoded é desnecessária. `#dc2626` (print) vs `#ef4444` (app `--color-status-error`) e `#059669` (print) vs `#10b981` (app `--color-status-success`) são divergências de marca.

---

### Sprint 3 — P3 (Limpeza e Melhoria Contínua)

**Objetivo:** Limpeza legada (shadow columns, índices redundantes, triggers), refactors menores (auth provider, breadcrumb, blur), regressão visual.
**Horas estimadas:** ~25h
**Débitos:** 11 stories

---

#### STORY-TD-016: Shadow Column Removal
- **Débito:** DB-01
- **Prioridade:** P3
- **Estimativa:** 2h
- **Descrição:** 9 shadow columns em `daily_checkins` (`user_id`, `date`, `leads`, `agd_cart`, `agd_net`, `vnd_porta`, `vnd_cart`, `vnd_net`, `visitas`) e 2 em `pdis` (`objective`, `action`) mantidas por trigger bidi-sync para compatibilidade legada.
- **Critérios de Aceitação:**
  1. Grep no codebase frontend confirma nenhuma leitura direta das shadow columns
  2. Drop de triggers `sync_daily_checkins_canonical()` e `sync_pdi_legacy_shadow_columns()`
  3. Drop das 11 shadow columns
  4. `npm run typecheck` passa (tipos atualizados)
  5. `npm test` passa (sem regressão)
  6. Migration versionada com `ALTER TABLE ... DROP COLUMN IF EXISTS`
- **Dependências:** Confirmação do @dev de que nenhum componente frontend lê as colunas legadas
- **Notas Técnicas:** Migração documentada como "mantém compatibilidade por 1 release" (migration `20260407001000`). Triggers fazem bidi-sync via `COALESCE` encadeado (~0.3ms overhead por INSERT/UPDATE). Usar feature flag se houver dúvida sobre o frontend.

---

#### STORY-TD-017: JSONB Schema Validation
- **Débito:** DB-10
- **Prioridade:** P3
- **Estimativa:** 2h
- **Descrição:** Colunas JSONB sem validação de schema em `devolutivas` (~5 colunas), `automation_configs.ai_context`, `report_history.data_snapshot`. Tabelas de audit/log são aceitáveis sem validação (schema mutável por design).
- **Critérios de Aceitação:**
  1. CHECK constraints com `jsonb_typeof()` em `devolutivas` validando chaves obrigatórias
  2. Schema check básico em `automation_configs.ai_context`
  3. Tabelas de audit (`checkin_audit_logs`, `logs_reprocessamento`, `importacoes_brutas`, `historico_regras_metas_loja`) permanecem sem validação (append-only)
  4. Migration versionada
  5. Dados existentes validados antes de aplicar constraint
- **Dependências:** Nenhuma
- **Notas Técnicas:** Foco em `devolutivas` primeiro (dados de negócio estruturado). Para audit/log, JSONB sem validação é aceitável por design.

---

#### STORY-TD-018: Updated_at Triggers (2 Tabelas)
- **Débito:** DB-11
- **Prioridade:** P3
- **Estimativa:** 1h
- **Descrição:** `solicitacoes_correcao_lancamento` e `logs_reprocessamento` sofrem UPDATE mas não possuem `updated_at`. Demais tabelas de audit são append-only e genuinamente não precisam.
- **Critérios de Aceitação:**
  1. Coluna `updated_at TIMESTAMPTZ` adicionada em `solicitacoes_correcao_lancamento` e `logs_reprocessamento`
  2. Trigger `update_updated_at_column_canonical()` (função canônica) associado a ambas
  3. Trigger dispara apenas em UPDATE, setando `updated_at = now()`
  4. Tabelas append-only (`checkin_audit_logs`, `historico_regras_metas_loja`, `importacoes_brutas`) não alteradas
- **Dependências:** Nenhuma
- **Notas Técnicas:** Escopo reduzido pelo DB Specialist — apenas 2 tabelas sofrem UPDATE. As demais têm apenas `created_at` (append-only).

---

#### STORY-TD-019: Login FormField Migration + Inline Validation
- **Débito:** UX-06 + UX-07 (agrupado)
- **Prioridade:** P3
- **Estimativa:** 4h (grouped)
- **Descrição:** Login usa `<input>` nativo com classes inline em vez dos atom components `Input` e `FormField` do design system. `FormField` já suporta `useId()` para label binding, `aria-hidden` em ícones, error state com `role="alert"`. Migrar para habilitar validação inline e eliminar `style={{ height: '3.25rem' }}`.
- **Critérios de Aceitação:**
  1. Login migrado para `FormField` molecule (campos email e senha)
  2. Validação inline em tempo real: formato de email, senha vazia
  3. Error state com `role="alert"` via prop `error` do FormField
  4. Inputs usam atom components (`Input`, `Label`, `Button`)
  5. Zero `style={{ height: '3.25rem' }}` inline styles
  6. Zero `@ts-ignore` ou `any` no componente
  7. Autocomplete de browser funciona (type="email", type="password")
- **Dependências:** UX-04 (STORY-TD-013 — labels Login corrigidos)
- **Notas Técnicas:** `FormField.tsx` já existe com auto-binding via `React.useId()`, ícone com `aria-hidden`, error com `role="alert"`. Esta story resolve simultaneamente UX-06 (validação inline) e UX-07 (atom components). Usar props `autoFocus`, `icon={<Mail />}`, `icon={<Lock />}`.

---

#### STORY-TD-020: Blur Optimization + aria-hidden
- **Débito:** UX-08 + UX-13 (agrupado)
- **Prioridade:** P3
- **Estimativa:** 1h
- **Descrição:** `Login.tsx:91-93` — 3 divs decorativas com `filter: blur(140px/120px/80px)` sem `aria-hidden="true"`. Impacto em GPU rendering em dispositivos low-end + micro-falha de acessibilidade.
- **Critérios de Aceitação:**
  1. `aria-hidden="true"` adicionado nas 3 divs decorativas do `Login.tsx:91-93`
  2. Blur radius reduzido em dispositivos low-end (considerar `@media (prefers-reduced-motion)` para lazy mount)
  3. Elementos com `aria-hidden="true"` não são focáveis por teclado
  4. axe-core: zero violações
- **Dependências:** Nenhuma
- **Notas Técnicas:** `MorningReport.tsx:175` já aplica `aria-hidden="true"` corretamente — seguir o mesmo padrão.

---

#### STORY-TD-021: Breadcrumb Component
- **Débito:** UX-09
- **Prioridade:** P3
- **Estimativa:** 2h
- **Descrição:** Sem navegação hierárquica. Páginas profundas (`GerentePDI > PDIPrint`, `Configuracoes` com tabs) não oferecem orientação posicional. Beneficia especialmente o role `admin` com 15+ rotas.
- **Critérios de Aceitação:**
  1. Component `Breadcrumb` criado com suporte a items hierárquicos
  2. Implementado com nav semântica (`<nav aria-label="Breadcrumb">` + `<ol>` + `<li>`)
  3. Integrado ao layout autenticado em páginas com profundidade > 1
  4. Último item não é link (página atual)
  5. Keyboard navigable
  6. Não bloqueante para WCAG (melhora 2.4.8 Location Level AAA)
- **Dependências:** Nenhuma
- **Notas Técnicas:** Não é bloqueante WCAG. Usar nav semântica com `aria-label="Breadcrumb"`. JSON-LD `BreadcrumbList` é opcional (nice-to-have).

---

#### STORY-TD-022: DB Cleanup Batch — FK, Indexes, Triggers, Policies
- **Débito:** DB-15 + DB-16 + DB-17 + DB-18 + DB-19 + DB-06 (agrupado)
- **Prioridade:** P3
- **Estimativa:** 5h
- **Descrição:** Batch de limpeza DB com 6 débitos menores correlatos: FK formal em `pdi_sessoes.loja_id`, drop de indexes redundantes, consulting indexes, RLS policy refactor, trigger consolidation, e documentação de permissive policies.
- **Critérios de Aceitação:**
  1. **DB-15:** FK formal `pdi_sessoes.loja_id → stores(id) ON DELETE SET NULL` criada
  2. **DB-16:** `idx_checkins_store_date` e `idx_checkins_seller_date` removidos (redundantes com `daily_checkins_store_reference_idx` e `daily_checkins_seller_reference_idx`)
  3. **DB-17:** Indexes `(client_id, visit_number)` e `(client_id, reference_date)` criados em `consulting_visits` e `consulting_financials`
  4. **DB-18:** Policy `manager_view_store_requests` refatorada para usar `is_manager_of()` / `is_owner_of()` / `is_admin()`
  5. **DB-19:** 3 variantes de `update_updated_at()` consolidadas em 1 função canônica `update_updated_at_column_canonical()`; triggers redirecionados; variantes antigas removidas com `DROP FUNCTION`
  6. **DB-06:** Decisão de permissive policies documentada (threshold: 200 users simultâneos ou compliance LGPD); monitoring via `pg_stat_statements` instalado
  7. Todas as migrations versionadas e validadas com `supabase db reset`
- **Dependências:** DB-08 (baseline)
- **Notas Técnicas:** DB-16: mesmo para `idx_checkins_seller_date` vs `daily_checkins_seller_reference_idx`. DB-18: `is_manager_of()` já faz cache via `is_admin()` early-return. DB-19: testar que nenhum trigger quebra após DROP. DB-06: permissive SELECT é otimização deliberada — não reverter sem medir impacto.

---

#### STORY-TD-023: Radix Audit + Bundle Reduction
- **Débito:** SYS-02
- **Prioridade:** P3
- **Estimativa:** 2h
- **Descrição:** 11 pacotes `@radix-ui` instalados com uso parcial. Auditar imports reais vs instalados e remover pacotes não utilizados.
- **Critérios de Aceitação:**
  1. Imports reais vs instalados auditados em todo o codebase
  2. Pacotes `@radix-ui` não utilizados removidos do `package.json`
  3. Bundle size reduzido mensuravelmente — relatório antes/depois (`npm run build`)
  4. Zero regressão funcional (componentes que usam Radix continuam funcionando)
  5. `npm run typecheck` passa
- **Dependências:** UX-01 (STORY-TD-004 — WizardPDI migrado para Radix Dialog)
- **Notas Técnicas:** Verificar `@radix-ui/react-dialog` (usado no STORY-TD-004). Outros pacotes podem ter uso indireto via componentes compostos.

---

#### STORY-TD-024: Auth Provider Cleanup
- **Débito:** SYS-03
- **Prioridade:** P3
- **Estimativa:** 1h
- **Descrição:** `auth-provider.tsx` duplicado com `useAuth.tsx`. Consolidar em 1 fonte de verdade.
- **Critérios de Aceitação:**
  1. Arquivo duplicado removido
  2. Todos os imports redirecionados para fonte canônica
  3. Zero race condition no logout (relevante para DB-12 ON DELETE CASCADE)
  4. `npm run typecheck` passa
  5. `npm test` passa
- **Dependências:** Nenhuma (mas QA recomenda executar antes de DB-12)
- **Notas Técnicas:** QA Review CR-06: se `useAuth`/`auth-provider` tiver race condition no logout e DB-12 adicionar CASCADE, o cascade pode disparar em contexto inesperado.

---

#### STORY-TD-025: Scripts README + Indexação
- **Débito:** SYS-04
- **Prioridade:** P3
- **Estimativa:** 1h
- **Descrição:** 85+ scripts operacionais sem indexação ou documentação. Criar README com índice e categorização.
- **Critérios de Aceitação:**
  1. README.md criado em `scripts/` (ou diretório relevante) com índice de todos os scripts
  2. Scripts categorizados por função (seed, migration, cleanup, deploy, util)
  3. Cada entrada com: nome, propósito, uso, dependências
  4. Nenhum script funcional removido ou alterado
- **Dependências:** Nenhuma
- **Notas Técnicas:** Apenas documentação. Scripts permanecem inalterados.

---

#### STORY-TD-026: Visual Regression Tests
- **Débito:** SYS-06
- **Prioridade:** P3 (recomendação QA: elevar para P2 se UX-05 executar antes)
- **Estimativa:** 4h
- **Descrição:** Sem teste de regressão visual. Com 40+ mudanças de contraste (UX-05), 10 arquivos de print tokens (UX-10) e refatoração de Login/WizardPDI, o risco de regressão visual não-detectável é ALTO.
- **Critérios de Aceitação:**
  1. Framework de regressão visual configurado (Playwright screenshots ou equivalente)
  2. Baseline screenshots capturados para 10 páginas críticas em 3 breakpoints (320px, 768px, 1280px)
  3. CI pipeline inclui step de regressão visual
  4. Relatório de diff gerado automaticamente em caso de falha
  5. Fluxos críticos cobertos: Login, Checkin, PDI (Wizard completo), Feedback
- **Dependências:** Nenhuma (mas idealmente antes ou simultâneo com UX-05)
- **Notas Técnicas:** QA Review CR-07: substituir 40+ instâncias de `opacity-40` sem testes de regressão visual é arriscado. SYS-06 classificado como LOW→MEDIUM pela QA. Alternativa se não puder configurar framework: screenshot manual comparativo em 3 breakpoints antes/depois.

---

## Definition of Done

Cada story é considerada DONE quando TODOS os critérios abaixo são atendidos:

1. **Quality Gates Automatizados:**
   - `npm run lint` passa sem erros
   - `npm run typecheck` passa sem erros
   - `npm test` passa sem falhas

2. **Critérios de Aceitação:** Todos os itens listados na story são verificados e marcados

3. **Revisão de Código:** PR revisado por pelo menos 1 dev (cross-domain quando aplicável)

4. **Migrations (DB stories):** Validadas com `supabase db reset` em ambiente limpo

5. **Acessibilidade (UX stories):** Validada com axe-core (zero violações nos critérios tratados)

6. **Performance (DB stories):** `EXPLAIN ANALYZE` confirma melhoria (quando aplicável)

7. **Documentação:** Decisões técnicas registradas no PR ou wiki

---

## Orçamento

| Sprint | Débitos | Horas | Foco |
|--------|---------|-------|------|
| Sprint 1 (P1) | 7 stories | ~20.5h | Estabilização crítica: baseline DB, strict mode, Tailwind v4, acessibilidade P1 |
| Sprint 2 (P2) | 8 stories | ~30h | Performance DB, WCAG AA, tokens de cor/contraste, print tokens |
| Sprint 3 (P3) | 11 stories | ~25h | Limpeza legada, refactors menores, regressão visual |
| **Total** | **26 stories** | **~71h** | |

| Item | Budget Épico | Estimativa FINAL | Gap |
|------|-------------|------------------|-----|
| Total | 45h | 71h | +26h (+57%) |

**Ação requerida:** Aprovar budget revisado de 71h ou reduzir escopo P3.

---

## Dependências Críticas

```
DB-08 (baseline) ──┬──► DB-05 (indexes)
                    ├──► DB-09 (PII)
                    ├──► DB-12 (FK)
                    └──► DB-15/16/17/18/19 (cleanup)

SYS-05 (Tailwind v4) ──┬──► UX-05 (contrast token)
                        ├──► UX-03 (reduced motion)
                        └──► UX-10 (print tokens)

SYS-01 (TS strict) ──► UX-01/UX-12 (WizardPDI refactor)

UX-01 (focus trap) ──┬──► UX-04 (Login labels)
                      └──► UX-13 (aria-hidden)

SYS-03 (auth cleanup) ──► DB-12 (FK CASCADE)
```

---

## Referências

| Documento | Caminho |
|-----------|---------|
| Technical Debt Assessment FINAL | `docs/prd/technical-debt-assessment.md` |
| DB Specialist Review (FASE 5) | `docs/reviews/db-specialist-review.md` |
| UX Specialist Review (FASE 6) | `docs/reviews/ux-specialist-review.md` |
| QA Review (FASE 7) | `docs/reviews/qa-review.md` |
| QA Specialist Review | `docs/reviews/qa-specialist-review.md` |
| Design System Pipeline | `docs/design-system/00-pipeline-summary.md` |
| A11y Audit Report | `docs/design-system/03-a11y-audit-report.md` |
| Frontend Spec | `docs/frontend/frontend-spec.md` |
| AGENTS.md (Quality Gates) | `AGENTS.md` |

---

**Assinatura:** @pm (Morgan)
**Data:** 15 de Abril de 2026
**Próximo passo:** Aprovação de budget pelo stakeholder + kick-off Sprint 1 (DB-08, SYS-01, UX-14, UX-02 podem iniciar imediatamente)
, UX-14, UX-02 podem iniciar imediatamente)
