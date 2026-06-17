# Story MX-EV7-20260616 - Evolucao da Nota no PDI

## Status

Ready for Review

## Story

**As a** vendedor,
**I want** ver a evolucao das minhas notas de competencia entre sessoes de PDI,
**so that** eu saiba onde estou evoluindo e onde minha nota ficou estagnada.

## Source Requirements

- PRD EV-7.2: grafico/painel de progresso comparando sessoes de PDI por competencia.
- PRD EV-7.2: destacar o que esta evoluindo e o que esta estagnado.
- PRD EV-7.2: usar estilo de telinha de progresso como trilha/aulas.
- PRD EV-7.2: serie temporal de avaliacoes por competencia entre sessoes de PDI.
- PRD EV-7.2: depende de EV-7.1 com multiplas sessoes avaliadas.

## Acceptance Criteria

1. Existe helper puro que ordena sessoes PDI no tempo e agrupa notas por competencia.
2. O helper calcula delta entre nota anterior e nota atual por competencia.
3. Competencias com delta positivo sao destacadas como evoluindo.
4. Competencias com delta zero sao destacadas como estagnadas.
5. A tela `VendedorPDI` renderiza painel de evolucao quando ha PDI ativo.
6. Com menos de duas sessoes comparaveis, a tela mostra estado vazio compacto sem quebrar as secoes existentes.
7. O painel usa dados reais de `useMyPDISessions`, sem mockar notas ou misturar Score.
8. Existem testes automatizados para helper de evolucao e renderizacao basica do painel.
9. Gates obrigatorios passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- `src/pages/VendedorPDI.tsx` ja renderiza conquistas, competencias e plano de acao da sessao ativa.
- `useMyPDISessions` retorna sessoes com `avaliacoes`, `data_realizacao` e `created_at`.
- O PDI nao entra no Score comparativo; esta story deve permanecer apenas na visualizacao do PDI.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.
- Arquivos `devLoadAlwaysFiles` e fallbacks definidos em `.aiox-core/core-config.yaml` nao existem neste checkout; usar padroes observados no codigo.

## Tasks / Subtasks

- [x] Criar teste vermelho e helper puro de evolucao do PDI (AC: 1-4, 7).
- [x] Integrar painel na tela `VendedorPDI` com estado comparavel e vazio (AC: 5-7).
- [x] Adicionar teste de renderizacao basica do painel (AC: 8).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 9).

## File List

- `docs/stories/story-MX-EV7-20260616-evolucao-nota-pdi.md`
- `src/lib/pdi-evolution.ts`
- `src/lib/pdi-evolution.test.ts`
- `src/pages/VendedorPDI.tsx`
- `src/pages/VendedorPDI.test.tsx`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- Arquivos `docs/framework/*` e fallbacks `docs/architecture/padroes-de-codigo.md`, `docs/architecture/pilha-tecnologica.md`, `docs/architecture/arvore-de-origem.md` ausentes no checkout.
- `bun test src/lib/pdi-evolution.test.ts` - falhou primeiro por helper ausente (`Cannot find module './pdi-evolution'`).
- `bun test src/pages/VendedorPDI.test.tsx` - falhou primeiro por painel `Evolução das notas` ausente.
- `bun test src/lib/pdi-evolution.test.ts src/pages/VendedorPDI.test.tsx` - 4 pass.
- `npm run typecheck` - passou.
- `npm run lint` - passou (`tsc --noEmit`, `lint-tokens-ast`, `eslint`; 508 arquivos escaneados).
- `npm test` - 479 pass.
- `npm run build` - passou (`vite build`).
- `git diff --check` - passou.
- CodeRabbit local indisponivel: `command -v wsl` e `command -v coderabbit` sem resultado.

### Completion Notes

- `pdi-evolution.ts` cria serie temporal por competencia, ordena sessoes por `data_realizacao`/`created_at` e calcula delta da nota atual contra a anterior.
- Competencias comparaveis sao classificadas como `evoluindo`, `estagnado` ou `queda`; competencias com apenas uma avaliacao ficam fora da comparacao.
- `VendedorPDI` ganhou painel "Evolução das notas" com contadores, linhas por competencia e estado compacto quando ainda nao ha duas sessoes avaliadas.
- A visualizacao usa somente sessoes reais de `useMyPDISessions` e nao altera o Score comparativo.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-7.2.
- 2026-06-16: Implementada evolucao temporal das notas no PDI e validada pelos gates obrigatorios.
