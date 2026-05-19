# Story 3.13 — Security headers + CSP + SRI

**Status:** Draft
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 3
**Prioridade:** P1
**Severidade do débito:** Alta
**Débito relacionado:** **GAP-04 / SEC-001** (security headers ausentes, `docs/reviews/architect-review.md` §GAP-04)
**Esforço estimado:** 16h (range 14-20h)
**Owner sugerido:** @devops (lead) + @dev (FE para SRI/inline scripts)
**RACI:** R=@devops, A=Tech Lead, C=@dev, I=stakeholders
**Created:** 2026-05-19
**Created by:** @sm (River)

---

## Problem Statement
App **não envia** security headers básicos (per `architect-review.md` §GAP-04): sem CSP, sem `X-Frame-Options`, sem `Strict-Transport-Security`, sem `Referrer-Policy`. Scripts externos (Sentry, Supabase) sem SRI. Resultado: vulnerável a XSS/clickjacking/man-in-the-middle, score Mozilla Observatory F/D.

## Business Value
Eleva postura de segurança ao baseline indústria. Score Mozilla Observatory ≥B. Reduz risco real de XSS/clickjacking. Pré-requisito para conformidade LGPD/SOC2 futura.

## Acceptance Criteria
1. **AC1 (headers configurados):** Given config Vercel/Nginx (`vercel.json` ou `headers` middleware), When response sai, Then envia `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
2. **AC2 (CSP report-only):** Given CSP definida, When release deployada, Then header `Content-Security-Policy-Report-Only` ativo com endpoint de report. Após **7 dias** de telemetria limpa → migrar para `Content-Security-Policy` (enforce).
3. **AC3 (SRI scripts externos):** Given scripts/styles externos no `index.html`, When build roda, Then atributo `integrity` + `crossorigin` presentes.
4. **AC4 (score ≥B):** Given Mozilla Observatory scan pós-deploy, When auditado, Then **score ≥B**.
5. **AC5 (telemetria CSP):** Given endpoint `/api/csp-report` (ou Sentry CSP reports), When violation ocorre, Then registrada para análise.

## Scope IN
- Configurar headers em `vercel.json` (ou middleware Vite preview)
- CSP report-only com policy inicial (default-src 'self', conexões Supabase/Sentry permitidas)
- Endpoint de report CSP (Sentry CSP report endpoint ou custom)
- SRI para scripts/styles externos no `index.html` (Sentry, fonts, etc)
- Plano de migração report-only → enforce após 7 dias telemetria
- Doc `docs/security/headers.md`

## Scope OUT
- ❌ Migrar para enforce nesta story (só report-only; enforce em story follow-up Sprint 4)
- ❌ Subresource Integrity para chunks Vite (assume bundle próprio = trusted)
- ❌ WAF / rate limiting (futura)
- ❌ Certificate transparency monitoring

## Tasks
- [ ] Inventário scripts/styles externos (1h)
- [ ] Definir CSP policy inicial (2h)
- [ ] Configurar headers em `vercel.json` (2h)
- [ ] Setup endpoint CSP report (Sentry CSP) (2h)
- [ ] Implementar SRI (script auto-gera integrity) (3h)
- [ ] Deploy preview + scan Observatory (1h)
- [ ] Telemetria CSP report-only setup + dashboard Sentry (2h)
- [ ] Plano migração enforce + doc `docs/security/headers.md` (2h)
- [ ] CodeRabbit review
- [ ] @qa gate

## Dependências
**Bloqueada por:** Story 0.3 (Sentry done — precisamos do endpoint de CSP report)
**Bloqueia:** Story Sprint 4 "CSP enforce" (após 7 dias telemetria)

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| CSP enforce quebra Supabase realtime | Alta | Alto | Report-only primeiro; ajustar policy via telemetria; migrar só após 0 reports em 7d |
| SRI quebra ao atualizar lib externa | Alta | Médio | Build step regenera integrity; CI bloqueia mismatch |
| Headers conflitam com preview Vite local | Média | Baixo | Headers só em produção (vercel.json); dev pass-through |
| Score Observatory <B mesmo após config | Baixa | Médio | Iterar policy; possível precisar de `X-XSS-Protection` legado |

## Testes Requeridos
- [ ] curl/CI scan: todos headers presentes na response
- [ ] Mozilla Observatory ≥B
- [ ] E2E smoke: login, navegação, realtime — sem regressão
- [ ] CSP report-only: violations registradas em Sentry

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Score Observatory ≥B confirmado
- [ ] Telemetria CSP ativa
- [ ] Doc `docs/security/headers.md` publicado
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **CSP report-only quebra realtime:** ajustar policy (`connect-src`); deploy hotfix. RTO: <30min.
2. **SRI bloqueia carregamento Sentry:** desabilitar SRI temporariamente para esse script; investigar; re-PR. RTO: <15min.
3. **Headers causam erro inesperado:** revert `vercel.json`. RTO: <10min.

## Notas Técnicas
**Nunca** migrar para CSP enforce direto. Sempre 7+ dias de telemetria report-only. Supabase realtime usa WebSocket — `connect-src` deve incluir `wss://*.supabase.co`. Sentry tem endpoint CSP report-uri pronto.

## Referências
- `docs/reviews/architect-review.md` §GAP-04 / SEC-001
- Mozilla Observatory
- OWASP Secure Headers Project
- Story 0.3 (Sentry)

---

## Change Log
- 2026-05-19 | @sm (River) | Story criada — Sprint 3 SEC-001
