# Story OPS-20260603 - Google Meet Admin MX Co-hosts

## Status

Ready for Review

## Contexto

Os eventos online criados pela Agenda Central MX usam `gestao@mxconsultoria.com.br` como organizador do Google Meet. Daniel, Jose, Mariane e Joao precisam administrar as reunioes, mas hoje permanecem apenas como participantes porque a conexao central possui somente permissao de leitura do Meet.

## Acceptance Criteria

- [x] A conexao OAuth da Agenda Central MX solicita a permissao necessaria para criar membros em espacos do Google Meet.
- [x] Eventos online centrais promovem Daniel, Jose, Mariane e Joao ao papel `COHOST` no Google Meet.
- [x] A promocao de co-hosts e idempotente e nao recria convites ou eventos pessoais duplicados.
- [x] Falha de permissao/configuracao do Meet nao impede a sincronizacao do evento no Google Calendar e retorna aviso operacional.
- [x] Eventos existentes podem ser reprocessados pela sincronizacao para receber os co-hosts.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm test`.

## Checklist por Papel

- [ ] Admin MX: Daniel, Jose, Mariane e Joao entram no Meet como co-hosts. Pendente reconexao da conta central para validacao real.
- [x] Operacao: Agenda Central MX informa quando precisa ser reconectada para conceder a nova permissao.
- [x] Agenda: eventos centrais e espelhos pessoais nao sao duplicados pela configuracao de co-hosts.

## Dev Agent Record

### Agentes

- @dev (Dex): investigacao, implementacao, testes e gates.

### Debug Log

- Auditoria em 2026-06-03 confirmou que o token `google_central` possui `meetings.space.readonly`, mas nao possui `meetings.space.created`.
- A API do Google Calendar mantem o organizador como campo somente leitura; a administracao adicional deve ser configurada como membro `COHOST` no Google Meet.
- `google-oauth-handler` passou a solicitar `meetings.space.created` para a Agenda Central MX.
- `google-calendar-sync` lista membros do espaco Meet, mantem co-hosts existentes e cria/substitui somente os quatro admins configurados.
- `google-calendar-merged` informa ao frontend quando a conexao central ainda nao autorizou co-hosts; a agenda exibe acao de reconexao.
- O callback OAuth central reprocessa visitas e eventos online futuros apos a nova autorizacao, promovendo co-hosts tambem nos Meets existentes.
- Deploy Supabase aplicado: `google-oauth-handler` v75, `google-calendar-merged` v56 e `google-calendar-sync` v74.
- Validacao remota de visita online existente retornou `ok: true`, sem erro de calendario, e aviso explicito para reconectar a Agenda Central MX.
- Consentimento OAuth nao foi concluido automaticamente porque a sessao do Chrome nao estava autenticada no MX Performance e o ambiente local nao possui as credenciais OAuth para abrir o fluxo direto.

### Gates

- [x] `npm run typecheck` - passed.
- [x] `npm run lint` - passed.
- [x] `npm test` - 402 passed.
- [x] `npm run build` - passed.
- [x] `deno check` - passed.
- [x] Validacao remota pos-deploy - aviso de reconexao confirmado sem bloquear sincronizacao.

### File List

- `docs/stories/story-OPS-20260603-google-meet-admin-cohosts.md`
- `src/features/agenda/components/GoogleCalendarStatus.tsx`
- `src/hooks/useGoogleCalendar.ts`
- `src/lib/agenda/google-meet-cohost-rules.test.ts`
- `supabase/functions/_shared/google.ts`
- `supabase/functions/_shared/google_meet_cohost_rules.ts`
- `supabase/functions/google-calendar-merged/index.ts`
- `supabase/functions/google-calendar-sync/index.ts`
- `supabase/functions/google-oauth-handler/index.ts`
