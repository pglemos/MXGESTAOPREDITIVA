# Evidências de release do módulo interno MX

## Gates locais

- [x] `node scripts/verify-mx-design-system.mjs`
- [x] `node scripts/check-internal-mx-styles.mjs`
- [x] compilação sintática TypeScript/JSX
- [ ] `npm run typecheck` no repositório completo
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] E2E de perfis internos
- [ ] regressão visual e overflow

## Gates remotos

- [ ] um commit consolidado na branch de feature
- [ ] Preview Vercel `READY`
- [ ] smoke autenticado dos três perfis
- [ ] revisão do diff e ausência de mudanças Supabase
- [ ] merge por squash somente após todos os gates

## Rollback

Rollback de aplicação: reverter o commit de merge. Não existe rollback de banco porque esta entrega não altera Supabase.
