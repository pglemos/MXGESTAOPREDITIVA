# Story 1.5 — Pattern Wrap SQLERRM em Todas RPCs Novas (DB-002)

**Status:** Ready
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 1
**Prioridade:** P0
**Severidade do débito:** Alta
**Débito relacionado:** DB-002 (vazamento de mensagens internas via SQLERRM)

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 1 critical-path: PASS (rollback simples documentado, bloqueada por 0.9 correlation ID, informa 1.1 — trabalho paralelo)
**Esforço estimado:** 10h
**Owner sugerido:** @data-engineer
**RACI:** R=@data-engineer, A=Tech Lead, C=@architect+@dev, I=@qa
**Created:** 2026-05-17

## Problem Statement
db-specialist-review (DB-002) identifica que RPCs propagam `SQLERRM` cru ao cliente, vazando estrutura de tabelas, constraints e mensagens internas (vetor de info-disclosure). Solução: pattern padrão de wrap onde erro real é logado em tabela de auditoria com `trace_id` e cliente recebe resposta genérica + trace_id para suporte rastrear.

## Business Value
Fecha vetor de info-disclosure (OWASP A05). Trace_id melhora UX de suporte sem expor internals. Pattern reutilizável reduz custo de toda RPC futura.

## Acceptance Criteria
1. **AC1:** Given uma RPC nova ou refatorada, When erro ocorre, Then `SQLERRM` + `SQLSTATE` + contexto são gravados em `rpc_error_log` com `trace_id` UUID, e resposta ao cliente é `{error: 'internal_error', trace_id: '<uuid>'}` (sem detalhes).
2. **AC2:** Given o pattern, When aplicado, Then existe helper SQL `wrap_rpc_error(p_trace_id uuid, p_context text)` reutilizável, exemplificado em pelo menos 3 RPCs (incluindo as da story 1.1).
3. **AC3:** Given a tabela `rpc_error_log`, When criada, Then tem RLS habilitada (apenas admin lê), retenção de 90 dias documentada, e índice por `trace_id`.
4. **AC4:** Given CodeRabbit, When roda em PRs com RPCs, Then regra customizada bloqueia uso de `RAISE EXCEPTION '%', SQLERRM` direto (pattern proibido).
5. **AC5:** Given correlation ID (story 0.9), When erro ocorre, Then `correlation_id` cliente é correlacionável com `trace_id` server-side no log.

## Scope IN
- Criação de `rpc_error_log` com RLS + retenção.
- Helper SQL `wrap_rpc_error`.
- Aplicação do pattern nas RPCs da story 1.1 (3+ exemplos).
- Regra CodeRabbit custom (lint SQL).
- Documentação `docs/architecture/rpc-error-handling.md`.
- Política de retenção (cron job 90 dias).

## Scope OUT
- Refator de RPCs legadas (Sprint 2 — escopo separado).
- Dashboards de monitoramento de erros (Sentry já cobre via correlation_id).
- Alertas por trace_id (futuro).

## Tasks
- [ ] Migração: criar `rpc_error_log` + RLS + índice.
- [ ] Implementar helper `wrap_rpc_error` (PL/pgSQL).
- [ ] Aplicar pattern em 3+ RPCs (story 1.1).
- [ ] Cron de retenção 90 dias (pg_cron ou edge function).
- [ ] Regra CodeRabbit custom.
- [ ] Documentação `docs/architecture/rpc-error-handling.md`.
- [ ] Testes pgTAP: erro disparado → log gravado + resposta genérica.
- [ ] @qa gate.

## Dependências
- **Bloqueada por:** Story 0.9 (correlation ID — para correlacionar logs).
- **Bloqueia (informa):** Story 1.1 (deve usar este pattern). Trabalhar em paralelo.

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Helper esconde erros que dev precisa ver | Média | `trace_id` no log + acesso admin facilita debug |
| Retenção excede limites de storage | Baixa | 90 dias com cleanup automatizado |
| Regra CodeRabbit falsos-positivos | Baixa | Allow-list para casos legítimos com comentário `-- coderabbit-ignore: rationale` |
| RLS impede admin de ler | Média | Testar policy explicitamente |

## Testes Requeridos
- [ ] pgTAP: RPC que dispara erro → log existe com trace_id + resposta genérica
- [ ] RLS: role não-admin → SELECT em `rpc_error_log` retorna 0 linhas
- [ ] Cron retenção: registro com 91 dias é deletado
- [ ] CodeRabbit: PR com `RAISE EXCEPTION '%', SQLERRM` é bloqueado

## Definition of Done
- [ ] ACs verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] 3+ RPCs usando o pattern
- [ ] Documentação publicada
- [ ] @qa gate PASS
- [ ] PR merged (@devops push)

## Rollback Plan
1. **Helper buggy:** revert da migração; RPCs voltam a propagar SQLERRM temporariamente (degradação aceitável vs. quebra).
2. **Tabela com problema:** drop + recreate; logs perdidos aceitáveis em rollback emergencial.
3. **Regra CodeRabbit ruidosa:** desabilitar a regra; abrir issue para refinar.
4. RTO: <10min.

## Notas Técnicas
- Pattern PL/pgSQL:
  ```sql
  EXCEPTION WHEN OTHERS THEN
    v_trace := gen_random_uuid();
    INSERT INTO rpc_error_log(trace_id, sqlstate, sqlerrm, context, correlation_id)
      VALUES (v_trace, SQLSTATE, SQLERRM, p_context, current_setting('app.correlation_id', true));
    RAISE EXCEPTION 'internal_error' USING DETAIL = v_trace::text, ERRCODE = 'P0001';
  ```
- Cliente lê `details` da exceção e mostra apenas trace_id ao usuário.

## Verificação Estática (2026-05-17)
✅ **Gap confirmado** em [submit_checkin RPC](../../../supabase/migrations/20260516125000_submit_checkin_rpc.sql) linha 161:
```sql
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
```
Vaza nome de constraint, coluna, tipo, search_path. Pattern do `Notas Técnicas` resolve. Aplicar primeiro em `submit_checkin` (maior surface) e depois em todas RPCs novas da Story 1.1.

## Referências
- `docs/reviews/submit-checkin-rpc-audit.md` §4 (DB-002 evidência completa)
- `docs/reviews/db-specialist-review.md` §DB-002
- `docs/prd/technical-debt-assessment.md` §DB-002
- Story 0.9 (correlation ID)
- Story 1.1 (consumidora do pattern)
