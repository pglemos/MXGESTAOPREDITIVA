# Story MX-EV8-20260616 - Campos de Maturidade no Perfil do Vendedor

## Status

Ready for Review

## Story

**As a** sistema,
**I want** conhecer tempo de mercado, experiencia declarada e cargo do vendedor,
**so that** a plataforma possa atribuir trilha N1-N4 e calibrar estrategia comercial.

## Source Requirements

- PRD EV-8.2: campos obrigatorios de maturidade no Meu Perfil: tempo de mercado, experiencia declarada e cargo.
- PRD EV-8.2: esses campos alimentam a regra de atribuicao de trilha (EV-5.3).
- PRD EV-8.2: esses campos fazem parte do curriculo/Mercado de Trabalho.
- PRD EV-5.3: trilha automatica por maturidade N1-N4 usa tempo de mercado, experiencia declarada e cargo.

## Acceptance Criteria

1. A tabela `vendedor_perfil` suporta `tempo_mercado_anos`, `experiencia_declarada` e `cargo_atual`, sem quebrar perfis existentes.
2. O hook `useVendedorPerfil` le, edita e persiste os campos de maturidade.
3. O Meu Perfil exibe uma secao editavel de maturidade comercial com os tres campos.
4. O sistema expoe uma derivacao deterministica de nivel N1-N4 para consumo da trilha automatica.
5. Existem testes automatizados para a derivacao N1-N4 e renderizacao da secao no Meu Perfil.
6. Gates obrigatorios da story passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- Arquitetura ativa: React 19, Vite, TypeScript, React Router, Tailwind 4, Supabase e Bun test. [Source: docs/architecture/system-architecture.md#1-tech-stack]
- `vendedor_perfil` e a fonte atual do Meu Perfil; alteracoes devem ser aditivas e preservar RLS existente. [Source: supabase/migrations/20260609170000_vendedor_perfil.sql]
- Campos de maturidade devem ficar no cadastro-base do vendedor, nao em dados de treinamento ou PDI. [Source: docs/prd/modulo-vendedor/08-epic-perfil-comissionamento.md#EV-8.2]
- Imports absolutos `@/*` sao padrao do projeto e da Constituicao AIOX. [Source: .aiox-core/constitution.md#vi-absolute-imports-should]
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.

## Tasks / Subtasks

- [x] Adicionar migration Supabase para campos de maturidade em `vendedor_perfil` (AC: 1).
- [x] Atualizar tipos gerados e contrato de `useVendedorPerfil` (AC: 2).
- [x] Adicionar derivacao N1-N4 consumivel por EV-5.3 (AC: 4).
- [x] Exibir e salvar secao de maturidade comercial no Meu Perfil (AC: 3).
- [x] Adicionar testes automatizados de derivacao e UI (AC: 5).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 6).

## File List

- `docs/stories/story-MX-EV8-20260616-campos-maturidade-perfil.md`
- `src/features/crm/MeuPerfilVendedor.container.tsx`
- `src/features/crm/MeuPerfilVendedor.container.test.tsx`
- `src/features/crm/hooks/useVendedorPerfil.ts`
- `src/features/crm/hooks/useVendedorPerfil.test.ts`
- `src/features/crm/lib/maturidade.ts`
- `src/types/database.generated.ts`
- `supabase/migrations/20260616183000_vendedor_perfil_maturidade.sql`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- CodeRabbit pre-commit nao executado: `wsl` e `coderabbit` nao estao disponiveis neste ambiente macOS.
- Gates executados: `bun test src/features/crm/hooks/useVendedorPerfil.test.ts src/features/crm/MeuPerfilVendedor.container.test.tsx`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`.

### Completion Notes

- `vendedor_perfil` recebeu campos aditivos `tempo_mercado_anos`, `experiencia_declarada` e `cargo_atual`.
- `useVendedorPerfil` le, edita e persiste os novos campos sem quebrar perfis existentes.
- Meu Perfil recebeu secao "Maturidade Comercial" com os tres campos e nivel sugerido N1-N4.
- Regra pura `derivarNivelMaturidadeVendedor` foi criada em `src/features/crm/lib/maturidade.ts` para consumo posterior da trilha automatica EV-5.3.
- Testes automatizados cobrem classificacao N1/N4/calibragem por cargo e renderizacao da secao no Meu Perfil.
- Validacoes locais aprovadas: teste isolado, lint, typecheck, suite completa, build e diff check.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-8.2.
- 2026-06-16: Implementacao concluida e story movida para Ready for Review.
