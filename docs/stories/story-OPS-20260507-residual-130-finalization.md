# Story OPS-20260507 - Finalizacao Residual dos 130 Itens

## Status

Done

## Contexto

A rodada anterior concluiu hardening de rota, auth, RLS, Edge Functions, check-in, consultoria e equipe. Esta story continua a lista dos 130 itens confirmaveis e remove residuos objetivos ainda presentes no codigo local: confirmacoes nativas, casts `any`, tipos fracos em automacoes/exportacoes e regras de vendas duplicadas por modulo.

Chaves, tokens e secrets permanecem inalterados.

## Acceptance Criteria

- [x] Remover `window.confirm`/`confirm` de fluxos de loja, equipe, produto, seguranca e dashboard.
- [x] Zerar scan de `as any`, `: any`, `Record<string, any>` e `z.any()` em `src` de producao.
- [x] Tipar `GerenteFeedback`, automacoes matinal/semanal, exportacoes XLSX/PDF e validadores legados.
- [x] Centralizar regras de vendas de loja consumidas por Ranking, DashboardLoja e RotinaGerente.
- [x] Adicionar teste unitario para o builder compartilhado de regras de loja.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm test`.
- [x] Rodar `npm run build`.
- [x] Rodar E2E smoke/navegacao Chromium se a suite estiver disponivel.

## Checklist por Papel

- [x] Vendedor: produtos e relatorios deixam de depender de confirmacao nativa/casts amplos nos fluxos tocados.
- [x] Gerente: devolutivas, dashboard, rotina e equipe recebem tipagem/confirmacao mais previsivel.
- [x] Dono: lojas, metas e equipe de rede deixam de usar confirmacao nativa.
- [x] Admin/MX: consultoria, notificacoes, automacoes, exportacao e rede recebem contratos mais fortes.

## Dev Agent Record

### Debug Log

- Execucao continuada em modo yolo autorizado, preservando tokens/chaves existentes.
- Criado `requestToastConfirmation` para substituir confirmacoes nativas por toast acionavel e deduplicado.
- Criado `buildStoreSalesRules` para normalizar regras de metas e benchmarks por loja.
- `GerenteFeedback` removeu casts em nomes de vendedores, funil semanal e medias de relatorio.
- Automacoes matinal/semanal passaram a tipar relacoes Supabase, check-ins e payloads de e-mail/XLSX.
- Validadores, schemas e helpers de exportacao trocaram `any` por `unknown` ou contratos especificos.
- Scan local de `as any`, `: any`, `Record<string, any>`, `z.any()` e confirmacao nativa em `src` ficou sem resultados.
- Gates finais em 2026-05-07: `npm run typecheck`, `npm run lint`, `npm test` (226 passed), `npm run build`, E2E Chromium smoke/navegacao (17 passed).
- Residuo consciente: build ainda alerta `vendor-pdf` acima de 1 MB; fica como frente de performance/bundle, nao bug funcional desta story.

### File List

- `docs/stories/story-OPS-20260507-residual-130-finalization.md`
- `src/components/admin/AdminNetworkView.tsx`
- `src/features/admin/components/StoreEditModal.tsx`
- `src/features/configuracoes/components/EditUserModal.tsx`
- `src/features/configuracoes/components/tabs/EquipeUsuariosTab.tsx`
- `src/features/configuracoes/components/tabs/LojasRedeTab.tsx`
- `src/features/configuracoes/components/tabs/OperacionalLojaTab.tsx`
- `src/features/configuracoes/components/tabs/PerfilTab.tsx`
- `src/features/configuracoes/components/tabs/SegurancaTab.tsx`
- `src/features/consultoria/components/VisitActionQuickAdd.tsx`
- `src/features/lojas/components/StoreGoalsPanel.tsx`
- `src/features/pdi/WizardPDI.tsx`
- `src/features/ranking/components/BattleView.tsx`
- `src/hooks/useConsultingDriveFiles.ts`
- `src/hooks/useNetworkPerformance.ts`
- `src/lib/automation/cron-scheduler.ts`
- `src/lib/automation/email/templates/matinal.ts`
- `src/lib/automation/email/templates/weekly-feedback.ts`
- `src/lib/automation/logger.ts`
- `src/lib/automation/reports/xlsx-generator.ts`
- `src/lib/automation/weekly/feedback-engine.ts`
- `src/lib/calculations.ts`
- `src/lib/export.ts`
- `src/lib/migration-validator.ts`
- `src/lib/schemas/feedback.schema.ts`
- `src/lib/storeSalesRules.test.ts`
- `src/lib/storeSalesRules.ts`
- `src/lib/ui/confirmAction.ts`
- `src/lib/utils.ts`
- `src/lib/validation/checkin-validator.ts`
- `src/lib/validation/legacy-normalizer.ts`
- `src/pages/ConsultorNotificacoes.tsx`
- `src/pages/ConsultoriaClienteDetalhe.tsx`
- `src/pages/DashboardLoja.tsx`
- `src/pages/GerenteFeedback.tsx`
- `src/pages/Historico.tsx`
- `src/pages/Lojas.tsx`
- `src/pages/ProdutosDigitais.tsx`
- `src/pages/Ranking.tsx`
- `src/pages/RotinaGerente.tsx`
- `src/types/database.ts`
- `src/types/html2pdf.d.ts`
- `src/types/postgres.d.ts`
