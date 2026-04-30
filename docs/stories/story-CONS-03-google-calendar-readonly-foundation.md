# Story [CONS-03]: Agenda de Consultoria - Fundacao Google Calendar Readonly

**Status:** REVIEW
**Agent:** @architect + @dev + @data-engineer
**Effort:** 6h
**Priority:** HIGH

## 1. Context

Com `CONS-01` e `CONS-02` em revisao, o proximo passo do Epic 2 e iniciar a agenda da consultoria sem abrir ainda um sync complexo ou criacao de eventos no Google.

O modulo ja possui um componente visual inicial de agenda no detalhe do cliente, mas ainda falta a base tecnica para:

- autorizar o consultor no Google
- persistir tokens com seguranca
- ler eventos do calendario principal
- exibir os eventos no contexto do cliente

Esta story fica propositalmente enxuta: **OAuth2 + leitura inicial (`readonly`) + exibicao minima**.

Referencias:

- `docs/prd/mx-consultoria-crm/requirements.md`
- `docs/prd/mx-consultoria-crm/epics.md`
- `docs/architecture/mx-consultoria-crm/integration-plan.md`
- `docs/architecture/mx-consultoria-crm/google-integration-spec.md`
- `docs/stories/story-CONS-01-consulting-core-foundation.md`
- `docs/stories/story-CONS-02-client-structure-and-assignments.md`

## 2. User Story

Como consultor/admin da MX,
quero conectar minha agenda Google ao CRM de Consultoria,
para visualizar compromissos vinculados ao meu contexto operacional sem depender de planilha externa.

## 3. Acceptance Criteria

- [x] Criar migration isolada para `tokens_oauth_consultoria` e `configuracoes_calendario_consultoria`.
- [x] Persistir `access_token`, `refresh_token`, `expires_at` e `scopes` por usuario autenticado.
- [x] Aplicar RLS para garantir que cada usuario veja e altere apenas seus proprios tokens/configuracoes.
- [x] Criar Edge Function para callback OAuth do Google e troca de `code` por tokens.
- [x] Ler eventos do Google Calendar com escopo minimo `calendar.events.readonly`.
- [x] Exibir eventos retornados no detalhe do cliente, sem quebrar a tela atual.
- [x] Se Google estiver offline ou sem autorizacao, a tela deve degradar com mensagem clara sem derrubar o modulo de consultoria.
- [ ] Rotas do core atual continuam funcionando: `/checkin`, `/funil`, `/ranking`, `/feedback`, `/pdi`, `/treinamentos`.

## 4. Implementation Tasks

1. [x] Criar migration `consulting_calendar` com tabelas de tokens e configuracao.
2. [x] Definir policies RLS por `auth.uid()` para tokens/config de agenda.
3. [x] Criar Edge Function `google-oauth-handler` para:
   - receber `code`
   - trocar por tokens
   - salvar tokens do usuario
4. [x] Criar hook dedicado para agenda (`useConsultingAgenda.ts`) ou extrair a logica do componente atual.
5. [x] Integrar leitura inicial de eventos do calendario principal (`primary`).
6. [x] Exibir lista simples de eventos futuros na `ConsultoriaClienteDetalhe`.
7. [x] Validar fallback para:
   - usuario nao autenticado no Google
   - falha de token
   - Google offline
8. [x] Rodar gates locais e smoke do modulo.

## 5. Rollback

- A migration deve ficar isolada e reversivel sem tocar nas tabelas de clientes/visitas.
- A Edge Function deve poder ser desativada sem quebrar a tela principal.
- O componente de agenda deve continuar funcional em estado vazio, mesmo sem integracao ativa.

## 6. Regression Checks

- [x] `npm run lint`
- [x] `npm run typecheck`
- [ ] `npm test`
- [x] `npm run build`
- [ ] Validar que `/consultoria/clientes/:clientId` continua carregando sem Google conectado.
- [ ] Validar que o login principal do sistema continua funcionando.

## 7. Definition of Done

- Consultor/admin consegue iniciar a autorizacao Google.
- Callback OAuth salva tokens corretamente.
- Eventos futuros aparecem no detalhe do cliente em modo leitura.
- Falhas de Google nao derrubam o CRM de Consultoria.
- File List atualizado abaixo.

## 8. File List

- `docs/stories/story-CONS-03-google-calendar-readonly-foundation.md`
- `src/hooks/useConsultingAgenda.ts`
- `src/features/consultoria/components/GoogleCalendarView.tsx`
- `src/pages/ConsultoriaClienteDetalhe.tsx`
- `supabase/functions/google-oauth-handler/index.ts`
- `supabase/functions/google-calendar-events/index.ts`
- `supabase/migrations/20260413120000_consulting_google_calendar.sql`
- `supabase/migrations/20260414103000_consulting_google_calendar_hardening.sql`

## 9. Notes

- Esta story **nao** inclui criacao/edicao de eventos no Google.
- Esta story **nao** inclui webhooks/push notificacoes.
- Esta story **nao** inclui conciliacao automatica cliente <-> evento por regra de negocio avancada.
- O fluxo seguro de OAuth agora depende de `GOOGLE_TOKEN_ENCRYPTION_SECRET`, `SUPABASE_ANON_KEY` ou `SUPABASE_PUBLISHABLE_KEY`, alem das credenciais Google ja existentes.
- `npm test` segue bloqueado por falha preexistente em `src/hooks/use-toast.test.ts` porque o modulo `src/hooks/use-toast.ts` nao existe mais no repo atual.
- Smoke local: `curl -I http://127.0.0.1:4173/` retornou `HTTP/1.1 200 OK`.
- O proximo passo, se esta story fechar bem, e decidir entre:
  - agenda operacional interna (`consulting_calendar_events`)
  - ou sincronizacao incremental mais robusta
