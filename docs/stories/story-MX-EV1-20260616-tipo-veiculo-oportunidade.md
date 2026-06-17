# Story MX-EV1-20260616 - Tipo de Veiculo em Oportunidades

## Status

Ready for Review

## Story

**As a** vendedor,
**I want** registrar o tipo de veiculo da oportunidade,
**so that** o sistema consiga aplicar regras de comissionamento por categoria da loja.

## Source Requirements

- PRD EV-1.2: cadastro de venda captura tipo de veiculo (carro/moto/caminhao).
- PRD EV-1.2: valor/faturamento da venda fica disponivel para o motor de remuneracao.
- PRD EV-1.2: campo "tipo de veiculo" habilita comissionamento por categoria (ver EV-8).
- PRD R-02: KPIs e comissionamento nao podem depender de mock fixo ou dado inventado.

## Acceptance Criteria

1. A tabela `oportunidades` suporta o campo `tipo_veiculo` com valores `carro`, `moto` e `caminhao`, sem quebrar registros existentes.
2. O contrato TypeScript/Zod de oportunidades aceita e normaliza `tipo_veiculo`.
3. A criacao de oportunidade pelo hook `useOportunidades` persiste `tipo_veiculo`.
4. O formulario opcional de novo cliente no check-in captura `tipo_veiculo` quando cria uma oportunidade.
5. Se o vendedor informar veiculo ou valor negociado no check-in, a oportunidade so e criada com `tipo_veiculo` informado.
6. Existem testes automatizados para o contrato Zod e para o fluxo UI de check-in criando oportunidade com `tipo_veiculo`.
7. Gates obrigatorios da story passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- Arquitetura ativa: React 19, Vite, TypeScript, React Router, Tailwind 4, Supabase e Bun test. [Source: docs/architecture/system-architecture.md#1-tech-stack]
- Estrutura: codigo de dominio em `src/features/`, schemas compartilhados em `src/lib/schemas/`, tipos Supabase em `src/types/database.generated.ts`. [Source: docs/architecture/system-architecture.md#2-estrutura-de-diretorios]
- Padrao de API: hooks fazem queries diretas ao Supabase via client singleton. [Source: docs/architecture/system-architecture.md#3-3-camada-de-api]
- Imports absolutos `@/*` sao padrao do projeto e da Constituicao AIOX. [Source: .aiox-core/constitution.md#vi-absolute-imports-should]
- `core-config.yaml` referencia `docs/framework/*`, mas esses arquivos nao existem; foi usado fallback de arquitetura ativa existente.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.

## Tasks / Subtasks

- [x] Adicionar migration Supabase para `crm_tipo_veiculo` e coluna `oportunidades.tipo_veiculo` (AC: 1).
- [x] Atualizar tipos gerados e schema Zod de oportunidades (AC: 2).
- [x] Persistir `tipo_veiculo` em `useOportunidades.createOportunidade` (AC: 3).
- [x] Adicionar seletor `Tipo de veiculo` no check-in e validar oportunidade com veiculo/valor (AC: 4, 5).
- [x] Adicionar testes automatizados de schema e UI (AC: 6).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 7).

## File List

- `docs/stories/story-MX-EV1-20260616-tipo-veiculo-oportunidade.md`
- `src/features/checkin/sections/CheckinCrmSection.tsx`
- `src/features/checkin/sections/CheckinCrmSection.test.tsx`
- `src/features/crm/hooks/useOportunidades.ts`
- `src/lib/schemas/crm.schema.ts`
- `src/lib/schemas/crm.schema.test.ts`
- `src/types/database.generated.ts`
- `supabase/migrations/20260616171000_oportunidades_tipo_veiculo.sql`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- CodeRabbit pre-commit nao executado: `wsl` e `coderabbit` nao estao disponiveis neste ambiente macOS.
- Gates executados: `bun test src/lib/schemas/crm.schema.test.ts src/features/checkin/sections/CheckinCrmSection.test.tsx`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`.

### Completion Notes

- Criado enum Supabase `crm_tipo_veiculo` e coluna nullable `oportunidades.tipo_veiculo` para preservar oportunidades antigas.
- Schema Zod e tipos Supabase aceitam `carro`, `moto` e `caminhao`, normalizando ausencia para `null`.
- `useOportunidades.createOportunidade` persiste `tipo_veiculo`.
- Check-in captura `Tipo de veiculo` e bloqueia criacao de oportunidade com veiculo/valor sem categoria.
- Testes automatizados cobrem contrato Zod e fluxo UI criando oportunidade com `tipo_veiculo`.
- Validacoes locais aprovadas: teste isolado, lint, typecheck, suite completa, build e diff check.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-1.2.
- 2026-06-16: Implementacao concluida e story movida para Ready for Review.
