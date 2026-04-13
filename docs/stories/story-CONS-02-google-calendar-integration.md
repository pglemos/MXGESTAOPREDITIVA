# Story [CONS-02]: Integracao com Google Calendar (Gestao de Agendas)

**Status:** DRAFT
**Agent:** @data-engineer + @dev + @architect
**Effort:** 8h
**Priority:** MEDIUM

## 1. Context

Após a fundação do CRM de Consultoria (CONS-01), o próximo passo é permitir que os consultores gerenciem suas agendas diretamente pelo sistema MX. A integração deve ser feita via Google Calendar API, permitindo visualizar e possivelmente criar eventos vinculados aos clientes da consultoria.

Esta story foca na autenticação OAuth2 e na sincronização básica de eventos (leitura inicial).

Referencias:
- `docs/prd/mx-consultoria-crm/requirements.md`
- `docs/architecture/mx-consultoria-crm/google-integration-spec.md` (A criar)

## 2. User Story

Como consultor MX,
quero vincular minha agenda do Google ao CRM de Consultoria,
para visualizar meus compromissos com cada cliente diretamente na plataforma.

## 3. Acceptance Criteria

- [ ] Implementar fluxo de autenticação OAuth2 (Google) para consultores.
- [ ] Armazenar de forma segura `refresh_tokens` e `access_tokens` (encriptados).
- [ ] Criar tabela `consulting_calendar_sync` para mapear agendas por cliente/consultor.
- [ ] Implementar Supabase Edge Function para processar o callback do Google.
- [ ] Criar componente de Calendário na `ConsultoriaClienteDetalhe.tsx`.
- [ ] Sincronizar eventos em tempo real ou via polling eficiente.
- [ ] Garantir que o RLS impeça que um consultor veja a agenda de outro sem permissão.

## 4. Implementation Tasks

1.  **Database:** Criar migration para `consulting_oauth_tokens` e `consulting_calendar_settings`.
2.  **Edge Functions:** Criar function `google-oauth-handler` para o fluxo de autorização.
3.  **API:** Integrar com Google Calendar API (List Events).
4.  **UI:** Adicionar aba "Agenda" na tela de detalhes do cliente.
5.  **Security:** Validar escopos mínimos (readonly primeiro) e encriptação de tokens no DB.

## 5. Rollback

- Remover tabelas de tokens e configurações de agenda.
- Desativar Edge Functions de callback.

## 6. Regression Checks

- [ ] Validar que o login principal do sistema continua funcionando.
- [ ] Garantir que o módulo de CRM (CONS-01) não quebre se o Google estiver offline.

## 7. Definition of Done

- Consultor consegue autorizar acesso ao Google Calendar.
- Eventos do Google aparecem na tela do cliente vinculado.
- Tokens são renovados automaticamente via refresh token.
- RLS validado para isolamento de agendas.
