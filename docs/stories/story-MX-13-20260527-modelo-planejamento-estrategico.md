# Story MX-13.1 - Modelo de indicadores planejados

## Status

Done

## Story

**As a** consultor MX ou gestor executivo,
**I want** cadastrar indicadores planejados com meta, realizado e ano anterior por periodo,
**so that** o Planejamento Estrategico sustente os 5 cards, a tabela anual e os sinais da Central MX.

## Executor Assignment

executor: "data-engineer"
quality_gate: "architect"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build", "migration review"]

## Epic Reference

- **Epic:** EPIC-MX-13 - Planejamento Estrategico
- **PRD:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
- **Dependencies:** EPIC-MX-01, EPIC-MX-07, EPIC-MX-08
- **Consumers:** Central MX, Dashboard Executivo, Consultor IA, Sistema de Alertas

## Context

Esta story cria o modelo de indicadores planejados do Planejamento Estrategico. A UI de 5 cards e tabela anual fica para stories seguintes; aqui o foco e garantir que os indicadores do PDF/documentos fonte possam ser cadastrados e comparados por Meta, Realizado e Ano Anterior.

## Acceptance Criteria

1. Existe modelo persistente para indicadores de planejamento por loja e periodo.
2. Cada indicador suporta Meta, Realizado e Ano Anterior.
3. Indicadores podem ser agrupados por categoria/card principal.
4. O modelo permite tabela anual por mes, ano e indicador.
5. Estados sem dado indicam indicador ou periodo pendente.
6. Diferencas e evolucao podem alimentar Central MX, alertas e Consultor IA.
7. RLS respeita loja, perfil e escopo de acesso.
8. Cadastro de indicadores nao depende de grafico ou BI externo.

## Tasks / Subtasks

- [x] Auditar modelos de planejamento/indicadores existentes.
- [x] Definir catalogo de indicadores planejados.
- [x] Modelar valores por periodo: meta, realizado e ano anterior.
- [x] Modelar categoria/card principal e ordenacao de exibicao.
- [x] Aplicar RLS por loja/perfil.
- [x] Criar fixtures alinhadas aos 5 cards principais.
- [x] Adicionar testes de periodo, indicador pendente e permissao.
- [x] Rodar `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.
- [x] Atualizar Dev Agent Record e File List antes de concluir.

## Dev Notes

- Nao implementar a tela completa nesta story.
- Evitar acoplar indicador a um componente visual especifico.
- Garantir que a tabela anual consiga consumir o contrato sem transformacao pesada no frontend.
- Quando a lista final do PDF nao estiver completa no repo, criar estrutura extensivel e marcar pendencias.

## Testing

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Teste de valores por periodo
- Teste de RLS por loja/perfil
- Teste de indicador sem dado

## Article IV - Rastreabilidade

| Item | Fonte |
|---|---|
| 5 cards principais | PRD §4.12 FR-PLANEJ |
| Tabela anual completa | PRD §4.12 |
| Meta / Realizado / Ano Anterior | PRD §4.12 |
| Poucos graficos | PRD §4.12, PRD §5.2 NFR-V7 |

## File List

- `docs/stories/story-MX-13-20260527-modelo-planejamento-estrategico.md`
- `src/lib/mx-executive-foundation.ts`
- `src/lib/mx-executive-foundation.test.ts`
- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx`
- `src/features/dashboard-loja/hooks/useDashboardLojaData.ts`
- `supabase/migrations/20260527180000_departments_planning_consultive_rules_schema.sql`
- `supabase/migrations/20260430190000_fundacao_portugues_permissoes_evidencias.sql`
- `supabase/migrations/20260501002000_store_goals_admin_only.sql`

## Dev Agent Record

### Debug Log

- Story criada em modo YOLO via @sm para formalizar EPIC-MX-13.1.
- 2026-05-27: Auditada a implementação existente: `StrategicPlanningView` já entrega 5 cards e tabela anual Meta/Realizado/Ano Anterior no cockpit do dono.
- 2026-05-27: Indicadores atuais incluem lucro líquido, volume de vendas, custo por venda, estoque pendente e funcionários; a tabela cobre vendas, conversão, estoque, margem, lucro líquido e disciplina.
- 2026-05-27: O modelo UI atual consome metas, DRE, funil e equipe; a persistência canônica de planejamento foi adicionada em migration própria nesta passagem.
- 2026-05-27: Metas e histórico já têm fundação/RLS em migrations existentes, mas não substituem o contrato completo de planejamento estratégico.
- 2026-05-27: Gates executados no lote MX: `npm run lint` passou com warnings preexistentes, `npm run typecheck` passou, `npm test` passou com 329 testes e `npm run build` passou.
- 2026-05-27: Criada migration `20260527180000_departments_planning_consultive_rules_schema.sql` com `catalogo_indicadores_planejamento` e `valores_indicadores_planejamento`, incluindo Meta, Realizado, Ano Anterior, período anual/mensal e RLS por loja/perfil.
- 2026-05-27: Adicionada cobertura unitária em `mx-executive-foundation.test.ts` para período anual/mensal, indicador completo/parcial/pendente e permissão de escrita por perfil/escopo de loja.

### Completion Notes

- A UI dos 5 cards e tabela anual existe, com estados pendentes transparentes.
- A persistência própria de indicadores planejados e RLS foram adicionadas.
- Testes unitários cobrem período, indicador pendente e permissão por perfil/escopo.

### Change Log

- 2026-05-27: Story atualizada de `Draft` para `InProgress` com evidência da UI de planejamento e pendências do modelo persistente.
- 2026-05-27: Story movida para `Ready for Review` após cobertura unitária dos contratos pendentes.

### Change Log Update — 2026-05-28

- 2026-05-28: QA gate Wave 3 dry-run PASS (358 tests, lint clean, typecheck clean, build OK). Status movido para `Done` por @aiox-master (Orion). Fonte: `docs/reports/qa-gate-mx-wave3-stories-20260528.md`.
