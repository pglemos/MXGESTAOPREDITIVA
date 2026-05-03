# Story OPS-20260503 - Limpeza Dominio Canonico MX

## Status

Ready for Review

## Contexto

O dominio oficial do sistema e `https://mxperformance.vercel.app`. Dominios antigos de operacao nao devem aparecer em codigo, documentacao operacional, Supabase ou Vercel do projeto `mxperformance`.

## Acceptance Criteria

- [x] Codigo fonte nao possui fallback ou link para dominio antigo.
- [x] Documentacao operacional do repo nao usa usuarios/domínios antigos.
- [x] Supabase Edge Function `feedback-semanal` usa `https://mxperformance.vercel.app` como constante canonica, sem depender de variavel de ambiente para URL do app.
- [x] Supabase live nao possui secret de URL do app.
- [x] Vercel do projeto `mxperformance` nao possui env de URL do app.
- [x] Vercel do time `synvolt` nao possui alias/domínio antigo no projeto `mxperformance`.
- [ ] Dominio externo antigo desativado no proprietario correto da Vercel, se existir fora do time `synvolt`.

## Dev Agent Record

### Debug Log

- `curl` no dominio antigo retornou Vercel ativo com conteudo `Sertaneja & Gela - Gestão de Estoque`, fora do projeto `mxperformance`.
- `vercel projects ls` no time `synvolt` listou `mxperformance`, `golffox`, `golffox-photo-fix`, `golffox-prod-fix`; nao listou projeto antigo.
- `vercel alias rm` para o dominio antigo retornou `Alias not found ... under synvolt`.
- `vercel domains rm` para o dominio antigo retornou `Domain not found ... under synvolt`.
- `supabase secrets list` foi validado sem secret de URL de app; a funcao usa constante canonica para evitar sobrescrita por ambiente.
- `vercel env ls` foi validado sem env de URL de app em Production, Preview ou Development.
- Varredura local com `rg --hidden` validou ausencia do dominio antigo.
- `whatsapp-service/cors-config.js` nao usa mais variavel de ambiente para URL do app; origem canônica fixa em `https://mxperformance.vercel.app`.

### File List

- `docs/stories/story-OPS-20260503-canonical-domain-cleanup.md`
- `docs/stories/story-manager-routine-04/spec/spec.md`
- `docs/stories/story-whatsapp-message-06/spec/spec.md`
- `supabase/functions/feedback-semanal/index.ts`
- `supabase/functions/google-oauth-handler/index.ts`
- `whatsapp-service/cors-config.js`
