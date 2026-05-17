# EPIC-HARDENING-FOUNDATION — Resolução de Débitos Técnicos

**Created:** 2026-05-17 | **By:** @pm (Morgan) | **Status:** Ready for Sprint 0 kick-off
**Baseado em:** `docs/prd/technical-debt-assessment.md` (FINAL) + `docs/reviews/qa-review.md` + `docs/reports/TECHNICAL-DEBT-REPORT.md`

> NOTA: Este arquivo substitui escopo anterior (EPIC-TD-001 PLANNING) por escopo formal pós-QA Gate APPROVED-CONDICIONAL. Histórico em git.

---

## 1. Objetivo

Reduzir a superfície de risco técnico do MX Gestão Preditiva ao patamar enterprise via hardening incremental em 4 ondas (Sprint 0–3), com gates verificáveis, observabilidade ponta-a-ponta e rollouts canary, garantindo continuidade operacional e habilitando os roadmaps de produto subsequentes sem retrabalho.

## 2. Justificativa Negócio

- **Investimento total:** R$112.500 (~830h) em 6–8 semanas.
- **ROI estimado:** 12:1 conforme `TECHNICAL-DEBT-REPORT.md` (perdas evitadas, premiações infladas, multas LGPD/WCAG, retrabalho de incidentes invisíveis).
- **Exposição mitigada:** até **R$51M** em risco cumulativo (DB-016 fraude de check-ins, X-1 drift de tipos, X-8 observabilidade ~nula, LGPD).
- **Sprint 0 (foco imediato):** R$10.500 (~70h) — destrava todas as demais ondas; sem Sprint 0, qualquer P0 técnico dispara X-2/X-5/X-11 em produção sem rede.

## 3. Critérios de Sucesso Epic-Level

1. Sprint 0 100% concluído com aceite verificável antes de qualquer story de Sprint 1 tocar produção.
2. Zero deploy de migration crítica (DB-016/DB-006/DB-013/DB-017) sem migration reversível validada (UP→DOWN→UP em branch ephemeral).
3. Suite RLS regression (8 tabelas × 5 roles = 40 cenários, 160 assertions) verde em `main` e bloqueante em PR.
4. Sentry ativo em FE + edge functions com source maps; erro deliberado em staging chega com stack trace de-minificado.
5. CI com branch protection + secret scanning + types diff gate + CodeRabbit prompt-only obrigatório.
6. Correlation ID propagado FE → RPC → `logs_auditoria` em 100% das chamadas críticas.
7. Inventário completo de consumers de `lancamentos_diarios` publicado antes de qualquer REVOKE.
8. Backlog de Sprint 1 priorizado por desbloqueio (não só severidade), com canary plan documentado para todo P0 com impacto em produção.

## 4. Escopo

### Sprint 0 — Hardening Foundation (1 semana, ~70h, R$10.500) — BLOQUEANTE

Stories obrigatórias (todas criadas neste epic, status `Draft`):

| ID | Story | Débito | Owner | h |
|---|---|---|---|---|
| 0.1 | [generate-database-types](./sprint-0/story-0.1-generate-database-types.md) | DB-014 / UX-004 / X-1 | @devops+@dev | 4 |
| 0.2 | [verify-rotate-env-secrets](./sprint-0/story-0.2-verify-rotate-env-secrets.md) | SYS-012 | @devops | 4 |
| 0.3 | [sentry-source-maps-init](./sprint-0/story-0.3-sentry-source-maps-init.md) | SYS-017 / X-8 | @dev | 3 |
| 0.4 | [ci-branch-protection-gitleaks](./sprint-0/story-0.4-ci-branch-protection-gitleaks.md) | CI-001 / GAP-01 | @devops | 6 |
| 0.5 | [rls-regression-matrix](./sprint-0/story-0.5-rls-regression-matrix.md) | T-01 / DB-016 / DB-019 / DB-013 | @qa+@dev | 12 |
| 0.6 | [smoke-tests-403](./sprint-0/story-0.6-smoke-tests-403.md) | T-03 / DB-016 / DB-019 | @qa | 4 |
| 0.7 | [migration-reversibility](./sprint-0/story-0.7-migration-reversibility.md) | T-10 / X-11 / DB-016/006/013/017 | @qa+@dev | 6 |
| 0.8 | [inventario-lancamentos-consumers](./sprint-0/story-0.8-inventario-lancamentos-consumers.md) | Pré-DB-016 | @data-engineer+@dev | 6 |
| 0.9 | [correlation-id-fe-rpc](./sprint-0/story-0.9-correlation-id-fe-rpc.md) | X-8 / GAP-09 | @dev | 6 |
| 0.10 | [ci-coderabbit-prompt-only](./sprint-0/story-0.10-ci-coderabbit-prompt-only.md) | CI / Governança | @devops | 4 |

