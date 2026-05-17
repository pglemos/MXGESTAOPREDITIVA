# Auditoria — `public.submit_checkin(jsonb)` RPC

**Date:** 2026-05-17
**Executor:** @aiox-master (Orion) — análise estática
**Source:** `supabase/migrations/20260516125000_submit_checkin_rpc.sql`
**Objetivo:** Confirmar/refutar gaps DB-001 e DB-002; mapear inconsistências entre RPC e policy direct-POST

---

## 1. Veredito

| Story | Débito | Status pós-auditoria | Ação |
|-------|--------|----------------------|------|
| 1.6 | **DB-001** — validate `vendedores_loja.is_active` | ✅ **GAP REAL** | Mantém Story 1.6 |
| 1.5 | **DB-002** — wrap SQLERRM | ✅ **CONFIRMADO** | Mantém Story 1.5 |
| 1.3/1.4 | **DB-016** — bypass via PostgREST | ✅ Confirmado (gate 09:45 + backdate dentro janela) | Mantém canary |

---

## 2. Matriz Direct-POST vs `submit_checkin` RPC

Compara o que cada via aceita/rejeita:

| Cenário | Direct POST (policy via `pode_lancar_checkin`) | `submit_checkin` RPC |
|---------|:----:|:----:|
| Caller authenticated mas usuário `active=false` | ❌ rejeita | ❌ rejeita (l.20-28) |
| Caller role ≠ 'vendedor' tentando 'daily' | ❌ rejeita | ❌ rejeita (l.53-56) |
| Self-impersonation (lançar como outro vendedor) | ❌ rejeita | ❌ rejeita (l.62-64) |
| Vínculo de loja inativo | ❌ rejeita | ❌ rejeita (l.79-87) |
| **`vendedores_loja.is_active = false` (vendedor encerrado)** | ❌ **rejeita** | ✅ **ACEITA** ⚠️ **DB-001 GAP** |
| Backdate fora janela do vínculo | ❌ rejeita (vl.started_at/ended_at) | ⚠️ aceita se ≤ ontem (l.75) |
| Backdate dentro janela do vínculo | ✅ aceita | ❌ rejeita (l.58-60: só `v_official_reference = ontem`) |
| Bypass gate 09:45 (POST após horário) | ✅ aceita | ❌ rejeita (l.66-68) |
| Data futura | ❌ rejeita | ❌ rejeita (l.75-77) |
| Vazamento de SQLERRM em erro inesperado | N/A | ✅ **VAZA** (l.161) ⚠️ **DB-002 GAP** |

### Conclusão da matriz
- **RPC é MAIS RÍGIDO que policy** em: gate horário, data backdate, scope
- **Policy é MAIS RÍGIDA que RPC** em: vendedores_loja.is_active
- **Inconsistência cruzada** — uma cobre o que a outra não cobre. Resultado: combinação é defensiva, mas isolada cada uma tem buracos.

---

## 3. Detalhes — DB-001 (Story 1.6)

### Gap real
RPC `submit_checkin` valida apenas `vinculos_loja.is_active`:

```sql
-- Linha 79-87 do RPC
IF NOT v_is_internal AND NOT EXISTS (
  SELECT 1
    FROM public.vinculos_loja
   WHERE user_id = v_seller_id
     AND store_id = v_store_id
     AND coalesce(is_active, true) = true
) THEN
  RETURN jsonb_build_object('ok', false, 'error', 'Usuário não possui vínculo ativo com a loja.');
END IF;
```

**FALTA:** validação de `vendedores_loja.is_active = true` (tabela paralela que controla atividade comercial específica do vendedor).

### Cenário exploitável (RPC)
1. Vendedor "João" tem `vinculos_loja` ativo na "Loja X"
2. `vendedores_loja` para João/Loja X foi marcado `is_active = false` (encerrado comercialmente, mas vínculo administrativo mantido)
3. João chama `submit_checkin` antes de 09:45 com `reference_date = ontem`
4. RPC aceita → INSERT bem-sucedido
5. Direct POST seria rejeitado pela policy via `pode_lancar_checkin`

### Patch sugerido (Story 1.6 deliverable)
```sql
-- Adicionar ANTES do INSERT (após linha 87)
IF NOT v_is_internal AND NOT EXISTS (
  SELECT 1
    FROM public.vendedores_loja
   WHERE seller_user_id = v_seller_id
     AND store_id = v_store_id
     AND coalesce(is_active, true) = true
) THEN
  RETURN jsonb_build_object('ok', false, 'error', 'Vendedor não está ativo nesta loja.');
END IF;
```

**Esforço:** 6h (mantém estimativa Story 1.6)

---

## 4. Detalhes — DB-002 (Story 1.5)

### Gap real
```sql
-- Linha 159-162
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
```

**Vaza:**
- Nome de constraint violada
- Nome de coluna inesperada
- Detalhes de tipo
- Search_path issues
- Schema introspection acidental

