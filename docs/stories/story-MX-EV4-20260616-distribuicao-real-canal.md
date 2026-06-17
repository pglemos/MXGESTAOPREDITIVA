# Story MX-EV4-20260616 - Distribuicao Real por Canal no Funil

## Status

Ready for Review

## Story

**As a** vendedor,
**I want** que o funil calcule a estrategia por canal com base no meu mix real de vendas ou no mix manual do perfil,
**so that** eu saiba onde concentrar energia para bater a meta sem ver canais que a loja nao opera.

## Source Requirements

- PRD EV-4.2: Calcular distribuicao de vendas por canal nos ultimos 3 meses.
- PRD EV-4.2: "O que falta" deve ser ponderado pelo canal mais forte, nao fixo.
- PRD EV-4.2: Perfil pode ter override manual de percentual por porta/internet/carteira.
- PRD EV-4.2: Usar oportunidades ganhas por canal e periodo.
- PRD EV-4.3: Canais sem operacao devem ser ocultados do funil.
- PRD EV-4.3: Canais ativos podem vir da configuracao ou da distribuicao inferida.
- Prompt visual 2026-06-17: Internet, Carteira e Porta devem aparecer sempre; canal sem dados deve mostrar estado controlado, nao sumir.

## Acceptance Criteria

1. Existe helper puro para normalizar canais de estrategia do funil (`internet`, `carteira`, `porta/showroom`).
2. Vendas ganhas dos ultimos 3 meses geram distribuicao percentual por canal.
3. Vendas fora da janela de 3 meses ou sem etapa `ganho` nao entram no mix.
4. O plano "o que falta" distribui as vendas faltantes conforme o mix real ou manual.
5. Canais com 0% no mix real/manual ficam ocultos quando existe mix ativo.
6. Sem mix real/manual, o funil mantem fallback com todos os canais para nao deixar o vendedor sem plano.
7. O perfil do vendedor permite salvar mix manual de internet, carteira e porta/showroom.
8. A tela de Funil renderiza cards dinamicos e insights usando a estrategia ponderada.
9. Existem testes automatizados para helper, migration e renderizacao basica do Funil.
10. Gates obrigatorios passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Addendum 2026-06-17

- O prompt visual de 2026-06-17 substitui o AC-5 original para a UI do vendedor: canais com 0% ou sem dados nao ficam ocultos; devem permanecer visiveis com orientacao operacional e CTA.
- A tela passa a responder decisao comercial completa: o que falta para bater meta, ritmo atual, canal prioritario, volume necessario por canal, gargalo principal e acoes para Central de Execucao.

## Dev Notes

- `FunilVendedor.container.tsx` ja calcula benchmark por canal, mas de forma fixa.
- `showroom` deve ser consolidado como `porta`, seguindo o mesmo criterio da cadencia.
- `vendedor_perfil` ja concentra configuracoes pessoais do vendedor.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.

## Tasks / Subtasks

- [x] Criar helper puro de distribuicao e plano ponderado do funil (AC: 1-6).
- [x] Adicionar campos de mix manual no perfil, migration e tipos gerados (AC: 7).
- [x] Integrar helper na tela de Funil e ocultar canais inativos (AC: 5, 8).
- [x] Adicionar testes do helper, migration, Funil e Perfil (AC: 9).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 10).

## File List

- `docs/stories/story-MX-EV4-20260616-distribuicao-real-canal.md`
- `supabase/migrations/20260616214000_vendedor_perfil_mix_canais_funil.sql`
- `src/features/crm/lib/funil.ts`
- `src/features/crm/lib/funil.test.ts`
- `src/features/crm/FunilVendedor.container.tsx`
- `src/features/crm/FunilVendedor.container.test.tsx`
- `src/features/crm/CentralExecucao.container.tsx`
- `src/features/crm/MeuPerfilVendedor.container.tsx`
- `src/features/crm/MeuPerfilVendedor.container.test.tsx`
- `src/features/crm/hooks/useVendedorPerfil.ts`
- `src/lib/vendedor-perfil-mix-canais-migration.test.ts`
- `src/types/database.generated.ts`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- `bun test src/features/crm/lib/funil.test.ts src/lib/vendedor-perfil-mix-canais-migration.test.ts src/features/crm/FunilVendedor.container.test.tsx src/features/crm/MeuPerfilVendedor.container.test.tsx` - 10 pass.
- `npm run typecheck` - passou.
- `npm run lint` - passou (`tsc --noEmit`, `lint-tokens-ast`, `eslint`).
- `bun test src/features/crm/CentralExecucao.container.test.tsx` - 2 pass.
- `npm test` - 537 pass, 0 fail.
- `npm run build` - passou (`vite build`).
- `git diff --check` - passou.
- Validação visual Playwright em `http://localhost:3001/meu-funil` - passou com captura final em `funil-validacao-final-alinhada.png` (`1728x1296`, proporcional ao anexo `1448x1086`).
- CodeRabbit local indisponivel: `command -v wsl` e `command -v coderabbit` sem resultado.

### Change Log Update — 2026-06-17

- 2026-06-17: Funil de Vendas realinhado ao mock/briefing operacional. Mantidos os 3 cards superiores, criado card horizontal "Plano para Bater sua Meta", Internet/Carteira/Porta sempre visiveis, periodo selecionavel, cards de destaque/assistente/gargalo e CTAs para `/central-execucao` com origem Funil de Vendas. Teste do container atualizado para validar canal sem dados visivel. Internet usa tom azul (`status-info`), Carteira laranja e Porta verde, conforme referencia visual. Gates finais executados: `npm run typecheck`, `npm run lint`, `bun test src/features/crm/FunilVendedor.container.test.tsx`, `bun test src/features/crm/CentralExecucao.container.test.tsx`, `npm test` e `npm run build`. Captura visual local da hierarquia em `funil-validacao-final-alinhada.png`.
- 2026-06-17: Ajuste visual adicional para aproximar do anexo final: CTA principal "Gerar plano na Central de Execução" usa o verde escuro institucional (`brand-secondary`) e o teste do Funil cobre o cenário visual de topo do mock (60% da meta, R$ 8.450 realizado, R$ 12.000 projetado e R$ 3.550 faltante).

### Completion Notes

- `funil.ts` consolida `showroom` como `porta`, calcula vendas ganhas dos ultimos 3 meses e retorna mix percentual por canal.
- O plano do funil usa mix manual do perfil quando informado; caso contrario usa historico real; sem mix disponivel mantem fallback com todos os canais.
- Na UI do vendedor, Internet, Carteira e Porta permanecem visiveis mesmo com 0% ou sem dados, exibindo estado controlado, base de calculo e CTA para a Central de Execucao.
- `Meu Perfil` ganhou a secao "Mix de Canais" com percentuais opcionais para Internet, Carteira e Porta/Showroom.
- Migration adiciona `mix_canal_internet_pct`, `mix_canal_carteira_pct` e `mix_canal_porta_pct` em `vendedor_perfil` com faixa 0-100.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-4.2 e EV-4.3.
- 2026-06-16: Implementada distribuicao real/manual por canal no Funil e validada pelos gates obrigatorios.
