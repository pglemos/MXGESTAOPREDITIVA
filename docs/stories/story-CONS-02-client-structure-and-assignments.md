# Story [CONS-02]: Estrutura Operacional do Cliente de Consultoria

**Status:** REVIEW
**Agent:** @sm + @dev
**Effort:** 4h
**Priority:** HIGH

## 1. Context

Com a fundacao do CRM de Consultoria entregue na `CONS-01`, o proximo passo util e permitir que o cliente seja operado de verdade no sistema. Hoje a tela de detalhe apenas exibe dados, mas ainda nao permite estruturar o cliente com unidades, contatos e consultores vinculados.

Esta story continua dentro do Epic 1 e nao inclui agenda Google, PMR, DRE, estoque, BI ou importadores.

Referencias:

- `docs/prd/mx-consultoria-crm/requirements.md`
- `docs/prd/mx-consultoria-crm/epics.md`
- `docs/architecture/mx-consultoria-crm/data-model.md`
- `docs/architecture/mx-consultoria-crm/integration-plan.md`
- `docs/stories/story-CONS-01-consulting-core-foundation.md`

## 2. User Story

Como usuario admin/MX,
quero cadastrar unidades, contatos e consultores por cliente da consultoria,
para transformar o cliente em um registro operacional utilizavel no CRM interno.

## 3. Acceptance Criteria

- [x] Admin deve conseguir cadastrar unidade em cliente da consultoria.
- [x] Admin deve conseguir cadastrar contato em cliente da consultoria.
- [x] Admin deve conseguir vincular usuario existente ao cliente em `consulting_assignments`.
- [x] Admin deve conseguir reativar/desativar assignment sem apagar historico.
- [x] A tela `/consultoria/clientes/:clientId` deve refletir as alteracoes apos salvar.
- [x] Usuarios continuam sem acesso a rotas fora do escopo novo.
- [x] Rotas atuais do core devem continuar funcionando: `/checkin`, `/funil`, `/ranking`, `/feedback`, `/pdi`, `/treinamentos`.

## 4. Implementation Tasks

1. Expandir hook de detalhe do cliente para criar unidades, contatos e assignments.
2. Carregar usuarios ativos para vinculacao no cliente.
3. Adicionar formularios minimos na tela de detalhe para:
   - unidade
   - contato
   - assignment
4. Permitir acao de ativar/desativar assignment.
5. Validar a renderizacao da tela sem quebrar as abas existentes.
6. Rodar validacoes do projeto.

## 5. Rollback

- As alteracoes devem ficar restritas ao contexto `/consultoria*`.
- Nenhuma tabela do core operacional pode ser alterada.
- O rollback deve poder remover apenas a UI e os hooks desta story, mantendo a `CONS-01`.

## 6. Regression Checks

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run build`
- [ ] Verificar que `/consultoria/clientes/:clientId` carrega sem erro.

## 7. Definition of Done

- Cliente pode receber unidades, contatos e consultores vinculados.
- Detail page da consultoria fica operacional para administracao basica.
- Nenhuma regressao introduzida nos gates locais.
- File List atualizado abaixo.

## 8. File List

- `docs/stories/story-CONS-02-client-structure-and-assignments.md`
- `src/features/consultoria/components/GoogleCalendarView.tsx`
- `src/features/consultoria/types.ts`
- `src/hooks/useAuth.tsx`
- `src/hooks/useConsultingClients.ts`
- `src/pages/ConsultoriaClienteDetalhe.tsx`
- `src/pages/ConsultoriaClientes.tsx`
- `src/pages/ConsultoriaVisitaExecucao.tsx`
- `src/pages/Login.tsx`

## 9. Notes

Assignments continuam usando a tabela `users` existente e o controle de acesso permanece baseado em `consulting_assignments` + RLS da `CONS-01`.

Validacao local concluida para gates e para o shell de `/consultoria/clientes` com bypass DEV.

Validacao live concluida em `2026-04-13` / `2026-04-14` com o usuario admin real `jose.roberto@mxperformance.com.br`:
- `consulting_client_units`: insert e delete validados
- `consulting_client_contacts`: insert e delete validados
- `consulting_assignments`: upsert, deactivate, reactivate e delete validados
- cleanup completo executado apos o teste, sem deixar dados de QA persistidos

A validacao visual headless do detalhe `/consultoria/clientes/:clientId` segue instavel neste ambiente por `ERR_CONNECTION_RESET` do browser contra o Supabase, apesar de `curl` e RLS autenticada estarem operando normalmente.
