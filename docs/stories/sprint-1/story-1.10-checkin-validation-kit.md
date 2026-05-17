# Story 1.10 — Centralizar Validação `checkin_validation_kit()`

**Status:** Ready
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 1
**Prioridade:** P1
**Severidade do débito:** Alta
**Débito relacionado:** **DB-028** (inconsistência policy ↔ RPC, descoberta na verificação estática 2026-05-17)
**Esforço estimado:** 5h (range 4-6h)
**Owner sugerido:** @data-engineer + @architect (revisão de design)
**RACI:** R=@data-engineer, A=Tech Lead, C=@architect (design review), I=stakeholders
**Created:** 2026-05-17
**Created by:** @aiox-master (Orion) — pós-discovery refinement

---

## Problem Statement
A regra de negócio "vendedor X pode lançar checkin Y para loja Z na data D?" está implementada em **DOIS lugares** com critérios DIVERGENTES:

1. **Policy direct-POST** via função `public.pode_lancar_checkin(p_store_id, p_seller_id, p_reference_date)` — valida `vendedores_loja.is_active = true` + janela `started_at/ended_at`
2. **RPC `submit_checkin`** ([linha 79-87](../../../supabase/migrations/20260516125000_submit_checkin_rpc.sql)) — valida apenas `vinculos_loja.is_active = true`, ignora `vendedores_loja`

**Resultado:** o mesmo cenário (vendedor com vínculo ativo mas `vendedores_loja` inativo) é **rejeitado via direct-POST** mas **aceito via RPC**. Story 1.6 corrige o gap específico, mas a divergência arquitetural permanece — qualquer refactor futuro em UMA das vias esquece da outra → drift garantido.

## Business Value
Elimina classe inteira de bugs futuros de "funciona via UI mas não via API" (ou vice-versa). Reduz superfície de erro de validação para 1 fonte de verdade. Facilita auditoria, testes e onboarding de devs novos no fluxo de checkin (o mais crítico do sistema).

## Acceptance Criteria
1. **AC1 (função única):** Given a função `public.checkin_validation_kit(p_caller_id uuid, p_seller_id uuid, p_store_id uuid, p_reference_date date, p_scope text, p_now timestamptz)` é criada, When chamada com cenários válidos e inválidos, Then retorna `(ok boolean, error_code text, error_message text)` consistente.
2. **AC2 (policy adotada):** Given a policy `lancamentos_diarios_insert/update` é refeita, When usa apenas `checkin_validation_kit(...)`, Then comportamento permanece equivalente (validado por Story 0.5 RLS matrix).
3. **AC3 (RPC adotada):** Given `submit_checkin` RPC é refatorada, When usa `checkin_validation_kit(...)` em vez das validações inline, Then todos cenários da Story 1.6 + Story 0.6 smoke 403 continuam verdes.
4. **AC4 (pgTAP):** Given suite pgTAP cobre 8 cenários (vendedor inativo, vínculo inativo, fora janela, fora horário, scope inválido, impersonation, data futura, OK), When executada via CI, Then 100% passing.
5. **AC5 (documentação):** Given ADR criado, When `docs/adr/0042-checkin-validation-kit.md` existe, Then documenta racional + invariantes garantidas + extensões futuras.

## Scope IN
- Criar função `checkin_validation_kit(...)` SECURITY DEFINER, STABLE, search_path explícito
- Refatorar `submit_checkin` RPC para usar a função
- Refatorar policies `lancamentos_diarios_insert/update` para usar a função
- Atualizar testes pgTAP (8 cenários mínimos)
- ADR documentando a decisão

## Scope OUT
- ❌ Refatorar `pode_lancar_checkin()` existente — apenas marcar como `@deprecated`, manter alias para retrocompatibilidade até Sprint 2
- ❌ Criar versões para outras tabelas (metas, comissões) — esta story é específica para checkins
- ❌ Migrar todas RPCs ao mesmo pattern — apenas `submit_checkin` neste escopo

## Tasks
- [ ] Design da função `checkin_validation_kit(...)` (1h, @architect review)
- [ ] Implementar função + testes pgTAP (1.5h)
- [ ] Refatorar `submit_checkin` RPC (1h)
- [ ] Refatorar policies INSERT/UPDATE em `lancamentos_diarios` (0.5h)
- [ ] Atualizar smoke tests Story 0.6 — confirmar 403 com nova validação (0.5h)
- [ ] ADR + revisão design (0.5h)
- [ ] Code review (CodeRabbit + @architect)
- [ ] @qa gate

## Dependências
**Bloqueada por:**
- Story 1.5 (wrap-sqlerrm — pattern de erro a ser usado em `checkin_validation_kit`)
- Story 1.6 (validate vendedor — gap específico que DB-028 generaliza)
- Story 0.5 (RLS matrix — para validar AC2)

**Bloqueia:**
- Nenhuma diretamente, mas reduz risco de regressão em Sprint 1.4 (canary REVOKE 100%)

