# Story MX-AUDIT-20260710 — Remediação integral do módulo do vendedor

## Status

InProgress

## Story

**Como** vendedor e gestor da MX,
**quero** que Fechamento, Regularização, CRM, performance, conteúdo e carreira usem fatos oficiais e fluxos auditáveis,
**para que** a operação diária, os indicadores e o desenvolvimento profissional sejam consistentes entre frontend, banco e produção.

## Fonte e escopo

- Fonte aprovada pelo usuário: `/Users/pedroguilherme/Downloads/auditoria_consolidada_modulo_vendedor_6_contextos_github_2026-07-10.md`.
- A auditoria consolidada e as decisões finais das reuniões de 09/07/2026 são o contrato desta story.
- Execução direta na `main`; nenhuma branch adicional deve existir ao final.
- A regra rígida 09:30–12:00 é evolução futura e não deve bloquear a fase atual.
- UX já classificada como implementada na auditoria não deve ser refeita sem regressão comprovada.

## Acceptance Criteria

### AC1 — Data operacional e imutabilidade do Fechamento

1. Antes de 12:00, D-1 pendente permanece como data principal.
2. Antes de 12:00, finalizar D-1 libera D0 imediatamente no frontend e na RPC.
3. Após 12:00, D0 é principal e D-1 pendente migra para Histórico/Regularização sem bloquear D0.
4. O payload diário persiste apenas valores declarados, nunca substituição silenciosa por CRM.
5. Produção zero usa `declaredAllZero` para exibição, validação e bloqueio; atividade de CRM gera apenas divergência visível.
6. Fechamento diário finalizado é imutável na RPC; correções só entram pelo fluxo canônico de regularização.
7. Rascunhos e placeholders não são exibidos como finalizados.
8. O ID de placeholder/registro criado é retornado pela RPC e respeita vendedor, loja, data e escopo.
9. D+1 conta somente data exata D+1 e canais elegíveis Carteira/Internet no fluxo principal e na regularização.

### AC2 — Regularização canônica

1. Existe uma única fonte canônica para solicitar, aprovar, rejeitar, cancelar e aplicar regularizações.
2. Original, solicitado, delta, motivo, ator, aprovador, timestamps, status e impacto ficam preservados.
3. Solicitação pendente não altera o fechamento oficial nem indicadores.
4. Apenas aprovação autorizada aplica uma vez a correção e gera trilha/notificações idempotentes.
5. As telas existentes usam as RPCs canônicas e deixam de gravar em estruturas concorrentes.

### AC3 — CRM e fatos comerciais

1. Venda direta é transacional e cria cliente/oportunidade/evento oficial/entrega futura de forma atômica.
2. Repetição com a mesma chave idempotente não duplica venda ou evento.
3. `data_competencia` representa competência comercial; `created_at` mantém a criação real.
4. Clientes são deduplicados por loja + telefone normalizado, com RLS e RPC segura.
5. Falhas críticas são auditáveis e não dependem de efeito best-effort ou somente `console.error`.

### AC4 — Performance oficial

1. Existe read model/RPC oficial compartilhado para Home, Minha Meta, Ranking e Relatórios.
2. A fonte exclui rascunhos, placeholders e regularizações pendentes; aprovação conta exatamente uma vez.
3. Realizado e projetado são campos e textos distintos, inclusive comissão.
4. Uma venda oficial produz o mesmo resultado nas quatro superfícies.
5. Ranking filtra apenas fatos finais oficiais e mantém filtro por unidade.

### AC5 — Conteúdo e carreira

1. Universidade MX permite abrir aula, reproduzir vídeo/YouTube, acessar material, comentar/sugerir e persistir progresso.
2. Conteúdo respeita segmentação configurável por produto, plano, loja, cargo ou perfil quando presente no contrato de dados.
3. Desenvolvimento mantém Feedback/PDI e recebe a experiência educacional prevista na auditoria sem duplicar fonte de conteúdo.
4. Meu Perfil exibe e persiste somente campos editáveis pelo vendedor e protege campos oficiais.
5. Perfil profissional contempla data de entrada/tempo de casa, experiências, formação, cursos, certificações, PDI, performance e carreira com trilha auditável.

