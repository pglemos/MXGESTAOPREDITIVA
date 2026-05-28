# Story MX-2.1 - Schema Canônico de Roles (10 Perfis MX)

## Status

✅ **Done** — aplicada em produção Supabase `fbhcmzzgwjdgkctlfvbo` em 2026-05-27 via Management API.

### Resultado da aplicação real

| Métrica | Valor |
|---|---|
| Roles catalogados | 11 (10 canônicos + `admin_mx` meta-role) |
| Usuários mapeados via backfill | **241/241 (100%)** |
| Tabela `roles` estendida | ✅ (6 colunas novas) |
| Coluna `usuarios.role_id` | ✅ FK criada + populada |
| Trigger Master por loja | ⏸️ Adiado (modelo M:N via `vinculos_loja` — story de follow-up) |
| RLS + updated_at trigger | ✅ Ativos |
| Registro em `supabase_migrations.schema_migrations` | ✅ |

## Story

**As a** arquiteto de dados do MX Performance,
**I want** uma tabela canônica `roles` com os 10 perfis oficiais e suas hierarquias, mais o vínculo de cada usuário ao seu role,
**so that** o sistema possa aplicar permissões consistentes (RLS, route guards, layout dinâmico) e o Master/Dono possa liberar acessos conforme `.docx` §39.

## Executor Assignment

executor: "data-engineer"
quality_gate: "qa"
quality_gate_tools: ["supabase migration list", "psql migration verification", "npm run typecheck", "RLS test suite"]

## Epic Reference

