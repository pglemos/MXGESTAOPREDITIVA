# Google Calendar Integration Architecture

**Version:** 0.1
**Owner:** @aiox-master
**Context:** CRM de Consultoria (Story CONS-02)

## 1. Flow

### **A. OAuth 2.0 Flow**
1. O usuário (consultor) clica em "Conectar Agenda" na tela do cliente.
2. O sistema gera uma URL de autorização da Google com os escopos `https://www.googleapis.com/auth/calendar.events.readonly`.
3. O Google redireciona o usuário para `https://{supabase_url}/functions/v1/google-oauth-handler?code={code}`.
4. A Edge Function troca o código por tokens (access + refresh).
5. Os tokens são salvos em `public.consulting_oauth_tokens` vinculados ao `auth.uid()`.

### **B. Event Synchronization**
- Opção 1: Webhooks do Google (Push Notifications).
- Opção 2: Fetch sob demanda no frontend (UI Poll).
- **Decisão:** Iniciaremos com UI Poll para MVP e moveremos para Webhooks em cenários de alta volumetria.

## 2. Data Model

### **Table: public.consulting_oauth_tokens**
- `id`: uuid (PK)
- `user_id`: uuid (FK -> users.id, unique)
- `access_token`: text (encrypted)
- `refresh_token`: text (encrypted)
- `expires_at`: timestamptz
- `scopes`: text[]
- `created_at`: timestamptz

### **Table: public.consulting_calendar_settings**
- `id`: uuid (PK)
- `client_id`: uuid (FK -> consulting_clients.id)
- `user_id`: uuid (FK -> users.id)
- `google_calendar_id`: text (default: 'primary')
- `sync_active`: boolean (default: true)

## 3. Encryption Strategy
- Utilizar `pgcrypto` ou `KMS` para encriptar os tokens no banco de dados. O Supabase Edge Function utilizará uma chave secreta injetada via ambiente (`SUPABASE_ENCRYPTION_KEY`).

## 4. UI/UX
- Aba "Agenda" no Detalhe do Cliente.
- Calendário estilo lista ou grid mensal simples.
- Status da sincronização visível.

## 5. Security (RLS)
```sql
ALTER TABLE public.consulting_oauth_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY oauth_tokens_owner_only ON public.consulting_oauth_tokens
    FOR ALL USING (auth.uid() = user_id);
```
