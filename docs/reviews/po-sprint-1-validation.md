# PO Validation Report — Sprint 1

**Validator:** @po (Pax) | **Date:** 2026-05-17 | **Scope:** 9 stories Sprint 1
**Mandate:** 10-point checklist + Sprint 1 rigor (Rollback / DB-016 sequencing / Feature flags / Compliance externa)

## 1. Executive Summary

| Métrica | Valor |
|---|---|
| Total stories | 9 |
| GO | 8 |
| GO CONDICIONAL | 1 (story 1.7) |
| NO-GO | 0 |
| Score médio | 9.9/10 |
| Status transitions Draft → Ready | 9/9 |
| DB-016 canary chain (1.1→1.2→1.3→1.4) integrity | ✅ PASS |
| Sprint 1 ready para kick-off | ✅ SIM — após Sprint 0 fechar |

Sprint 1 apresenta qualidade consistente com Sprint 0. Rollback plans são multi-tier com RTOs específicos. Sequenciamento DB-016 fielmente respeita qa-review §4.1. Única observação: story 1.7 precisa formalizar o processo DPO (não bloqueia Ready, mas exige paralelo D1).

## 2. Resultados por Story

### Story 1.1 — DB-016 Fase A: Publicar RPCs SECURITY DEFINER
**Score 10/10 | GO**

| # | Critério | Status |
|---|---|---|
| 1 | Título | ✅ |
| 2 | Descrição | ✅ traceável qa-review §4.1 + DB-016 |
| 3 | AC Given/When/Then | ✅ 5 ACs testáveis (byte-identical, p95<=1.2x) |
| 4 | Escopo IN/OUT | ✅ |
| 5 | Dependências | ✅ Bloqueada 0.5+0.8+Sprint 0; bloqueia 1.2/1.3/1.4 |
| 6 | Estimativa | ✅ 16h |
| 7 | Business value | ✅ |
| 8 | Riscos | ✅ 4 riscos com mitigação |
| 9 | DoD | ✅ |
| 10 | Alinhamento PRD/Epic | ✅ |

| Sprint 1 critical-path | Pass | Notas |
|---|---|---|
| A. Rollback detalhado | ✅ | RTO <5min, drop reverso pré-pronto |
| B. DB-016 sequencing | ✅ | Bloqueada por 0.5/0.8/Sprint 0 |
| C. Métricas observáveis | ✅ | p95 RPC vs SELECT bench obrigatório |
| D. Feature flag | N/A | Fase A é aditiva |
| E. Compliance externa | N/A | |

**Status transition:** Draft → Ready ✅

---

### Story 1.2 — DB-016 Fase B: Migrar 27 SELECTs (flag OFF)
**Score 10/10 | GO**

10/10 ACs testáveis. Lint rule bloqueia SELECT direto remanescente. Shadow-read opcional via Promise.all com diff em Sentry.

| Sprint 1 critical-path | Pass | Notas |
|---|---|---|
| A. Rollback | ✅ | 3 cenários, RTO <15min revert / <1min flag-off |
| B. Sequencing | ✅ | Bloqueada por 1.1 |
| C. Métricas | ✅ | Smoke tests + shadow-read diff |
| D. Feature flag | ✅ | `db016_rpc_enabled` default OFF, CI valida default |
| E. Compliance externa | N/A | |

**Status transition:** Draft → Ready ✅

---

### Story 1.3 — DB-016 Fase C: REVOKE + Canary 1%
**Score 10/10 | GO**

Story mais crítica do sprint. AC4 garante auto-rollback determinístico. Sticky bucketing por user_id documentado.

| Sprint 1 critical-path | Pass | Notas |
|---|---|---|
| A. Rollback | ✅ | 4 tiers (auto<=5min, manual<=2min, REVOKE reverso<=10min, code revert); RTO worst <15min |
| B. Sequencing | ✅ | Bloqueada por 1.2 + 0.9 + Sprint 0 (0.3/0.5/0.6/0.9) — alinhado qa-review |
| C. Métricas | ✅ | SLO: error<0.5%, p95<1.2x, FP<0.1%; janela 24h |
| D. Feature flag | ✅ | 1% sticky + kill-switch documentado |
| E. Compliance externa | N/A | |

