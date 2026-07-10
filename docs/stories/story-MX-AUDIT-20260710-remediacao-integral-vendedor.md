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

- [ ] Fase 1 — Corrigir núcleo do Fechamento (AC1)
  - [ ] Alinhar data oficial D-1/D0 entre React e `submit_checkin`.
  - [ ] Persistir `declaredForm`, unificar zero declarado e mostrar divergência de CRM.
  - [ ] Rejeitar sobrescrita diária finalizada no servidor.
  - [ ] Reutilizar `isSubmittedClosing` no Histórico.
  - [ ] Retornar ID da RPC e corrigir placeholder/escopo.
  - [ ] Unificar cálculo D+1 e remover mensagens de trava desativada.
  - [ ] Criar testes unitários, de contrato SQL e integração.
- [ ] Fase 2 — Regularização canônica (AC2)
  - [ ] Inventariar estruturas concorrentes e escolher a fonte já compatível com o app.
  - [ ] Criar schema/RPCs/transições/status/RLS/auditoria/notificações.
  - [ ] Migrar consumidores e impedir aplicação antes da aprovação.
  - [ ] Cobrir solicitar/aprovar/rejeitar/cancelar/aplicar/idempotência.
- [ ] Fase 3 — CRM e eventos (AC3)
  - [ ] Criar RPC transacional de venda direta com idempotência.
  - [ ] Introduzir competência explícita sem adulterar `created_at`.
  - [ ] Implementar deduplicação segura por loja + telefone.
  - [ ] Migrar o modal e cobrir falhas intermediárias/repetição.
- [ ] Fase 4 — Performance oficial (AC4)
  - [ ] Criar read model/RPC compartilhado com realizado/projetado.
  - [ ] Migrar Home, Minha Meta, Ranking e Relatórios.
  - [ ] Validar paridade e exclusão de estados não oficiais.
- [ ] Fase 5 — Conteúdo e carreira (AC5)
  - [ ] Completar Universidade MX.
  - [ ] Integrar experiência educacional em Desenvolvimento conforme fonte única.
  - [ ] Completar perfil profissional e histórico auditável.
  - [ ] Cobrir permissões, acessibilidade e responsividade.
- [ ] Fase 6 — Hardening e produção (AC6)
  - [ ] Rodar gates completos e estabilizar TestSprite/CI aplicável.
  - [ ] Aplicar migrations e executar smoke autenticado.
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

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Auditoria fonte: `/Users/pedroguilherme/Downloads/auditoria_consolidada_modulo_vendedor_6_contextos_github_2026-07-10.md`
- Plano herdado: `~/.claude/plans/wondrous-nibbling-nova.md`

### Completion Notes List

- Em andamento.

### File List

- `docs/stories/story-MX-AUDIT-20260710-remediacao-integral-vendedor.md`

## QA Results

- Pendente de revisão AIOX QA após implementação.
