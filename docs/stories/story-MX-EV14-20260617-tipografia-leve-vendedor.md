# Story MX-EV14-20260617 - Tipografia Leve nas Telas do Vendedor

## Status

Ready for Review

## Story

**As a** Daniel/Mariane,
**I want** uma tipografia menos pesada nas telas do vendedor,
**so that** o produto fique mais leve, agradavel e proximo da spec visual.

## Source Requirements

- PRD EV-14.1: reduzir uso de `font-black` para pesos medios.
- PRD EV-14.1: aplicar de forma consistente nas telas do vendedor.
- PRD EV-14.1: manter hierarquia Titulo 32/700, Subtitulo 20/600, Card 16/600, Texto 14/400.
- PRD EV-14.1: Mariane valida cada tela ajustada.

## Acceptance Criteria

1. `Typography` nao usa `font-black` como peso padrao para h1/h2/h3/h4/p/caption/tiny.
2. Hierarquia base fica alinhada a 700/600/600/400 para titulo/subtitulo/card/texto.
3. `Button` e `Badge` deixam de impor `font-black` por padrao.
4. Telas do vendedor herdam a tipografia mais leve sem mudanca de fluxo.
5. Contratos visuais dos atomos possuem testes.
6. Gates obrigatorios passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
7. Validacao Mariane fica registrada como pendencia externa quando nao executavel no ambiente local.

## Dev Notes

- EV-14 e transversal; preferir ajuste nos atomos para reduzir blast radius e evitar edicoes pagina-a-pagina.
- Nao alterar cores, layout, navegacao ou regras de negocio.
- A validacao visual humana da Mariane nao e executavel por CLI; registrar explicitamente.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.
- Template/checklist formais do agente SM (`story-tmpl.yaml`, `story-draft-checklist.md`) nao existem neste checkout; usar formato local das stories `story-MX-EV*`.

## Tasks / Subtasks

- [x] Criar testes vermelhos para pesos padrao de Typography/Button/Badge (AC: 1-5).
- [x] Ajustar `Typography` para pesos 700/600/400 conforme spec (AC: 1-2).
- [x] Ajustar `Button` e `Badge` para peso medio/semibold por padrao (AC: 3-4).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 6-7).

## File List

- `docs/stories/story-MX-EV14-20260617-tipografia-leve-vendedor.md`
- `src/components/atoms/Typography.tsx`
- `src/components/atoms/Button.tsx`
- `src/components/atoms/Badge.tsx`
- `src/test/atoms/Typography.test.tsx`
- `src/test/atoms/Button.test.tsx`
- `src/test/atoms/Badge.test.tsx`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- Template/checklist do SM ausentes no checkout; story segue formato local ja usado em `docs/stories/story-MX-EV*.md`.
- UX local: skill `aiox-ux-design-expert` carregado para orientar ajuste atomico de design system.
- Red: `bun test src/test/atoms/Typography.test.tsx src/test/atoms/Button.test.tsx src/test/atoms/Badge.test.tsx` falhou por `font-black` ainda ser o padrao dos atomos.
- Focused pass: `bun test src/test/atoms/Typography.test.tsx src/test/atoms/Button.test.tsx src/test/atoms/Badge.test.tsx` -> 9 pass, 0 fail.
- Gate: `npm run typecheck` -> pass.
- Gate: `npm run lint` -> pass; `lint-tokens-ast` escaneou 516 arquivos.
- Gate: `npm test` -> 532 pass, 0 fail.
- Gate: `npm run build` -> pass.
- Gate: `git diff --check` -> pass.
- Auditoria local: `font-black` no escopo vendedor/DS auditado caiu de 273 para 266 por remocao dos padroes atomicos; usos explicitos de pagina permanecem para iteracao visual posterior.
- Extra: `command -v wsl` e `command -v coderabbit` sem binarios disponiveis no ambiente.

### Completion Notes

- `Typography` agora usa h1 `font-bold`, h2/h3/h4 `font-semibold`, paragrafo `font-normal`, caption/tiny `font-medium` e tracking normal.
- `Button` e `Badge` deixam de impor `font-black` por padrao, reduzindo peso visual em telas que usam os atomos.
- Nenhum fluxo, cor, rota ou regra de negocio foi alterado.
- Validacao humana da Mariane nao foi executada neste ambiente e permanece como pendencia externa de aprovacao visual.

### Change Log

- 2026-06-17: Story criada a partir de PRD EV-14.1.
- 2026-06-17: Ajuste atomico de tipografia leve implementado e validado por testes/gates; validacao Mariane pendente externamente.
