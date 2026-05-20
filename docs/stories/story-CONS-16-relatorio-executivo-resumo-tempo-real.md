# Story CONS-16 - Relatorio Executivo e Resumo em Tempo Real

**Status:** Implemented - aguardando validacao final  
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 1 - Consultoria PMR pronta para uso  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @architect + @dev  
**Quality Gate:** @qa  
**Prioridade:** Critical

## Contexto

A reuniao reforcou que o consultor nao deve levar trabalho para casa. Ao terminar a visita, o resumo deve estar disponivel para o lojista/dono e o relatorio deve seguir padrao MX, mesmo que a conversa tenha ocorrido fora da ordem do modelo.

Ja existe `VisitReportTemplate.tsx` e scripts CLI de resumo executivo, mas a entrega precisa ficar amarrada ao fluxo da visita.

## User Story

Como admin/admin master MX,  
quero gerar resumo e relatorio executivo ao finalizar a visita,  
para entregar ao lojista/dono um retorno padronizado imediatamente apos a reuniao.

## Acceptance Criteria

- [x] Visita possui acao clara de gerar/atualizar resumo executivo.
- [x] Resumo fica persistido no historico da visita/cliente.
- [x] Relatorio final segue ordem padrao MX, independente da ordem da conversa.
- [x] Relatorio inclui, quando houver dados: periodo, resultado, pontos positivos, pontos a melhorar, tarefas, proximos passos e anexos.
- [x] Transcricao pode ser anexada ou referenciada quando disponivel, sem ser obrigatoria.
- [x] O dono/lojista consegue visualizar o resultado permitido para seu papel.
- [x] Admin/admin master MX consegue revisar antes de compartilhar.
- [x] Estados de erro e dados incompletos sao tratados sem gerar relatorio quebrado.

## Regras de Negocio

- O resumo em tempo real e a fonte operacional do que sera compartilhado no grupo/cliente.
- O relatorio deve usar o padrao MX, nao apenas concatenar campos na ordem de preenchimento.
- IA pode ser usada futuramente, mas o MVP deve funcionar com regra deterministica e campos existentes.

## Arquivos Provaveis

- `src/features/consultoria/components/VisitReportTemplate.tsx`
- `src/features/consultoria/components/VisitExecutionViews.tsx`
- `src/pages/ConsultoriaClienteDetalhe.tsx`
- `src/hooks/useConsultingClientBySlug.ts`
- `scripts/consultoria_gerar_resumo_executivo.ts`
- `scripts/consultoria_gerar_planejamento_estrategico.ts`
- `src/lib/consultoria/*`
- `src/test/*.test.ts`

## Plano AIOX

1. [x] @architect define contrato do relatorio e do resumo.
2. [x] @ux-design-expert valida acao de gerar/revisar/compartilhar.
3. [x] @dev implementa geracao deterministica e UI de revisao.
4. [x] @qa valida relatorio com dados completos, incompletos e anexos.

## Decisoes Assumidas em Yolo Mode

- O MVP usa geracao deterministica em `buildExecutiveVisitReport`.
- O relatorio segue ordem MX fixa: resultado do periodo, positivos/alinhamentos, pontos a melhorar, tarefas concluidas, proximos passos, foco do proximo ciclo e anexos.
- IA continua opcional/futura; o botao existente de resumo usa regra local.
- Transcricao nao vira campo obrigatorio nesta story.

## Gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] Smoke visual do relatorio quando houver alteracao de template.

### Extensao Gemini - 2026-05-20

- [x] Backend `gemini-generate` usa `gemini-2.5-flash` como modelo primario.
- [x] Limite global diario primario configurado para 230 chamadas antes do fallback.
- [x] Fallback configurado para `gemini-2.5-flash-lite` com limite diario de 1000 chamadas.
- [x] Contador diario persistido em banco por projeto/modelo, com reset baseado no dia do Pacific Time.
- [x] Frontend mantem fallback deterministico local quando a Edge Function ou o Gemini estiverem indisponiveis.
- [x] Gates executados: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `deno check supabase/functions/gemini-generate/index.ts`.

## File List

- `docs/stories/story-CONS-16-relatorio-executivo-resumo-tempo-real.md`
- `src/lib/consultoria/executive-visit-report.ts`
- `src/lib/consultoria/executive-visit-report.test.ts`
- `src/pages/ConsultoriaVisitaExecucao.tsx`
- `.env.example`
- `supabase/config.toml`
- `supabase/functions/gemini-generate/index.ts`
- `supabase/migrations/20260520120000_gemini_daily_usage_limits.sql`
