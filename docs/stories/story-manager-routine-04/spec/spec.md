# STORY-04 — Rotina Diaria Do Gerente

Status: Ready for Review

## Contexto

O EPIC-04 do backlog exige que a rotina real do gerente exista em uma area unica, com check-ins pendentes, sem registro, agendamentos do dia, resumo do dia anterior, ranking do momento, atalhos operacionais e rastreabilidade da execucao diaria. O plano operacional tambem define que dono acompanha e gerente opera.

## Escopo

- Consolidar a tela `/rotina` como painel operacional de manha para `gerente` e auditoria/operacao estrutural por `admin`.
- Bloquear acesso operacional do `dono` e `vendedor` pela rota.
- Usar dados canonicos de `daily_checkins`, `store_sellers` e ranking oficial.
- Registrar execucao diaria em `logs_rotina_gerente`.
- Expor historico minimo da rotina na propria tela.
- Manter atalho para feedback estruturado e mensagem/notificacao da loja.

## Fora De Escopo

- Reescrever Edge Function do relatorio matinal.
- Criar automacao de WhatsApp.
- Criar usuarios reais de gerente/vendedor em producao.
- Implementar reuniao semanal completa de feedback.

## Criterios De Aceite

- [x] `/rotina` permite operacao apenas para `admin` e `gerente`.
- [x] Tela exibe check-ins pendentes e sem registro.
- [x] Tela exibe agendamentos do dia a partir do check-in canonico.
- [x] Tela exibe resumo do dia anterior.
- [x] Tela exibe ranking do momento.
- [x] Tela oferece atalhos para feedback estruturado e mensagem da loja.
- [x] Execucao diaria da rotina e observacao opcional sao salvas.
- [x] Admin/dono/gerente autorizados conseguem consultar historico minimo conforme RLS.
- [x] Gates locais passam.

## Validacao

- Migration `20260407003000_manager_daily_routine.sql` aplicada no Supabase live por transacao SQL direta e reparada com `supabase migration repair --status applied 20260407003000`.
- Tabela live `logs_rotina_gerente` validada com colunas esperadas e politicas RLS `role_matrix_logs_rotina_gerente_*`.
- Insert/update via RLS simulando usuario real `admin@autogestao.com.br` validado com `BEGIN ... ROLLBACK`; nenhum dado de teste ficou persistido.
- Query pós-rollback confirmou `0` registros com `notes = 'rollback validation'`.

## Gates

- `npm run lint`: passou.
- `npm run typecheck`: passou.
- `npm test`: passou, 26 testes.
- `npm run build`: passou.
- `git diff --check`: passou.

## File List

- `docs/stories/story-manager-routine-04/spec/spec.md`
- `docs/stories/story-manager-routine-04/plan/implementation.yaml`
- `supabase/migrations/20260407003000_manager_daily_routine.sql`
- `src/hooks/useManagerRoutine.ts`
- `src/types/database.ts`
- `src/App.tsx`
- `src/pages/RotinaGerente.tsx`
