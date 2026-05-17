# DB-016 — Análise Refinada do Vetor de Ataque

**Date:** 2026-05-17
**Executor:** @aiox-master (Orion) — análise estática pós-inventário
**Status:** Vetor CONFIRMADO mas com escopo **mais NARROW** que reportado pela FASE 2

---

## 1. Veredito Refinado

| Aspecto | FASE 2 / qa-review | **Análise Estática (este doc)** |
|---------|--------------------|------------------------------|
| Bypass via PostgREST possível? | ✅ Sim | ✅ Sim (confirmado) |
| Cross-tenant data leak? | Implícito | ❌ **NÃO** — policies bloqueiam |
| Self-impersonation (lançar como outro vendedor)? | Implícito | ❌ **NÃO** — `uid = p_seller_id` |
| Bypass gate horário 09:45? | ✅ | ✅ confirmado (gate só client-side) |
| Backdate dentro da janela ativa? | — | ✅ **Novo achado** |
| Self-checkin múltiplo no mesmo dia? | — | ⚠️ depende de constraint UNIQUE (`seller_store_reference_scope_key`) |

**Conclusão:** DB-016 é **risco de business-rule bypass**, não de data breach cross-tenant. Severidade **realista: Alta** (não Crítica como reportado), mas continua bloqueante para canary release.

---

## 2. Evidência: Policies Atuais

Última migração que mexeu nas policies: `supabase/migrations/20260507143000_yolo_second_pass_rls_hardening.sql`

### INSERT policy
```sql
CREATE POLICY lancamentos_diarios_insert ON public.lancamentos_diarios
  FOR INSERT TO authenticated
  WITH CHECK (
    public.eh_area_interna_mx()
    OR public.pode_lancar_checkin(store_id, seller_user_id, reference_date)
  );
```

### UPDATE policy
```sql
CREATE POLICY lancamentos_diarios_update ON public.lancamentos_diarios
  FOR UPDATE TO authenticated
  USING (
    public.eh_area_interna_mx()
    OR public.pode_lancar_checkin(store_id, seller_user_id, reference_date)
  )
  WITH CHECK (
    public.eh_area_interna_mx()
    OR public.pode_lancar_checkin(store_id, seller_user_id, reference_date)
  );
```

### SELECT policy (migration anterior)
```sql
CREATE POLICY lancamentos_diarios_select ON public.lancamentos_diarios
  FOR SELECT TO authenticated
  USING (
    public.eh_area_interna_mx()
    OR public.tem_papel_loja(store_id, ARRAY['dono', 'gerente'])
    OR seller_user_id = auth.uid()
  );
```

### REVOKE statements
```
ZERO REVOKE encontrado em qualquer migration.
GRANTs herdam de schema public.* (padrão Supabase para `authenticated`).
```

---

## 3. Função `pode_lancar_checkin()` — Análise

```sql
SELECT
  uid = p_seller_id                             -- ✅ não permite impersonation
  AND EXISTS (
    SELECT 1
    FROM public.usuarios u
    JOIN public.vinculos_loja v
      ON v.user_id = u.id
     AND v.store_id = p_store_id
     AND v.role = 'vendedor'                    -- ✅ exige role correto
    JOIN public.vendedores_loja vl
      ON vl.seller_user_id = u.id
     AND vl.store_id = p_store_id
    WHERE u.id = uid
      AND u.active = true                       -- ✅ usuario ativo
      AND u.role = 'vendedor'                   -- ✅ role no perfil
      AND vl.is_active = true                   -- ✅ DB-001 já coberto AQUI!
      AND (vl.started_at IS NULL OR vl.started_at <= p_reference_date)
      AND (vl.ended_at IS NULL OR vl.ended_at >= p_reference_date)
  )
```

### Defesas garantidas pelo gate
- ✅ **Cross-tenant leak:** bloqueado (vinculo por store_id)
- ✅ **Impersonation:** bloqueado (uid = p_seller_id)
- ✅ **Vendedor inativo:** bloqueado (DB-001 **JÁ COBERTO** pela função! revisar se Story 1.6 ainda é necessária)
- ✅ **Backdate fora da janela do vínculo:** bloqueado
- ❌ **Bypass gate 09:45:** não validado em DB
- ❌ **Backdate dentro da janela ativa:** permitido (e.g., vendedor pode lançar checkin de ontem hoje)
- ❌ **Race condition self-checkin múltiplo:** depende de UNIQUE constraint

---

## 4. Vetor de Ataque Real (refinado)

### Exploits possíveis pelo authenticated authenticated `vendedor`:

1. **Bypass gate 09:45 (BUSINESS RULE)**
   ```http
   POST /rest/v1/lancamentos_diarios
   Authorization: Bearer <token-vendedor>
   Content-Type: application/json

   { "store_id": "<loja_ativa>", "seller_user_id": "<self_uid>",
     "reference_date": "<today>", "metric_scope": "daily", ... }
   ```
   → ✅ Aceito mesmo fora da janela 09:45 (gate só FE em `useCheckins.ts:11,66`)

