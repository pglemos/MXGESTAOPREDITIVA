# Story MX-EV1-20260616 - Cadastro Rico da Venda

## Status

Ready for Review

## Story

**As a** vendedor,
**I want** registrar os detalhes comerciais da oportunidade,
**so that** funil, faturamento e comissionamento usem dados reais de venda e perda.

## Source Requirements

- PRD EV-1.2: cadastro de venda captura nome, telefone, veiculo, tipo de veiculo, canal, data, carro na troca, sinal, financiamento, venda realizada e motivo da perda.
- PRD EV-1.2: valor/faturamento da venda fica disponivel para o motor de remuneracao.
- PRD EV-1.2: cadastro e opcional no Fechamento e grava na Carteira/CRM, sem duplicar o formulario oficial D-1.
- PRD R-02: KPIs, funil e comissionamento devem vir de dados reais, nao de mocks.

## Acceptance Criteria

1. O cadastro opcional do check-in continua criando cliente na Carteira/CRM sem alterar `lancamentos_diarios`.
2. Quando o cadastro cria oportunidade, ele captura sinal, financiamento, carro na troca, status da negociacao e data de fechamento quando aplicavel.
3. Se a negociacao for marcada como perdida, `motivo_perda` e obrigatorio.
4. Se a negociacao for marcada como venda realizada ou perdida, `closed_at` e persistido a partir da data informada.
5. O hook `useOportunidades.createOportunidade` aceita e persiste `motivo_perda` e `closed_at`, mantendo os campos ja existentes (`valor_negociado`, `sinal`, `financiamento`, `carro_avaliado`, `tipo_veiculo`).
6. Existem testes automatizados para criacao de oportunidade rica e bloqueio de perda sem motivo.
7. Gates obrigatorios da story passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- Arquitetura ativa: React 19, Vite, TypeScript, React Router, Tailwind 4, Supabase e Bun test. [Source: docs/architecture/system-architecture.md#1-tech-stack]
- O formulario oficial D-1 permanece em `CheckinForm` e `lancamentos_diarios`; este slice mexe apenas no bloco opcional de CRM (`CheckinCrmSection`). [Source: docs/prd/modulo-vendedor/01-epic-fechamento.md#EV-1.1]
- `oportunidades` ja possui `sinal`, `financiamento`, `carro_avaliado`, `motivo_perda`, `closed_at` e `tipo_veiculo`; o slice deve expor esses campos no fluxo de criacao. [Source: supabase/migrations/20260609120000_mx_crm_vendedor_foundation.sql]
- Imports absolutos `@/*` sao padrao do projeto e da Constituicao AIOX. [Source: .aiox-core/constitution.md#vi-absolute-imports-should]
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.

## Tasks / Subtasks

- [x] Estender `OportunidadeInput` e payload de `createOportunidade` com `motivo_perda` e `closed_at` (AC: 4, 5).
- [x] Adicionar campos comerciais ricos no cadastro opcional do check-in (AC: 1, 2).
- [x] Validar perda com motivo obrigatorio e fechamento com data obrigatoria (AC: 3, 4).
- [x] Atualizar testes do check-in para oportunidade rica e perda sem motivo (AC: 6).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 7).

## File List

- `docs/stories/story-MX-EV1-20260616-cadastro-rico-venda.md`
- `src/features/checkin/sections/CheckinCrmSection.tsx`
- `src/features/checkin/sections/CheckinCrmSection.test.tsx`
- `src/features/crm/hooks/useOportunidades.ts`
- `src/features/crm/hooks/useOportunidades.test.ts`
- `src/lib/schemas/crm.schema.ts`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- CodeRabbit pre-commit nao executado: `wsl` e `coderabbit` nao estao disponiveis neste ambiente macOS.
- Gates executados: `bun test src/lib/schemas/crm.schema.test.ts src/features/crm/hooks/useOportunidades.test.ts src/features/checkin/sections/CheckinCrmSection.test.tsx`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`.

### Completion Notes

- Cadastro opcional do check-in agora captura sinal, financiamento, carro na troca, status da negociacao, data de venda/perda e motivo de perda quando aplicavel.
- O formulario oficial D-1 em `lancamentos_diarios` foi preservado; os novos dados comerciais sao gravados em `oportunidades`.
- `useOportunidades.createOportunidade` persiste `motivo_perda` e `closed_at` para estados terminais, mantendo `valor_negociado`, `sinal`, `financiamento`, `carro_avaliado` e `tipo_veiculo`.
- Validacoes impedem oportunidade com veiculo/valor sem tipo de veiculo, venda realizada sem valor e perda sem motivo.
- Testes automatizados cobrem payload do hook, criacao de oportunidade rica e bloqueio de perda sem motivo.
- Validacoes locais aprovadas: teste isolado, lint, typecheck, suite completa, build e diff check.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-1.2.
- 2026-06-16: Implementacao concluida e story movida para Ready for Review.
