# Story OPS-20260503 - Limpeza Dominio Canonico MX

## Status

Ready for Review

## Contexto

O dominio oficial do sistema e `https://mxperformance.vercel.app`. Dominios antigos de operacao nao devem aparecer em codigo, documentacao operacional, Supabase ou Vercel do projeto `mxperformance`.

## Acceptance Criteria

- [x] Codigo fonte nao possui fallback ou link para dominio antigo.
- [x] Documentacao operacional do repo nao usa usuarios/domínios antigos.
- [x] Supabase Edge Function `feedback-semanal` usa `https://mxperformance.vercel.app` como fallback canonico.
- [x] Supabase live recebe `APP_URL=https://mxperformance.vercel.app` como secret defensivo.
- [x] Vercel do projeto `mxperformance` recebe `APP_URL=https://mxperformance.vercel.app`.
- [x] Vercel do time `synvolt` nao possui alias/domínio antigo no projeto `mxperformance`.
- [ ] Dominio externo antigo desativado no proprietario correto da Vercel, se existir fora do time `synvolt`.

## Dev Agent Record

### Debug Log

- `curl` no dominio antigo retornou Vercel ativo com conteudo `Sertaneja & Gela - Gestão de Estoque`, fora do projeto `mxperformance`.
- `vercel projects ls` no time `synvolt` listou `mxperformance`, `golffox`, `golffox-photo-fix`, `golffox-prod-fix`; nao listou projeto antigo.
- `vercel alias rm` para o dominio antigo retornou `Alias not found ... under synvolt`.
- `vercel domains rm` para o dominio antigo retornou `Domain not found ... under synvolt`.
- `supabase secrets list` nao tinha `APP_URL`; foi configurado explicitamente para `https://mxperformance.vercel.app`.
- Varredura local com `rg --hidden` validou ausencia do dominio antigo.

### File List

- `docs/stories/story-OPS-20260503-canonical-domain-cleanup.md`
- `docs/stories/story-manager-routine-04/spec/spec.md`
- `docs/stories/story-whatsapp-message-06/spec/spec.md`
- `supabase/functions/feedback-semanal/index.ts`