### AC6 — Hardening e entrega

1. Testes unitários, de contrato SQL/RPC e E2E cobrem os cenários prioritários da seção 11 da auditoria.
2. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run validate:structure`, `npm run validate:agents`, `npm run sync:ide:check` e `git diff --check` passam, distinguindo warnings preexistentes de falhas.
3. Migrations são aplicadas com segurança e validadas no projeto Supabase `fbhcmzzgwjdgkctlfvbo`.
4. Somente `main` existe local e remotamente ao final; alterações são commitadas e enviadas diretamente nela via AIOX DevOps.
5. Deploy Vercel de produção chega a READY e as rotas exatas são validadas com vendedor, gerente e dono, incluindo desktop/mobile quando aplicável.
6. Evidências e runbook de rollback não contêm dados pessoais, senhas ou tokens.

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> `coderabbit_integration.enabled` não está habilitado em `.aiox-core/core-config.yaml`; a revisão será executada manualmente por Dev/QA/DevOps.

## Tasks / Subtasks

- [x] Fase 1 — Corrigir núcleo do Fechamento (AC1)
  - [x] Alinhar data oficial D-1/D0 entre React e `submit_checkin`.
  - [x] Persistir `declaredForm`, unificar zero declarado e mostrar divergência de CRM.
  - [x] Rejeitar sobrescrita diária finalizada no servidor.
  - [x] Reutilizar `isSubmittedClosing` no Histórico.
  - [x] Retornar ID da RPC e corrigir placeholder/escopo.
  - [x] Unificar cálculo D+1 e remover mensagens de trava desativada.
  - [x] Criar testes unitários, de contrato SQL e integração.
- [x] Fase 2 — Regularização canônica (AC2)
  - [x] Inventariar estruturas concorrentes e escolher a fonte já compatível com o app.
  - [x] Criar schema/RPCs/transições/status/RLS/auditoria/notificações.
  - [x] Migrar consumidores e impedir aplicação antes da aprovação.
  - [x] Cobrir solicitar/aprovar/rejeitar/cancelar/aplicar/idempotência.
- [x] Fase 3 — CRM e eventos (AC3)
  - [x] Criar RPC transacional de venda direta com idempotência.
  - [x] Introduzir competência explícita sem adulterar `created_at`.
  - [x] Implementar deduplicação segura por loja + telefone.
  - [x] Migrar o modal e cobrir falhas intermediárias/repetição.
- [x] Fase 4 — Performance oficial (AC4)
  - [x] Criar read model/RPC compartilhado com realizado/projetado.
  - [x] Migrar Home, Minha Meta, Ranking e Relatórios.
  - [x] Validar paridade e exclusão de estados não oficiais.
- [x] Fase 5 — Conteúdo e carreira (AC5)
  - [x] Completar Universidade MX.
  - [x] Integrar experiência educacional em Desenvolvimento conforme fonte única.
  - [x] Completar perfil profissional e histórico auditável.
  - [x] Cobrir permissões, acessibilidade e responsividade.
- [ ] Fase 6 — Hardening e produção (AC6)
  - [ ] Rodar gates completos e estabilizar TestSprite/CI aplicável.
  - [x] Aplicar migrations e executar smoke autenticado.
  - [ ] Atualizar checklist, File List, QA Results e evidências.
  - [ ] Remover branches extras, commit/push na `main` e validar deploy/produção.

## Dev Notes

### Regras técnicas confirmadas

- Stack: React 19, TypeScript, Vite, Supabase direto, Bun test/Testing Library e Playwright. [Source: `docs/architecture/00-overview.md#existing-project-analysis`]
- Mudanças devem ser incrementais e com rollback por migration/commit; páginas permanecem lazy-loaded e imports usam `@/`. [Source: `docs/architecture/00-overview.md#identified-constraints`]
- Testes são co-localizados; caminhos críticos incluem submissão diária do vendedor. [Source: `docs/architecture/04-testing-deploy.md#integration-tests`]
- Gates obrigatórios incluem typecheck, lint, testes e build. [Source: `docs/architecture/04-testing-deploy.md#verification-steps-per-story`]
- Autorização é reforçada por RLS; vendedor deve permanecer restrito ao próprio usuário/loja. [Source: `docs/architecture/security-matrix.md#regression-gates`]
- A arquitetura documental existente é anterior à auditoria de julho e não define os novos contratos de regularização/performance; nesses pontos, a auditoria consolidada e o schema aplicado são a fonte de verdade.