**Pré-requisitos técnicos:** Sprint 0 done; Stories 1.5, 1.6 merged

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Função SECURITY DEFINER com search_path errado | Baixa | Alto | Code review obrigatório @architect; pgTAP cobre CVE-2018-1058 family |
| Refactor policy quebra cenário não testado | Média | Alto | Story 0.5 matrix verde antes do merge; canary em staging por 24h |
| Função pesada degrada performance INSERT | Baixa | Médio | EXPLAIN ANALYZE em 10 cenários antes/depois; deve ficar STABLE inline |
| Drift entre função antiga `pode_lancar_checkin` e nova `checkin_validation_kit` durante transição | Média | Médio | Adicionar `RAISE WARNING 'deprecated: use checkin_validation_kit'` em `pode_lancar_checkin`; remover em Sprint 2 |

## Testes Requeridos (pgTAP)
- [ ] T1 — Vendedor ativo + vínculo ativo + janela ok + horário ok + scope daily → OK
- [ ] T2 — `vendedores_loja.is_active = false` → REJECT (cobre DB-001 generalizado)
- [ ] T3 — `vinculos_loja.is_active = false` → REJECT
- [ ] T4 — `reference_date` fora janela `started_at/ended_at` → REJECT
- [ ] T5 — `current_time > 09:45` + scope=daily → REJECT
- [ ] T6 — `p_caller_id != p_seller_id` + scope=daily → REJECT (impersonation)
- [ ] T7 — `reference_date > today` → REJECT (data futura)
- [ ] T8 — Admin MX (`eh_area_interna_mx`) bypassa todas regras de vendedor → OK

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] pgTAP 8 cenários verdes em CI
- [ ] Story 0.5 RLS matrix continua verde (sem regressão)
- [ ] Story 0.6 smoke 403 continua verde
- [ ] EXPLAIN ANALYZE: INSERT em `lancamentos_diarios` < 1.2x baseline
- [ ] ADR `docs/adr/0042-checkin-validation-kit.md` publicado
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **Função buggy / pgTAP falha:** revert da migration; policy + RPC voltam à versão pré-1.10. RTO: <10min.
2. **Regressão em produção (Sprint 1.4 canary detecta):** desabilitar via `RAISE EXCEPTION 'rollback'` na função → comportamento de fallback nas policies/RPC antigas precisa estar preservado em `submit_checkin_v_prev.sql` (guardado no PR como artefato). RTO: <15min.
3. **Performance degradada >20%:** revert + investigar; opção fallback: `IMMUTABLE` hint se aplicável.
4. **Drift causa bug em produção:** `pode_lancar_checkin` deprecated permanece funcional como backstop até Sprint 2.

## Notas Técnicas

### Design da função
```sql
CREATE OR REPLACE FUNCTION public.checkin_validation_kit(
  p_caller_id uuid,
  p_seller_id uuid,
  p_store_id uuid,
  p_reference_date date,
  p_scope text DEFAULT 'daily',
  p_now timestamptz DEFAULT now()
)
RETURNS TABLE(ok boolean, error_code text, error_message text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_official_reference date := ((timezone('America/Sao_Paulo', p_now))::date - 1);
  v_current_sp_time time := (timezone('America/Sao_Paulo', p_now))::time;
BEGIN
  -- (validações em ordem; primeira falha retorna; admin bypassa específicas)
  -- ... ver ADR para spec completo
  RETURN QUERY SELECT true, NULL::text, NULL::text;
END;
$$;
```

### Adoção
- **Policy:** `WITH CHECK ((SELECT ok FROM checkin_validation_kit(auth.uid(), seller_user_id, store_id, reference_date, COALESCE(metric_scope, 'daily'))))`
- **RPC `submit_checkin`:** substitui validações inline (linhas 20-87) por chamada à função; mantém INSERT + EXCEPTION handler (Story 1.5 pattern)

## Referências
- `docs/reviews/submit-checkin-rpc-audit.md` §6 (descoberta DB-028)
- `docs/reviews/db016-vector-analysis.md` (contexto vetor narrow)
- `docs/prd/technical-debt-assessment.md` §DB-028 (Alta, P1)
- Story 1.5 (wrap-sqlerrm — pattern de erro)
- Story 1.6 (validate vendedor — gap específico)
- Story 0.5 (RLS matrix — validação)
- ADR a criar: `docs/adr/0042-checkin-validation-kit.md`

---

## Change Log

- 2026-05-17 | @aiox-master (Orion) | Story criada pós-discovery DB-028 (audit submit_checkin §6)
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (9/10) | Sprint 1 critical-path: pass | Critérios A-E: A(rollback 4 cenários mensuráveis RTO<15min) ✓, B(deps 1.5/1.6/0.5 corretas) ✓, C(EXPLAIN ANALYZE <1.2x baseline + pgTAP 8 cenários observáveis) ✓, D(N/A) ✓, E(N/A) ✓ | Nota: -1pt em estimativa (5h pode ser otimista dado design SECURITY DEFINER + 8 pgTAP + refactor duplo policy/RPC; recomendo buffer @architect/@dev)

