# Security Headers — Runbook

**Story:** 3.13 (GAP-04 / SEC-001)
**ADR:** [0053-security-headers-csp](../adr/0053-security-headers-csp.md)
**Última atualização:** 2026-05-19

## Visão geral

Security headers são configurados em `vercel.json` na rota catch-all `/(.*)`. CSP roda
em modo **report-only** por 7+ dias antes de ser promovido a enforce.

## Headers ativos

| Header | Valor | Propósito |
|--------|-------|-----------|
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` | Força HTTPS, elegível para [HSTS preload list](https://hstspreload.org/) |
| X-Content-Type-Options | `nosniff` | Impede MIME sniffing |
| X-Frame-Options | `DENY` | Anti-clickjacking (legado) |
| Referrer-Policy | `strict-origin-when-cross-origin` | Não vaza path/query para terceiros |
| Permissions-Policy | camera/mic/payment/usb desligados | Reduz superfície de API |
| Cross-Origin-Opener-Policy | `same-origin` | Isola browsing context |
| Cross-Origin-Resource-Policy | `same-origin` | Bloqueia inclusão cross-origin |
| Content-Security-Policy-Report-Only | (ver `vercel.json`) | Telemetria sem enforce |

## Configurar endpoint CSP real no Sentry

A política atual usa `report-uri` placeholder:

```
report-uri https://o0.ingest.sentry.io/api/0/security/?sentry_key=PLACEHOLDER
```

**Para ativar reports reais:**

1. Sentry → Settings → Projects → `mx-gestao-preditiva` → Security Headers
2. Copiar o "CSP Report URI" (formato: `https://oXXX.ingest.sentry.io/api/PROJECT_ID/security/?sentry_key=KEY`)
3. Substituir em `vercel.json` → header `Content-Security-Policy-Report-Only` → diretiva `report-uri`
4. Commit + deploy

## Ler relatórios CSP

1. Sentry → Issues → filtrar por `level:warning csp`
2. Atalho: `https://sentry.io/issues/?query=is%3Aunresolved+csp`

**O que ignorar:**
- `chrome-extension://`, `moz-extension://`, `safari-extension://` (extensões do usuário)
- `data:image/` em img-src (já permitido)
- `null` source (geralmente extensão ou bookmarklet)

**O que investigar:**
- Domínios `https://*` desconhecidos → suspeitar de XSS ou domínio legítimo faltando
- Violations `script-src` repetidas → suspeitar de injeção
- Violations `connect-src` para Supabase/Sentry → CSP precisa de ajuste

## Adicionar novo domínio externo legítimo

Cenário: integrar API/CDN nova (ex.: Resend para email).

1. Identificar a diretiva certa:
   - Chama REST/WS? → `connect-src`
   - Carrega imagem? → `img-src`
   - Carrega fonte? → `font-src`
   - Carrega script? → `script-src`
   - Carrega CSS? → `style-src`
2. Editar `vercel.json` → header `Content-Security-Policy-Report-Only` → adicionar host na diretiva
3. **Sempre** usar wildcard mais restritivo possível (`https://api.exemplo.com`, não `https://*`)
4. Commit + PR + deploy preview
5. Verificar Sentry para confirmar zero violations relacionadas ao novo host
6. Se CSP já estiver em modo enforce, repetir o procedimento no header `Content-Security-Policy`

## Procedimento de enforce (após 7+ dias)

**Pré-requisitos (TODOS verdadeiros):**
- [ ] 7+ dias corridos com `Content-Security-Policy-Report-Only` em produção
- [ ] 0 violations legítimas no Sentry (extensões e `null` source não contam)
- [ ] Smoke E2E executado: login, navegação, realtime, upload — sem regressão
- [ ] Story Sprint 4 "CSP enforce" aberta

**Passos:**

1. Criar branch `feat/csp-enforce`
2. Em `vercel.json`, renomear a key `Content-Security-Policy-Report-Only` → `Content-Security-Policy` (mantendo o valor idêntico)
3. PR com label `security` + revisor obrigatório @devops
4. Deploy preview + smoke E2E manual
5. Merge + deploy produção em janela de baixo tráfego
6. **Janela de observação:** 24h com on-call de plantão
7. Se quebrar (ex.: realtime caindo): rollback imediato via revert do PR, RTO <10min

## Rollback

| Sintoma | Ação | RTO |
|---------|------|-----|
| CSP enforce quebra realtime/Supabase | Revert PR `Content-Security-Policy` → `Content-Security-Policy-Report-Only`; redeploy | <10min |
| HSTS preload causa lock-in indesejado | Reduzir `max-age=0` em hotfix; aguardar TTL expirar nos browsers (caro) | dias |
| Headers conflitam com app legacy | Revert `vercel.json` ao commit anterior; redeploy | <10min |

## Testes manuais

```bash
# Verificar headers em produção
curl -I https://app.mxgestaopreditiva.com.br/ | grep -iE 'strict-transport|content-security|x-frame|referrer|permissions'

# Mozilla Observatory (CLI ou web)
# https://observatory.mozilla.org/analyze/app.mxgestaopreditiva.com.br
```

Score esperado pós-deploy: **B** (subir para A após remover `'unsafe-inline'`/`'unsafe-eval'`).

## SRI (Subresource Integrity)

**Status:** não aplicável ao bundle atual (Vite serve assets do próprio origin).
**TODO Sprint 4:** se passar a usar CDN externa (Sentry CDN, etc.), adicionar `integrity` + `crossorigin` em `<script>`/`<link>` no `index.html`. Plugin candidato: `vite-plugin-sri3`.

## Referências

- ADR-0053
- `vercel.json`
- `docs/reviews/architect-review.md` §GAP-04
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [HSTS Preload List](https://hstspreload.org/)
