# ADR-0042 — `checkin_validation_kit()`: Single Source of Truth para Validação de Check-in

**Status:** Accepted
**Date:** 2026-05-18
**Author:** @aiox-master (Orion) — pós-discovery refinement
**Story:** 1.10
**Débito:** DB-028
**Migration:** `supabase/migrations/20260518120000_checkin_validation_kit.sql`

---

## Contexto

A regra de negócio "vendedor X pode lançar checkin Y para loja Z na data D no escopo S?" estava implementada em **DOIS lugares** com critérios divergentes (descoberto na verificação estática 2026-05-17):

1. **Policy `lancamentos_diarios_insert/update`** via função `public.pode_lancar_checkin()`
   - Valida `vendedores_loja.is_active = true` + janela `started_at/ended_at`
   - NÃO valida gate horário 09:45
   - NÃO valida `reference_date = ontem` (aceita backdate dentro da janela ativa)

2. **RPC `submit_checkin`** (pré-Story 1.5/1.6)
   - Valida `vinculos_loja.is_active` apenas
   - Valida gate 09:45 + `reference_date = ontem`
   - NÃO validava `vendedores_loja.is_active` (gap DB-001 corrigido na Story 1.6)

### Riscos da duplicação

- **Drift garantido:** refactor em UM lugar esquece do outro
- **Bugs "funciona via UI mas não via API"** (ou vice-versa) — testers reportam comportamentos contraditórios
- **Auditoria custosa:** revisar 2 implementações para cada mudança de regra
- **Onboarding lento:** novo dev precisa ler 2 fontes para entender o fluxo crítico

---

## Decisão

**Centralizar a validação em UMA função `public.checkin_validation_kit()`** que é chamada por:

- RPC `submit_checkin` (Story 1.10 já refatora)
- Policy `lancamentos_diarios_insert/update` (Sprint 2 — DB-028 cleanup; deixar `pode_lancar_checkin()` como deprecated wrapper)

### Assinatura

```sql
public.checkin_validation_kit(
  p_caller_id uuid,
  p_seller_id uuid,
  p_store_id uuid,
  p_reference_date date,
  p_scope text DEFAULT 'daily',
  p_now timestamptz DEFAULT now()
) RETURNS TABLE(ok boolean, error_code text, error_message text)
```

### Atributos

- `LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public`
- `GRANT EXECUTE TO authenticated`

### Códigos de erro (estáveis para UX FE consumir)

| Code | Mensagem | Cenário |
|------|----------|---------|
| `unauthenticated` | Não autenticado. | `p_caller_id IS NULL` |
| `caller_inactive` | Usuário não autenticado ou inativo. | `usuarios.active = false` ou row ausente |
| `incomplete_payload` | Dados de checkin incompletos. | store/seller/date null |
| `invalid_scope` | Escopo de checkin inválido. | scope ≠ daily/adjustment/historical |
| `role_required` | Registro diário é permitido apenas para vendedor. | scope=daily com role ≠ vendedor |
| `self_only` | Registro diário deve ser feito pelo próprio vendedor. | caller_id ≠ seller_id em daily |
| `invalid_reference_date` | Registro diário aceita somente a referência oficial. | reference_date ≠ ontem em daily |
| `time_window_closed` | Lançamentos diários ficam disponíveis somente até 09:45. | now > 09:45 SP em daily |
| `future_date` | Lançamentos não podem usar data futura. | reference_date > ontem |
| `no_active_store_link` | Usuário não possui vínculo ativo com a loja. | vinculos_loja.is_active = false |
| `vendor_inactive` | Vendedor não está ativo nesta loja no período informado. | vendedores_loja.is_active = false OU fora janela |

### Bypass admin

Caller com role em `('administrador_geral', 'administrador_mx', 'consultor_mx')` bypassa regras de vendedor (5.x), mas continua sujeito a:
- Caller deve estar `active=true`
- Payload completo
- Scope válido
- Data ≤ ontem

---

## Consequências

### Positivas

✅ **Single source of truth** — qualquer mudança de regra é feita em 1 lugar
✅ **Auditoria reduzida** — review de regra de negócio passa de 2 implementações para 1
✅ **Códigos de erro estáveis** — UX FE pode mapear `error_code` para mensagens amigáveis sem inspecionar `error_message`
✅ **Testes pgTAP cobrem 1 função** — 8 cenários (T1-T8) cobrem combinatória de validações
✅ **Performance equivalente** — `STABLE` + index access; EXPLAIN ANALYZE deve ficar dentro de 1.2x baseline

