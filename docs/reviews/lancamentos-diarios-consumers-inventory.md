# Inventário de Consumers — `public.lancamentos_diarios`

**Story:** 0.8 (Sprint 0 Wave 1 — pré-requisito DB-016)
**Date:** 2026-05-17
**Executor:** @aiox-master (Orion) — análise estática
**Status:** Done — pronto para Sprint 1 (stories 1.1 e 1.2)

---

## 1. TL;DR

| Métrica | Valor | Observação |
|---------|-------|------------|
| Arquivos consumers (produção) | **13** | + 1 teste (`RLS-Isolation.playwright.ts`) |
| Total SELECTs (produção) | **36** | 33% acima da estimativa FASE 6 (27) |
| Total UPDATEs | **0** | ⚠️ correção pós-revisão — UPDATE inicial era falso positivo de grep |
| Total INSERTs | **2** | ambos em `checkin-service.ts` (LEGACY — bypass do RPC) |
| Edge Functions tocando tabela | **3** | usam `service_role` → não afetadas por REVOKE |
| RPC canônica de escrita | ✅ existe | `public.submit_checkin` (migration 20260516125000) |
| RPC canônica de leitura | ❌ **AUSENTE** | **Story 1.1 precisa criar família `get_lancamentos_for_*`** |

**Veredito:** Sequência DB-016 é viável. Risco identificado: `src/lib/services/checkin-service.ts` é caminho legacy paralelo ao RPC canônico — **deve ser migrado ou removido em Story 1.2** antes de REVOKE.

---

## 2. Consumers Frontend (produção) — 13 arquivos

### Hooks (6 arquivos, 23 ops)
| Arquivo | SELECT | UPDATE | INSERT | Total | Story 1.2 prioridade |
|---------|:------:|:------:|:------:|:-----:|----------------------|
| [src/hooks/useRanking.ts](src/hooks/useRanking.ts) | 9 | 0 | 0 | 9 | **P0** — maior concentração; leitura pública dentro do tenant |
| [src/hooks/useCheckins.ts](src/hooks/useCheckins.ts) | 5 | 0 | 0 | 5 | **P0** — leitura por usuário/loja |
| [src/hooks/useTeam.ts](src/hooks/useTeam.ts) | 3 | 0 | 0 | 3 | P1 |
| [src/hooks/usePerformance.ts](src/hooks/usePerformance.ts) | 2 | 0 | 0 | 2 | P1 |
| [src/hooks/useNetworkHierarchy.ts](src/hooks/useNetworkHierarchy.ts) | 1 | 0 | 0 | 1 | P2 — apenas SELECT (UPDATE inicial era falso positivo) |

### Pages (5 arquivos, 13 ops)
| Arquivo | SELECT | UPDATE | INSERT | Total |
|---------|:------:|:------:|:------:|:-----:|
| [src/pages/PainelConsultor.tsx](src/pages/PainelConsultor.tsx) | 4 | 0 | 0 | 4 |
| [src/pages/MorningReport.tsx](src/pages/MorningReport.tsx) | 3 | 0 | 0 | 3 |
| [src/pages/AiDiagnostics.tsx](src/pages/AiDiagnostics.tsx) | 1 | 0 | 0 | 1 |
| [src/pages/GerenteFeedback.tsx](src/pages/GerenteFeedback.tsx) | 1 | 0 | 0 | 1 |

### Services & Automation (4 arquivos, 9 ops)
| Arquivo | SELECT | UPDATE | INSERT | Total | Observação |
|---------|:------:|:------:|:------:|:-----:|------------|
| [src/lib/services/checkin-service.ts](src/lib/services/checkin-service.ts) | 2 | 0 | **2** | 4 | ⚠️ **LEGACY** — não usa `submit_checkin` RPC. Importado por `AiDiagnostics.tsx` e `MorningReport.tsx` |
| [src/lib/automation/cron-scheduler.ts](src/lib/automation/cron-scheduler.ts) | 2 | 0 | 0 | 2 | client-side cron — revisar se deve mover para Edge Function |
| [src/lib/automation/weekly/feedback-engine.ts](src/lib/automation/weekly/feedback-engine.ts) | 2 | 0 | 0 | 2 | mesma observação |
| [src/lib/automation/monthly/close-engine.ts](src/lib/automation/monthly/close-engine.ts) | 1 | 0 | 0 | 1 | mesma observação |

### Testes (1 arquivo, fora do escopo de migração)
| Arquivo | Notas |
|---------|-------|
| [src/test/security/RLS-Isolation.playwright.ts](src/test/security/RLS-Isolation.playwright.ts) | 2 SELECTs — exatamente o teste que precisamos manter pós-REVOKE para validar enforcement |

---

## 3. Edge Functions (3 arquivos — service_role, NÃO bloqueadas por REVOKE)

| Edge Function | Linha | Operação |
|---------------|:-----:|----------|
| [supabase/functions/relatorio-mensal/index.ts](supabase/functions/relatorio-mensal/index.ts) | 171 | SELECT relatório mensal |
| [supabase/functions/relatorio-matinal/index.ts](supabase/functions/relatorio-matinal/index.ts) | 215, 216 | SELECT relatório matinal (2 queries) |
| [supabase/functions/feedback-semanal/index.ts](supabase/functions/feedback-semanal/index.ts) | 219 | SELECT feedback semanal |

**Impacto REVOKE:** ZERO — usam `SUPABASE_SERVICE_ROLE_KEY` que bypassa RLS e GRANTs.

---

## 4. Estado Backend (RPCs e Migrations)

