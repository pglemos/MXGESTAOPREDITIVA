# Story MX-2.2 - RLS Policies por Entidade (consumindo roles canônicos)

## Status

🟡 **Parcialmente entregue (helpers) — 2026-05-27**

Helpers SQL canônicos aplicados em produção (migration `20260527120000_role_rls_helpers.sql`):
- `current_user_role_code(uid)` — code canônico do user (fallback automático para `usuarios.role` legado)
- `current_user_role_codes(uid)` — array (combina `usuarios` + `vinculos_loja` M:N)
- `user_has_role(text[], uid)` — match booleano
- `user_has_min_hierarchy(smallint, uid)` — match hierárquico
- `user_is_master_loja(loja_id, uid)` — Master da loja específica

**Aguarda Wave-3:** policies finais nas tabelas score_*/usuarios/lojas (substituição das policies temporárias permissivas da MX-7.1 §10).

## Story

**As a** arquiteto de segurança do MX Performance,
**I want** Row-Level Security (RLS) policies em todas as tabelas críticas consumindo `usuarios.role_id` (FK para roles canônicos),
**so that** o isolamento de dados por perfil seja garantido tecnicamente, atendendo UX-P6 (adapta-se ao perfil) e o requisito do Master "libera acessos" (.docx §39).

## Executor Assignment

executor: "data-engineer"
quality_gate: "qa"
quality_gate_tools: ["psql policy tests", "supabase migration list", "RLS regression suite"]

## Epic Reference

- **Épico:** EPIC-MX-02 — Sistema de Perfis & Permissões
- **Dependência:** MX-2.1 aplicada (`roles` table existe + `usuarios.role_id` populado)

## Acceptance Criteria

- [ ] Função helper `current_user_role_code()` retornando `roles.code` do usuário autenticado
- [ ] Função helper `user_has_role(text[])` para checks rápidos em policies
- [ ] Função helper `user_has_min_hierarchy(smallint)` para checks hierárquicos
- [ ] RLS atualizada nas tabelas score (`score_inputs`, `score_calculations`, `score_observations`) — substituindo policies temporárias de MX-7.1
- [ ] RLS aplicada em `usuarios` (Master vê todos da loja; outros veem só si)
- [ ] RLS em `lojas` (Master vê própria loja; Consultor MX vê várias lojas via allowlist existente)
- [ ] Policy especial Consultor MX: read em `score_calculations`, write apenas em `score_observations`
- [ ] Testes regressivos: cada role tenta acessar dados de outra loja → negado
- [ ] Migration **reversível**

## Tasks / Subtasks

- [ ] Mapear tabelas críticas que precisam de RLS revisada
- [ ] Implementar helpers SQL (current_user_role_code, user_has_role, user_has_min_hierarchy)
- [ ] Atualizar policies de score_* (substituir TODO de MX-7.1)
- [ ] Implementar policies de usuarios, lojas, planos_acao, etc.
- [ ] Suite de testes policy-per-role
- [ ] Documentar matriz de permissões em `docs/architecture/security-matrix.md`

## Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| 10 perfis | PRD §3 ← `.docx` §35–§74 |
| Master libera acessos | PRD §3 ← `.docx` §39 |
| Consultor MX read-only no Score | PRD §4.7 FR-SCORE-5 ← `.docx` §259–§264 |
| Policies TODO em MX-7.1 | `supabase/migrations/20260527110000_score_engine_schema.sql` §10 |

## Estimate

L (large) — matriz de permissões multi-tabela.
