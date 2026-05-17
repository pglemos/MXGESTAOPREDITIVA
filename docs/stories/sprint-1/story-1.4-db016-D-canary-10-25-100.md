# Story 1.4 — DB-016 Fase D: Rollout Canary 10% → 25% → 100% (7 dias)

**Status:** Ready
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 1
**Prioridade:** P0
**Severidade do débito:** Crítica
**Débito relacionado:** DB-016 (Fase D — Canary Sequence)

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 1 critical-path: PASS (rollback por degrau não só para zero, bloqueada por 1.3, gates SLO por nível, feature flag rollout 10/25/100, postmortem obrigatório por rollback)
**Esforço estimado:** 16h (operacional + observação)
**Owner sugerido:** @devops + @data-engineer
**RACI:** R=@devops, A=Tech Lead, C=@dev+@qa, I=stakeholders+CTO
**Created:** 2026-05-17

## Problem Statement
qa-review §4.1 Fase D: com Fase C estável a 1% por 24h, escalar progressivamente para 10%, 25%, 100% em janela de 7 dias com gates de promoção entre níveis e auto-rollback a cada degrau. Esta fase encerra DB-016 e estabelece o template de canary rollout para futuros débitos de schema crítico.

## Business Value
Conclui o débito mais crítico do epic (DB-016) com risco mitigado. Template canary fica reutilizável para Sprint 2+ (DB-013, RLS adicional etc.). Auditabilidade total atingida na escrita de `lancamentos_diarios`.

## Acceptance Criteria
1. **AC1:** Given Fase C aprovada, When o rollout inicia, Then a progressão é 10% (24h) → 25% (48h) → 100% (após observação 96h) com gates explícitos.
2. **AC2:** Given cada gate, When métricas são avaliadas, Then promoção ocorre apenas se error rate <0.5%, RPC p95 <1.2x baseline, false-positive 403 rate <0.1% por toda a janela.
3. **AC3:** Given qualquer degrau, When SLO estoura por 5min consecutivos, Then auto-rollback para o nível anterior (não para 0%) com notificação on-call.
4. **AC4:** Given 100% atingido, When sustentado por 24h sem incidente, Then DB-016 é declarado concluído; relatório final publicado.
5. **AC5:** Given a janela completa, When encerrada, Then `docs/runbooks/db016-canary-completo.md` documenta linha do tempo, métricas por degrau e lições aprendidas (template para próximos canaries).

## Scope IN
- Configuração programada de rollout 10/25/100 com timings (janelas de 24/48/96h).
- Gates de promoção automatizados ou semi-automatizados.
- Auto-rollback por degrau (não apenas para 0%).
- Comunicação por degrau (Slack + status page interna).
- Relatório consolidado canary completo.
- Template reutilizável `docs/runbooks/canary-rollout-template.md`.

## Scope OUT
- Remoção de SELECTs originais (Sprint 2).
- Drop de colunas legadas (Sprint 2+).
- Canary para outras tabelas (escopo próprio).

## Tasks
- [ ] Configurar agenda de rollout (10% → 25% → 100%) com timings.
- [ ] Implementar gates de promoção (manual com checklist OU automático com critérios).
- [ ] Auto-rollback por degrau (não só zero).
- [ ] Plano de comunicação por degrau (templates Slack).
- [ ] Executar rollout (7 dias).
- [ ] Coletar métricas por degrau (dashboards persistentes).
- [ ] Publicar `docs/runbooks/db016-canary-completo.md`.
- [ ] Extrair template em `docs/runbooks/canary-rollout-template.md`.
- [ ] @qa gate final DB-016.

## Dependências
- **Bloqueada por:** Story 1.3 (Fase C aprovada com 24h estáveis).
- **Bloqueia:** Sprint 2 cleanup (remoção SELECTs originais, drop colunas).

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Degradação só aparece em 25%+ (carga) | Alta | Janelas longas; bench de carga em staging com mix realista |
| Auto-rollback oscila (flap) | Média | Cooldown de 15min entre rollback/retry; manual override |
| Equipe sem cobertura on-call 7 dias | Alta | Escala definida + handoff documentado; rollout em dias úteis |
| Gate manual atrasa progressão | Baixa | Checklist objetivo; sign-off async permitido |
| Métricas insuficientes em 100% | Média | Definir SLO de "estável" antes de declarar done (24h pós-100%) |

## Testes Requeridos
- [ ] Staging: ensaio completo 10→25→100 em janela compactada
- [ ] Staging: simular SLO breach em 10% e validar rollback para 1% (não para 0%)
- [ ] Verificar dashboards persistem métricas por degrau (histórico)
- [ ] Smoke tests (story 0.6) executados em cada degrau de produção
- [ ] Postmortem template pronto antes do rollout (caso necessário)

## Definition of Done
- [ ] ACs verdes
- [ ] CodeRabbit sem CRITICAL/HIGH (config/scripts canary)
- [ ] 100% sustentado por 24h sem incidente
- [ ] Relatório canary completo publicado
- [ ] Template canary reutilizável publicado
- [ ] @qa gate final PASS DB-016
- [ ] Stakeholders + CTO notificados
- [ ] PR de fechamento merged (@devops push)

## Rollback Plan
1. **Por degrau:** auto-rollback para nível anterior (10→1, 25→10, 100→25) se SLO estoura.
2. **Total emergencial:** flag → 0% (kill-switch da Fase C).
3. **Reverter REVOKE:** GRANT pré-escrito (mesmo plano Fase C tier 3).
4. **Revert código:** se bug emergir em volume só visível em 25/100%.
5. RTO por degrau: <5min (auto). RTO total emergencial: <15min.
6. Pausar progressão se 1 rollback ocorreu — investigação obrigatória antes de re-tentar.
7. Postmortem obrigatório a cada rollback (mesmo automático).

## Notas Técnicas
- Sticky bucketing preserva mesmos usuários por degrau (10% inclui o 1% original, etc.) para reduzir variância.
- Dashboards comparativos: bucket RPC vs bucket SELECT lado-a-lado.
- Template canary deve cobrir: critérios SLO, timings, gates, comunicação, rollback.

## Referências
- `docs/prd/technical-debt-assessment.md` §DB-016
- `docs/reviews/qa-review.md` §4.1 Fase D
- Stories 1.1, 1.2, 1.3 (pré-requisitos sequenciais)