### RPCs existentes que envolvem `lancamentos_diarios`
| Migration | Função | Tipo | Status |
|-----------|--------|------|--------|
| `20260516125000_submit_checkin_rpc.sql` | `public.submit_checkin(p_payload jsonb)` | INSERT canônico | ✅ canônica |
| `20260507143000_yolo_second_pass_rls_hardening.sql:22` | `public.pode_lancar_checkin(...)` | gate validação | helper |
| `20260430190000_fundacao_portugues_permissoes_evidencias.sql:419` | `public.notify_manager_on_checkin()` | trigger | side-effect |
| `00000000000000_baseline_legacy_schema.sql:2602` | `public.sync_daily_checkins_canonical()` | trigger | side-effect |

### RPCs FALTANTES (criar na Story 1.1)
- `public.get_lancamentos_for_ranking(p_store_id uuid, p_window text)` SECURITY DEFINER + `tem_papel_loja()` check
- `public.get_lancamentos_for_dashboard(p_user_id uuid, p_date date)` SECURITY DEFINER
- `public.get_lancamentos_for_morning_report(p_store_id uuid, p_date date)` SECURITY DEFINER
- `public.get_lancamentos_for_painel_consultor(p_consultor_id uuid, p_filters jsonb)` SECURITY DEFINER
- `public.get_lancamentos_for_feedback_semanal(p_store_id uuid, p_week int)` SECURITY DEFINER
- ~~`public.update_lancamento_*`~~ — **NÃO necessário** (UPDATE inicial era falso positivo de grep; FE não faz UPDATE direto)

---

## 5. Riscos Identificados

| # | Risco | Severidade | Mitigação |
|---|-------|:----------:|-----------|
| R1 | `checkin-service.ts` é caminho INSERT paralelo ao `submit_checkin` RPC — REVOKE quebra inserts via essa via | 🚨 Crítica | Story 1.2 DEVE migrar `AiDiagnostics.tsx` e `MorningReport.tsx` para chamar `submit_checkin` RPC OU remover `storeCheckin()` se não-usado |
| R2 | UPDATE em `useNetworkHierarchy.ts:25` — escopo a confirmar | ⚠️ Alta | Inspecionar antes de Story 1.1; pode justificar nova RPC `update_lancamento_hierarchy_*` |
| R3 | Estimativa Story 1.2 sub-dimensionada (27→36 SELECTs, +33%) | ⚠️ Média | Aumentar esforço Story 1.2 de 20h → ~26h |
| R4 | Automation client-side (`cron-scheduler`, `feedback-engine`, `close-engine`) executa SELECTs como `authenticated` — confirma janela de execução | ⚠️ Média | Validar se rodam em sessão admin ou usuário comum; idealmente mover para Edge Functions |
| R5 | `useRanking.ts` com 9 SELECTs concentrados — refator pesado | ⚠️ Média | Quebrar em RPC única com filtros, não 9 chamadas |

---

## 6. Plano de Migração para Story 1.2

### Ordem recomendada (4 batches paralelos, controlados por feature flag `db_016_lancamentos_via_rpc`)

**Batch A (P0 — destrava write path)**
1. `checkin-service.ts` → chamar `submit_checkin` RPC ou remover
2. `useNetworkHierarchy.ts` (UPDATE) → nova RPC ou remover

**Batch B (P0 — alta concentração)**
3. `useRanking.ts` → `get_lancamentos_for_ranking`
4. `useCheckins.ts` → `get_lancamentos_for_dashboard`

**Batch C (P1 — pages)**
5. `MorningReport.tsx` → `get_lancamentos_for_morning_report`
6. `PainelConsultor.tsx` → `get_lancamentos_for_painel_consultor`
7. `GerenteFeedback.tsx` + `AiDiagnostics.tsx` → conforme escopo

**Batch D (P2 — services automation)**
8. `cron-scheduler.ts`, `feedback-engine.ts`, `close-engine.ts` → avaliar mover para Edge Functions
9. `useTeam.ts`, `usePerformance.ts` → migrar últimos

---

## 7. Atualizações ao Assessment

### Para `docs/prd/technical-debt-assessment.md`
- DB-016 sequenciamento: confirma **inventário 13 consumers + 36 SELECTs + 3 writes**
- Story 1.2 esforço: revisar 20h → **~26h**
- Story 1.1: incluir família **5 novas RPCs SELECT** + revisão da UPDATE em `useNetworkHierarchy`
- Novo subitem em DB-016: **checkin-service.ts (LEGACY) deve ser tratado em Batch A obrigatório**

### Para `docs/reviews/qa-review.md`
- T-04 (smoke 403): adicionar caso específico para INSERT em `checkin-service.ts` path
- Confirma X-2 (RBAC bypass efetivo) — 3 writes não passam por RPC canônica hoje

---

## 8. Próximos Passos

1. ✅ Story 0.8 (este inventário) — **DONE**
2. ➡️ Story 1.1 — criar 5 RPCs SELECT + 1 RPC UPDATE (depois de Sprint 0 done)
3. ➡️ Story 1.2 — migrar 13 arquivos atrás de feature flag, esforço revisado para ~26h
4. Antes de Story 1.3 (REVOKE canary 1%) — rodar `RLS-Isolation.playwright.ts` confirmando que feature flag ON funciona end-to-end

---

## 9. Referências

- `docs/prd/technical-debt-assessment.md` §4 (DB-016 sequencing)
- `docs/reviews/qa-review.md` §4.1 (DB-016 canary mandate)
- `docs/reviews/db-specialist-review.md` §4.1 (DB-016 vetor de ataque confirmado)
- `docs/reviews/ux-specialist-review.md` §6 (X-2 RBAC bypass cross-camada)
- `docs/stories/sprint-0/story-0.8-inventario-lancamentos-consumers.md`
- `docs/stories/sprint-1/story-1.1-db016-A-publicar-rpcs.md`
- `docs/stories/sprint-1/story-1.2-db016-B-migrar-selects-flag-off.md`
