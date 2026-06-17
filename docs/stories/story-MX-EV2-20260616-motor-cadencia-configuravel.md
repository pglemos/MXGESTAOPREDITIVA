# Story MX-EV2-20260616 - Motor de Cadencia Configuravel

## Status

Ready for Review

## Story

**As a** consultor/admin,
**I want** definir fluxos de cadencia por canal e etapa,
**so that** o sistema gere o proximo passo para o vendedor sem depender de treinamento manual.

## Source Requirements

- PRD EV-2.2: fluxo e uma sequencia de passos por etapa.
- PRD EV-2.2: cada passo gera automaticamente a proxima acao do cliente com prazo.
- PRD EV-2.2: fluxos sao configuraveis e versionaveis para analytics.
- PRD EV-2.2: vendedor nao cria fluxo; vendedor segue o fluxo pronto.

## Acceptance Criteria

1. Banco possui `cadencia_fluxos` versionado por canal/etapa/loja e `cadencia_estado_cliente` por cliente.
2. Existe seed global ativo para canais `internet`, `carteira` e `porta`, com passos JSONB e prazos.
3. Existe RPC idempotente para inicializar a cadencia de um cliente, gerar `proxima_acao` e prazo, e persistir a versao aplicada.
4. Criacao de cliente usa a regra de cadencia para preencher a primeira proxima acao quando o vendedor nao informa uma acao manual.
5. Helper TS expõe a configuracao padrao e consegue resolver a primeira acao por canal.
6. Existem testes automatizados para o helper e para o contrato da migration.
7. Gates obrigatorios da story passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- A tela atual `CarteiraClientes.container.tsx` ja exibe etapa, cadencia e proxima acao, mas `src/features/crm/lib/cadencia.ts` ainda concentra o fluxo inicial em codigo.
- A fundacao CRM existe em `supabase/migrations/20260609120000_mx_crm_vendedor_foundation.sql` com `clientes.proxima_acao` e `clientes.proxima_acao_em`.
- EV-2.3/EV-2.4/EV-2.5 dependem deste estado versionado para status de acao, reagendamento e Central.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.

## Tasks / Subtasks

- [x] Adicionar migration de fluxos/estado/RPC com seed global (AC: 1, 2, 3).
- [x] Atualizar tipos gerados para tabelas e RPC (AC: 1, 3).
- [x] Criar helper TS para configuracao padrao e primeira acao por canal (AC: 4, 5).
- [x] Integrar `useClientes.createCliente` com inicializacao de cadencia (AC: 4).
- [x] Adicionar testes automatizados de helper e migration (AC: 6).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 7).

## File List

- `docs/stories/story-MX-EV2-20260616-motor-cadencia-configuravel.md`
- `supabase/migrations/20260616203000_cadencia_configuravel_vendedor.sql`
- `src/types/database.generated.ts`
- `src/features/crm/lib/cadencia.ts`
- `src/features/crm/lib/cadencia.test.ts`
- `src/features/crm/hooks/useClientes.ts`
- `src/features/crm/hooks/useClientes.test.ts`
- `src/lib/cadencia-configuravel-migration.test.ts`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- `bun test src/features/crm/lib/cadencia.test.ts src/features/crm/hooks/useClientes.test.ts src/lib/cadencia-configuravel-migration.test.ts` - 9 pass.
- `npm run lint` - passou (`tsc --noEmit`, `lint-tokens-ast`, `eslint`).
- `npm run typecheck` - passou.
- `npm test` - 440 pass.
- `npm run build` - passou (`vite build`).
- `git diff --check` - passou.
- CodeRabbit local indisponivel: `command -v wsl` e `command -v coderabbit` sem resultado.

### Completion Notes

- Migration cria `cadencia_fluxos` e `cadencia_estado_cliente`, com RLS por loja/vendedor e escrita de fluxo restrita a lideranca/admin.
- Seed global ativo cobre `internet`, `carteira` e `porta`, com passos JSONB, prazos e transicoes internas validadas por teste.
- RPC `inicializar_cadencia_cliente` e idempotente, escolhe fluxo global/loja por canal, grava o estado versionado e preenche `clientes.proxima_acao`/`proxima_acao_em` sem sobrescrever valores manuais.
- Helper TS `resolverPrimeiraAcaoCadencia` fornece a primeira acao padrao por canal e trata showroom como fluxo porta.
- `useClientes.createCliente` monta payload com primeira acao de cadencia quando o vendedor nao informou acao manual e chama a RPC para persistir o estado aplicado.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-2.2.
- 2026-06-16: Implementado motor configuravel de cadencia e validado pelos gates obrigatorios.
