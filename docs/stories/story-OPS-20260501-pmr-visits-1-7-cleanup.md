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

## Debug Log

- Cliente validado: `maiscar`, usando `program_template_key = pmr_7`.
- Produção/Supabase foi corrigido diretamente para que os textos de objetivo, participantes, evidências e checklist das visitas 5-7 reflitam PMR 7.
- Validação local autenticada feita em `http://127.0.0.1:3001/consultoria/clientes/maiscar/visitas/5`, `/6` e `/7`.
- Mobile validado em viewport `390x844`; o bloco de ações passou a caber em duas colunas.

## File List

- `src/hooks/usePmrDiagnostics.ts`
- `src/features/consultoria/components/VisitOneHighFidelity.tsx`
- `src/features/consultoria/components/VisitExecutionViews.tsx`
- `src/features/consultoria/components/VisitHeaderBase.tsx`
- `src/pages/ConsultoriaVisitaExecucao.tsx`
- `supabase/migrations/20260501003000_pmr_unify_interview_aliases.sql`
- `supabase/migrations/20260501004000_pmr7_visit_5_7_alignment.sql`
- `docs/stories/story-OPS-20260501-pmr-interview-unification.md`
- `docs/stories/story-OPS-20260501-pmr-visits-1-7-cleanup.md`
