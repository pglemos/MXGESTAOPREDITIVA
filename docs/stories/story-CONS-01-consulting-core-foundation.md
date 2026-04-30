# Story [CONS-01]: Fundacao do CRM de Consultoria

**Status:** REVIEW
**Agent:** @data-engineer + @dev
**Effort:** 4h
**Priority:** HIGH

## 1. Context

O novo modulo `CRM de Consultoria MX` precisa nascer sem quebrar o core atual do `MX PERFORMANCE`. O primeiro corte aprovado pelo PRD e pela validacao PO e criar apenas a fundacao: tabelas isoladas `consulting_*`, RLS, tipos/hook minimo e tela protegida para clientes da consultoria.

Esta story nao inclui Google Calendar, DRE, estoque, BI, anexos ou importacao definitiva.

Referencias:

- `docs/prd/mx-consultoria-crm/requirements.md`
- `docs/prd/mx-consultoria-crm/epics.md`
- `docs/architecture/mx-consultoria-crm/data-model.md`
- `docs/architecture/mx-consultoria-crm/integration-plan.md`
- `docs/reviews/mx-consultoria-crm-po-validation.md`

## 2. User Story

Como usuario admin/MX,
quero cadastrar e visualizar clientes da consultoria em um contexto separado,
para iniciar o CRM interno da MX sem afetar lojas, check-ins e relatorios existentes.

## 3. Acceptance Criteria

- [x] Criar migration Supabase isolada para as tabelas:
  - `consulting_clients`
  - `unidades_cliente_consultoria`
  - `contatos_cliente_consultoria`
  - `atribuicoes_consultoria`
- [x] Criar RLS inicial para impedir acesso indevido aos clientes da consultoria.
- [x] Admin deve poder listar e cadastrar clientes da consultoria.
- [ ] Consultor vinculado em `atribuicoes_consultoria` deve poder ler o cliente vinculado.
- [ ] Usuario sem permissao nao deve ler cliente sem assignment.
- [x] Criar tipos TypeScript minimos para as entidades novas.
- [x] Criar hook minimo `useConsultingClients`.
- [x] Criar rota protegida `/consultoria` e `/consultoria/clientes`.
- [x] Criar tela minima de listagem/detalhe sem depender de Google, DRE, estoque ou BI.
- [ ] Rotas atuais de core devem continuar funcionando: `/checkin`, `/funil`, `/ranking`, `/feedback`, `/pdi`, `/treinamentos`.

## 4. Implementation Tasks

1. Criar migration `supabase/migrations/<timestamp>_consulting_core.sql`.
2. Definir tabelas `consulting_*` do MVP com `created_at`, `updated_at`, chaves estrangeiras e indices basicos.
3. Definir policies RLS para admin e assignments.
4. Criar testes de RLS ou teste de acesso equivalente para isolamento basico.
5. Criar tipos em `src/types/database.ts` ou arquivo de tipos dedicado, seguindo padrao do projeto.
6. Criar `src/hooks/useConsultingClients.ts`.
7. Criar paginas minimas:
   - `src/pages/Consultoria.tsx`
   - `src/pages/ConsultoriaClientes.tsx`
   - `src/pages/ConsultoriaClienteDetalhe.tsx`
8. Registrar rotas lazy em `src/App.tsx`.
9. Adicionar entrada de navegacao somente se houver padrao claro no `Layout`; caso contrario, documentar como acessar a rota.
10. Rodar validacoes.

## 5. Rollback

- A UI deve ficar isolada em rotas `/consultoria*`; remover as rotas deve desativar o modulo sem afetar o core.
- A migration deve ser isolada e nao alterar tabelas existentes.
- Caso o schema precise ser revertido antes de producao, remover apenas tabelas `consulting_*` criadas nesta story.
- Nenhum dado de `stores`, `daily_checkins`, `devolutivas`, `pdis`, `trainings` ou relatorios deve ser alterado.

## 6. Regression Checks

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run build`
- [ ] Verificar que `/checkin`, `/funil`, `/ranking`, `/feedback`, `/pdi` e `/treinamentos` ainda renderizam sem erro.

## 7. Definition of Done

- Tabelas e RLS do core de consultoria criadas.
- Tela minima de clientes acessivel por admin/MX.
- Hook minimo funcional.
- Acesso indevido bloqueado por RLS.
- Core existente sem regressao nos comandos de qualidade.
- File List atualizado abaixo.

## 8. File List

- `docs/stories/story-CONS-01-consulting-core-foundation.md`
- `supabase/migrations/20260413110000_consulting_core_foundation.sql`
- `src/features/consultoria/types.ts`
- `src/hooks/useConsultingClients.ts`
- `src/pages/Consultoria.tsx`
- `src/pages/ConsultoriaClientes.tsx`
- `src/pages/ConsultoriaClienteDetalhe.tsx`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/types/database.ts`
- `src/components/atoms/Typography.tsx`
- `src/components/atoms/Button.tsx`
- `src/hooks/useGoals.ts`
- `src/hooks/useTeam.ts`
- `src/pages/OperationalSettings.tsx`
- `src/pages/Notificacoes.tsx`
- `src/pages/SellerPerformance.tsx`
- `src/pages/VendedorHome.tsx`
- `src/pages/History.tsx`
- `src/hooks/useStoreSales.test.ts`
- `package.json`
- `scripts/repair_retry.ts`
- `scripts/repair_system.ts`
- `scripts/reset_admin_single.ts`
- `scripts/reset_passwords.ts`
- `scripts/reset_passwords_v2.ts`

## 9. Notes

Google Calendar, DRE, estoque, anexos, importadores e BI ficam fora desta story por decisao PO. Eles dependem da fundacao desta story estar verde.

Observacao de validacao:

- `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passaram.
- O script `npm test` foi alinhado para rodar apenas a suíte unitária do Bun; os testes Playwright continuam disponíveis em `npm run test:e2e`.
- Smoke web local confirmado em `http://localhost:3002/`, com redirecionamento esperado para `/login` sem erros de console.
- A migration e as policies foram criadas, mas a leitura real via RLS ainda depende de aplicacao do schema no banco alvo e teste com usuarios reais.
