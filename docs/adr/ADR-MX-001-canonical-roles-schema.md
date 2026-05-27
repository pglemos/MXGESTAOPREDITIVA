# ADR-MX-001 — Canonical Roles Schema (10 Perfis)

**Data:** 2026-05-27
**Status:** Proposed
**Decisor:** @architect (sugerido) + @pm
**Stakeholders:** @data-engineer (implementador), @dev (consumidores frontend), @qa (validação)
**Origem:** Story MX-2.1 (Schema canônico de roles) — auditoria identificou modelo legado
**Documentos relacionados:**
- `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md` §3 (10 perfis)
- `docs/stories/epics/epic-mx-02-perfis-permissoes-2026-05-27.md`
- `docs/stories/story-MX-02-20260527-schema-roles.md`

---

## 1. Contexto

O `.docx` *MX PERFORMANCE - DESENVOLVIMENTO* define **10 perfis canônicos** (§35–§74): Master/Dono, Diretor/Sócio, Gerente Comercial, Vendedor, Marketing, Produto, Financeiro, RH, Operações, Consultor MX.

A auditoria de 2026-05-27 do schema Supabase encontrou:

1. **Tabela `public.usuarios` com coluna `role` (string livre)** — não há tabela canônica
2. **12 valores em uso real** (mistura PT/EN): `admin`, `administrador_geral`, `administrador_mx`, `consultor_mx`, `consultor`, `dono`, `gerente`, `manager`, `owner`, `seller`, `todos`, `vendedor`
3. **Função `eh_admin_master_mx()`** com allowlist de 7 emails hardcoded — Admin Master MX (consultor externo) é entidade ortogonal aos 10 perfis da loja
4. **10+ migrations** referenciam `usuarios.role` diretamente

## 2. Decisão

Adotar **estratégia aditiva, não-destrutiva**:

1. Criar tabela `roles` com 10 perfis canônicos (codes em inglês: `master`, `director`, `sales_manager`, `seller`, `marketing`, `product`, `finance`, `hr`, `operations`, `consultant`)
2. Adicionar coluna `usuarios.role_id` (FK nullable inicialmente) para coexistir com `usuarios.role` legado
3. Backfill automático na migration mapeando legado → canônico:
   - `dono` / `owner` → `master`
   - `gerente` / `manager` → `sales_manager`
   - `vendedor` / `seller` → `seller`
   - `consultor` / `consultor_mx` → `consultant`
   - `admin` / `administrador_geral` / `administrador_mx` / `todos` → **NÃO mapeados** (são meta-roles MX, fora do escopo da loja)
4. Preservação total da coluna `usuarios.role` string e função `eh_admin_master_mx()` (refatoração fora do escopo)
5. Stories futuras (2.2 RLS, 2.5 guards, 2.9 reconciliação) consomem `role_id`, não a string

## 3. Justificativa

| Alternativa | Pro | Contra |
|---|---|---|
| **Substituir `usuarios.role` por `role_id` direto** | Schema limpo | Quebra 10+ migrations + Admin Master MX + features em produção. Inaceitável. |
| **Manter só string, sem tabela `roles`** | Zero mudança | Não atende PRD (10 perfis canônicos), perpetua inconsistência PT/EN |
| ✅ **Estratégia aditiva (decidida)** | Coexistência segura, migração incremental | Período de duplicação até deprecação |

## 4. Consequências

### Positivas

- Implementação não-destrutiva — risco baixo em produção
- Permite frontend evoluir gradualmente (`useCurrentRole()` consome `role_id`)
- ADR explícito previne confusão futura entre Master Loja vs Admin Master MX

### Negativas / Tech Debt

- Período de duplicação `role` (string) + `role_id` (FK) — N sprints
- `eh_admin_master_mx()` allowlist permanece tech debt (escalonar em backlog separado)
- Story futura necessária para deprecar coluna `usuarios.role` string

## 5. Implementação

- **Story responsável:** MX-2.1
- **Migration:** `supabase/migrations/20260527100000_canonical_roles_schema.sql`
- **Types regenerados:** `supabase gen types typescript`
- **TS union exportado:** `RoleCode = 'master' | 'director' | ... | 'consultant'`

## 6. Aprovação Pendente

- [ ] @architect — validar estratégia técnica
- [ ] @pm — confirmar mapping de roles
- [ ] @data-engineer — confirmar plano de backfill
- [ ] Stakeholder humano — confirmar prazo de deprecação de `usuarios.role`

---

**Rastreabilidade Article IV:**
- 10 perfis → PRD §3 ← `.docx` §35–§74
- Master "libera acessos" → `.docx` §39
- Consultor MX read-only no Score → PRD §4.7 FR-SCORE-5 ← `.docx` §259–§264
- Achados de auditoria → execução real em 2026-05-27 (grep migrations + introspecção schema)