**Status transition:** Draft → Ready ✅

---

### Story 1.4 — DB-016 Fase D: Canary 10%/25%/100%
**Score 10/10 | GO**

Excelente: auto-rollback POR DEGRAU (não só para zero). Template canary reutilizável extraído.

| Sprint 1 critical-path | Pass | Notas |
|---|---|---|
| A. Rollback | ✅ | Por degrau: 10→1, 25→10, 100→25; cooldown 15min anti-flap; postmortem obrigatório |
| B. Sequencing | ✅ | Bloqueada por 1.3 com 24h estáveis |
| C. Métricas | ✅ | Mesmos SLO da 1.3 por toda janela |
| D. Feature flag | ✅ | Rollout 10/25/100 sticky preserva 1% original |
| E. Compliance externa | N/A | |

**Status transition:** Draft → Ready ✅

---

### Story 1.5 — Pattern Wrap SQLERRM (DB-002)
**Score 10/10 | GO**

Pattern fundamental para info-disclosure. CodeRabbit rule custom bloqueia anti-pattern. RLS na `rpc_error_log` previne self-leak.

| Sprint 1 critical-path | Pass | Notas |
|---|---|---|
| A. Rollback | ✅ | RTO <10min, degradação aceita vs quebra |
| B. Sequencing | ✅ | Bloqueada por 0.9; informa 1.1 — paralelo |
| C. Métricas | ✅ | pgTAP + CodeRabbit gate |
| D. Feature flag | N/A | |
| E. Compliance externa | N/A | |

**Status transition:** Draft → Ready ✅

---

### Story 1.6 — Validar `vendedores_loja.is_active` (DB-001)
**Score 10/10 | GO**

Patch cirúrgico DB-001. AC3 cobre race condition. UX copy aprovado por @po antes do PR.

| Sprint 1 critical-path | Pass | Notas |
|---|---|---|
| A. Rollback | ✅ | revert RPC <10min, hotfix path <5min |
| B. Sequencing | ✅ | Bloqueada por 1.5 (wrap-sqlerrm) |
| C. Métricas | ✅ | Smoke 0.6 atualizado |
| D. Feature flag | N/A | |
| E. Compliance externa | N/A | |

**Status transition:** Draft → Ready ✅

---

### Story 1.7 — Encrypt-Then-Drop Migration Backups PII (DB-013)
**Score 9/10 | GO CONDICIONAL**

Único GO CONDICIONAL. Encrypt-then-drop sequence muito bem desenhada (export → checksum SHA-256 → row count → spot-check 100 linhas → DPO approval → DROP). Restore testado em staging. **Gap:** AC4 cita "DPO/responsável de compliance aprova formalmente" mas não detalha template/SLA/responsável nomeado.

| Sprint 1 critical-path | Pass | Notas |
|---|---|---|
| A. Rollback | ✅ | Export validado É o rollback; RTO ~2h restore planejado |
| B. Sequencing | N/A | Não é Fase DB-016; informa 1.8 |
| C. Métricas | ✅ | Checksum + row count + bucket audit |
| D. Feature flag | N/A | |
| E. Compliance externa LGPD/DPO | ⚠️ | Citado mas processo formal não detalhado |

**Fixes RECOMENDADOS (não bloqueantes):**
- Anexar template de DPO approval ao PR
- Iniciar processo DPO D1 do sprint (já mitigado no risco "Aprovação DPO atrasa")
- Nomear responsável DPO ou substituto

**Status transition:** Draft → Ready ✅ (compliance fix em paralelo D1)

---

### Story 1.8 — Habilitar RLS em Tabelas Faltantes
**Score 10/10 | GO**

Inventário de consumidores antes de habilitar. CodeRabbit rule bloqueia `USING (true)`. Padrão imutabilidade para history table preserva trigger.

| Sprint 1 critical-path | Pass | Notas |
|---|---|---|
| A. Rollback | ✅ | DISABLE instantâneo <5min; tier emergencial `current_user=postgres` |
| B. Sequencing | ✅ | Bloqueada por 0.5 RLS matrix; coordena com 1.7 |
| C. Métricas | ✅ | EXPLAIN ANALYZE bench, smoke 0.6 zero regressão |
| D. Feature flag | N/A | |
| E. Compliance externa | N/A | |

