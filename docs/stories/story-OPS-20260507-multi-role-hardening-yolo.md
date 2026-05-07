# Story OPS-20260507 - Hardening Multi-Role Residual em Modo Yolo

## Status

Done

## Contexto

O commit `013089a` concluiu a primeira rodada de hardening de rotas, auth, check-in, PDI, consultoria, produtos digitais, equipe, ranking, build e PWA. A auditoria de 2026-05-07 listou novos riscos residuais em vendedor, gerente, dono e admin, principalmente `any`, confirmacoes nativas, payloads de consultoria, scripts/Edge Functions e bundles grandes.

Esta story executa a proxima rodada em modo yolo autorizado, com @aiox-master coordenando, @qa revisando e @dev corrigindo. Chaves, tokens e secrets devem permanecer os mesmos.

## Acceptance Criteria

- [x] Criar epic operacional para a rodada multi-role.
- [x] Executar revisao @qa com achados priorizados por papel/modulo.
- [x] Executar frente @dev para correcoes de baixo risco em UI/configuracao.
- [x] Corrigir pelo menos uma fatia adicional de `any`/casts/console/confirm sem alterar segredo.
- [x] Atualizar Dev Agent Record com agentes, mudancas, gates e residuos.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm run lint`.
- [x] Rodar testes focados do escopo.
- [x] Rodar `npm test`.
- [x] Rodar `npm run build`.
- [x] Rodar E2E smoke/navegacao Chromium se houver mudanca em rota/UI.

## Checklist por Papel

- [x] Vendedor: check-in, historico e produtos reforcados por tipagem/RLS sem trocar credenciais.
- [x] Gerente: equipe de loja reforcada com Edge Function e confirmacao deduplicada para remocao/revisao.
- [x] Dono: operacao de lojas/equipe protegida por validacao server-side de alvo e papel.
- [x] Admin/MX: consultoria, agenda, configuracoes e Edge Functions revisadas na rodada.

## Dev Agent Record

### Agentes

- @aiox-master (Orion): coordenacao, epic/story, integracao e gates.
- @qa (Quinn): revisao estatica multi-role e recomendacao de gates.
- @dev (Dex): correcoes de baixo risco em UI/configuracao.
- @pm/@po/@architect: validacao de artefatos e fatiamento brownfield.

### Debug Log

- Story criada a partir da auditoria de 2026-05-07 e do epic `EPIC-OPS-20260507-MULTI-ROLE-HARDENING`.
- Execucao iniciada em modo yolo autorizado, preservando credenciais existentes.
- PM/PO/Architect recomendou story operacional nova e vinculo ao epic de debito tecnico; `epic-technical-debt.md` recebeu bloco de referencia para esta rodada.
- @dev removeu `any` simples de `NotificacoesTab`, `SistemaMxTab` e `ConsultingDailyTrackingView`, preservando comportamento.
- @qa identificou P0 em `manage-store-team`: gerente/dono podiam alterar/remover papeis sensiveis pela Edge Function com service role.
- `manage-store-team` passou a validar `active` do chamador, papel atual do alvo, self-management, loja anterior e promocao/rebaixamento conforme papel do chamador.
- `register-user` passou a bloquear chamador inativo antes de criar usuarios.
- Migration `20260507120000_harden_produtos_digitais_rls.sql` criada para restringir SELECT de `produtos_digitais`: admin ve tudo; demais veem somente `status='ativo'` e audiencia compativel com `target_roles`.
- `Checkin` removeu `any` do check-in historico e do icone de input; `useAuth` removeu `any` de vinculos e timeout.
- `useCheckins` passou a selecionar o contrato completo de `DailyCheckin` e calcular totais sem casts amplos.
- `StoreTeamPanel` removeu `any` de integrante/vigencia e substituiu confirmacoes nativas por toast de acao deduplicado por item.
- @qa revisou a fatia nova e apontou P1/P2: agenda filtrada no client e confirmacoes concorrentes em equipe/pre-cadastro.
- `useAgendaAdmin` passou a aplicar escopo de consultor nao master direto nas queries de visitas/eventos.
- `StoreTeamPanel` passou a bloquear confirmacoes duplicadas de remocao, aprovacao e rejeicao enquanto o toast de decisao esta aberto.
- Consultoria Visita 1 ganhou tipos para `VisitOneQuantData`, `VisitHeaderBaseData` e evidencias, removendo casts de relatorio/upload/assinatura.
- `useConsultingClientBySlug` passou a tipar usuarios atribuiveis, evidencias e snapshots de estoque.
- Schema de cliente consultoria trocou `z.any()` por `z.unknown()` no payload quantitativo.
- `npm run typecheck` passou em 2026-05-07.
- Limite local: `deno` nao esta instalado, entao lint especifico das Edge Functions nao foi executado nesta maquina.
- Gates locais em 2026-05-07: `npm run typecheck`, `npm run lint`, testes focados auth/check-in/utils (35 passed), `npm test` (224 passed), `npm run build`, E2E smoke/navegacao Chromium (18 passed).
- Supabase remoto: migration `20260507120000_harden_produtos_digitais_rls.sql` aplicada via `npx supabase db push --linked`.
- Supabase remoto: Edge Functions publicadas `manage-store-team` e `register-user`.
- Supabase `db lint --linked`: No schema errors found antes e depois da migration.
- Gates finais apos a segunda fatia: `npm run lint`, testes focados auth/check-in/utils (35 passed), `npm test` (224 passed), `npm run build` e E2E smoke/navegacao Chromium (18 passed).
- Residuo consciente: o build ainda alerta chunks grandes (`vendor-pdf`, `index`, `vendor-charts`) e `deno` segue indisponivel localmente para lint das Edge Functions.

### File List

- `docs/stories/epics/epic-ops-20260507-multi-role-hardening.md`
- `docs/stories/story-OPS-20260507-multi-role-hardening-yolo.md`
- `docs/stories/epic-technical-debt.md`
- `src/features/configuracoes/components/tabs/NotificacoesTab.tsx`
- `src/features/configuracoes/components/tabs/SistemaMxTab.tsx`
- `src/features/consultoria/components/ConsultingDailyTrackingView.tsx`
- `src/features/consultoria/components/VisitOneHighFidelity.tsx`
- `src/features/consultoria/components/VisitReportTemplate.tsx`
- `src/features/consultoria/types.ts`
- `src/hooks/useAuth.tsx`
- `src/hooks/useAgendaAdmin.ts`
- `src/hooks/useCheckins.ts`
- `src/hooks/useConsultingClientBySlug.ts`
- `src/lib/schemas/consulting-client.schema.ts`
- `src/pages/Checkin.tsx`
- `src/pages/ConsultoriaVisitaExecucao.tsx`
- `supabase/functions/manage-store-team/index.ts`
- `supabase/functions/register-user/index.ts`
- `supabase/migrations/20260507120000_harden_produtos_digitais_rls.sql`
