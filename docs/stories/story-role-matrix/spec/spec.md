# Story Role Matrix — Congelar Matriz Oficial de Papeis MX

## Status

Ready for Review

## Contexto

O produto MX Gestao Preditiva deve operar com a matriz oficial de papeis definida pelo dominio:

- `admin`: governanca total da MX Gestao Preditiva em todas as lojas.
- `dono`: visao executiva das lojas vinculadas, sem operacao diaria.
- `gerente`: operacao da loja e desenvolvimento da equipe.
- `vendedor`: execucao individual, leitura e ciencia dos rituais.

## Requisitos

- FR-ROLE-001: O papel `consultor` deixa de ser papel funcional novo e passa a ser alias legado de `admin`.
- FR-ROLE-002: O papel `dono` representa o dono da loja cliente, com escopo em lojas vinculadas.
- FR-ROLE-003: `admin` pode ver e operar tudo, sem depender de membership.
- FR-ROLE-004: `dono` pode ver suas lojas, performance, metas, funil, relatorios, feedbacks e PDIs da equipe, mas nao opera check-in, reprocessamento, benchmark tecnico, rotina diaria ou edicao de feedback/PDI por padrao.
- FR-ROLE-005: `gerente` pode operar sua loja, equipe, check-ins, ranking, metas, funil, feedback, PDI e treinamentos.
- FR-ROLE-006: `vendedor` pode ver e executar somente seus dados, check-ins, historico, ranking, treinamentos, feedback, PDI e notificacoes.
- FR-ROLE-007: A navegacao autenticada deve refletir a matriz oficial por papel.
- FR-ROLE-008: RLS deve seguir: admin tudo; dono lojas vinculadas; gerente loja vinculada; vendedor registros proprios.
- CON-ROLE-001: Migrations devem ser versionadas no repo; aplicacao no Supabase live fica para etapa controlada de deploy.
- CON-ROLE-002: Compatibilidade com dados legados deve normalizar `consultor -> admin`, `owner -> dono`, `manager -> gerente`, `seller -> vendedor`.

## Acceptance Criteria

- [x] `UserRole` usa apenas `admin | dono | gerente | vendedor` no dominio novo.
- [x] `MembershipRole` usa `dono | gerente | vendedor`.
- [x] `useAuth` normaliza aliases legados e carrega lista de memberships, mantendo loja ativa.
- [x] `admin` nao depende de membership para autenticar e acessar telas globais.
- [x] `dono` aparece na navegacao com perfil executivo/read-only.
- [x] Menus de `admin`, `gerente` e `vendedor` refletem a matriz oficial.
- [x] Telas de lojas, metas/benchmarks, feedback e PDI respeitam restricoes basicas de UI por papel.
- [x] Migration versionada atualiza constraints, dados legados, helpers RLS e politicas principais.
- [x] README e PRD documentam a matriz oficial sem `consultor` como papel funcional.
- [x] Quality gates executados: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Supabase Live Validation

- [x] Projeto CLI linkado em `fbhcmzzgwjdgkctlfvbo` / `MX GESTAO PREDITIVA`.
- [x] `supabase db push --dry-run` nao foi usado para aplicar porque o historico remoto diverge das migrations locais antigas.
- [x] Snapshot critico pre-migration salvo em `supabase/.temp/backups/pre_role_matrix_20260407150825_metadata.json`.
- [x] Migration `20260407000000_role_matrix_dono_admin.sql` validada em transacao com `ROLLBACK`.
- [x] Migration aplicada no Supabase live em transacao e marcada como `applied` via `supabase migration repair --status applied 20260407000000`.
- [x] Constraints live confirmadas: `users.role` aceita `admin | dono | gerente | vendedor`; `memberships.role` aceita `dono | gerente | vendedor`.
- [x] Tabela `roles` live contem `admin`, `dono`, `gerente`, `vendedor`.
- [x] Helpers live confirmados: `normalize_mx_role`, `is_admin()`, `has_store_role`, `is_owner_of`, `is_manager_of`, `is_member_of`.
- [x] Politicas `role_matrix_*` criadas nas tabelas operacionais existentes.
- [x] Validacao RLS com usuario real `admin` confirmou acesso global.
- [x] Validacao transacional simulando `admin`, `dono`, `gerente` e `vendedor` com rollback confirmou escopos esperados sem criar contas em producao.

Observacao: o banco live possui apenas `1` usuario real em `public.users`, com role `admin`. Nao ha usuarios reais de `dono`, `gerente` e `vendedor` para validacao ponta-a-ponta com login real por papel.

## File List

- `docs/stories/story-role-matrix/spec/spec.md`
- `docs/stories/story-role-matrix/plan/implementation.yaml`
- `PRD_MX_Gestao_Preditiva_90D_atualizado.md`
- `README.md`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/components/auth-provider.tsx`
- `src/hooks/useAuth.tsx`
- `src/hooks/useData.ts`
- `src/hooks/useTeam.ts`
- `src/pages/Checkin.tsx`
- `src/pages/Configuracoes.tsx`
- `src/pages/ConsultorNotificacoes.tsx`
- `src/pages/DashboardLoja.tsx`
- `src/pages/GerenteFeedback.tsx`
- `src/pages/GerentePDI.tsx`
- `src/pages/GoalManagement.tsx`
- `src/pages/Lojas.tsx`
- `src/pages/Reprocessamento.tsx`
- `src/types/database.ts`
- `supabase/migrations/20260407000000_role_matrix_dono_admin.sql`