**Status transition:** Draft → Ready ✅

---

### Story 1.9 — Mover `@supabase/supabase-js` para `dependencies` (SYS-005)
**Score 10/10 | GO**

Quick win 2h. CI gate `omit-dev-build-smoke` permanente é o ganho estrutural.

| Sprint 1 critical-path | Pass | Notas |
|---|---|---|
| A. Rollback | ✅ | git revert <10min |
| B. Sequencing | ✅ | Bloqueada por Sprint 0 (0.6 + 0.10) |
| C. Métricas | ✅ | Smoke prod-build |
| D. Feature flag | N/A | |
| E. Compliance externa | N/A | |

**Status transition:** Draft → Ready ✅

---

## 3. DB-016 Canary Chain Integrity

| Check | Status | Evidência |
|---|---|---|
| 1.1 → 1.2 → 1.3 → 1.4 dependencies verified | ✅ | Cada story tem "Bloqueada por: story anterior" explícito |
| 1.1 bloqueada por 0.5 + 0.8 + Sprint 0 | ✅ | Confirmado em Dependências |
| 1.3 bloqueada por 0.9 (correlation ID) | ✅ | Citado: "Sprint 0 done (especialmente 0.9)" |
| Auto-rollback presente em cada step canary | ✅ | 1.3 (auto-rollback 0%), 1.4 (rollback por degrau) |
| SLO alinhados qa-review §4.1 | ✅ | error<0.5% / p95<1.2x / FP<0.1% consistente em 1.3 e 1.4 |
| Janelas de observação respeitam | ✅ | 1.3 (24h), 1.4 (24+48+96h+24h pós) — total 7 dias |
| Postmortem obrigatório por rollback | ✅ | 1.3 ("postmortem obrigatório antes de re-tentar"), 1.4 (idem) |

**Conclusão:** Canary chain INTEGRA. Sequenciamento bloqueante deterministicamente impede execução fora de ordem.

## 4. Story 1.7 — Special Concerns (DPO/LGPD)

| Item | Status | Notas |
|---|---|---|
| DPO approval documentado | ⚠️ Parcial | AC4 cita mas falta template/responsável/SLA formal |
| Retenção LGPD respeitada | ✅ | Default 1 ano, alinhamento legal explícito |
| Encrypt-then-drop sequence clara | ✅ | export AES-256/KMS → checksum SHA-256 → spot-check 100 → DPO → DROP → auditoria |
| Restore testado em staging | ✅ | Test required + AC1 spot-check |
| Bucket policy auditada | ✅ | "zero acesso público" + IaC |
| KMS rotation testada | ✅ | Test required |

**Recomendação operacional:** @pm/@po acionar DPO D1 do Sprint 1 em paralelo. Sem aprovação até T-2 dias do DROP planejado, escalar para Tech Lead conforme RACI.

## 5. Cross-Stories Observations

1. **Wrap-sqlerrm como pré-requisito transversal:** 1.5 é dependência de 1.1 e 1.6. Recomenda executar 1.5 em paralelo com 1.1 (ambas owner @data-engineer).
2. **RLS matrix (story 0.5) é dependência crítica:** stories 1.1 e 1.8 dependem. Sprint 0 deve fechar 0.5 prioritariamente.
3. **Correlation ID (story 0.9) é dependência crítica:** stories 1.3 e 1.5 dependem. Sprint 0 prioridade.
4. **Inventário de consumidores (0.8) é base para 1.1 e 1.8:** atrasos em 0.8 cascateiam.
5. **@devops fica sobrecarregado:** 1.3, 1.4, 1.7 e 1.9 todas tocam push/CI. Considerar buffer.
6. **Squad on-call necessária para 1.4 (7 dias):** escala precisa estar definida antes do início.

## 6. Próximos Passos