### Negativas / Trade-offs

⚠️ **Coexistência temporária** — `pode_lancar_checkin()` permanece funcional como backstop até Sprint 2 (refactor da policy). Drift residual baixo porque marcamos como `DEPRECATED` no `COMMENT`.

⚠️ **SECURITY DEFINER risk** — função executa como owner. Mitigação: `search_path = public` explícito (CVE-2018-1058 family), code review obrigatório @architect, pgTAP cobre cenários adversariais.

⚠️ **Performance degradation risk** — função STABLE chamada por policy em cada INSERT/UPDATE. Mitigação: EXPLAIN ANALYZE pré/pós e baseline em Sprint 1.4 canary. Se >1.2x baseline, considerar inlining ou caching.

---

## Plano de Adoção

### Sprint 1 (Story 1.10 — esta entrega)
- ✅ Criar `checkin_validation_kit()` em migration
- ✅ Refatorar `submit_checkin` RPC para chamar a função
- ✅ Marcar `pode_lancar_checkin()` com `COMMENT ... DEPRECATED`
- ⏳ Testes pgTAP (8 cenários T1-T8) — devs devem adicionar
- ⏳ EXPLAIN ANALYZE comparativo — devs devem rodar antes do merge

### Sprint 2 (DB-028 cleanup)
- Refatorar policies `lancamentos_diarios_insert/update` para chamar `checkin_validation_kit()` em vez de `pode_lancar_checkin()`
- Validar via Story 0.5 RLS regression matrix (zero regressão)
- DROP de `pode_lancar_checkin()` após 7 dias de produção estável

### Sprint 3+
- Pattern aplicável a outras tabelas com lógica de validação duplicada (metas, comissões) — não escopo desta ADR

---

## Alternativas Consideradas

### Alt 1: Manter duplicação + testes de equivalência
Rejeitada — não escala. A cada mudança de regra, manter sincronia exige disciplina; testes de equivalência são proxy, não garantia.

### Alt 2: Mover toda lógica para policy (eliminar RPC submit_checkin)
Rejeitada — RPC oferece valor adicional (audit log, ON CONFLICT upsert, EXCEPTION handling, tracing). Manter ambos os caminhos com 1 fonte de verdade é o equilíbrio correto.

### Alt 3: Mover toda lógica para FE
Rejeitada — viola defense-in-depth. Cliente é zona não confiável (DB-016 demonstra).

---

## Verificação

### Critérios de sucesso pós-merge

- [x] Migration aplicada idempotentemente
- [x] `submit_checkin` continua funcional (Story 1.6 ACs verdes)
- [x] `pode_lancar_checkin()` marcado como DEPRECATED via COMMENT
- [ ] Story 0.5 RLS matrix continua verde (zero regressão de comportamento)
- [ ] Story 0.6 smoke 403 continua verde
- [ ] EXPLAIN ANALYZE `submit_checkin` INSERT: tempo ≤ 1.2x baseline pré-1.10
- [ ] 8 cenários pgTAP T1-T8 (devs adicionam)

### Métricas de longo prazo

- Mean Time Between Validation Bugs (MTBVB): expectativa de **redução de 50%** após adoção plena (Sprint 2)
- Lines of validation logic: 78 LOC duplicadas → 1 fonte (78 LOC + ~10 LOC de wrappers)

---

## Referências

- `docs/reviews/submit-checkin-rpc-audit.md` §6 (descoberta DB-028)
- `docs/reviews/db016-vector-analysis.md` (contexto vetor narrow)
- `docs/prd/technical-debt-assessment.md` §DB-028
- `docs/stories/sprint-1/story-1.10-checkin-validation-kit.md`
- `supabase/migrations/20260516125000_submit_checkin_rpc.sql` (versão original)
- `supabase/migrations/20260517120000_rpc_error_log_wrap_sqlerrm.sql` (Story 1.5)
- `supabase/migrations/20260517130000_submit_checkin_validate_vendedor.sql` (Story 1.6)
- `supabase/migrations/20260518120000_checkin_validation_kit.sql` (esta ADR)
- `supabase/migrations/20260507143000_yolo_second_pass_rls_hardening.sql:22` (`pode_lancar_checkin` original)
