# Story [DB-04]: Database Integrity Triggers

**Status:** READY
**Agent:** @data-engineer
**Effort:** 2h
**Priority:** MEDIUM (Data Integrity)

## 1. Context
Quando uma `store` é excluída (hard delete), as `memberships` e `store_sellers` conectadas a ela são destruídas devido ao `ON DELETE CASCADE`. Contudo, os usuários (`users`) relacionados, caso fiquem sem nenhuma outra unidade vinculada, permanecem ativos no banco de dados como "fantasmas", poluindo consultas globais.

## 2. Acceptance Criteria
- [ ] Criação de uma Trigger no PostgreSQL (`after_store_delete_cleanup_users`).
- [ ] Se um usuário perder sua última afiliação na tabela `memberships` ou `store_sellers`, seu status deve mudar automaticamente para `active = false`.
- [ ] Migration versionada garantindo integridade de domínio de exclusão de dados.

## 3. Implementation Tasks
1. Criar a migration `20260411004000_membership_orphan_cleanup.sql`.
2. Escrever a função de verificação `check_orphan_users_after_store_deletion()`.
3. Associar a trigger ao evento `AFTER DELETE ON public.stores` ou `AFTER DELETE ON public.memberships`.

## 4. Definition of Done
- Scripts integrados em banco.
- Nenhum usuário vendedor ativo sem uma loja correspondente no painel de admin.
