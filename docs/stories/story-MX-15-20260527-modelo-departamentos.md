# Story MX-15.1 - Modelo de departamentos

## Status

Ready for Review

## Story

**As a** dono, diretor ou gestor autorizado,
**I want** estruturar departamentos da loja com indicadores, score, alertas e planos de acao por area,
**so that** o MX mostre a empresa inteira, nao apenas a operacao comercial.

## Executor Assignment

executor: "data-engineer"
quality_gate: "architect"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build", "permission model review"]

## Epic Reference

- **Epic:** EPIC-MX-15 - Departamentos
- **PRD:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
- **Dependencies:** EPIC-MX-02, EPIC-MX-07, EPIC-MX-08, EPIC-MX-09
- **Consumers:** Central MX, Dashboard Executivo, Home Dono

## Context

Esta story cria a base de departamentos: Comercial, Marketing, Produto, Financeiro, RH e Operacoes. A UI por departamento fica para stories posteriores; aqui o foco e permitir que score, indicadores, alertas e planos de acao sejam associados a cada area com permissao correta.

## Acceptance Criteria

1. Existe modelo persistente para departamentos padrao: Comercial, Marketing, Produto, Financeiro, RH e Operacoes.
2. Departamento pode ser associado a loja, responsaveis e perfis autorizados.
3. Departamento pode receber indicadores, score, alertas e planos de acao.
4. Dono/Diretor consegue ter visao consolidada por departamento.
5. Perfis departamentais acessam somente areas permitidas.
6. Estados pendentes indicam dados ainda nao conectados.
7. O modelo nao duplica pessoas/permissoes do EPIC-MX-02 ou EPIC-MX-16.
8. A estrutura suporta drill-down futuro sem perder contexto da loja.

## Tasks / Subtasks

- [x] Auditar modelos existentes de loja, perfil, equipe e areas.
- [x] Criar catalogo de departamentos padrao.
- [x] Modelar relacao departamento-loja-responsavel.
- [x] Definir vinculos com indicadores, score, alertas e planos de acao.
- [x] Aplicar permissoes por perfil/departamento.
- [x] Criar fixtures para departamentos com estados pendentes.
- [x] Adicionar testes de acesso por perfil e loja.
- [x] Rodar `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.
- [x] Atualizar Dev Agent Record e File List antes de concluir.

## Dev Notes

- Nao criar modulo separado para cada departamento nesta story.
- Departamento e uma camada de organizacao do produto e dos indicadores.
- Integrar com o modelo de perfis existente em vez de criar permissao paralela.
- Comercial deve continuar compativel com funil/vendas existentes.

## Testing

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Teste de catalogo dos 6 departamentos
- Teste de permissao por perfil/departamento
- Teste de associacao com loja e responsavel

## Article IV - Rastreabilidade

| Item | Fonte |
|---|---|
| Area Departamentos | PRD §4.1 FR-MENU |
| Comercial, Marketing, Produto, Financeiro, RH e Operacoes | EPIC-MX-15 |
| Perfis departamentais | PRD §3 |
| Score por departamento | PRD §4.7 FR-SCORE-3 |

## File List

- `docs/stories/story-MX-15-20260527-modelo-departamentos.md`
- `src/lib/mx-executive-foundation.ts`
- `src/lib/mx-executive-foundation.test.ts`
- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx`
- `src/features/sales-performance/views/AdminPerformanceView.tsx`
- `src/features/sales-performance/sections/AdminPeopleChart.tsx`
- `src/features/dashboard-loja/hooks/useDashboardLojaData.ts`
- `src/lib/auth/routeAccess.ts`
- `supabase/migrations/20260527180000_departments_planning_consultive_rules_schema.sql`

## Dev Agent Record

### Debug Log

- Story criada em modo YOLO via @sm para formalizar EPIC-MX-15.1.
- 2026-05-27: Auditados consumidores existentes: `OwnerExecutiveCockpit` já possui catálogo visual de Comercial, Marketing, Produto, Financeiro, Operacional e RH com score/estado por dados disponíveis.
- 2026-05-27: `OwnerExecutiveCockpit` associa Comercial a meta/funil, Marketing a lead > agendamento, Financeiro a DRE, Operacional a disciplina de lançamento e mantém Produto/RH como pendentes explícitos.
- 2026-05-27: `AdminPerformanceView` já tem seção `Pessoas` na matriz executiva; a entidade persistente de departamentos foi adicionada em migration própria nesta passagem.
- 2026-05-27: Gates executados no lote MX: `npm run lint` passou com warnings preexistentes, `npm run typecheck` passou, `npm test` passou com 329 testes e `npm run build` passou.
- 2026-05-27: Criada migration `20260527180000_departments_planning_consultive_rules_schema.sql` com `departamentos_mx`, relação loja-responsável, perfis autorizados, seed dos 6 departamentos por loja e RLS por loja/perfil/departamento.
- 2026-05-27: Adicionada cobertura unitária em `mx-executive-foundation.test.ts` para catálogo dos 6 departamentos, leitura por perfil/departamento, responsável direto, escopo de loja e escrita autorizada.

### Completion Notes

- A camada visual/consultiva de departamentos existe no cockpit do dono, com pendências transparentes.
- A relação persistente departamento-loja-responsável e permissões departamentais foi adicionada.
- Testes unitários cobrem acesso por perfil/loja e preservam a regra de responsável direto.

### Change Log

- 2026-05-27: Story atualizada de `Draft` para `InProgress` com mapeamento de UI existente e pendências reais do modelo persistente.
- 2026-05-27: Story movida para `Ready for Review` após cobertura unitária dos contratos pendentes.
