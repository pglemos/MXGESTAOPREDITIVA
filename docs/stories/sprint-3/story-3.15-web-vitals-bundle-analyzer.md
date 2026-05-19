# Story 3.15 — Web Vitals monitoring + bundle analyzer dashboard

**Status:** Ready
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 3
**Prioridade:** P2
**Severidade do débito:** Média
**Débito relacionado:** **PERF-monitoring** (sem telemetria de perf, `docs/reviews/architect-review.md` §perf)
**Esforço estimado:** 10h (range 8-12h)
**Owner sugerido:** @dev (FE) + @devops (CI/dashboard)
**RACI:** R=@dev, A=Tech Lead, C=@devops, I=stakeholders
**Created:** 2026-05-19
**Created by:** @sm (River)

---

## Problem Statement
App **não coleta Web Vitals** em produção (per `architect-review.md` §perf). Não sabemos LCP/INP/CLS reais dos usuários. Bundle cresce sem visibilidade — sem alerta de regressão em PR. Tomada de decisão sobre performance é cega.

## Business Value
Telemetria contínua = decisões data-driven. Bundle analyzer em CI bloqueia crescimento descontrolado. Dashboard Sentry + Web Vitals expõe regressões de performance imediatamente. Habilita SLOs futuros (LCP P75 <2.5s).

## Acceptance Criteria
1. **AC1 (web-vitals lib):** Given `web-vitals` instalada, When app carrega, Then captura LCP, INP, CLS, FCP, TTFB e envia para Sentry (`Sentry.metrics`) ou endpoint próprio.
2. **AC2 (dashboard Sentry):** Given dashboard criado, When acessado, Then mostra **P75 e P95** por métrica, por route principal, últimos 30d.
3. **AC3 (bundle analyzer):** Given `rollup-plugin-visualizer` configurado, When CI roda build, Then artifact `bundle-stats.html` é gerado.
4. **AC4 (size budget):** Given budget configurado em `vite.config.ts` (ex: 500KB initial chunk), When PR ultrapassa budget, Then **CI falha**.
5. **AC5 (PR comment):** Given PR alterando bundle, When CI roda, Then comment automático compara size antes/depois (via `bundlewatch` ou similar).

## Scope IN
- Instalar `web-vitals` lib
- Hook `useReportWebVitals` enviando para Sentry
- Dashboard Sentry com P75/P95 por route
- `rollup-plugin-visualizer` no `vite.config.ts`
- Budget chunks principais (`maxEntrypointSize`, `maxAssetSize`)
- CI: `bundlewatch` action ou similar com PR comment
- Doc `docs/observability/web-vitals.md`

## Scope OUT
- ❌ Alertas PagerDuty (futuro)
- ❌ SLO formal (Sprint 4+)
- ❌ Real User Monitoring full (Sentry session replay — story própria)
- ❌ Lighthouse CI (consideração futura)

## Tasks
- [ ] Instalar `web-vitals` + hook (1h)
- [ ] Integração Sentry metrics (1.5h)
- [ ] Dashboard Sentry P75/P95 (1.5h)
- [ ] Setup `rollup-plugin-visualizer` (1h)
- [ ] Configurar budget no Vite (1h)
- [ ] `bundlewatch` GitHub Action + PR comment (2h)
- [ ] Doc `docs/observability/web-vitals.md` (1h)
- [ ] CodeRabbit review
- [ ] @qa gate

## Dependências
**Bloqueada por:** Story 0.3 (Sentry done — necessário para metrics endpoint)
**Bloqueia:** Story Sprint 4 "SLO definition"

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| `Sentry.metrics` não disponível no plano atual | Média | Médio | Fallback: endpoint custom + dashboard simples |
| Bundle budget falha CI legítimo (refactor grande) | Média | Médio | Threshold com tolerância 5%; override manual via label `bundle-override` |
| `web-vitals` impacta performance própria | Baixa | Baixo | Lib é <1KB; envio com `requestIdleCallback` |
| Dashboard Sentry custoso de manter | Baixa | Baixo | Template versionado em `docs/observability/` |

## Testes Requeridos
- [ ] Smoke: navegar app → verificar evento Sentry com vitals
- [ ] CI: PR com chunk acima do budget → falha
- [ ] CI: bundle-stats.html gerado como artifact
- [ ] Dashboard Sentry: P75 LCP visível para 1+ route

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Dashboard Sentry acessível
- [ ] Budget ativo em CI
- [ ] Doc publicado
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **`Sentry.metrics` indisponível:** usar `Sentry.captureMessage` com tags como fallback.
2. **Budget bloqueia mergeam crítico:** label `bundle-override` desabilita check temporariamente.
3. **Performance hit em web-vitals send:** mover envio para `requestIdleCallback`.

## Notas Técnicas
`web-vitals` v4+ tem API simplificada (`onLCP`, `onINP`, `onCLS`). Enviar via `navigator.sendBeacon` em pagehide para garantir entrega. INP substituiu FID em 2024.

## Referências
- `docs/reviews/architect-review.md` §perf
- Web Vitals docs
- Sentry Performance Monitoring
- Story 0.3 (Sentry)

---

## Change Log
- 2026-05-19 | @sm (River) | Story criada — Sprint 3 PERF-monitoring
- 2026-05-19 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 3 critical-path: pass
