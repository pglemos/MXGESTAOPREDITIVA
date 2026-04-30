# Epic 2: User Provisioning — 4 Colaboradores MX

**Epic ID:** EPIC-MX-EVOL-02
**Status:** Provisionado
**Onda:** A (Imediata)
**Estimativa:** 1 dia útil
**Owner:** @pm (Morgan)
**Implementação:** @data-engineer (Dara) + @dev (Dex)
**Origem:** Tarefa original #4
**Depende de:** Épico 1 (Auth Hardening)

---

## Objetivo

Provisionar acessos administrativos para 4 colaboradores da MX Performance, todos com role `admin`,
respeitando o fluxo de troca obrigatória de senha no primeiro login (garantido pelo Épico 1).

---

## Colaboradores a Provisionar

| Nome | Email | Role | Senha inicial | Notas |
|------|-------|------|---------------|-------|
| Daniel | danieljsvendas@gmail.com | admin | 123456 | Já mencionado nos contextos OAuth — possivelmente já existe |
| Gedson | gedson.freire.localiza@gmail.com | admin | 123456 | Novo |
| João | camarajoaoaugusto@gmail.com | admin | 123456 | Novo |
| Mariane | marianedcs@gmail.com | admin | 123456 | Novo |

**Pré-validação obrigatória:** rodar query antes de inserir para identificar emails já existentes em `auth.users` e em `public.users`.

---

## Stories

### Story 2.1: Verificar acessos pré-existentes

**Critérios de Aceitação:**

- [x] Script `scripts/audit_mx_team_access.ts` que para cada email lista:
  - Existe em `auth.users`? (id, created_at, last_sign_in_at)
  - Existe em `public.users`? (role, must_change_password, store_id)
  - Tem `store_memberships`?
- [x] Output salvo em `docs/audit/mx-team-access-2026-04-30.md`
- [x] PO valida o relatório antes de prosseguir

### Story 2.2: Provisionar usuários ausentes

**Critérios de Aceitação:**

- [x] Para cada email não existente, criar via edge function `register-user` (mesma usada na Equipe):
  - role: `admin`
  - password: `123456`
  - `must_change_password: true`
- [x] Para usuários existentes mas sem role `admin`: atualizar via SQL com confirmação manual
- [x] Documentar comandos executados em `docs/audit/mx-team-provisioning-log.md`
- [x] Cada um dos 4 colaboradores deve conseguir login com `123456` e ser obrigado a trocar a senha

### Story 2.3: Notificar colaboradores

**Critérios de Aceitação:**

- [x] Mensagem-template (texto puro, para PO copiar e enviar) em `docs/templates/welcome-message-mx-admin.md`
  - Inclui URL do app, email cadastrado, senha temporária `123456`, instrução de trocar no primeiro login

---

## Definition of Done

- [ ] Todas as ACs marcadas
- [ ] 4 colaboradores conseguem login efetivo
- [ ] Auditoria de roles confirma `role = admin` para os 4
- [ ] @qa aprova
- [ ] @devops realiza eventuais migrações em produção

---

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Email já está cadastrado com outro role/loja | Script de auditoria roda antes; PO decide caso a caso |
| Edge function `register-user` falha sem service_role key | Validar secrets do Supabase antes de rodar |
| Daniel já tem conta vinculada ao Google OAuth (verificação pendente conforme última story OAuth) | Conferir tabela `oauth_state_purpose` antes de provisionar |
