# Story 1.6 — Validar `vendedores_loja.is_active` em `submit_checkin` (DB-001)

**Status:** Ready
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 1
**Prioridade:** P0
**Severidade do débito:** Alta
**Débito relacionado:** DB-001 (vendedor inativo consegue submeter check-in)

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 1 critical-path: PASS (rollback cirúrgico revert RPC, bloqueada por 1.5, hotfix path para falso-positivo, smoke 0.6 atualizado)
**Esforço estimado:** 6h
**Owner sugerido:** @data-engineer
**RACI:** R=@data-engineer, A=Tech Lead, C=@dev+@qa, I=stakeholders
**Created:** 2026-05-17

## Problem Statement
db-specialist-review (DB-001) identifica que a RPC `submit_checkin` não valida `vendedores_loja.is_active = true`, permitindo que vendedor desligado/desativado submeta lançamentos — violando integridade do payroll e RH. Patch SQL já desenhado: adicionar verificação no início da RPC + retornar erro de domínio claro.

## Business Value
Fecha furo de integridade em fluxo financeiro crítico. Reduz disputas de RH e custo de retroatividade. Patch é cirúrgico (uma RPC) com risco baixo.

## Acceptance Criteria
1. **AC1:** Given um vendedor com `is_active=false`, When chama `submit_checkin`, Then RPC retorna erro de domínio `{code: 'vendor_inactive', trace_id}` (sem vazar SQLERRM — pattern story 1.5) e não insere registro.
2. **AC2:** Given um vendedor com `is_active=true`, When chama `submit_checkin`, Then o comportamento atual é preservado (regressão zero).
3. **AC3:** Given vendedor desativado durante a sessão (race), When chama `submit_checkin`, Then a checagem é dentro de transação (read committed suficiente) e bloqueia consistentemente.
4. **AC4:** Given testes pgTAP, When executados, Then cobrem: vendedor ativo (sucesso), inativo (erro), inexistente (erro), desativado mid-flight (erro).
5. **AC5:** Given correlation ID, When erro ocorre, Then é rastreável end-to-end (FE → Sentry → rpc_error_log).

## Scope IN
- Patch SQL na RPC `submit_checkin` (SELECT `is_active` + raise erro de domínio se false).
- Pattern wrap-sqlerrm (story 1.5) aplicado.
- Testes pgTAP cobrindo 4 cenários.
- UX FE: mensagem amigável "Vendedor inativo. Contate o gestor." (sem expor trace_id ao usuário final).
- Atualizar smoke tests (story 0.6) com cenário vendedor inativo.

## Scope OUT
- Refator amplo de `submit_checkin` (apenas o patch DB-001).
- Outras RPCs com gaps similares (escopo próprio em Sprint 2).
- UI para gestor ativar/desativar vendedor (já existente — fora do escopo).

## Tasks
- [ ] Aplicar patch SQL conforme db-specialist-review §DB-001.
- [ ] Integrar pattern wrap-sqlerrm (story 1.5).
- [ ] Tratamento UX no FE para `vendor_inactive`.
- [ ] Testes pgTAP: 4 cenários.
- [ ] Smoke test (story 0.6) atualizado.
- [ ] CodeRabbit + @qa gate.

## Dependências
- **Bloqueada por:** Story 1.5 (pattern wrap-sqlerrm), Sprint 0 done.
- **Bloqueia:** —

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Falso-positivo (vendedor recém-criado sem flag) | Média | Validar default da coluna `is_active`; backfill se necessário antes do deploy |
| Mensagem de erro confusa para usuário | Baixa | UX copy aprovado por @po antes do PR |
| Race condition (desativação concorrente) | Baixa | Read committed cobre; documentar limitação se houver |
| Breakage de fluxo legado | Alta | Smoke test cobre fluxo feliz; rollback simples (revert RPC) |

## Testes Requeridos
- [ ] pgTAP: vendedor ativo submete → sucesso
- [ ] pgTAP: vendedor inativo submete → erro `vendor_inactive`
- [ ] pgTAP: vendedor inexistente submete → erro
- [ ] pgTAP: vendedor desativado entre sessão e RPC → erro
- [ ] Smoke test (story 0.6): cenário vendedor inativo
- [ ] FE: mensagem amigável renderizada

## Definition of Done
- [ ] ACs verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Testes pgTAP 4 cenários verdes
- [ ] @qa gate PASS
- [ ] PR merged (@devops push)

## Rollback Plan
1. **Bug no patch:** revert da migração (substitui RPC pela versão anterior — guardada no PR como `submit_checkin_v_prev.sql`).
2. **Falso-positivo em produção:** hotfix temporário relaxando a checagem (com alerta) enquanto investiga.
3. **UX FE confusa:** revert do PR FE; RPC continua segura mesmo sem UX customizada.
4. RTO: <10min para revert RPC; <5min para hotfix.

## Notas Técnicas
- Patch SQL:
  ```sql
  IF NOT EXISTS (SELECT 1 FROM vendedores_loja WHERE id = p_vendedor_id AND is_active = true) THEN
    -- usar pattern wrap-sqlerrm
    RAISE EXCEPTION 'vendor_inactive' USING ERRCODE = 'P0002';
  END IF;
  ```
- Code do erro distinto (`P0002`) para diferenciar de erros genéricos.

## Verificação Estática (2026-05-17)
✅ **Gap REAL confirmado** — RPC `submit_checkin` ([linha 79-87](../../../supabase/migrations/20260516125000_submit_checkin_rpc.sql)) valida `vinculos_loja.is_active` MAS NÃO `vendedores_loja.is_active`:
```sql
-- ATUAL (incompleto)
IF NOT v_is_internal AND NOT EXISTS (
  SELECT 1 FROM public.vinculos_loja
   WHERE user_id = v_seller_id AND store_id = v_store_id
     AND coalesce(is_active, true) = true
) THEN RETURN ... END IF;
-- FALTA: checagem de vendedores_loja.is_active
```

**Patch validado para inserir APÓS linha 87:**
```sql
IF NOT v_is_internal AND NOT EXISTS (
  SELECT 1 FROM public.vendedores_loja
   WHERE seller_user_id = v_seller_id AND store_id = v_store_id
     AND coalesce(is_active, true) = true
) THEN
  RETURN jsonb_build_object('ok', false, 'error', 'Vendedor não está ativo nesta loja.');
END IF;
```

**Inconsistência cruzada descoberta** (gera débito DB-028 sugerido):
- Direct POST (policy via `pode_lancar_checkin`) → ❌ rejeita vendedor inativo
- `submit_checkin` RPC → ✅ aceita vendedor inativo (gap deste story)

## Referências
- `docs/reviews/submit-checkin-rpc-audit.md` §3 (DB-001 evidência + patch)
- `docs/reviews/db-specialist-review.md` §DB-001 (patch SQL completo)
- `docs/prd/technical-debt-assessment.md` §DB-001
- Story 1.5 (wrap-sqlerrm — combinar pattern)
- Story 0.6 (smoke 403)
