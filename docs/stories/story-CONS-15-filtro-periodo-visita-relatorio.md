# Story CONS-15 - Filtro de Periodo para Visita e Relatorio

**Status:** Implemented - aguardando validacao final  
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 1 - Consultoria PMR pronta para uso  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @data-engineer + @dev  
**Quality Gate:** @qa  
**Prioridade:** High

## Contexto

Na reuniao, ficou claro que o consultor precisa escolher o periodo que sera discutido com o cliente, por exemplo resultado do mes passado, trimestre ou intervalo especifico. O periodo deve orientar indicadores, conversa e relatorio final.

Ja existem campos `period_start` e `period_end` em fluxos de planejamento estrategico, mas a visita precisa ter seu proprio controle ou contrato claro de periodo.

## User Story

Como admin/admin master MX,  
quero selecionar o periodo de analise da visita,  
para gerar conversa e relatorio alinhados ao resultado que sera discutido com o lojista/dono.

## Acceptance Criteria

- [x] Visita permite selecionar periodo de analise com inicio e fim.
- [x] Periodo pode ser preenchido por presets: mes atual, mes anterior, trimestre atual, intervalo customizado.
- [x] Periodo selecionado fica persistido na visita ou em entidade vinculada.
- [x] Indicadores exibidos na visita respeitam o periodo quando houver dados.
- [x] Relatorio executivo exibe o periodo usado.
- [x] Visita sem periodo usa fallback claro, sem quebrar relatorios existentes.
- [x] RLS mantem acesso restrito ao cliente/loja correta.

## Regras de Negocio

- O periodo da visita nao precisa alterar metas globais.
- O periodo e contexto da reuniao, nao substitui fechamento mensal.
- O relatorio deve deixar explicito se o periodo foi manual ou preset.

## Arquivos Provaveis

- `supabase/migrations/*_consulting_visit_analysis_period.sql`
- `src/features/consultoria/types.ts`
- `src/hooks/useConsultingClientBySlug.ts`
- `src/hooks/useConsultingMetrics.ts`
- `src/pages/ConsultoriaClienteDetalhe.tsx`
- `src/features/consultoria/components/VisitReportTemplate.tsx`
- `src/lib/schemas/consulting-client.schema.ts`
- `src/test/schemas/schemas.test.ts`

## Plano AIOX

1. [x] @data-engineer decide persistencia: colunas em `visitas_consultoria` ou tabela auxiliar.
2. [x] @architect valida impacto no motor PMR e relatorios.
3. [x] @ux-design-expert valida seletor/presets.
4. [x] @dev implementa.
5. [x] @qa testa fallback, periodo customizado e acesso por papel.

## Decisoes Assumidas em Yolo Mode

- Persistencia em `visitas_consultoria` com `analysis_period_start`, `analysis_period_end` e `analysis_period_preset`.
- Sem nova tabela e sem nova policy RLS; as permissoes existentes da visita continuam valendo.
- Presets suportados: mes atual, mes anterior, trimestre atual, trimestre anterior e personalizado.
- Visita sem periodo exibe fallback `Periodo nao informado`.

## Gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] Teste de schema se houver migration.

## File List

- `docs/stories/story-CONS-15-filtro-periodo-visita-relatorio.md`
- `src/lib/consultoria/visit-analysis-period.ts`
- `src/lib/consultoria/visit-analysis-period.test.ts`
- `src/features/consultoria/types.ts`
- `src/lib/schemas/consulting-client.schema.ts`
- `src/pages/ConsultoriaVisitaExecucao.tsx`
- `src/features/consultoria/components/VisitReportTemplate.tsx`
- `src/test/schemas/schemas.test.ts`
- `supabase/migrations/20260515121000_consulting_visit_analysis_period.sql`
