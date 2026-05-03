# STORY-11 — Reprocessamento e Reparo Administrativo

Status: Ready for Review

## Contexto

O EPIC-11 exige motor de reprocessamento robusto, idempotente e auditável. O fluxo já existia na UI, mas o live ainda não tinha `file_hash`, `processed_at` e trava forte de lote.

## Escopo

- Endurecer `process_import_data`.
- Adicionar `file_hash` e `processed_at` em `logs_reprocessamento`.
- Permitir hash de arquivo já no terminal administrativo.
- Preservar upsert canônico em `daily_checkins`.

## Fora De Escopo

- Parser novo de planilha.
- Importação assíncrona com fila.
- Reprocessamento multi-arquivo em paralelo.

## Critérios De Aceite

- [x] Upload CSV grava `file_hash`.
- [x] Lote duplicado por hash é bloqueado.
- [x] Lote já concluído não roda novamente.
- [x] `processed_at` é gravado na conclusão.
- [x] Gates locais passam.

## Validação

- Migration `20260407160000_reconcile_epic09_12_end_to_end.sql` adicionou colunas e substituiu a função.
- `Reprocessamento.tsx` calcula SHA-256 do arquivo antes do disparo.
- `npm run validate:e2e:live` executou `process_import_data` no live com hash único e confirmou bloqueio do segundo lote com o mesmo `file_hash`.
- 2026-05-02: Audit Trail da tela `/configuracoes/reprocessamento` passou a listar somente `source_type = csv_import`, evitando misturar falhas de relatórios automáticos com eventos de ingestão.
- 2026-05-02: Funções `relatorio-matinal`, `relatorio-mensal` e `feedback-semanal` passaram a preencher `errors` também quando o envio não acontece por configuração ausente.

## File List

- `docs/stories/story-reprocess-hardening-11/spec/spec.md`
- `docs/stories/story-reprocess-hardening-11/plan/implementation.yaml`
- `scripts/validate_live_end_to_end.ts`
- `src/pages/Reprocessamento.tsx`
- `supabase/functions/feedback-semanal/index.ts`
- `supabase/functions/relatorio-matinal/index.ts`
- `supabase/functions/relatorio-mensal/index.ts`
- `src/types/database.ts`
- `supabase/migrations/20260407160000_reconcile_epic09_12_end_to_end.sql`
