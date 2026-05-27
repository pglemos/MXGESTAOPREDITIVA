# Story MX-2.x - Trigger Unicidade Master por Loja (M:N via vinculos_loja)

## Status

🟡 **Draft — bloqueada por decisão de produto** (ver §Decisão Pendente)

## Story

**As a** arquiteto de dados,
**I want** garantir tecnicamente que cada loja tenha **apenas 1 Master ativo** (PRD §3 / `.docx` §37–§39),
**so that** o princípio "Master/Dono libera acessos" seja inviolável e auditável.

## Executor Assignment

executor: "data-engineer"
quality_gate: "qa"

## Epic Reference

- **Épico:** EPIC-MX-02 — Sistema de Perfis & Permissões
- **Origem:** Migration MX-2.1 (Story MX-2.1) ADIOU este trigger por desconhecimento do modelo M:N
- **PRD:** §3 perfil 1 ("Master / Dono — libera acessos")

## 🔴 Achados de auditoria (2026-05-27)

Investigação revelou:

1. Modelo real é **M:N via `vinculos_loja`** (id, user_id, store_id, role, is_active, ended_at)
2. Usuários podem ter múltiplos vínculos (1 user → várias lojas) — esperado
3. **Múltiplos vínculos com role='dono' por mesma loja JÁ EXISTEM em produção:**
   - 1 loja específica (`801a8299-ce87-4754-b537-29d831556bfc`) tem **3 donos** ativos
   - Total: 9 vínculos `dono` em 7 lojas (média 1.3/loja)
4. Mesmo padrão observado para gerentes: 12 vínculos em 7 lojas (média 1.7)

## 🟡 Decisão Pendente

O PRD §3 sugere "Master = acesso total + libera acessos" — implícito 1 por loja. Mas a realidade de produção permite múltiplos. Stakeholder precisa decidir:

| Opção | Significado | Impacto |
|---|---|---|
| **A** Forçar 1 Master/loja | Adicionar trigger UNIQUE + **deduplicar** os 3 donos da loja `801a82...` antes (cleanup de dados) | Quebra UX de "sócios todos como dono" se for intencional |
| **B** Aceitar N Masters/loja | Atualizar PRD para "1 ou mais Masters/loja" + não implementar trigger | Mantém status quo; viola interpretação literal do `.docx` |
| **C** Híbrido: 1 Master primário + N co-Masters | Adicionar coluna `is_primary` em `vinculos_loja` | Mais complexo, requer migration + UX update |

## Acceptance Criteria (após decisão)

### Se Opção A:
- [ ] Identificar manualmente quem é o "verdadeiro" Master da loja `801a82...` (dos 3 candidatos)
- [ ] Migration de cleanup: revogar role='dono' dos outros 2 (manter histórico via `ended_at`)
- [ ] Trigger BEFORE INSERT/UPDATE em `vinculos_loja` que bloqueia segundo `dono` ativo na mesma `store_id`
- [ ] Validação: tentar inserir 2º dono via SQL → falha com mensagem clara

### Se Opção B:
- [ ] Atualizar PRD §3 (mudar "1 Master" para "1 ou mais Masters")
- [ ] Atualizar ADR-MX-001 com decisão
- [ ] Nenhuma migration técnica

### Se Opção C:
- [ ] Migration: `ALTER TABLE vinculos_loja ADD COLUMN is_primary boolean DEFAULT false`
- [ ] Backfill: marcar 1 como primary por loja (regra: mais antigo? quem está nas allowlists?)
- [ ] Trigger: bloqueia 2º `is_primary=true` por `store_id`
- [ ] UI: gestão de "quem é o primary" pelo Master atual

## Dev Notes

### Função auxiliar já criada (em MX-2.2 helpers)

`public.user_is_master_loja(p_loja_id, uid)` retorna true se `user_id` tem vínculo ativo com role canônico master nessa loja. Já considera modelo M:N. Tolerante a múltiplos Masters atual.

### Helper para listar lojas onde user é Master

Sugestão para implementar nesta story:
```sql
CREATE OR REPLACE FUNCTION user_master_lojas(uid uuid DEFAULT auth.uid())
RETURNS uuid[] AS $$
  SELECT array_agg(DISTINCT v.store_id)
  FROM public.vinculos_loja v
  WHERE v.user_id = uid AND v.is_active=true
    AND lower(v.role) IN ('dono','owner','master')
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public;
```

## Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| "Master/Dono libera acessos" | PRD §3 ← `.docx` §37–§39 |
| Múltiplos Masters em produção | Auditoria 2026-05-27 (3 donos na loja 801a82...) |
| Modelo M:N | `vinculos_loja` schema descoberto via introspecção |

## Estimate

**A:** M (medium — cleanup + trigger + validação)
**B:** S (small — só docs)
**C:** L (large — migration + backfill + UI)

## Next Step

Stakeholder humano decide Opção A, B ou C antes de qualquer implementação.