**Total Sprint 0:** ~55h core + overhead de handoffs/RACI ≈ 70h. Itens de feature-flag infra e ADR rollback do assessment (originais 0.9/0.10) seguem para Sprint 1 prep (FASE 10b) por sequenciamento de desbloqueio.

### Sprint 1 — P0 Segurança + Tipos (2–3 semanas, ~120h, R$18.000)

STORIES PENDENTES — a serem criadas em **FASE 10b** (9 stories cobrindo DB-016 fatiado em 4 + DB-014 finalização + DB-006 helpers + DB-019 audit RLS + DB-013 + feature flag infra + ADR rollback formal).

### Sprint 2 — P1 Governança + A11y (4–5 semanas, ~200h, R$30.000)

ROADMAP. Stories sob demanda cobrindo UX-001/002/004 (god-hooks/pages), UX-021..028 (a11y WCAG AA), SYS-009 (consolidação testsprite/e2e), DB-018 (índices), DB-021 (pg_stat_statements ativo).

### Sprint 3 — P2 Perf + LGPD + Decomposição (6–8 semanas, ~280h, R$42.000)

ROADMAP. Stories sob demanda cobrindo decomposição de god-modules, LGPD (retention/erasure flows), perf budgets, RUM/session replay (UX-030), Supabase Advisors remediation, contract tests (Pact) edge↔RPC.

### Backlog P3 (~120h, R$18.000)

i18n, PWA real, mutation testing, flake quarantine, business metrics (PostHog/Amplitude), polish UX.

## 5. Stories Inicialmente Criadas (Sprint 0)

Ver tabela §4 Sprint 0. Todas em `docs/stories/sprint-0/`, status `Draft`, aguardando `@po *validate-story-draft`.

## 6. RACI Epic-Level

| Função | Pessoa/Agente |
|---|---|
| Responsible (execução) | @devops, @dev, @qa, @data-engineer, @architect |
| Accountable | Tech Lead |
| Consulted | @pm (Morgan), @analyst, stakeholders de produto |
| Informed | Diretoria, suporte, comercial |

## 7. Riscos Top-Level

| Risco | Severidade | Mitigação |
|---|---|---|
| Sprint 0 ser pulado e ir direto Sprint 1 (X-14) | Alta | Este epic é gate bloqueante; @po valida cada story; @pm não aprova Sprint 1 sem Sprint 0 DONE |
| Rotação de secrets quebrar integrações | Alta | Story 0.2 inclui janela coordenada + rollback documentado |
| RLS suite flaky por fixture instável (GAP-05) | Média | Story 0.5 exige fixture factories + seed reproduzível |
| Sentry init quebrar build/perf FE | Baixa | Story 0.3 valida em staging antes de prod |
| Correlation ID introduzir overhead | Baixa | Story 0.9 mede impacto p95 antes/depois |

## 8. Definition of Done Epic

- [ ] Todas as 10 stories Sprint 0 em status `Done`
- [ ] Suite RLS verde em `main` e bloqueante em PR
- [ ] Sentry capturando erros FE+edge com source maps em staging+prod
- [ ] CI com branch protection ativa + gitleaks + types diff gate + CodeRabbit
- [ ] Inventário `lancamentos-diarios-consumers.md` publicado e revisado
- [ ] Correlation ID validado em 1 fluxo end-to-end
- [ ] Migration reversibility validada em ao menos 1 migration crítica
- [ ] @qa gate PASS em todas as stories
- [ ] Sprint 1 stories criadas (FASE 10b) e prontas para `@sm *draft`

## 9. Comunicação

- **Daily Sprint 0:** standup 15min focado em desbloqueios entre @devops/@qa/@dev/@data-engineer.
- **Mid-sprint checkpoint:** dia 3 — semáforo por story.
- **Demo Sprint 0:** apresentar suite RLS rodando + Sentry capturando + CI bloqueando PR ruim.
- **Stakeholder update:** ao final, comunicar liberação para Sprint 1.

## 10. Referências

- `docs/prd/technical-debt-assessment.md` (FINAL — Sprint 0 §1, débitos §4)
- `docs/reviews/qa-review.md` (mandate Sprint 0, GAPs, X-11/X-14)
- `docs/reports/TECHNICAL-DEBT-REPORT.md` (ROI, exposição R$51M)
- `.claude/rules/story-lifecycle.md`, `.claude/rules/workflow-execution.md`
- Constitution Article IV — No Invention