### Estado herdado

- `main` iniciou esta execução limpa e 9 commits à frente de `origin/main`.
- O Claude concluiu apenas a exportação de `isSubmittedClosing`; os demais itens do plano da Fase 1 estavam abertos.
- Há uma branch local extra `feat/remuneracao-privacidade-perfil-readonly`; deve ser removida antes da entrega.
- Não reproduzir credenciais fornecidas em logs, arquivos, commits, screenshots ou relatórios.

### Testing

- Unitários: Bun test + Testing Library, co-localizados.
- Banco: testes de contrato das migrations e cenários RPC autenticados com rollback/fixtures isoladas.
- E2E: Playwright/browser nas rotas exatas e nos três papéis fornecidos.
- Regressão: desktop e mobile para Fechamento/Histórico/Regularização; console e rede sem erros funcionais.

## Change Log

| Date | Version | Description | Author |
|---|---:|---|---|
| 2026-07-10 | 0.1 | Story criada a partir da auditoria consolidada e do handoff do Claude Code | River (SM) |
| 2026-07-10 | 0.2 | Story reaberta após validação encontrar CI externo vermelho e rastreabilidade incompleta | Dex (Dev) |

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Auditoria fonte: `/Users/pedroguilherme/Downloads/auditoria_consolidada_modulo_vendedor_6_contextos_github_2026-07-10.md`
- Plano herdado: `~/.claude/plans/wondrous-nibbling-nova.md`
- Gates locais: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run validate:structure`, `npm run validate:agents`, `npm run sync:ide:check`, `git diff --check`.
- Banco: `supabase migration list --linked` e `supabase db push --linked --dry-run` no projeto `fbhcmzzgwjdgkctlfvbo`.
- Produção: smoke autenticado em `https://mxperformance.vercel.app` para vendedor, gerente e dono; desktop e mobile nas rotas sensíveis.
- CI externo: check `Supabase Preview` reproduzido pelo script manual fora da cadeia; TestSprite reproduzido com 35 casos legados gerados.

### Completion Notes List

- Fases 1–5 implementadas e migrations `20260710120000` a `20260710170000` confirmadas no banco remoto.
- Payload declarado, zero declarado, D-1/D0, imutabilidade, regularização canônica, venda transacional, competência, performance oficial, Universidade e perfil profissional cobertos por código e contratos.
- Suíte local concluída com `712 pass, 0 fail`; lint sem erros, typecheck, build, estrutura, agentes, sync IDE e diff verdes.
- Smoke de produção passou em 23 rotas desktop e 4 rotas mobile, sem overflow horizontal no Terminal MX; RPCs e tabelas novas foram exercitadas sem mutação funcional.
- Três SQLs manuais/rollback de maio foram movidos para `_archived`, removendo-os da cadeia automática; dry-run Supabase passou como `Remote database is up to date`.
- TestSprite legado (rotas/tabelas antigas e credenciais-placeholder) foi removido; Playwright nativo permanece como suíte canônica.
- CodeRabbit CLI instalado, porém sem autenticação; a story já declara a integração desabilitada. Nenhum resultado manual foi atribuído ao CodeRabbit.
- Entrega remota/CI final permanece sob autoridade AIOX DevOps.

### File List

