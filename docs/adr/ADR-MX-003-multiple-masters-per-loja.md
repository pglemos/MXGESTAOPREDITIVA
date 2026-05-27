# ADR-MX-003 — Múltiplos Masters por Loja (Opção B aprovada)

**Data:** 2026-05-27
**Status:** ✅ **Decided — Opção B aprovada pelo stakeholder**
**Decisor:** Pedro Guilherme (stakeholder)
**Stakeholders:** @architect, @pm, @data-engineer
**Origem:** Story `docs/stories/story-MX-02-20260527-master-por-loja.md`
**Documentos relacionados:**
- `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md` §3 (perfil Master)
- `docs/adr/ADR-MX-001-canonical-roles-schema.md`

---

## 1. Contexto

`.docx MX PERFORMANCE - DESENVOLVIMENTO` §37–§39 descreve o perfil Master/Dono como "acesso total, libera acessos" — interpretação literal sugere **1 Master por loja**.

Auditoria de produção (2026-05-27) revelou:
- Modelo real M:N via `vinculos_loja(user_id, store_id, role)`
- **1 loja com 3 donos ativos** (`store_id = 801a8299-ce87-4754-b537-29d831556bfc`)
- 9 vínculos `role='dono'` em 7 lojas (média 1.3/loja)
- Mesmo padrão para gerentes: 12 vínculos em 7 lojas

## 2. Decisão

**Opção B aprovada:** aceitar **múltiplos Masters por loja** como modelo canônico.

### Interpretação ajustada

O `.docx` permanece como fonte primária, mas o requisito "Master libera acessos" passa a significar:
- Qualquer usuário com `role=master` ativo na loja (via `vinculos_loja`) tem o poder de liberar acessos
- Lojas com múltiplos sócios podem ter todos como Master
- Não há hierarquia entre Masters da mesma loja

### Consequências práticas

| Cenário | Comportamento |
|---|---|
| Loja com 3 sócios | Os 3 podem ser Masters simultaneamente |
| Convite de novo funcionário | Qualquer Master pode aprovar |
| Conflito de decisão entre Masters | Resolvido por convenção operacional, não técnica |
| Remoção de Master | Outro Master ou Admin Master MX pode revogar |

## 3. Implicações técnicas

### Não fazer

- ❌ **NÃO** implementar trigger de unicidade `role=master` por loja
- ❌ **NÃO** fazer cleanup dos 3 donos da loja `801a82...`
- ❌ **NÃO** adicionar coluna `is_primary` em `vinculos_loja` (era a Opção C)

### Fazer

- ✅ Atualizar PRD §3 (feito neste PR)
- ✅ Marcar story Master-por-loja como Done com Opção B (feito neste PR)
- ✅ Documentar este ADR (este arquivo)
- ✅ Helper `user_is_master_loja(loja_id)` JÁ funciona corretamente — retorna `true` se o user é um dos Masters (não exige unicidade)

## 4. Stories impactadas

| Story | Antes | Depois |
|---|---|---|
| `story-MX-02-master-por-loja` | 🛑 Blocked (aguarda decisão) | ✅ Done (Opção B) |
| `story-MX-02-rls-policies` (Wave-3) | Premissa: 1 Master/loja | Premissa: N Masters/loja — usa `user_has_role(['master'])` |

## 5. Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| .docx "Master libera acessos" | `.docx` §37–§39 |
| Realidade de produção (3 donos em 1 loja) | Introspecção via Management API 2026-05-27 |
| Opção B aprovada | Stakeholder direto (sessão 2026-05-27) |

---

**Decisão fechada.** Sem implementação técnica necessária — apenas alinhamento documental.
