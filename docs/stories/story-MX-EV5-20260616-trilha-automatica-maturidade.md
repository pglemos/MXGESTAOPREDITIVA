# Story MX-EV5-20260616 - Trilha Automatica por Maturidade

## Status

Ready for Review

## Story

**As a** vendedor,
**I want** entrar automaticamente na trilha do meu nivel,
**so that** eu receba conteudo obrigatorio compativel com minha maturidade comercial.

## Source Requirements

- PRD EV-5.3: niveis N1 Iniciante, N2 Intermediario, N3 Performance, N4 Alta Performance.
- PRD EV-5.3: definicao automatica por tempo de mercado, experiencia declarada e cargo do Meu Perfil.
- PRD EV-5.3: 5 anos de mercado -> N4; sem experiencia -> N1.
- PRD EV-5.3: Trilha e conteudo obrigatorio, diferente da Biblioteca livre.
- PRD EV-8.2: campos de maturidade ficam em `vendedor_perfil`.

## Acceptance Criteria

1. O banco suporta `track_type` de maturidade N1-N4 em `trilhas_desenvolvimento`.
2. Existem trilhas globais ativas N1, N2, N3 e N4 com etapas obrigatorias.
3. Existe RPC idempotente para atribuir ao vendedor a trilha correspondente ao perfil de maturidade.
4. A tela de Treinamentos exibe o nivel sugerido e diferencia a trilha obrigatoria da Biblioteca.
5. A tela tenta autoatribuir a trilha de maturidade quando o vendedor acessa Treinamentos e ainda nao tem atribuicao ativa de maturidade.
6. Existem testes automatizados para a regra de track type e para a exibicao do nivel sugerido.
7. Gates obrigatorios da story passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- `trilhas_desenvolvimento`, `atribuicoes_trilha_desenvolvimento` e `progresso_etapa_trilha` ja existem. [Source: supabase/migrations/20260515190000_development_full_completion.sql]
- O track atual `novo_colaborador` continua existindo; as trilhas N1-N4 entram como maturidade comercial. [Source: src/hooks/useTrainings.ts]
- Regra TS de maturidade fica em `src/features/crm/lib/maturidade.ts` e deve ficar alinhada ao RPC. [Source: docs/stories/story-MX-EV8-20260616-campos-maturidade-perfil.md]
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.

## Tasks / Subtasks

- [x] Adicionar migration para track types N1-N4, seeds de trilhas e RPC de autoatribuicao (AC: 1, 2, 3).
- [x] Atualizar tipos gerados/RPCs e helper TS de track type (AC: 3, 6).
- [x] Integrar `VendedorTreinamentos` com perfil de maturidade e autoatribuicao idempotente (AC: 4, 5).
- [x] Adicionar testes automatizados de regra e UI (AC: 6).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 7).

## File List

- `docs/stories/story-MX-EV5-20260616-trilha-automatica-maturidade.md`
- `supabase/migrations/20260616192000_trilhas_maturidade_vendedor.sql`
- `src/types/database.generated.ts`
- `src/features/crm/lib/maturidade.ts`
- `src/features/crm/hooks/useVendedorPerfil.ts`
- `src/features/crm/hooks/useVendedorPerfil.test.ts`
- `src/features/crm/MeuPerfilVendedor.container.test.tsx`
- `src/hooks/useTrainings.ts`
- `src/pages/VendedorTreinamentos.tsx`
- `src/pages/VendedorTreinamentos.test.tsx`
- `src/lib/trilhas-maturidade-migration.test.ts`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- `bun test src/features/crm/hooks/useVendedorPerfil.test.ts src/pages/VendedorTreinamentos.test.tsx src/lib/trilhas-maturidade-migration.test.ts` - 8 pass.
- `npm run lint` - passou (`tsc --noEmit`, `lint-tokens-ast`, `eslint`).
- `npm run typecheck` - passou.
- `npm test` - 431 pass.
- `npm run build` - passou (`vite build`).
- `git diff --check` - passou.
- CodeRabbit local indisponivel: `command -v wsl` e `command -v coderabbit` sem resultado.

### Completion Notes

- Banco aceita trilhas de maturidade `maturidade_n1` a `maturidade_n4`, sem remover `novo_colaborador`, `reciclagem` ou `institucional`.
- Migration semeia quatro trilhas globais ativas com etapas obrigatorias e cria RPC idempotente `atribuir_trilha_maturidade_vendedor`.
- `useDevelopmentTracks` expoe `assignMaturityTrack`, chamando a RPC com restricao de autoatribuicao para vendedor.
- `VendedorTreinamentos` calcula o nivel pelo Meu Perfil, exibe trilha obrigatoria separada da Biblioteca e tenta autoatribuir quando ainda nao ha trilha de maturidade ativa.
- Testes cobrem regra N1-N4, contrato da migration e renderizacao/autoatribuicao da tela.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-5.3.
- 2026-06-16: Implementada trilha automatica por maturidade N1-N4 e validada pelos gates obrigatorios.
