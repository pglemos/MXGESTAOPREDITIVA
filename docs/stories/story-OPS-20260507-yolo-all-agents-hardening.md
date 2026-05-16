# Story OPS-20260507 - Fechamento Operacional de Superficies Sensiveis

## Status

Done

## Contexto

A auditoria multi-role de 2026-05-07 listou mais de 100 riscos, falhas e residuos em vendedor, gerente, dono e admin. As stories anteriores fecharam a rodada ampla de `any`, confirmacoes nativas, RLS, Edge Functions e gates. Restam residuos objetivos e confirmaveis nesta rodada yolo: exclusao fisica em produtos digitais, senha provisoria fixa no pre-cadastro publico, `select('*')` em fluxos criticos de check-in/historico e validacao local da Edge Function de pre-cadastro.

Chaves, tokens, secrets, push, PR, release, migrations remotas e deploy automatico ficam fora do escopo.

## Acceptance Criteria

- [x] Registrar a rodada no epic `EPIC-OPS-20260507-MULTI-ROLE-HARDENING`.
- [x] Executar revisao @qa com achados priorizados por papel/modulo.
- [x] Executar frente @dev para correcoes seguras em codigo local.
- [x] Trocar delecao fisica evitavel por arquivamento em fluxo admin de produtos digitais.
- [x] Atualizar textos/acoes de UI de produto de "Excluir" para "Arquivar" quando o comportamento passar a ser soft-delete.
- [x] Remover senha provisoria fixa em pre-cadastro publico.
- [x] Remover fallback fixo de senha provisoria na UI de pre-cadastro.
- [x] Reduzir `select('*')` em check-in/historico para contratos explicitos ja existentes.
- [x] Endurecer `store-pre-registration` sem alterar secrets: senha forte gerada por solicitacao e residuos tipados/fatiados.
- [x] Nao alterar fluxo funcional de aprovacao de pre-cadastro, permissoes de produto, RLS ou credenciais.
- [x] Preservar secrets, tokens e chaves existentes.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm test`.
- [x] Rodar `npm run build`.
- [x] Atualizar checklist, Dev Agent Record e File List antes de concluir.

## Checklist por Papel

- [x] Vendedor: historico/check-in continuam carregando apenas dados esperados e sem regressao visual/funcional.
- [x] Gerente: pre-cadastro de equipe nao gera senha previsivel e mantem revisao pendente.
- [x] Dono: produtos digitais deixam de sofrer remocao fisica acidental; arquivamento preserva governanca.
- [x] Admin/MX: produto, pre-cadastro, Edge Function e gates locais ficam revisados sem troca de secrets.

## Agentes

- @aiox-master (Orion): coordenacao, story, integracao e gates locais.
- @qa (Quinn): revisao multi-role, severidade, gate recommendation.
- @dev (Dex): correcoes locais seguras e testes focados.
- @architect (Aria): limites arquiteturais de rotas, auth e bundles.
- @data-engineer (Dara): riscos RLS, service role, plaintext e schema drift.
- @po (Pax): aceite, escopo e protecao contra requisitos inventados.
- @sm (River): story operacional e checklist.
- @pm (Morgan): prioridade por impacto operacional.
- @devops (Gage): autoridade reservada para push/PR/release, nao executada nesta story.
- @analyst (Atlas): consolidacao dos achados de auditoria.
- @ux-design-expert (Uma): riscos de UX em confirmacao/fluxos destrutivos.

## Dev Agent Record

### Debug Log

- Story criada em modo yolo a partir da auditoria multi-role de 2026-05-07.
- Worktree inicial limpo antes da rodada.
- Subagentes acionados: @qa, @dev, @architect/@data-engineer e @po/@sm.
- @po/@sm recomendou estreitar a story para superficies sensiveis confirmaveis, evitando nova auditoria ampla paralela.
- @qa apontou P0 em senha provisoria fixa/retornada cedo e em Edge shared auth sem checagem de `active`.
- @dev corrigiu matriz de rotas: `/lancamento-diario` restrito a vendedor e `/auditoria` alinhada ao App para internos MX + gerente.
- `ProdutosDigitais` passou de delete fisico para arquivamento via `status='arquivado'`, com textos de UI atualizados.
- `store-pre-registration` passou a gerar senha provisoria forte por solicitacao e nao persistir a senha em `pre_cadastros_loja.temporary_password`.
- `StorePreRegistration` removeu fallback fixo `[SENHA_TEMPORARIA_REDACTED]` no retorno da Edge Function.
- `StoreTeamPanel` deixou de selecionar e exibir `temporary_password` de pre-cadastros.
- `_shared/auth` de Edge Functions passou a bloquear perfil `active=false`.
- `useCheckins` e `useAuth` reduziram consultas amplas nos caminhos tocados.
- `ProdutosDigitais` reduziu `select('*')` para contrato explicito.
- Scan focado confirmou que `[SENHA_TEMPORARIA_REDACTED]`, `select('*')` e delete fisico de produto nao aparecem mais nos arquivos tocados.
- `deno --version` falhou com `command not found`; `deno check` local das Edge Functions nao foi executado.
- Build passou, mas manteve aviso de chunk grande: `vendor-pdf` acima de 1 MB.

### Gates

- [x] `npm run typecheck` - passed.
- [x] `npm run lint` - passed.
- [x] `bun test src/lib/auth/routeAccess.test.ts src/hooks/useCheckins.test.ts src/lib/auth/roles.test.ts src/lib/supabase.test.ts` - 16 passed.
- [x] `npm test` - 227 passed.
- [x] `npm run build` - passed with existing large chunk warning.

### Residuos Esperados

- Edge Functions seguem sem `deno check` local se `deno` nao estiver instalado.
- Itens que exigem migration remota, secrets, deploy, push, PR ou validacao live devem ficar fatiados.
- Correcoes de bundle grandes podem permanecer como frente de performance se exigirem refatoracao ampla.
- Remover o retorno one-time da senha provisoria exige redesenho do fluxo de entrega de credencial e ficou fora desta fatia.
- Lint/tipagem completa das Edge Functions fica bloqueada localmente sem `deno`.
- Auditoria RLS/banco completa, OAuth token backfill e service-role scripts ficam para stories tecnicas dedicadas.

### File List

- `docs/stories/story-OPS-20260507-yolo-all-agents-hardening.md`
- `docs/stories/epics/epic-ops-20260507-multi-role-hardening.md`
- `src/features/lojas/components/StoreTeamPanel.tsx`
- `src/hooks/useAuth.tsx`
- `src/hooks/useCheckins.ts`
- `src/lib/auth/routeAccess.ts`
- `src/lib/auth/routeAccess.test.ts`
- `src/pages/ProdutosDigitais.tsx`
- `src/pages/StorePreRegistration.tsx`
- `supabase/functions/_shared/auth.ts`
- `supabase/functions/store-pre-registration/index.ts`
