# Story OPS-20260501 - Unificar entrevistas PMR da Visita 1

## Contexto

A tela `/consultoria/clientes/:slug/visitas/1` exibiu modelos duplicados de entrevistas PMR porque o banco mantinha ativos os aliases legados `owner`, `manager`, `process` e `seller` junto com as chaves finais `dono`, `gerente`, `processo` e `vendedor`.

## Checklist

- [x] Consolidar os aliases antigos em quatro entrevistas canonicas.
- [x] Normalizar os modelos ativos em producao.
- [x] Evitar criacao de nova resposta a cada digitacao na tela de entrevista.
- [x] Melhorar legibilidade e controle de escala 1-5.
- [x] Validar desktop e mobile no navegador local.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm test`.

## Dev Agent Record

### Debug Log

- Produção antes do ajuste tinha 8 modelos PMR ativos.
- Normalizacao via Supabase Service Role deixou ativos apenas `dono`, `gerente`, `processo` e `vendedor`.
- Validado em producao que a aba "Entrevistas PMR" carrega 4 entradas.
- Validado localmente em `http://localhost:3001/consultoria/clientes/maiscar/visitas/1`.

### Completion Notes

- O hook `usePmrDiagnostics` agora deduplica templates por chave canonica e agrupa respostas legadas no template final.
- A UI local de entrevistas agora usa rascunho local e botao explicito de salvar/atualizar.
- A migration versiona a mesma normalizacao aplicada na base.

### File List

- `src/hooks/usePmrDiagnostics.ts`
- `src/features/consultoria/components/VisitOneHighFidelity.tsx`
- `supabase/migrations/20260501003000_pmr_unify_interview_aliases.sql`
- `docs/stories/story-OPS-20260501-pmr-interview-unification.md`

### Change Log

- 2026-05-01: Correcao operacional concluida.
