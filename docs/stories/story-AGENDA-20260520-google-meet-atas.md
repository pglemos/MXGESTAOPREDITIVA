# Story AGENDA-20260520 - Google Meet com transcricao e ata MX

## Objetivo

Garantir que visitas online, aulas online e eventos online da Agenda MX tenham link do Google Meet e um pipeline de ata gerada a partir da transcricao oficial do Google Meet.

## Escopo Entregue

- [x] Confirmar que eventos online continuam gerando Google Meet via Google Calendar `conferenceData`.
- [x] Trocar padrao visual de local online de `ZOOM` para `Google Meet`.
- [x] Adicionar escopo OAuth central `meetings.space.readonly` para leitura de registros e transcricoes do Meet.
- [x] Criar tabela `reunioes_google_meet_atas` para armazenar transcricao, ata, status e erros de processamento.
- [x] Criar Edge Function `google-meet-ata` com processamento individual e processamento recorrente de reunioes vencidas.
- [x] Gerar ata MX usando OpenRouter Free/fallback e o contador diario existente.
- [x] Anexar ata de visitas online em `evidencias_visita` como tipo `ata`.
- [x] Atualizar politica publica de privacidade para Calendar + Meet.

## Observacoes Operacionais

- O sistema consegue buscar e transformar a transcricao oficial do Google Meet em ata quando a transcricao foi gerada pelo Google Meet.
- Se a reuniao nao tiver transcricao habilitada/gerada, a funcao registra `no_transcript` ou `transcript_not_ready` e tenta novamente no processamento recorrente.
- A conta central Google precisa ser reconectada apos o deploy para aceitar o novo escopo do Google Meet.
- A recorrencia pode ser ativada com `configure_google_meet_ata_cron(function_url, cron_secret)`.

## File List

- `supabase/functions/google-meet-ata/index.ts`
- `supabase/migrations/20260520143000_google_meet_atas.sql`
- `supabase/functions/_shared/google.ts`
- `supabase/functions/google-oauth-handler/index.ts`
- `supabase/config.toml`
- `src/features/agenda-admin/hooks/useAgendaAdminForms.ts`
- `src/features/agenda-admin/modals/EventoModal.tsx`
- `src/features/consultoria/components/VisitReportTemplate.tsx`
- `src/pages/Privacy.tsx`
