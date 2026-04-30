# STORY-08 — Feedback Estruturado Completo

Status: Ready for Review

## Contexto

O EPIC-08 exige painel de feedback estruturado por vendedor, com numeros semanais, comparacao com equipe, diagnostico, plano de acao, formulario obrigatorio do gerente, meta compromisso sugerida pelos ultimos 15 dias, historico e ciencia do vendedor.

## Escopo

- Usar a semana anterior como referencia oficial do feedback.
- Preencher automaticamente funil, diagnostico e acao sugerida ao selecionar vendedor.
- Calcular comparacao com media da equipe.
- Sugerir meta compromisso a partir dos ultimos 15 dias e permitir ajuste manual do gerente.
- Persistir snapshots auxiliares em `team_avg_json`, `diagnostic_json`, `commitment_suggested` e `acknowledged_at`.
- Permitir criacao apenas por `admin` e `gerente`.
- Permitir vendedor ler e confirmar ciencia.

## Fora De Escopo

- Dono criar ou editar feedback.
- Alterar regra de PDI mensal.
- Criar usuarios reais de teste em producao.

## Criterios De Aceite

- [x] Gerente/admin criam feedback com campos obrigatorios.
- [x] Dono e vendedor nao criam feedback.
- [x] Vendedor ve apenas seus devolutivas.
- [x] Semana de referencia e a semana anterior fechada.
- [x] Meta compromisso sugerida vem dos ultimos 15 dias e pode ser ajustada.
- [x] Ciencia do vendedor grava `acknowledged` e `acknowledged_at`.
- [x] Gates locais passam.

## Validacao

- Migration `20260407006000_weekly_feedback_official.sql` adicionou campos estruturados em `devolutivas` no Supabase live.
- Migration `20260407006100_feedback_seller_ack_guard.sql` aplicada no Supabase live e reparada com `supabase migration repair --status applied 20260407006100`.
- Painel do gerente ajustado para semana anterior fechada, funil automatico, comparacao com media da equipe e meta compromisso sugerida pelos ultimos 15 dias.
- Tela do vendedor ajustada para exibir periodo, meta sugerida/final e data de ciencia.
- RLS/trigger validado com transacao e `ROLLBACK`: gerente cria feedback, vendedor ve o proprio feedback, confirma ciencia e nao altera conteudo.

## Gates

- `npm run lint`: passou.
- `npm run typecheck`: passou.
- `npm test`: passou, 26 testes.
- `npm run build`: passou.
- `git diff --check`: passou.

## File List

- `docs/stories/story-structured-feedback-08/spec/spec.md`
- `docs/stories/story-structured-feedback-08/plan/implementation.yaml`
- `src/pages/GerenteFeedback.tsx`
- `src/pages/VendedorFeedback.tsx`
- `src/hooks/useData.ts`
- `src/components/auth-provider.tsx`
- `src/types/database.ts`
- `supabase/migrations/20260407006000_weekly_feedback_official.sql`
- `supabase/migrations/20260407006100_feedback_seller_ack_guard.sql`
