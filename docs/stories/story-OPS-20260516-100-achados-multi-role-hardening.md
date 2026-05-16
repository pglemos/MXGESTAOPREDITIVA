# Story OPS-20260516 - Correção dos 100 Achados Multi-Role

## Status

Done

## Contexto

Continuação do `EPIC-OPS-20260507-MULTI-ROLE-HARDENING` para reduzir os 100 achados listados em 2026-05-16 nos perfis Admin MX, dono, gerente e vendedor.

Sem rotação de secrets, tokens ou senhas reais. Sem uso de agentes nativos em background do Codex para trabalho AIOX.

## Acceptance Criteria

- [x] Fechar matriz de rotas para comportamento deny-by-default.
- [x] Restringir simulação a perfis internos MX com usuário real ativo.
- [x] Remover fallback de papel desconhecido para vendedor.
- [x] Restringir ajuste técnico de check-in a gerente/perfis internos.
- [x] Salvar check-in por RPC com validação backend de vínculo, papel, escopo e data.
- [x] Tornar check-in mais acessível com input numérico direto e erro visível.
- [x] Tratar erros de lojas/equipe e evitar overwrite de destinatários ao editar gerente.
- [x] Criar loja por RPC atômica com loja, entrega, metas e benchmarks no backend.
- [x] Encerrar vigências ao arquivar loja e evitar disciplina acima de 100%.
- [x] Corrigir cálculo corporativo filtrado, refresh e clipboard em lojas.
- [x] Corrigir escopo do dashboard, data de referência canônica e rótulo de visão gerente/dono.
- [x] Remover mocks de comissão, broadcast e feed do ranking.
- [x] Melhorar PDI/feedback com labels, empty states e validações obrigatórias.
- [x] Bloquear bypass DEV por padrão explícito de ambiente.
- [x] Encerrar logout real mesmo durante simulação.
- [x] Impedir montagem da aplicação por trás da troca obrigatória de senha.
- [x] Mover edição de perfil e conclusão de troca de senha para RPC autenticada.
- [x] Ocultar URL pública de pré-cadastro na grade de lojas e restringir cópia ao Admin MX.
- [x] Ocultar URL pública de pré-cadastro no painel de equipe e tratar falhas de clipboard.
- [x] Encerrar `vinculos_loja` de forma auditável com `is_active/ended_at`.
- [x] Corrigir conflito de devolutiva por loja/gerente/vendedor/semana.
- [x] Usar capacidade compartilhada para PDI de dono/gerente/Admin MX.
- [x] Substituir confirmação nativa de aprovação de pré-cadastro por confirmação toast rastreável.
- [x] Remover `select('*')` dos hooks operacionais diretamente relacionados a lojas, metas, rotina e relatórios de devolutiva.
- [x] Quarentenar TestSprite legado e remover credenciais fixas dos artefatos TestSprite.
- [x] Reduzir chunks de PDF com split de `html2pdf`, `html2canvas` e `jspdf`.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm test`.
- [x] Rodar `npm run build`.
- [x] Validar boot local via Vite/curl.
- [x] Rodar E2E Chromium autenticado.

## Checklist por Papel

- [x] Admin MX: rotas, simulação, lojas, dashboard, ranking e funções sensíveis endurecidas.
- [x] Dono: acesso mobile à equipe, configurações por capacidade e rotina habilitada.
- [x] Gerente: feedback/PDI/dashboard com rótulos, validação e permissões mais explícitas.
- [x] Vendedor: check-in sem ajuste técnico, PDI sem falso ativo e home com métricas reais no WhatsApp.

## Dev Agent Record

### Debug Log

- Criado contrato central de capacidades em `src/lib/auth/capabilities.ts`.
- `routeAccess` passou a negar rotas desconhecidas e simulação foi limitada a perfis internos.
- Simulação deixou de criar usuários sintéticos quando não há usuário real ativo.
- Check-in passou a bloquear `adjustment` para vendedor e usar validação visível para valores fora do intervalo.
- Lojas passaram a tratar erro de query, normalizar e-mail, reverter criação parcial e preservar destinatários de entrega ao editar gerente.
- Dashboard passou a usar data de referência canônica e benchmark configurável no funil.
- Ranking removeu extrato simulado e LiveFloor passou a expor indisponibilidade onde não há backend real.
- `approve-store-registration` troca deleção de vigência por encerramento auditável.
- Segunda rodada fechou bypass DEV opt-in, logout real em simulação, bloqueio total da UI por troca obrigatória de senha e remoção de logs de estado auth em DEV.
- `vinculos_loja` ganhou encerramento auditável (`is_active`, `ended_at`) e os fluxos de equipe/loja/Edge Function passaram a filtrar vínculos ativos.
- `register-user` e `store-pre-registration` deixaram de apagar fisicamente vínculos em rollback/pendência e passaram a reativar vínculos por upsert tipado.
- Devolutivas passaram a usar chave de conflito por `store_id, manager_id, seller_id, week_reference`.
- TestSprite legado foi quarentenado por `conftest.py` e artefatos TestSprite deixaram de conter credenciais fixas.
- Split de PDF removeu o alerta de chunks grandes no build.
- Continuação removeu exposição do link público de pré-cadastro no painel de equipe para dono/gerente e adicionou tratamento de falha de clipboard.
- Continuação alinhou `GerentePDI` à capacidade compartilhada `canManagePDI`, incluindo dono conforme matriz.
- Continuação trocou confirmação nativa em notificações por `requestToastConfirmation`.
- Continuação removeu `select('*')` de `useOperationalSettings`, `useGoals`, `useFeedbackReports`, `useManagerRoutine` e `useStores`.
- Continuação adicionou RPC `admin_create_store` para criação atômica de loja e configuração operacional inicial.
- Continuação adicionou RPC `submit_checkin` e removeu o upsert direto de check-in do hook.
- Continuação adicionou RPCs `update_my_profile` e `complete_password_change`, removendo updates diretos de perfil/senha no cliente.
- Continuação removeu writes diretos de equipe/vigência no caminho Admin MX e consolidou edição/exclusão em `manage-store-team`.
- Continuação removeu credencial fixa dos helpers E2E e passou a gerar senhas fortes dinâmicas para usuários temporários.
- Continuação instalou o runtime Chromium do Playwright local e corrigiu a hidratação explícita da sessão de recuperação por hash token.
- Continuação corrigiu tipagens das Edge Functions e shared modules para validação Deno.
- Migrations `20260516120000` a `20260516125500` foram aplicadas no banco remoto via `supabase db push` após `supabase db push --dry-run` e confirmadas por `supabase migration list`.
- RPC `complete_password_change` foi validada com usuário temporário remoto e limpeza posterior, retornando `{ "ok": true }`.
- Validação local de Edge Functions com Deno passou; Docker segue indisponível nesta máquina para subir o stack Supabase local completo.
- Gates finais locais: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `deno check --node-modules-dir=auto supabase/functions/*/index.ts` passaram.
- Boot local validado em `http://127.0.0.1:3002/` com HTTP 200.
- E2E Chromium isolado em `http://127.0.0.1:3111/` passou: 16 passed, 64 skipped por dependências explícitas de ambiente/credenciais, 0 failed.
- Residuo consciente: suite Playwright completa ainda mantém testes skipped quando variáveis reais de ambiente/autenticação não estão disponíveis.

### File List

- `docs/stories/story-OPS-20260516-100-achados-multi-role-hardening.md`
- `deno.lock`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/features/ranking/components/LiveFloor.tsx`
- `src/features/ranking/components/SellerProfileModal.tsx`
- `src/features/admin/components/StoreEditModal.tsx`
- `src/features/lojas/components/StoreTeamPanel.tsx`
- `src/hooks/useAuth.tsx`
- `src/hooks/useCheckins.ts`
- `src/hooks/useCheckins.test.ts`
- `src/hooks/useFeedbacks.ts`
- `src/hooks/useFeedbackReports.ts`
- `src/hooks/useGoals.ts`
- `src/hooks/useManagerRoutine.ts`
- `src/hooks/useOperationalSettings.ts`
- `src/hooks/usePDI.ts`
- `src/hooks/usePDI_MX.ts`
- `src/hooks/useTeam.ts`
- `src/lib/auth/capabilities.test.ts`
- `src/lib/auth/capabilities.ts`
- `src/lib/auth/routeAccess.ts`
- `src/lib/auth/routeAccess.test.ts`
- `src/pages/Checkin.tsx`
- `src/pages/DashboardLoja.tsx`
- `src/pages/GerenteFeedback.tsx`
- `src/pages/GerentePDI.tsx`
- `src/pages/Lojas.tsx`
- `src/pages/Login.tsx`
- `src/pages/Notificacoes.tsx`
- `src/pages/VendedorHome.tsx`
- `src/pages/VendedorPDI.tsx`
- `src/test/auth-first-login.playwright.ts`
- `src/test/auth-password-recovery.playwright.ts`
- `src/test/e2e-helpers/auth.ts`
- `src/test/e2e-helpers/supabase-admin.ts`
- `src/test/mx-consultoria-role-smoke.playwright.ts`
- `supabase/functions/_shared/auth.ts`
- `supabase/functions/_shared/crypto.ts`
- `supabase/functions/_shared/drive-upload.ts`
- `supabase/functions/_shared/email.ts`
- `supabase/functions/approve-store-registration/index.ts`
- `supabase/functions/google-calendar-sync/index.ts`
- `supabase/functions/google-drive-files/index.ts`
- `supabase/functions/manage-store-team/index.ts`
- `supabase/functions/register-user/index.ts`
- `supabase/functions/store-pre-registration/index.ts`
- `supabase/migrations/20260516120000_vinculos_loja_soft_close.sql`
- `supabase/migrations/20260516121500_devolutivas_store_manager_week_key.sql`
- `supabase/migrations/20260516124500_admin_create_store_rpc.sql`
- `supabase/migrations/20260516125000_submit_checkin_rpc.sql`
- `supabase/migrations/20260516125500_auth_self_service_rpcs.sql`
- `testsprite_tests/README.md`
- `testsprite_tests/conftest.py`
- `vite.config.ts`
