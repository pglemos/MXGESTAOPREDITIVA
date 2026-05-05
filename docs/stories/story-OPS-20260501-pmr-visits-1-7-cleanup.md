# Story OPS-20260501 - Limpeza das visitas PMR 1 a 7

## Status

In Review

## Contexto

O fluxo em `/consultoria/clientes/:slug/visitas/1..7` estava confuso para o programa PMR 7:

- A visita 1 exibia entrevistas duplicadas para dono, gerente, processo e vendedor.
- As visitas 5, 6 e 7 misturavam componentes de um roteiro antigo com a metodologia PMR 7.
- A metodologia viva no banco tinha checklist/evidência trocados entre PDI e Marketing.
- O checklist cortava textos longos, dificultando leitura em desktop e mobile.
- O cabeçalho de ação da visita estourava no mobile em rotas com objetivos longos.

## Escopo

- Unificar aliases de entrevistas PMR para uma entrevista por papel na visita 1.
- Alinhar PMR 7:
  - Visita 5: Plano de Desenvolvimento Individual (PDI).
  - Visita 6: Posicionamento de Marketing, Estratégia de Conteúdo e Tráfego Pago.
  - Visita 7: Análise das Implementações e Plano de Ação Trimestral.
- Corrigir checklists/evidências das visitas 5, 6 e 7 no Supabase e em migration.
- Melhorar legibilidade dos checklists e responsividade do cabeçalho.

## Checklist

- [x] Auditar metodologia PMR 7 no banco.
- [x] Confirmar duplicidades de entrevistas PMR ativas.
- [x] Desativar aliases duplicados e consolidar templates canônicos.
- [x] Atualizar visita 5 para formulário de PDI.
- [x] Atualizar visita 6 para formulário de marketing/conteúdo/tráfego.
- [x] Atualizar visita 7 para análise trimestral e plano de ação.
- [x] Corrigir checklist para quebrar linha sem truncar tarefa.
- [x] Ajustar cabeçalho mobile de salvar/concluir.
- [x] Aplicar correção viva no Supabase para PMR 7.
- [x] Adicionar migrations de persistência.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm test`.
- [x] Rodar `npm run build`.
- [x] Validar visitas 5, 6 e 7 no navegador local.
- [x] Corrigir botao de resumo da visita para usar o rascunho digitado como fonte da mensagem de grupo.
- [x] Validar a visita 3 via Chrome MCP, incluindo console limpo e requests da rota sem erro.

## Debug Log

- Cliente validado: `maiscar`, usando `program_template_key = pmr_7`.
- Produção/Supabase foi corrigido diretamente para que os textos de objetivo, participantes, evidências e checklist das visitas 5-7 reflitam PMR 7.
- Validação local autenticada feita em `http://127.0.0.1:3001/consultoria/clientes/maiscar/visitas/5`, `/6` e `/7`.
- Mobile validado em viewport `390x844`; o bloco de ações passou a caber em duas colunas.
- Consolidação posterior: motor autônomo PMR, seed, importação de cronograma, agenda e execução de visitas foram travados no fluxo canônico 1-7.
- `pmr_9` foi tratado como legado: clientes passam para `pmr_7`, programa/etapas ficam inativos e visitas históricas já existentes são preservadas fora do fluxo operacional.
- Ajuste posterior: o botao de resumo do Relato Executivo agora transforma o rascunho digitado pelo consultor em mensagem pronta para grupo, mantendo fallback por checklist apenas quando o campo estiver vazio.
- Chrome MCP validado em `http://localhost:3001/consultoria/clientes/ged-veiculos/visitas/3`: login admin, geracao do resumo a partir do texto digitado, clique repetido sem misturar secoes, console sem mensagens e requests principais `200`.
- Durante a validacao Chrome MCP foi corrigido o select ambiguo de `visitas_consultoria` com `usuarios` usando FKs explicitas e foram adicionados `id/name/aria-label` aos campos de texto da visita.

## File List

- `src/hooks/usePmrDiagnostics.ts`
- `src/features/consultoria/components/VisitOneHighFidelity.tsx`
- `src/features/consultoria/components/VisitExecutionViews.tsx`
- `src/features/consultoria/components/VisitHeaderBase.tsx`
- `src/features/configuracoes/components/tabs/ConsultoriaPmrTab.tsx`
- `src/hooks/useAgendaAdmin.ts`
- `src/hooks/useConsultingClientBySlug.ts`
- `src/hooks/useConsultingClients.ts`
- `src/lib/consultoria/pmr-engine.ts`
- `src/lib/consultoria/pmr-engine.test.ts`
- `src/pages/ConsultoriaVisitaExecucao.tsx`
- `src/lib/consultoria/visit-report-draft.ts`
- `src/lib/consultoria/visit-report-draft.test.ts`
- `src/pages/AgendaAdmin.tsx`
- `scripts/import_cronograma_2026_mx.ts`
- `scripts/seed_pmr_methodology.ts`
- `supabase/migrations/20260501003000_pmr_unify_interview_aliases.sql`
- `supabase/migrations/20260501004000_pmr7_visit_5_7_alignment.sql`
- `supabase/migrations/20260503090000_pmr7_canonical_visit_flow.sql`
- `src/test/security/evidencias-visita.playwright.ts`
- `docs/stories/story-OPS-20260501-pmr-interview-unification.md`
- `docs/stories/story-OPS-20260501-pmr-visits-1-7-cleanup.md`
