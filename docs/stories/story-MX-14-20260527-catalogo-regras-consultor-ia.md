# Story MX-14.1 - Catalogo de regras consultivas

## Status

Ready for Review

## Story

**As a** gestor executivo ou consultor MX,
**I want** que o Consultor IA use um catalogo de regras deterministicas por indicador, perfil e contexto,
**so that** recomendacoes sejam explicaveis, rastreaveis e compativeis com a restricao rules-based de 2026.

## Executor Assignment

executor: "data-engineer"
quality_gate: "architect"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build", "rules explainability review"]

## Epic Reference

- **Epic:** EPIC-MX-14 - Consultor IA (rules-based 2026)
- **PRD:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
- **Dependencies:** EPIC-MX-07, EPIC-MX-08, EPIC-MX-09, EPIC-MX-10, EPIC-MX-13
- **Consumers:** Central MX, Dashboard Executivo, Plano de Acao

## Context

Esta story cria o catalogo de regras consultivas. A engine de execucao e a UI ficam para stories posteriores. O contrato precisa deixar claro que "IA" em 2026 significa regras e contexto simples, sem LLM obrigatorio e sem score alterado manualmente pelo consultor.

## Acceptance Criteria

1. Existe catalogo persistente/configuravel de regras consultivas.
2. Cada regra registra indicador/fonte, condicao, severidade, mensagem, recomendacao e acao sugerida.
3. Regras podem variar por perfil, departamento, loja ou escopo quando aplicavel.
4. Recomendacoes sao deterministicas e rastreaveis a regra e dado de origem.
5. Nenhuma regra altera automaticamente o MX Score.
6. Regras podem gerar sugestao de plano de acao em story posterior.
7. O catalogo suporta regra para exemplo de estoque acima de 90 dias.
8. Nao ha dependencia obrigatoria de LLM ou IA preditiva.

## Tasks / Subtasks

- [x] Auditar estruturas existentes de diagnostico, sugestao ou alertas.
- [x] Definir modelo de regra consultiva.
- [x] Modelar fonte/indicador, condicao, severidade, mensagem e recomendacao.
- [x] Modelar explicabilidade: regra aplicada e dado usado.
- [x] Criar regras iniciais seguras para score, alerta, benchmark, planejamento e estoque 90 dias.
- [x] Garantir que regra nao altere score automatico.
- [x] Criar testes de determinismo e rastreabilidade.
- [x] Rodar `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.
- [x] Atualizar Dev Agent Record e File List antes de concluir.

## Dev Notes

- Nao integrar LLM nesta story.
- Nao implementar chat generativo.
- A palavra "IA" no produto deve ser tratada como experiencia consultiva rules-based em 2026.
- Regras precisam apontar para dado de origem para auditoria e confianca.

## Testing

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Teste de regra deterministica
- Teste de explicabilidade por regra/dado
- Teste garantindo que score nao foi alterado pela recomendacao

## Article IV - Rastreabilidade

| Item | Fonte |
|---|---|
| Interpretar dados e sugerir acoes | PRD §4.14 FR-IA |
| Exemplo estoque 90 dias | PRD §4.14 |
| Regras e contexto simples | PRD §4.14, PRD §5.3 NFR-IA2 |
| Consultor nao altera score | PRD §4.7 FR-SCORE-5 |

## File List

- `docs/stories/story-MX-14-20260527-catalogo-regras-consultor-ia.md`
- `src/lib/mx-executive-foundation.ts`
- `src/lib/mx-executive-foundation.test.ts`
- `src/features/dashboard-loja/sections/PerformanceAlerts.tsx`
- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx`
- `src/features/central-mx/hooks/useConsultorIa.ts`
- `src/features/central-mx/hooks/useConsultorIa.test.ts`
- `src/features/central-mx/sections/ConsultorIaChat.test.tsx`
- `src/features/central-mx/sections/ConsultorIaStoreSection.tsx`
- `src/features/central-mx/StoreConsultorIa.container.tsx`
- `src/features/checkin/hooks/useCheckinPage.ts`
- `src/features/checkin/sections/CheckinCrmSection.test.tsx`
- `src/features/checkin/sections/CheckinForm.tsx`
- `src/features/checkin/sections/CheckinForm.test.ts`
- `src/features/crm/CarteiraClientes.container.tsx`
- `src/features/crm/CarteiraClientes.container.test.tsx`
- `src/features/crm/CentralExecucao.container.test.tsx`
- `src/features/crm/FunilVendedor.container.test.tsx`
- `src/features/crm/MeuPerfilVendedor.container.test.tsx`
- `src/features/crm/hooks/useVendedorPerfil.ts`
- `src/features/crm/hooks/useVendedorPerfil.test.ts`
- `src/features/crm/lib/vendedor-perfil-schema.ts`
- `src/features/notificacoes/sections/NotificacoesHeader.test.tsx`
- `src/lib/seller-live-action-fixes-migration.test.ts`
- `src/pages/VendedorTreinamentos.test.tsx`
- `src/pages/StoreConsultorIa.tsx`
- `src/components/Layout.tsx`
- `supabase/migrations/20260619093000_seller_live_action_fixes.sql`
- `src/App.tsx`
- `src/lib/auth/routeAccess.ts`
- `src/lib/auth/routeAccess.test.ts`
- `src/test/mx-consultoria-role-smoke.playwright.ts`
- `src/features/vendedor-home/AgendaVendedor.tsx`
- `src/features/dashboard-loja/sections/ManagerOperationalCockpit.tsx`
- `src/lib/calculations.ts`
- `src/lib/development-content.ts`
- `supabase/migrations/20260527140000_alerts_engine_schema.sql`
- `supabase/migrations/20260527180000_departments_planning_consultive_rules_schema.sql`

