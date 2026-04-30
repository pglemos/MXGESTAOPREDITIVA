# Epic 1: Auth Hardening — Senha Padrão & Troca Obrigatória

**Epic ID:** EPIC-MX-EVOL-01
**Status:** Draft
**Onda:** A (Imediata)
**Estimativa:** 1 dia útil
**Owner:** @pm (Morgan)
**Implementação:** @dev (Dex)
**Origem:** Tarefa original #7
**Bloqueia:** Épico 2 (User Provisioning)

---

## Objetivo

Padronizar a senha de primeiro acesso de **todos os usuários novos** como `123456`, garantindo que o fluxo já existente de troca obrigatória de senha (`must_change_password = true`) funcione corretamente do cadastro até o primeiro login bem-sucedido.

---

## Contexto Técnico

A infraestrutura para troca obrigatória **já existe**:

| Componente | Localização | Estado |
|------------|-------------|--------|
| Coluna `must_change_password` na tabela `users` | [migrations/20260427175213](../../../../supabase/migrations/20260427175213_add_must_change_password_to_users.sql) | ✅ Pronto |
| Trigger `handle_new_user` que define `TRUE` por padrão | [migrations/20260427175235](../../../../supabase/migrations/20260427175235_update_handle_new_user_trigger.sql) | ✅ Pronto |
| Componente `<ForcePasswordChange />` | [src/features/auth/components/ForcePasswordChange.tsx](../../../../src/features/auth/components/ForcePasswordChange.tsx) | ✅ Pronto |
| Renderização condicional no Layout | [src/components/Layout.tsx:153](../../../../src/components/Layout.tsx) | ✅ Pronto |
| Hook `changePassword` que zera o flag | [src/hooks/useAuth.tsx:328](../../../../src/hooks/useAuth.tsx) | ✅ Pronto |

**Único ajuste necessário:** trocar o default password no `registerUser` de `'Mx#2026!'` para `'123456'` em [src/hooks/useTeam.ts:136](../../../../src/hooks/useTeam.ts).

A edge function `register-user` (chamada via `supabase.functions.invoke`) também precisa ser auditada para confirmar que respeita a senha enviada e marca `must_change_password = true` no metadata.

---

## Stories

### Story 1.1: Padronizar senha default `123456` no fluxo de criação

**Critérios de Aceitação:**

- [ ] Constante `DEFAULT_FIRST_LOGIN_PASSWORD = '123456'` exportada de local centralizado (sugestão: `src/lib/auth/constants.ts`)
- [ ] [src/hooks/useTeam.ts:136](../../../../src/hooks/useTeam.ts) usa a constante em vez do literal `'Mx#2026!'`
- [ ] Edge function `supabase/functions/register-user` (verificar existência ou criar):
  - [ ] Aceita `password` no body com fallback para `123456`
  - [ ] Cria usuário via `supabase.auth.admin.createUser` com `user_metadata.must_change_password = true`
- [ ] Validador frontend de força de senha em `ForcePasswordChange.tsx` mantém mínimo 6 chars (já implementado) — confirmar que não bloqueia `123456` em testes
- [ ] Teste E2E (`e2e/`): novo usuário criado → faz login com `123456` → modal `<ForcePasswordChange />` aparece → troca para senha forte → modal desaparece → não reaparece em login subsequente

### Story 1.2: Auditoria do flow de force password change

**Critérios de Aceitação:**

- [ ] Documentado em `docs/auth/first-login-flow.md` o fluxo completo (provisionamento → primeiro login → troca)
- [ ] Validar que `must_change_password` permanece `true` se o usuário fechar o modal sem trocar (sem bypass)
- [ ] Se vendedor/gerente não trocar a senha, ele NÃO consegue acessar nenhuma rota do app (modal bloqueia 100% da UI — verificar z-index `z-[999]`)

---

## Definition of Done

- [ ] Todas as ACs marcadas
- [ ] `npm run typecheck` passa
- [ ] `npm run lint` passa
- [ ] Testes E2E em `e2e/` cobrindo o flow novo
- [ ] @qa aprova (PASS ou CONCERNS documentado)
- [ ] @devops faz push e deploy em produção

---

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Usuários existentes ficarem com flag pendente acidentalmente | Migration de validação: `UPDATE users SET must_change_password = false WHERE created_at < '2026-04-30'` (apenas se autorizado pelo PO) |
| Senha `123456` ser considerada fraca pelo Supabase Auth | Configurar `password_min_length = 6` em `supabase/config.toml` |
| Edge function `register-user` não existir | Story 1.1 cria a função se ausente |