- `.testsprite/` (removido)
- `testsprite_tests/` (artefatos gerados removidos)
- `docs/audit/admin-master-full-e2e-20260710055611.md`
- `docs/audit/admin-master-full-e2e-20260710055707.md`
- `docs/runbooks/lgpd-dpo-approval-template.md`
- `docs/runbooks/sprint-1-story-1.3-1.4-db016-canary.md`
- `docs/runbooks/sprint-1-story-1.7-drop-pii-backups.md`
- `docs/stories/sprint-1/story-1.3-db016-C-revoke-canary-1pct.md`
- `docs/stories/sprint-1/story-1.7-drop-migration-backups-pii.md`
- `docs/stories/story-MX-AUDIT-20260710-remediacao-integral-vendedor.md`
- `scripts/db016-canary-controller.sh`
- `scripts/lint-tokens-ast.mjs`
- `src/api/base44Client.js`
- `src/base44-reference/api/base44Client.js`
- `src/base44-reference/pages/Desenvolvimento.jsx`
- `src/base44-reference/pages/FeedbackPage.jsx`
- `src/base44-reference/pages/MeuPerfil.jsx`
- `src/base44-reference/pages/PDIPage.jsx`
- `src/base44-reference/pages/Treinamentos.jsx`
- `src/features/checkin/Checkin.container.tsx`
- `src/features/checkin/CheckinStickyHeader.test.ts`
- `src/features/checkin/hooks/useCheckinPage.ts`
- `src/features/checkin/hooks/useCrmDerivedTotals.ts`
- `src/features/checkin/lib/active-closing-context.ts`
- `src/features/checkin/lib/clientes-list-from-crm.test.ts`
- `src/features/checkin/lib/clientes-list-from-crm.ts`
- `src/features/checkin/lib/crm-derived-totals.ts`
- `src/features/checkin/sections/CheckinCrmSection.tsx`
- `src/features/checkin/sections/CheckinForm.tsx`
- `src/features/checkin/sections/CheckinHeader.tsx`
- `src/features/checkin/sections/NovoRegistroModal.tsx`
- `src/features/checkin/sections/RegularizarFechamentoDrawer.tsx`
- `src/features/crm/CentralExecucao.container.tsx`
- `src/features/crm/RelatoriosVendedor.container.tsx`
- `src/features/crm/hooks/useClientes.ts`
- `src/features/crm/hooks/useOportunidades.ts`
- `src/features/ranking/views/StoreRankingView.test.tsx`
- `src/features/ranking/views/StoreRankingView.tsx`
- `src/features/remuneracao/MinhaRemuneracaoPage.tsx`
- `src/features/vendedor-home/hooks/useVendedorHomePage.ts`
- `src/hooks/checkins/types.test.ts`
- `src/hooks/checkins/types.ts`
- `src/hooks/checkins/useCheckinsSubmit.ts`
- `src/hooks/useCheckinAuditor.ts`
- `src/hooks/useOfficialSellerPerformance.ts`
- `src/hooks/useRanking.ts`
- `src/lib/checkin-regularization-migration.test.ts`
- `src/lib/legacy-testsprite-artifacts.test.ts`
- `src/lib/official-seller-performance-migration.test.ts`
- `src/lib/regularization-notification-target-migration.test.ts`
- `src/lib/schemas/crm.schema.ts`
- `src/lib/submit-checkin-operational-date-migration.test.ts`
- `src/lib/supabase-migration-directory.test.ts`
- `src/lib/transactional-direct-sale-migration.test.ts`
- `src/lib/university-profile-migration.test.ts`
- `src/pages/FunilVendedor.tsx`
- `src/types/database.generated.ts`
- `src/types/database.ts`
- `supabase/migrations/_archived/20260521120000_drop_migration_backups_pii.sql`
- `supabase/migrations/_archived/20260521130000_db016_revoke_lancamentos_diarios.sql`
- `supabase/migrations/_archived/20260521131000_db016_revoke_rollback.sql`
- `supabase/migrations/20260710120000_harden_submit_checkin_operational_date.sql`
- `supabase/migrations/20260710130000_canonical_checkin_regularization.sql`
- `supabase/migrations/20260710140000_transactional_direct_sale_and_competence.sql`
- `supabase/migrations/20260710150000_official_seller_performance.sql`
- `supabase/migrations/20260710160000_university_and_professional_profile.sql`
- `supabase/migrations/20260710170000_fix_regularization_notification_targets.sql`

## QA Results

- Pendente de revisão AIOX QA após implementação.