## Dev Agent Record

### Debug Log

- Story criada em modo YOLO via @sm para formalizar EPIC-MX-14.1.
- 2026-05-27: Auditadas regras determinísticas existentes: `usePerformanceAlerts` gera recomendações por meta, disciplina, conversão de lead, conversão de visita e ausência de dados.
- 2026-05-27: `OwnerExecutiveCockpit` usa esses alertas para Consultor IA, plano de ação, alertas, benchmarking e agenda sem alterar automaticamente o MX Score.
- 2026-05-27: A migration de alertas já possui `rule_version` e `metadata`, e o catálogo persistente criado nesta passagem passa a sustentar explicabilidade por regra/dado.
- 2026-05-27: Estoque acima de 90 dias aparece como oportunidade/pendência de benchmarking na UI e agora também possui regra seedada no catálogo consultivo.
- 2026-05-27: Gates executados no lote MX: `npm run lint` passou com warnings preexistentes, `npm run typecheck` passou, `npm test` passou com 329 testes e `npm run build` passou.
- 2026-05-27: Criada migration `20260527180000_departments_planning_consultive_rules_schema.sql` com `catalogo_regras_consultivas`, condições JSON, severidade, mensagem, recomendação, ação sugerida, departamento, explicabilidade e `affects_score = false`.
- 2026-05-27: Seed inicial inclui regras para estoque acima de 90 dias, conversão lead > agendamento abaixo do benchmark, rotina incompleta e MX Score em atenção/crítico.
- 2026-05-27: Adicionada cobertura unitária em `mx-executive-foundation.test.ts` para determinismo, rastreabilidade por `sourceRef`, regra de estoque > 90 dias, benchmark e garantia de `affectsScore: false`.
- 2026-05-29: Unificado o Consultor IA de dono, gerente e vendedor na rota `/lojas/:storeSlug/consultor-ia`, reutilizando o mesmo bloco visual e o mesmo `ConsultorIaChat` rules-based.
- 2026-05-29: Atualizada navegação lateral/CTA para gerente e vendedor apontarem para a experiência consultiva por loja em vez de `/auditoria` ou WhatsApp.
- 2026-05-29: Gates executados: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `bun test src/lib/auth/routeAccess.test.ts` passaram.
- 2026-06-19: Corrigido `useConsultorIa` para consultar `consultor_solucoes.scope_type` com enum canônico `store`, evitando 400 `invalid input value for enum score_scope_type: "loja"`.
- 2026-06-19: Corrigido botão `Salvar rascunho` do Fechamento Diário para fluxo de rascunho local, sem disparar o RPC de finalização.
- 2026-06-19: Aplicada no Supabase remoto a migration `20260619093000_seller_live_action_fixes.sql`; o RPC `consultor_ia_sugerir_acao` passou a permitir vendedor vinculado à loja.
- 2026-06-19: Validação live com login vendedor confirmou `Salvar rascunho`, `FINALIZAR FECHAMENTO`, `Gerar sugestões`, `Feito`, `Não feito`, `Salvar perfil`, `Salvar cliente`, `Marcar tudo`, `Registrar snapshot`, `Responder prova`, `Confirmar presença`, `Adicionar à agenda`, `Li e compreendi` e `Concluir ação`.
- 2026-06-19: `Remover` validado no cliente de teste `Cliente Teste Codex 1781853212768`; após confirmação explícita, o clique em `OK` removeu o registro, a UI recarregada permaneceu com 2 clientes e o Supabase retornou contagem 0 por `id` e por `nome`.
- 2026-06-19: Gates executados após ajustes live: pacote direcionado Bun do módulo vendedor, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` e `git diff --check` passaram.
- 2026-06-19: Rodada final após `Remover`: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `git diff --check`, `npm run validate:structure` e `npm run validate:agents` passaram; `validate:agents` manteve apenas warnings preexistentes de dependências AIOX ausentes.

### Completion Notes

- Existe comportamento rules-based no frontend e nenhum uso obrigatório de LLM para recomendações operacionais.
- Catálogo persistente/configurável e explicabilidade formal foram adicionados.
- Testes unitários cobrem determinismo, rastreabilidade e preservação do MX Score.
- Dono, gerente e vendedor passam a acessar a mesma experiência do Consultor IA por loja em `/lojas/:storeSlug/consultor-ia`.
- Validação do vendedor confirmou `consultor_solucoes?scope_type=eq.store`, `consultor_ia_sugerir_acao` e `submit_checkin` com status 200 e sem erro de console funcional.
- Rotas e aliases do módulo vendedor foram validados com login `vendedor@mxgestaopreditiva.com.br`; ações finais com escrita foram clicadas no ambiente real quando não destrutivas.
- A exclusão `Remover` foi concluída somente após confirmação humana imediata, conforme política de ação destrutiva em UI; o registro `Cliente Teste Codex 1781853212768` não aparece mais na carteira após reload.

### Change Log

- 2026-05-27: Story atualizada de `Draft` para `InProgress` com evidência de regras existentes e pendências do catálogo persistente.
- 2026-05-27: Story movida para `Ready for Review` após cobertura unitária dos contratos pendentes.
- 2026-05-29: Correção de roteamento e navegação multi-perfil para o Consultor IA por loja.
- 2026-06-19: Correção do mapeamento de escopo do Consultor IA para enum `score_scope_type` canônico.
- 2026-06-19: Correção do CTA `Salvar rascunho`, liberação live do RPC `Gerar sugestões` para vendedor vinculado e validação real das ações do módulo vendedor.
