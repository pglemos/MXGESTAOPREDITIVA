# Story OPS-20260501: Branding da aba do navegador

## Status

Ready for Review

## Contexto

Solicitacao operacional: a aba do navegador deve exibir o nome correto da marca em letras maiusculas, `MX PERFORMANCE`, mantendo a logo atual como favicon.

## Acceptance Criteria

- [x] O titulo base do navegador usa `MX PERFORMANCE`.
- [x] Metadados PWA/iOS usam `MX PERFORMANCE`.
- [x] A home publica e a politica de privacidade nao exibem mais o nome antigo da marca.
- [x] A logo atual permanece apontando para `mx-logo.png`.

## QA

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run build`
- [x] Verificacao local da aba do navegador com titulo `MX PERFORMANCE`.

## File List

- `index.html`
- `vite.config.ts`
- `src/pages/OAuthHome.tsx`
- `src/pages/MXPerformanceLanding.tsx`
- `src/pages/Privacy.tsx`
- `docs/stories/story-OPS-20260430-mobile-calendar-arena.md`
- `docs/stories/story-OPS-20260501-browser-branding-title.md`