### Pattern de correção (deliverable Story 1.5)
```sql
EXCEPTION
  WHEN others THEN
    DECLARE
      v_trace_id text := gen_random_uuid()::text;
    BEGIN
      INSERT INTO public.logs_auditoria (
        user_id, action, entity, details_json
      ) VALUES (
        v_caller_id, 'ERROR', 'submit_checkin',
        jsonb_build_object(
          'trace_id', v_trace_id,
          'sqlerrm', SQLERRM,
          'sqlstate', SQLSTATE,
          'payload', p_payload
        )
      );
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'Erro interno ao processar check-in. trace_id=' || v_trace_id
      );
    END;
END;
```

**Esforço:** 10h (mantém Story 1.5; aplicar pattern em todas RPCs novas)

---

## 5. Detalhes — DB-016 refinado

A análise anterior em `db016-vector-analysis.md` continua válida. O vetor é:
- **Bypass gate 09:45** via POST direto (policy aceita, RPC rejeita)
- **Backdate dentro da janela do vínculo** via POST direto (policy aceita, RPC rejeita)

Confirma que canary REVOKE é necessário para fechar essas vias.

---

## 6. Inconsistência Estrutural Descoberta

**Problema:** Mesma lógica de "pode lançar?" implementada em DOIS lugares diferentes com regras DIVERGENTES:

1. **Policy** via `pode_lancar_checkin()` — usa `vendedores_loja` + janela `started_at/ended_at`
2. **RPC** `submit_checkin` — usa apenas `vinculos_loja.is_active` + `v_official_reference`

### Risco
- Refactor em uma esquece da outra → drift de comportamento
- Bugs futuros de "funciona via UI mas não via API" (ou vice-versa)

### Recomendação adicional para FASE 8 / assessment FINAL
**Novo débito sugerido: DB-028 — Centralizar validação "pode lançar checkin" em UMA função, chamada tanto pela policy quanto pelo RPC.**

Severidade: Alta
Esforço: 4-6h
Categoria: arquitetura/manutenibilidade
Recomendação: criar função `public.checkin_validation_kit(p_caller_id, p_seller_id, p_store_id, p_reference_date, p_scope, p_now)` que retorna `(ok bool, error text)` e é a única fonte de verdade. Ambos os caminhos chamam essa função.

---

## 7. Stories Sprint 1 — Status Atualizado

| Story | Status pós-auditoria | Esforço | Mudança |
|-------|---------------------|---------|---------|
| 1.1 — Publicar RPCs SELECT | ✅ Mantém | 16h | Sem UPDATE RPC (confirmado em inventário) |
| 1.2 — Migrar 13 consumers | ✅ Mantém | 26h ⬆️ | +6h por +33% SELECTs |
| 1.3 — REVOKE canary 1% | ✅ Mantém | 12h | Sem mudança |
| 1.4 — Canary 10/25/100% | ✅ Mantém | 16h | Sem mudança |
| 1.5 — Wrap SQLERRM | ✅ Confirmada gap real | 10h | Sem mudança |
| **1.6 — Validate vendedores_loja.is_active** | ✅ **Confirmada gap real** | 6h | Patch SQL pronto neste doc |
| 1.7 — Drop migration backups PII | ✅ Mantém | 8h | Sem mudança |
| 1.8 — RLS tabelas faltantes | ✅ Mantém | 10h | Sem mudança |
| 1.9 — supabase-js dependency | ✅ Mantém | 2h | Sem mudança |

**Total Sprint 1:** ~106h (vs ~100h estimativa FASE 10b; +6h por inventário Story 1.2)

---

## 8. Recomendações Operacionais

### Antes do kick-off Sprint 1
1. ✅ **Story 1.6 valida** — pode prosseguir
2. ✅ **Story 1.5 valida** — pode prosseguir
3. ⚠️ **Avaliar DB-028 novo** — criar story 1.10? Ou postpor para Sprint 2?
4. ⚠️ **Atualizar `qa-review.md` T-04:** smoke test deve cobrir cenário "vendedor com vínculo ativo MAS vendedores_loja inativo" via RPC

### Para FASE 8 (se reabrir)
- Adicionar DB-028 (centralização de validação) ao inventário
- Anotar inconsistência policy ↔ RPC como dívida arquitetural

---

## 9. Referências

- `supabase/migrations/20260516125000_submit_checkin_rpc.sql` (RPC auditado)
- `supabase/migrations/20260507143000_yolo_second_pass_rls_hardening.sql:22` (função `pode_lancar_checkin`)
- `docs/reviews/db016-vector-analysis.md` (análise complementar)
- `docs/reviews/lancamentos-diarios-consumers-inventory.md` (inventário Story 0.8)
- `docs/stories/sprint-1/story-1.5-rpcs-wrap-sqlerrm.md`
- `docs/stories/sprint-1/story-1.6-submit-checkin-validate-vendedor.md`