1. **Sprint 0 done first** — bloqueante absoluto (0.5, 0.6, 0.8, 0.9, 0.10 são pré-requisitos diretos)
2. **Stories Sprint 1 Ready para `@sm` pickup** quando Sprint 0 fechar
3. **Story 1.7 — acionar DPO/compliance D1 do sprint em paralelo** (não esperar Sprint 0 fechar para iniciar processo administrativo)
4. **Ordem sugerida de pickup Sprint 1:**
   - Wave 1 (paralela): 1.5 + 1.1 + 1.9 + 1.7 (kickoff DPO) + 1.8
   - Wave 2: 1.6 (após 1.5), 1.2 (após 1.1)
   - Wave 3: 1.3 (após 1.2)
   - Wave 4: 1.4 (após 1.3 + 24h estável)
5. **Definir escala on-call 7 dias** antes de iniciar 1.4
6. **Confirmar template canary reutilizável** será publicado por 1.4 — input para Sprint 2

## 7. Compliance — Article III/IV

| Article | Verificação | Status |
|---|---|---|
| III — Story-Driven Development | Todas 9 stories rastreiam débito específico (DB-001, DB-002, DB-013, DB-016, RLS, SYS-005) | ✅ |
| IV — No Invention | Todas referenciam fonte (assessment §X, qa-review §X, db-specialist-review §X) | ✅ |
| Article V — Quality First | DoD + CodeRabbit + @qa gate em todas | ✅ |

**Nenhuma invenção detectada.** Toda story possui linha "Referências" com ≥2 documentos rastreáveis.

---

## ADENDO — Story 1.10 (validada 2026-05-17)

- **Veredito:** GO (score 9/10)
- **Status transitioned:** Draft → Ready ✅
- **Sprint 1 total Ready:** 10/10
- **Débito rastreado:** DB-028 (Alta, P1) — `technical-debt-assessment.md`
- **Fonte de descoberta:** `docs/reviews/submit-checkin-rpc-audit.md` §6 (verificação estática 2026-05-17)

### Checklist 10-point
| # | Critério | Status | Nota |
|---|----------|:------:|------|
| 1 | Título claro/objetivo | ✅ | "Centralizar Validação `checkin_validation_kit()`" |
| 2 | Descrição completa | ✅ | Problem Statement explicita divergência policy↔RPC com refs de linha |
| 3 | AC testáveis G/W/T | ✅ | 5 ACs com formato Given/When/Then |
| 4 | Scope IN/OUT | ✅ | 4 IN + 3 OUT (deprecation explícita) |
| 5 | Dependências mapeadas | ✅ | Bloqueada por 1.5/1.6/0.5; pré-reqs claros |
| 6 | Estimativa | ⚠️ | 5h (4-6h) — risco de otimismo dado escopo dual; -1pt |
| 7 | Business value | ✅ | Eliminação de classe de bugs "UI vs API" + 1 fonte de verdade |
| 8 | Riscos documentados | ✅ | 4 riscos com matriz Prob/Impacto + mitigação |
| 9 | DoD claro | ✅ | 9 itens incluindo EXPLAIN ANALYZE <1.2x baseline |
| 10 | Alinhamento PRD/Epic | ✅ | EPIC-HARDENING-FOUNDATION + DB-028 assessment |

### Critérios extras A-E (Sprint 1 rigor)
- **A. Rollback Plan:** ✅ 4 cenários mensuráveis (RTO ≤15min), inclui artefato `submit_checkin_v_prev.sql` no PR
- **B. Dependências críticas:** ✅ 1.5 (wrap-sqlerrm), 1.6 (validate vendedor), 0.5 (RLS matrix) — todas Ready
- **C. Métricas observáveis:** ✅ EXPLAIN ANALYZE INSERT <1.2x baseline + 8 pgTAP scenarios em CI
- **D. Feature flag:** N/A (não é canary; canary é Sprint 1.4)
- **E. Compliance externa:** N/A

### Constituição
- **Article III:** ✅ rastreia DB-028 + Story 1.6 (gap específico generalizado)
- **Article IV:** ✅ Referências citam audit (§6), assessment (§DB-028), db016-vector-analysis — zero invenção

### Próximo passo
Sprint 1 está com 10/10 stories Ready. Recomendar @sm sequenciar 1.10 APÓS merge de 1.5+1.6+0.5 (bloqueadores). @architect deve revisar design SECURITY DEFINER antes de @dev iniciar.
