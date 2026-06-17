# Story MX-EV8-20260616 - Ocultar Oportunidades de Carreira no Perfil do Vendedor

## Status

Ready for Review

## Story

**As a** dono de loja com pacote principal,
**I want** que o vendedor vinculado não veja "Oportunidades de Carreira" no Meu Perfil,
**so that** o sistema não estimule saída antes do modelo de vendedor autônomo existir.

## Source Requirements

- PRD EV-8.4: "Oportunidades de Carreira" não aparece para vendedor vinculado; aparece apenas para autônomo; enquanto o conceito de autônomo não existe, o card fica oculto para todos.
- PRD EV-12.1: vínculo loja vs autônomo governa visibilidade de Carreira/Mercado.
- PRD R-04: telas/cards exclusivos de persona ficam ocultos, não quebrados.

## Acceptance Criteria

1. A página `Meu Perfil` não renderiza o card "Oportunidades de Carreira" para o vendedor atual.
2. O formulário de carreira não permite alterar `carreira_interesse`, `pretensao_min`, `pretensao_max`, `cargos_interesse` ou `cidades_interesse` pela UI enquanto não houver vínculo autônomo canônico.
3. As demais seções do perfil continuam renderizando e salvando sem depender do card de carreira.
4. Existe teste automatizado garantindo que "Oportunidades de Carreira" não aparece no `MeuPerfilVendedor`.
5. Gates obrigatórios da story passam: `npm run lint`, `npm run typecheck`, `npm test`.

## Dev Notes

- Arquitetura ativa: React 19, Vite, TypeScript, React Router, Tailwind 4, Supabase e Bun test. [Source: docs/architecture/system-architecture.md#1-tech-stack]
- Estrutura: código de domínio em `src/features/`, componentes compartilhados em `src/components/`, testes com Bun/Testing Library. [Source: docs/architecture/system-architecture.md#2-estrutura-de-diretorios]
- Padrão de API: hooks fazem queries diretas ao Supabase via client singleton. [Source: docs/architecture/system-architecture.md#3-3-camada-de-api]
- Imports absolutos `@/*` são padrão do projeto e da Constituição AIOX. [Source: .aiox-core/constitution.md#vi-absolute-imports-should]
- `core-config.yaml` referencia `docs/framework/*`, mas esses arquivos não existem; foi usado fallback de arquitetura ativa existente.
- ClickUp/MCP não está habilitado (`mcp.enabled: false`), então esta story foi criada apenas localmente.

## Tasks / Subtasks

- [x] Remover/condicionar render do card "Oportunidades de Carreira" em `MeuPerfilVendedor` (AC: 1, 2).
- [x] Garantir que os campos de carreira não sejam enviados por ação de UI enquanto ocultos (AC: 2, 3).
- [x] Adicionar teste unitário/integração do componente para visibilidade do card (AC: 4).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 5).

## File List

- `docs/stories/story-MX-EV8-20260616-carreira-visibilidade-vendedor.md`
- `src/features/crm/MeuPerfilVendedor.container.tsx`
- `src/features/crm/MeuPerfilVendedor.container.test.tsx`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- CodeRabbit pre-commit não executado: `wsl` e `coderabbit` não estão disponíveis neste ambiente macOS.
- Gates executados: `bun test src/features/crm/MeuPerfilVendedor.container.test.tsx`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`.

### Completion Notes

- Card "Oportunidades de Carreira" removido da renderização atual do Meu Perfil para cumprir EV-8.4 enquanto não existe vínculo autônomo canônico.
- Campos de carreira deixam de ser alteráveis pela UI porque o bloco inteiro fica oculto.
- Teste automatizado cobre a ausência do card e dos campos de carreira, mantendo renderização de seções principais do perfil.
- Validações locais aprovadas: lint, typecheck, teste isolado, suíte completa e build.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-8.4 / EV-12.1.
- 2026-06-16: Implementação concluída e story movida para Ready for Review.