2. **Backdate dentro da janela ativa**
   - Vendedor com `started_at: 2026-01-01`, `ended_at: NULL`
   - Pode inserir lançamento com `reference_date: 2026-04-30` hoje (2026-05-17)
   - → ✅ Permitido, sem alerta

3. **Manipulação de métricas após fechamento mensal**
   - Se `close-engine` rodou para abril mas vendedor ainda está ativo
   - Pode inserir lançamento backdated abril → corrompe relatório matinal/mensal

### Exploits IMPOSSÍVEIS (confirma defesa em camadas)

- ❌ Lançar checkin para outro vendedor (uid = p_seller_id)
- ❌ Lançar checkin para loja onde não tem vínculo (JOIN vinculos_loja)
- ❌ Lançar checkin como vendedor inativo (vl.is_active = true)
- ❌ Cross-tenant leak (cada policy é tenant-scoped)
- ❌ Vendedor encerrado lançar via PostgREST (vl.ended_at)

---

## 5. Revisão das Stories Afetadas

### Story 1.6 — `submit-checkin-validate-vendedor` (DB-001)
**Status original:** Crítica
**Análise refinada:** ⚠️ **PODE SER REBAIXADA OU REMOVIDA** — `pode_lancar_checkin()` já valida `vl.is_active = true`. Verificar se `submit_checkin` RPC realmente NÃO valida (esse foi o argumento original do DB-001) — pode ser que o problema seja só em INSERT direto, que esta análise mostra também bloqueado pela policy.

**Ação:** Inspecionar `submit_checkin` RPC source para confirmar gap real.

### Story 1.3/1.4 — DB-016 canary
**Mudança de mensagem:** Não vender como "fechar vazamento de dados", mas como **"reforçar defense-in-depth e fechar bypass de business rules (gate 09:45, backdate)"**.
**Severidade:** Mantém Sprint 1 prioridade, mas relatório executivo pode ser ajustado — risco LGPD/breach é menor que o reportado.

### Story 1.1 — criar RPCs SELECT
**Sem mudança:** SELECT pública dentro do tenant via PostgREST é arquitetonicamente frágil mesmo com policy boa — RPCs SECURITY DEFINER permitem auditoria centralizada, log estruturado e correlação. Mantém escopo.

### Story 1.2 — migrar SELECTs
**Sem mudança:** 13 arquivos, ~36 SELECTs. Apenas confirma ausência de UPDATE no FE.

---

## 6. Atualizações Recomendadas

### Em `docs/prd/technical-debt-assessment.md`
- DB-016: severidade **Crítica → Alta** (business rule bypass, não data breach)
- DB-001: marcar como **parcialmente coberto** por `pode_lancar_checkin()`; verificar gap real em `submit_checkin` RPC

### Em `docs/reports/TECHNICAL-DEBT-REPORT.md`
- Seção "Riscos" — refinar narrativa DB-016: "permite manipulação de horário/data de checkin pelo próprio vendedor" (não "vazamento de dados")
- ROI conservador ajustado: risco evitado central R$1,35M → R$ XX (cálculo menor sem cenário breach)
- Mantém recomendação Sprint 0 + canary como **boas práticas e defense-in-depth**

### Em `docs/reviews/qa-review.md`
- T-04 (smoke 403): refinar para incluir "tentativa de POST com reference_date backdated" — validar policy aceita/rejeita conforme janela do vínculo
- Adicionar teste de bypass gate 09:45 via POST direto

---

## 7. Conclusão

| Item | Status |
|------|--------|
| Vetor confirmado? | ✅ Sim |
| Severidade ajustada | Crítica → **Alta** (não breach, é bypass de business rule) |
| DB-001 redundante com policy? | ⚠️ Provavelmente — verificar `submit_checkin` RPC |
| Canary DB-016 ainda necessário? | ✅ Sim — defense-in-depth + auditoria centralizada |
| Story 1.6 escopo | ⚠️ A revisar antes do kick-off Sprint 1 |
| Relatório executivo precisa ajuste? | ⚠️ Sim — narrativa de risco mais precisa |

**Mudança no plano:** nenhuma story Sprint 0 muda. Story 1.6 precisa verificação adicional antes do kick-off. Relatório executivo deve ser ajustado para refletir narrativa mais precisa antes de apresentar ao board (evita over-selling do risco que enfraquece credibilidade técnica).

---

## 8. Referências

- `supabase/migrations/20260507143000_yolo_second_pass_rls_hardening.sql` (policies atuais)
- `supabase/migrations/20260430190000_fundacao_portugues_permissoes_evidencias.sql:935-955` (policy SELECT)
- `supabase/migrations/20260516125000_submit_checkin_rpc.sql` (RPC canônica — verificar)
- `docs/reviews/lancamentos-diarios-consumers-inventory.md` (Story 0.8 inventory)
- `docs/reviews/db-specialist-review.md` §4.1 (análise original do vetor)
- `docs/reviews/qa-review.md` §4.1 (canary sequence mandate)
