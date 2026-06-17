# Story MX-EV8-20260616 - Comissionamento Configuravel

## Status

Ready for Review

## Story

**As a** vendedor, gestor ou dono,
**I want** configurar modelos de comissao por venda, percentual, categoria, bonus e equipe,
**so that** a remuneracao estimada use o modelo comercial real da loja ou do autonomo.

## Source Requirements

- PRD EV-8.3: suportar valor fixo por carro.
- PRD EV-8.3: suportar percentual sobre valor vendido/faturamento.
- PRD EV-8.3: suportar categoria de veiculo (`carro`, `moto`, `caminhao`) usando `tipo_veiculo` da venda.
- PRD EV-8.3: suportar bonus por patamar.
- PRD EV-8.3: suportar comissao de equipe pela meta da loja apenas para vendedor de loja.
- PRD EV-8.3: vendedor de loja herda plano RH/dono; autonomo configura o proprio modelo.
- PRD EV-8.3: calculo da tela de Comissao usa valor/faturamento das vendas, nao so contagem.

## Acceptance Criteria

1. Enum/tipos de regra aceitam `percentual_faturamento`, `comissao_categoria` e `comissao_equipe` sem quebrar regras antigas.
2. `remuneracao_regras` registra `tipo_veiculo` opcional para regras de categoria.
3. Motor de remuneracao soma comissao fixa por venda preservando comportamento atual.
4. Motor calcula percentual sobre faturamento vendido.
5. Motor calcula comissao por categoria usando `tipo_veiculo` das vendas.
6. Motor aplica comissao de equipe apenas quando `vinculoTipo=loja` e o patamar da loja foi atingido.
7. Tela/estimativa do vendedor passa detalhes reais de oportunidades ganhas para usar valor negociado e tipo de veiculo.
8. Cadastro de regras permite selecionar os novos modelos e categoria quando aplicavel.
9. Existem testes automatizados para motor e migration.
10. Gates obrigatorios passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- `tipo_veiculo` ja existe em oportunidades pela EV-1.2.
- `useRemuneracaoEstimadaVendedor` hoje calcula por contagem; precisa receber detalhes de vendas.
- `vendedor de loja` vs `autonomo` vem de EV-12.1 (`useVendedorPerfil`).
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.
- Arquivos `devLoadAlwaysFiles` e fallbacks definidos em `.aiox-core/core-config.yaml` nao existem neste checkout; usar padroes observados no codigo.

## Tasks / Subtasks

- [x] Criar testes vermelhos para motor e migration (AC: 1-6, 9).
- [x] Atualizar migration/tipos para novos modelos de regra (AC: 1-2).
- [x] Estender motor de remuneracao para faturamento, categoria e equipe (AC: 3-6).
- [x] Passar oportunidades ganhas para a estimativa do vendedor (AC: 7).
- [x] Atualizar cadastro/listagem de regras para novos modelos (AC: 8).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 10).

## File List

- `docs/stories/story-MX-EV8-20260616-comissionamento-configuravel.md`
- `supabase/migrations/20260616235000_remuneracao_modelos_configuraveis.sql`
- `src/lib/remuneracao-configuravel-migration.test.ts`
- `src/types/database.generated.ts`
- `src/features/remuneracao/lib/comparativo.ts`
- `src/features/remuneracao/lib/comparativo.test.ts`
- `src/features/remuneracao/hooks/useRemuneracao.ts`
- `src/features/remuneracao/components/CadastroRegras.tsx`
- `src/features/remuneracao/MinhaRemuneracaoPage.tsx`
- `src/features/vendedor-home/hooks/useVendedorHomePage.ts`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- Arquivos `docs/framework/*` e fallbacks `docs/architecture/padroes-de-codigo.md`, `docs/architecture/pilha-tecnologica.md`, `docs/architecture/arvore-de-origem.md` ausentes no checkout.
- Testes vermelhos iniciais: `bun test src/features/remuneracao/lib/comparativo.test.ts src/lib/remuneracao-configuravel-migration.test.ts` falhou por migration ausente e campos de comissao configuravel ainda indefinidos.
- Teste focado final: `bun test src/features/remuneracao/lib/comparativo.test.ts src/lib/remuneracao-configuravel-migration.test.ts` - 22 pass.
- `npm run typecheck` - passou.
- `npm run lint` - passou, incluindo token lint em 509 arquivos.
- `npm test` - passou, 488 testes.
- `npm run build` - passou.
- `git diff --check` - passou.
- `command -v wsl` - indisponivel neste ambiente.
- `command -v coderabbit` - indisponivel neste ambiente.

### Completion Notes

- Migration adiciona os modelos `percentual_faturamento`, `comissao_categoria`, `comissao_equipe` e a coluna opcional `tipo_veiculo` em `remuneracao_regras`.
- Motor preserva comissao fixa por venda e soma componentes configuraveis por faturamento, categoria e equipe.
- Comissao de equipe e aplicada apenas para `vinculoTipo=loja` quando o patamar de meta da loja e atingido.
- Estimativa do vendedor passa oportunidades ganhas do mes com `valor_negociado` e `tipo_veiculo` para calculo real de faturamento/categoria.
- Cadastro de regras permite selecionar os novos modelos, meta minima quando aplicavel e categoria de veiculo para regra por categoria.
- Pagina `Minha Remuneracao` mostra resumo/componentes de comissao sem assumir que todo modelo e por venda fixa.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-8.3.
- 2026-06-16: Implementado comissionamento configuravel e validado por testes focados, gates globais e build.
