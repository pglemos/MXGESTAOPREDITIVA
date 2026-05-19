# ADR-0053 — Security Headers + CSP Report-Only

**Status:** Accepted
**Data:** 2026-05-19
**Deciders:** @devops (Gage), Tech Lead
**Story:** Sprint 3 — Story 3.13 (GAP-04 / SEC-001)

## Contexto

Auditoria de arquitetura (`docs/reviews/architect-review.md` §GAP-04) identificou ausência de
headers de segurança no deploy Vercel: sem CSP, sem HSTS, sem X-Frame-Options, sem
Referrer-Policy. Score Mozilla Observatory: F. Vulnerável a XSS, clickjacking e
downgrade attacks. Pré-requisito para LGPD/SOC2.

## Decisão

1. Configurar **security headers estáticos** em `vercel.json` (`source: "/(.*)"`):
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY` (legado) + `frame-ancestors 'none'` (CSP moderno)
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy` (desabilita camera/mic/payment/usb; geo apenas self)
   - `Cross-Origin-Opener-Policy: same-origin`
   - `Cross-Origin-Resource-Policy: same-origin`

2. Adotar **CSP em modo `Content-Security-Policy-Report-Only`** por **7 dias** antes de
   promover a `Content-Security-Policy` (enforce). Diretivas:
   - `default-src 'self'`
   - `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://browser.sentry-cdn.com https://js.sentry-cdn.com`
   - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
   - `img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com`
   - `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://*.ingest.sentry.io`
   - `font-src 'self' data: https://fonts.gstatic.com`
   - `frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`
   - `upgrade-insecure-requests`
   - `report-uri` apontando para endpoint Sentry CSP

3. **SRI (Subresource Integrity):** scripts/styles do bundle Vite são servidos do
   próprio origin (`'self'`) e não precisam de SRI. Para CDNs externas (Sentry CDN
   futuro), adicionar `integrity` + `crossorigin` no `index.html` quando aplicável.
   Plugin `vite-plugin-sri3` fica como **TODO Sprint 4** (não bloqueante).

## Trade-offs

| Compromisso | Justificativa | Plano de remoção |
|-------------|---------------|------------------|
| `script-src 'unsafe-inline'` | Vite injeta scripts inline para hydration; React fast refresh em dev | Migrar para nonce/hash quando suportado nativamente pelo Vite (>= v6) |
| `script-src 'unsafe-eval'` | Algumas libs (lib de gráficos / parser) usam `new Function()` | Auditar lib por lib, isolar em worker, remover |
| `style-src 'unsafe-inline'` | shadcn/ui + Tailwind JIT injetam estilos inline | Migrar para nonce; baixo risco |
| CSP report-only (não enforce) | Evitar quebrar Supabase realtime ou Sentry em produção | Promover a enforce após 7 dias com 0 violations legítimas |
| `report-uri` placeholder | DSN/projectId Sentry específico não definido em build time | Substituir pelo endpoint real do projeto via env no deploy |

## Domínios externos permitidos (justificativa)

| Domínio | Diretiva | Por quê |
|---------|----------|---------|
| `*.supabase.co` | connect-src, img-src | Backend REST + Storage |
| `wss://*.supabase.co` | connect-src | Realtime WebSocket (CRÍTICO) |
| `*.sentry.io`, `*.ingest.sentry.io` | connect-src | Erro/perf telemetry |
| `browser.sentry-cdn.com` | script-src | Sentry browser SDK (se CDN no futuro) |
| `fonts.googleapis.com`, `fonts.gstatic.com` | style/font-src | Google Fonts |
| `*.googleusercontent.com` | img-src | Avatars Google OAuth |

## Quando promover report-only → enforce

Critérios cumulativos (todos verdadeiros):
1. **7+ dias** corridos em produção com `Content-Security-Policy-Report-Only` ativo
2. **0 violations legítimas** no Sentry CSP dashboard (extensões de navegador são ignoradas)
3. **Smoke E2E** completo: login + navegação + realtime + upload — sem regressão
4. **PR aprovado** mudando `Content-Security-Policy-Report-Only` → `Content-Security-Policy` em `vercel.json`

Story de follow-up (Sprint 4): "CSP enforce".

## Score esperado

Mozilla Observatory: **B** (faltar `'unsafe-inline'`/`'unsafe-eval'` removidos para chegar a A+).

## Consequências

**Positivo:**
- Postura de segurança no baseline indústria
- Reduz superfície XSS, clickjacking, MITM
- Telemetria CSP via Sentry permite refinamento empírico
- Pré-requisito LGPD/SOC2 atendido

**Negativo:**
- Manutenção: cada novo domínio externo exige update CSP
- Risco de quebra silenciosa em features futuras (mitigado pelo report-only)

## Referências

- `vercel.json`
- `docs/dev/security-headers.md` (runbook)
- `docs/reviews/architect-review.md` §GAP-04
- OWASP Secure Headers Project
- Mozilla Observatory