- **Épico:** EPIC-MX-02 — Sistema de Perfis & Permissões
- **Arquivo:** `docs/stories/epics/epic-mx-02-perfis-permissoes-2026-05-27.md`
- **PRD:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md` §3 (10 perfis) + §2.1 UX-P6

## Acceptance Criteria

> 🟡 **ACs refinados pós-auditoria 2026-05-27**: estratégia aditiva (não-destrutiva) obrigatória. Ver §Dev Notes para contexto do legado.

- [x] Nova migration criada em `supabase/migrations/20260527100000_canonical_roles_schema.sql`
- [x] Tabela `roles` estendida com colunas: `id` (uuid PK legado), `code` (text unique), `name_pt` (text), `name_en` (text), `description` (text legado), `hierarchy_level` (smallint), `is_master_loja` (boolean default false), `created_at` (legado), `updated_at`
- [x] Seed dos **10 perfis canônicos** com codes estáveis:
  - `master` (Master / Dono — is_master_loja=true, hierarchy=100)
  - `director` (Diretor / Sócio — hierarchy=90)
  - `sales_manager` (Gerente Comercial — hierarchy=70)
  - `seller` (Vendedor — hierarchy=40)
  - `marketing` (Marketing — hierarchy=50)
  - `product` (Produto — hierarchy=50)
  - `finance` (Financeiro / Administrativo — hierarchy=50)
  - `hr` (RH — hierarchy=50)
  - `operations` (Operações — hierarchy=50)
  - `consultant` (Consultor MX — hierarchy=60, escopo especial: read-only no Score)
- [x] Nova coluna `usuarios.role_id` (uuid, FK → roles.id, **nullable inicialmente** para coexistência com `usuarios.role` legado)
- [x] **Backfill obrigatório** convertendo `usuarios.role` (string) → `usuarios.role_id` (FK) usando o mapa documentado nas Dev Notes (dono→master, gerente→sales_manager, vendedor→seller, consultor→consultant, admins→admin_mx)
- [x] **Preservação total** de `usuarios.role` legado — coluna mantida intacta nesta story (deprecação coordenada em story futura)
- [x] **Preservação** da função `eh_admin_master_mx()` — não tocada nesta story
- [x] Constraint de Master por loja explicitamente adiada para `docs/adr/ADR-MX-003-multiple-masters-per-loja.md` porque o modelo real é M:N via `vinculos_loja`, não `usuarios.loja_id`
- [x] Migration **reversível** (DOWN script removendo FK e coluna `role_id` sem alterar `usuarios.role` original)
- [x] Documentação SQL inline: comentário em cada coluna + nota explícita sobre Consultor MX read-only no Score (FR-SCORE-5) + nota sobre coexistência temporária com `usuarios.role`
- [x] Reconciliação documentada com `story-OPS-20260508-role-ui-responsive-hardening` (Ready for Review — ver §Dev Notes)
- [x] Testes de migration: aplicação real em produção registrada nesta story; backfill produziu `role_id` em 241/241 usuários
- [x] Sem regressão em `npm run typecheck` após regeneração de types (`src/types/database.generated.ts` já contém `current_user_role_code`, `current_user_role_codes`, `user_has_role`)
- [x] Sem regressão em migrations subsequentes que referenciam `usuarios.role` string (estratégia preserva a coluna legada e helpers têm fallback)

## Tasks / Subtasks

- [x] ~~Mapear modelo atual de usuários no projeto~~ — **CONCLUÍDO em 2026-05-27**: tabela = `public.usuarios`, role-string em `usuarios.role`, vínculo multi-loja efetivo via `vinculos_loja`
- [x] ~~Verificar se já existe alguma tabela `roles` ou `user_roles` legada~~ — **CONCLUÍDO**: `roles` e `user_roles` existem no baseline; migration estende `roles` sem destruir legado
- [x] Escrever migration UP §1: estender tabela `roles` + seed dos 10 perfis canônicos + `admin_mx`
- [x] Escrever migration UP §2: adicionar coluna `usuarios.role_id` (nullable, FK → roles.id)
- [x] Escrever migration UP §3: backfill `role_id` mapeando `usuarios.role` (string) → `roles.code` conforme mapa em Dev Notes
- [x] Escrever migration UP §4: registrar adiamento da unicidade do Master por loja porque o modelo real é M:N via `vinculos_loja`
- [x] Escrever migration DOWN reversível (drop FK, drop coluna `role_id`, remover roles adicionados, preservar `usuarios.role` string intacta)
- [x] Regenerar types: `supabase gen types typescript` e commitar `src/types/database.generated.ts`
- [x] Atualizar `src/types/` com export de `RoleCode` union type (`'master'|'director'|'sales_manager'|'seller'|'marketing'|'product'|'finance'|'hr'|'operations'|'consultant'`)
- [x] Documentar em ADR (`docs/adr/ADR-MX-001-canonical-roles-schema.md`): decisão dos 10 perfis canônicos + estratégia aditiva + plano de deprecação de `usuarios.role` string
- [x] **Não-objetivo declarado**: refatorar `eh_admin_master_mx()` allowlist (tech debt separado, backlog futuro)

## Dev Notes

### 🔴 ACHADO CRÍTICO — Legado de Roles em uso (auditoria 2026-05-27)

A primeira execução desta story **descobriu modelo de roles legado em produção**. Schema atual usa `public.usuarios.role` (string livre), não tabela canônica. Valores em uso (extraídos das migrations):

| Role atual (legado) | Origem | Significado real |
|---|---|---|
| `administrador_geral` | usuarios | Admin Master **MX consultor** (allowlist de 7 emails hardcoded em `eh_admin_master_mx()`) |
| `administrador_mx` | usuarios | Variante de Admin MX |
| `admin` | usuarios | Admin genérico |
| `consultor_mx` / `consultor` | usuarios | Consultor MX |
| `dono` / `owner` | usuarios | Master/Dono **da loja** (PRD §3 perfil 1) |
| `gerente` / `manager` | usuarios | Gerente Comercial |
| `vendedor` / `seller` | usuarios | Vendedor |
| `todos` | policies | meta-valor (não é role real) |

### 🟡 Ambiguidade "Master" — 2 níveis no sistema

| "Master" no `.docx` | "Master" no código atual |
|---|---|
| Master / Dono da **loja** (§37–§39, "libera acessos") | `dono` / `owner` em `usuarios.role` |
| — (não mencionado no `.docx`) | `administrador_geral` (Admin Master MX — consultor MX que vê várias lojas) |

**Implicação:** Esta story foca no **Master da loja** (perfil 1 do PRD). O Admin Master MX (consultor MX externo) é entidade ortogonal — preservar e não confundir.

### 🟡 Allowlist de emails hardcoded — tech debt

Migration `20260522100000_admin_master_scope_alignment.sql` (e ~4 outras) define função `eh_admin_master_mx()` com **7 emails hardcoded**. Refatorar isso está fora do escopo desta story (separar em backlog), mas a tabela canônica deve permitir flag `is_master_mx` (distinto de `is_master` da loja) no futuro.

### Mapeamento canônico recomendado (estratégia aditiva, não-destrutiva)

| Legado | Code canônico proposto | Estratégia |
|---|---|---|
| `dono` / `owner` | `master` | Map via view ou seed parallel |
| `gerente` / `manager` | `sales_manager` | Map via view ou seed parallel |
| `vendedor` / `seller` | `seller` | Direto (mesmo nome) |
| `consultor` / `consultor_mx` | `consultant` | Map via view ou seed parallel |
| `administrador_geral` / `administrador_mx` / `admin` | — (fora do escopo MX-loja) | Manter; flag separada `is_master_mx` futura |

### 🛑 Estratégia migratória obrigatória (revisão dos ACs)

NÃO criar tabela `roles` nova e quebrar tudo. Estratégia aditiva:

1. Criar tabela `roles` com codes canônicos (master, director, sales_manager, seller, marketing, product, finance, hr, operations, consultant)
2. Criar coluna nova `usuarios.role_id` (FK nullable inicialmente)
3. Backfill: popular `role_id` a partir do valor legado em `usuarios.role` via map documentado acima
4. Manter `usuarios.role` (string) por N sprints até deprecação coordenada
5. Stories subsequentes (2.2 RLS, 2.5 guards) consomem `role_id`, não `role` string

### Multi-tenant — confirmado

Existem tabelas relacionadas a lojas (`stores`/`lojas`) nas migrations `20260504100000_store_registration_profile.sql` e `20260516124500_admin_create_store_rpc.sql`. Constraint "1 Master por loja" será **trigger** verificando `(usuarios.loja_id, role_id WHERE role.code='master')` único.

### Reconciliação com story-OPS-20260508

`story-OPS-20260508-role-ui-responsive-hardening.md` está em **Ready for Review** trabalhando hardening visual dos perfis vendedor/gerente/dono. Essa story (MX-2.1) é complementar — após esta migration aplicada, hardcode de role-string em `src/features/*` deve consumir `role_id` (Story 2.9 do épico cuidará da migração de consumo).

### Restrição Consultor MX

`.docx` §259–§264 + PRD FR-SCORE-5: Consultor MX NÃO altera score. Não é constraint dessa migration, mas o `description` do role `consultant` deve mencionar essa restrição para que a Story 7.10 (guard técnico) e RLS de score (Story 2.2 + 7.1) implementem corretamente.

### Convenção de migration

Última migration: `20260522100000_admin_master_scope_alignment.sql` (relevante! já há trabalho prévio de Master/scope — verificar se há conflito).

Sugestão de timestamp: `20260527100000_canonical_roles_schema.sql`.

## Testing

- Migration UP aplica sem erro em branch Supabase
- Seed produz exatamente 10 rows em `roles`
- FK em `profiles` impede `role_id` inexistente
- DOWN script remove tudo sem deixar lixo
- `supabase gen types` produz types coerentes
- Tipo `RoleCode` é union dos 10 codes exatamente

## Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Lista de 10 perfis com responsabilidades | PRD §3 ← `.docx` §35–§74 |
| Master "libera acessos" | PRD §3 ← `.docx` §39 |
| Consultor MX read-only no Score | PRD §4.7 FR-SCORE-5 ← `.docx` §259–§264 |
| Reconciliação com OPS-20260508 | git status sessão 2026-05-27 |
| Migration prévia 20260522100000_admin_master_scope_alignment.sql | git log |

## Estimate

M (medium) — migration + seed + FK + types + ADR.

## Next Step

Após DoD: @qa `*qa-gate` e desbloqueio das stories 2.2 (RLS policies) e 7.1 (Schema de Score consome este schema para RLS).

## File List

- `docs/adr/ADR-MX-001-canonical-roles-schema.md`
- `docs/stories/story-MX-02-20260527-schema-roles.md`
- `supabase/migrations/20260527100000_canonical_roles_schema.sql`
- `supabase/migrations/20260527120000_role_rls_helpers.sql`
- `src/types/database.ts`
- `src/types/database.generated.ts`
- `src/lib/auth/roles.ts`
- `src/lib/auth/roles.test.ts`
- `src/lib/auth/role-migration-contract.test.ts`

## Dev Agent Record

### Debug Log

- 2026-05-27: Reconciliada story com a migration adaptativa real: `roles` já existia no baseline e foi estendida, não recriada.
- 2026-05-27: Confirmado que `admin_mx` é meta-role separado dos 10 perfis canônicos e é mapeado a partir de `admin`/`administrador_geral`/`administrador_mx`.
- 2026-05-27: Adicionado `RoleCode`, `MxMetaRoleCode` e `MxRoleCode` em `src/types/database.ts`.
- 2026-05-27: Adicionados helpers `ROLE_CODES`, `MX_ROLE_CODES`, `toCanonicalRoleCode()` e `isCanonicalRoleCode()` em `src/lib/auth/roles.ts`.
- 2026-05-27: Adicionada cobertura `role-migration-contract.test.ts` para alinhamento entre migration de roles, helpers RLS e contrato TS.

### Completion Notes

- A story MX-2.1 está concluída no escopo adaptativo aplicado: schema aditivo, backfill, types, ADR e contrato TS.
- A unicidade de Master por loja não foi implementada nesta story por decisão arquitetural documentada em `ADR-MX-003`: o modelo real é M:N via `vinculos_loja`; a restrição correta deve ser tratada em follow-up específico.
- RLS final por entidade permanece em MX-2.2/Wave-3; esta story entrega catálogo, vínculo e helpers base.

### Change Log

- 2026-05-27: Story reconciliada com evidência de produção, types e testes de contrato de roles.
