# Story MX-EV7-20260616 - Autoavaliacao do Vendedor Autonomo no PDI

## Status

Ready for Review

## Story

**As a** vendedor autonomo,
**I want** preencher minhas competencias por autoavaliacao,
**so that** eu tenha PDI mesmo sem um gestor conduzindo a sessao.

## Source Requirements

- PRD EV-7.3: vendedor autonomo preenche formulario de autoavaliacao.
- PRD EV-7.3: para vendedor de loja, as notas continuam vindo do gestor.
- PRD EV-7.3: a fonte da nota registra origem `gestor` vs `autoavaliacao`.
- PRD EV-7.3: autonomo nao altera fluxo de loja.
- PRD EV-7.3: depende de EV-12 para persona autonomo.

## Acceptance Criteria

1. `pdi_avaliacoes_competencia` registra a origem da nota (`gestor` ou `autoavaliacao`).
2. O RPC de criacao de PDI aceita `origem_nota` por avaliacao e preserva default `gestor`.
3. Bundle de PDI aceita vendedor autonomo sem `loja_id` obrigatorio.
4. Existe helper puro para montar payload de autoavaliacao com `origem_nota: autoavaliacao`.
5. `usePDI_MX` le/grava `origem_nota` sem quebrar PDIs antigos.
6. Tela `VendedorPDI` mostra formulario de autoavaliacao apenas para vendedor autonomo.
7. Vendedor de loja nao ve formulario de autoavaliacao e continua no fluxo do gestor.
8. Existem testes automatizados para helper, migration e renderizacao da tela.
9. Gates obrigatorios passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- EV-12.1 ja expõe `vinculoTipo` pelo hook `useVendedorPerfil`.
- `pdi_sessoes.loja_id` ja e nullable, mas o schema client-side exigia `loja_id`.
- `create_pdi_session_bundle` e o ponto de persistencia existente para sessoes PDI.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.
- Arquivos `devLoadAlwaysFiles` e fallbacks definidos em `.aiox-core/core-config.yaml` nao existem neste checkout; usar padroes observados no codigo.

## Tasks / Subtasks

- [x] Criar testes vermelhos para helper e migration (AC: 1-4).
- [x] Atualizar migration/RPC/tipos/hook para origem da nota e loja opcional (AC: 1-5).
- [x] Integrar formulario de autoavaliacao na tela `VendedorPDI` para autonomo (AC: 6-7).
- [x] Adicionar teste de renderizacao da tela para autonomo vs loja (AC: 8).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 9).

## File List

- `docs/stories/story-MX-EV7-20260616-autoavaliacao-autonomo-pdi.md`
- `supabase/migrations/20260616234000_pdi_autoavaliacao_autonomo.sql`
- `src/lib/pdi-self-assessment.ts`
- `src/lib/pdi-self-assessment.test.ts`
- `src/lib/pdi-autoavaliacao-migration.test.ts`
- `src/hooks/usePDI_MX.ts`
- `src/features/pdi/WizardPDI.tsx`
- `src/pages/VendedorPDI.tsx`
- `src/pages/VendedorPDI.test.tsx`
- `src/types/database.generated.ts`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- Arquivos `docs/framework/*` e fallbacks `docs/architecture/padroes-de-codigo.md`, `docs/architecture/pilha-tecnologica.md`, `docs/architecture/arvore-de-origem.md` ausentes no checkout.
- `bun test src/lib/pdi-self-assessment.test.ts src/lib/pdi-autoavaliacao-migration.test.ts` - falhou primeiro por helper/migration ausentes.
- `bun test src/pages/VendedorPDI.test.tsx` - falhou primeiro por formulario de autoavaliacao ausente para autonomo.
- `bun test src/lib/pdi-self-assessment.test.ts src/lib/pdi-autoavaliacao-migration.test.ts src/pages/VendedorPDI.test.tsx` - 8 pass.
- `npm run typecheck` - falhou primeiro porque `WizardPDI` ainda nao enviava `origem_nota`; corrigido com default `gestor`.
- `npm run typecheck` - passou.
- `npm run lint` - passou (`tsc --noEmit`, `lint-tokens-ast`, `eslint`; 509 arquivos escaneados).
- `npm test` - 483 pass.
- `npm run build` - passou (`vite build`).
- `git diff --check` - passou.
- CodeRabbit local indisponivel: `command -v wsl` e `command -v coderabbit` sem resultado.

### Completion Notes

- Migration adiciona `origem_nota` em `pdi_avaliacoes_competencia` com default `gestor` e check `gestor|autoavaliacao`.
- `create_pdi_session_bundle` agora aceita `loja_id` nulo/vazio, arrays vazios para metas/plano e `origem_nota` por avaliacao.
- `usePDI_MX` le e grava `origem_nota`; PDIs antigos caem em `gestor`.
- `WizardPDI` marca explicitamente notas do fluxo de gerente como `gestor`.
- `VendedorPDI` mostra formulario de autoavaliacao apenas para `vinculoTipo=autonomo`; vendedor de loja nao ve o formulario.
- Helper `buildPDISelfAssessmentPayload` monta payload autonomo sem loja e com notas `autoavaliacao`.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-7.3.
- 2026-06-16: Implementada autoavaliacao do autonomo no PDI e validada pelos gates obrigatorios.
