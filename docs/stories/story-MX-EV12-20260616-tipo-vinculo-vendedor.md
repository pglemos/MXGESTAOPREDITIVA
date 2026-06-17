# Story MX-EV12-20260616 - Tipo de Vinculo do Vendedor

## Status

Ready for Review

## Story

**As a** sistema,
**I want** distinguir vendedor de loja de vendedor autonomo,
**so that** regras de visibilidade, feedback, PDI, score e comissionamento possam seguir o contexto correto.

## Source Requirements

- PRD EV-12.1: atributo de vinculo `loja` vs `autonomo`.
- PRD EV-12.1: vinculo governa comissionamento, feedback, PDI, carreira/mercado e refinamento de score.
- PRD EV-12.1: telas exclusivas de um lado ficam ocultas para o outro, sem quebrar navegacao.
- PRD EV-12.1: definir fonte canonica do vinculo em `usuarios`/`vendedor_perfil` ou derivada do vinculo de loja.

## Acceptance Criteria

1. Existe fonte canonica persistida para `vinculo_tipo` do vendedor.
2. O sistema suporta os valores `loja` e `autonomo`.
3. Existe helper puro que resolve o vinculo efetivo quando o perfil ainda nao tem valor persistido.
4. Vendedor com vinculo de loja permanece sem telas exclusivas de autonomo.
5. Vendedor autonomo passa a ver a area de carreira/mercado no perfil.
6. O hook `useVendedorPerfil` expoe o vinculo efetivo para telas consumidoras.
7. Existem testes automatizados para helper, migration e renderizacao do perfil.
8. Gates obrigatorios passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- `vendedor_perfil` ja e a fonte de preferencias pessoais do vendedor e possui RLS por dono/gestao.
- `vinculos_loja`/`activeStoreId` seguem como sinais de fallback quando `vinculo_tipo` ainda nao existe.
- Assinatura avulsa e migracao de dados continuam em EV-12.2/EV-12.3 futuro.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.

## Tasks / Subtasks

- [x] Criar migration e tipagem para `vinculo_tipo` em `vendedor_perfil` (AC: 1-2).
- [x] Criar helper puro de resolucao/visibilidade por vinculo (AC: 3-5).
- [x] Expor `vinculoTipo` pelo hook de perfil (AC: 6).
- [x] Condicionar a area de carreira/mercado do perfil ao vinculo autonomo (AC: 4-5).
- [x] Adicionar testes e rodar gates (AC: 7-8).

## File List

- `docs/stories/story-MX-EV12-20260616-tipo-vinculo-vendedor.md`
- `supabase/migrations/20260616222000_vendedor_perfil_vinculo_tipo.sql`
- `src/features/crm/lib/vinculo-vendedor.ts`
- `src/features/crm/lib/vinculo-vendedor.test.ts`
- `src/features/crm/hooks/useVendedorPerfil.ts`
- `src/features/crm/MeuPerfilVendedor.container.tsx`
- `src/features/crm/MeuPerfilVendedor.container.test.tsx`
- `src/lib/vendedor-perfil-vinculo-tipo-migration.test.ts`
- `src/types/database.generated.ts`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- `bun test src/features/crm/lib/vinculo-vendedor.test.ts src/lib/vendedor-perfil-vinculo-tipo-migration.test.ts src/features/crm/MeuPerfilVendedor.container.test.tsx` - 8 pass.
- `npm run typecheck` - passou.
- `npm run lint` - passou (`tsc --noEmit`, `lint-tokens-ast`, `eslint`).
- `npm test` - 469 pass.
- `npm run build` - passou (`vite build`).
- `git diff --check` - passou.
- CodeRabbit local indisponivel: `command -v wsl` e `command -v coderabbit` sem resultado.

### Completion Notes

- Migration adiciona enum `vendedor_vinculo_tipo` (`loja`, `autonomo`) e coluna `vinculo_tipo` em `vendedor_perfil`, com default `loja`.
- `vinculo-vendedor.ts` centraliza resolucao do vinculo efetivo e visibilidades de carreira/feedback.
- `useVendedorPerfil` expoe `vinculoTipo` efetivo, preservando fallback por loja ativa/vinculos quando o perfil ainda nao tem valor persistido.
- `Meu Perfil` mostra badge do vinculo e mantem "Oportunidades de Carreira" oculta para vendedor de loja.
- Para vendedor autonomo, a area de carreira/mercado fica visivel e salva pelos campos existentes do perfil.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-12.1.
- 2026-06-16: Implementada fonte canonica de vinculo do vendedor e validada pelos gates obrigatorios.
