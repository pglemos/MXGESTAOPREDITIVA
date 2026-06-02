# Story OPS-20260602 - Google Calendar Sync Reconciliation

## Status

Ready for Review

## Contexto

A agenda MX nao esta removendo eventos cancelados do Google Calendar, nao limpa eventos pessoais quando o responsavel muda e pode deixar duplicatas visiveis em agendas conectadas.

Auditoria somente leitura em 2026-06-02 encontrou 3 visitas canceladas ainda com IDs Google e 1 grupo de visitas duplicadas no banco. A limpeza deve ser conservadora: remover duplicatas no Google quando a origem MX e deterministica, mas nao apagar linhas ambiguas do sistema.

## Acceptance Criteria

- [x] `google-calendar-sync` remove do Google visitas/eventos com status cancelado e limpa IDs Google no banco.
- [x] Responsavel/consultor atual recebe espelho pessoal via `espelhos_agenda_google_usuario`.
- [x] Espelhos pessoais antigos sao removidos quando o responsavel/consultor deixa de estar relacionado ao evento.
- [x] Admin Master MX nao recebe duplicata pessoal quando a Agenda Central ja e a fonte de leitura.
- [x] Duplicatas Google com mesma origem MX sao deduplicadas mantendo o ID canonico salvo no banco/espelho.
- [x] CLI `scripts/reconcile_google_calendar_sync.ts` roda em dry-run por padrao e possui modo `--execute`.
- [x] CLI remove eventos Google cancelados/duplicados e apenas reporta duplicidades ambiguas do banco.
- [x] Secrets/tokens nao sao impressos em logs.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm test`.

## Checklist por Papel

- [x] Admin MX: cancelamento/remove Google Calendar sem apagar historico no sistema.
- [x] Consultor MX: troca de responsavel remove evento da agenda antiga e cria/atualiza na agenda correta.
- [x] Admin Master MX: consulta usa Agenda Central sem duplicar espelho pessoal.
- [x] Operacao: CLI permite previsualizar e executar reconciliacao conservadora.

## Dev Agent Record

### Agentes

- @dev (Dex): implementacao local, testes e gates.

### Debug Log

- Story criada antes das alteracoes de codigo para cumprir Constitution AIOX.
- `google-calendar-sync` agora converte status cancelado em delete efetivo, remove espelhos pessoais antigos e grava novos espelhos por usuario relacionado.
- Evento pessoal direto legado deixa de ser recriado; quando possivel, a funcao remove o legado e usa `espelhos_agenda_google_usuario` como mapa canonico.
- Admin Master MX e filtrado dos espelhos pessoais para evitar duplicidade com a Agenda Central.
- Upsert central e upsert de espelho pessoal deduplicam eventos Google pela origem `mx_source_kind` + `mx_source_id`.
- CLI de reconciliacao lista eventos MX por calendario em janela configuravel e roda em dry-run por padrao.
- Dry-run local rodou sem escrita, mas nao escaneou Google porque `GOOGLE_TOKEN_ENCRYPTION_SECRET` nao esta presente no ambiente; confirmou 1 grupo ambiguo no banco: PAAY em 2026-02-25T17:00:00+00:00.
- Deploy remoto de `google-calendar-sync` aplicado no projeto Supabase `fbhcmzzgwjdgkctlfvbo`.
- Validacao remota pos-deploy processou 3 visitas canceladas com vinculo Google; uma segunda rodada limpou 2 IDs pessoais legados orfaos. Resultado final: 0 visitas canceladas com `google_event_id`/`google_event_id_central`.
- Re-sync remoto do Gandini executado com sucesso; funcao retornou `ok: true`, sem erros, e sem recriar espelho pessoal para Admin Master.

### Gates

- [x] `npm run typecheck` - passed.
- [x] `npm run lint` - passed.
- [x] `npm test` - 384 passed.
- [x] `npm run build` - passed.
- [x] `deno check supabase/functions/google-calendar-sync/index.ts supabase/functions/_shared/google_calendar_sync_rules.ts` - passed.
- [x] `bun test src/lib/agenda/google-calendar-sync-rules.test.ts src/lib/agenda/google-calendar-privacy.test.ts` - passed.
- [x] `npx tsx scripts/reconcile_google_calendar_sync.ts --dry-run` - partial; Google calendars skipped because `GOOGLE_TOKEN_ENCRYPTION_SECRET` is missing locally.
- [x] `npx supabase functions deploy google-calendar-sync` - deployed.
- [x] Validacao remota com `x-google-calendar-sync-admin-token` - passed; canceladas com IDs Google: 2 antes da rodada final, 0 depois.
- [x] `git diff --check` - passed.

### File List

- `docs/stories/story-OPS-20260602-google-calendar-sync-reconciliation.md`
- `supabase/functions/google-calendar-sync/index.ts`
- `supabase/functions/_shared/google_calendar_sync_rules.ts`
- `scripts/reconcile_google_calendar_sync.ts`
- `src/lib/agenda/google-calendar-sync-rules.test.ts`
