# Story MX-MGR-20260713-01 — Início gerencial Base44 1:1

## Status

**Em auditoria**

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools:
  - architecture-review
  - bun-test
  - playwright
  - chrome-devtools
```

## Story

**Como** gerente autenticado do MX Performance,
**quero** que a tela Início reproduza integralmente o cockpit de previsibilidade do módulo Base44,
**para que** eu veja os mesmos cards, cálculos, estados, gráficos e fluxos usando os dados reais e o isolamento de loja do Supabase.

## Contexto e precedência

- Story filha do epic `docs/stories/epics/epic-modulo-gerencial-base44-rebuild.md`.
- O usuário aprovou em 2026-07-13 a reconstrução vertical tela por tela.
- O ZIP `/Users/pedroguilherme/Downloads/mx-gerente.zip` e a aplicação autenticada `https://mx-gerente.base44.app` são o contrato observável.
- O Base44 vence em composição, fórmulas, labels, estados e fluxos; React/Auth/Supabase/RLS permanecem infraestrutura.
- O sidebar escuro atual é a única exceção visual, com alteração apenas dos ícones de Rotina do Dia e Mentor Gerencial.
- Esta story não depende de outra story gerencial filha. Ela estabelece o padrão reutilizável para as nove telas seguintes.

## Acceptance Criteria

1. `/home` renderiza o cockpit Base44 sem segundo router, AuthProvider ou sidebar, preservando o sidebar escuro atual.
2. O cabeçalho reproduz título, subtítulo, dia da semana, data extensa, data `DD/MM/YYYY`, seletor de unidade apenas quando houver múltiplas lojas e as ações `Ver Meta da Loja`, `Ver Rotina do Dia` e atualizar.
3. A data da tela e das consultas do Início usa o dia civil atual em `America/Sao_Paulo`; não herda a virada operacional de fechamento às 12h e não exibe seletor de data editável quando a referência exibe apenas a data.
4. As fórmulas do ZIP são portadas sem reinterpretação:
   - `AGENDAMENTOS_POR_VENDA = 3`;
   - previsão = agendamentos confirmados de hoje ÷ 3, preservando uma casa decimal quando necessário;
   - necessidade = `max(ceil(metaMensal / diasUteisMes) - vendasHoje, 0)` e `null` sem meta;
   - `diasUteisMes` usa o valor equivalente persistido e, enquanto esse contrato não existir, o default Base44 de 22;
   - meta de agendamentos = `ceil(necessidade × 3)`;
   - gap = confirmados − meta de agendamentos;
   - cobertura, mensagem da Leitura do Dia e Ação sugerida seguem todas as ramificações de `dashboardPrevisibilidade.js`.
5. Os quatro cards reproduzem a referência nos estados com dados, zero, meta ausente, necessidade atendida, gap negativo, zero e positivo, incluindo pluralização e formatação decimal.
6. `Equipe em foco` mostra no máximo cinco vendedores, na ordenação Base44, com avatar/iniciais, agendamentos, projeção, realizado no mês, próxima faixa, carros faltantes e status; não inventa regra de remuneração ausente.
7. O desktop usa a tabela Base44 e o mobile usa cards Base44. Clique no vendedor e `Ver toda a equipe` abrem Minha Equipe; este último só aparece quando a unidade possui mais de cinco vendedores.
8. `Radar Financeiro da Equipe` reproduz exatamente os três indicadores e seus estados configurado/não configurado, sem texto substituto criado pela implementação MX atual.
9. `Agendamentos por Vendedor` usa gráfico horizontal equivalente ao Recharts do ZIP, ordenado de forma decrescente; clique numa barra abre Rotina da Equipe com o vendedor na busca.
10. Antes de toda navegação do cockpit, `mx_contexto_navegacao` registra `origemNavegacao: DASHBOARD_GERENCIAL`, data, unidade e timestamp; as telas de destino podem retornar ao Início consumindo esse contexto.
11. Loading, vazio, erro, ausência de loja, ausência de vendedores, ausência de meta e ausência de dados financeiros são distintos e reproduzem o conteúdo Base44 sem números fictícios.
12. O ícone de Rotina do Dia no sidebar é `CalendarClock` e o de Mentor Gerencial é `BrainCircuit`; nenhum outro elemento do sidebar muda.
13. A tela passa por testes unitários das fórmulas/ordenação, testes de componente das interações e E2E autenticado das ações.
14. Paridade visual e funcional é comprovada no Chrome em `1440×900`, `768×1024` e `390×844`, sem captura de loading, sem overflow horizontal e sem erro de console ou resposta 4xx/5xx causada pela story.
15. `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam antes do handoff para QA.

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `.aiox-core/core-config.yaml`.
> Quality validation will use the manual review process and the existing repository command when available.

## Tasks / Subtasks

- [x] 1. Fixar o baseline e o contrato do Início (AC: 1–14)
  - [x] Comparar código do ZIP, árvore acessível e captura autenticada Base44 × produção.
  - [x] Registrar medidas e estados nos artefatos de auditoria visual.
- [x] 2. Portar o domínio de previsibilidade Base44 para funções puras TypeScript (AC: 3–6, 8)
  - [x] Portar formatação, pluralização, previsão, necessidade, meta, gap, cobertura, mensagens, ação sugerida, status financeiro e ordenação.
  - [x] Cobrir todas as ramificações e bordas com testes unitários co-localizados.
- [x] 3. Implementar o adaptador Supabase do Início (AC: 2–11)
  - [x] Mapear loja, meta, vendedores e fechamentos do dia/mês sem SDK Base44.
  - [x] Separar data civil gerencial da data operacional do fechamento.
  - [x] Manter membership/RLS como autorização efetiva e distinguir erro/vazio/sem vínculo.
- [x] 4. Reconstruir os componentes visuais e responsivos (AC: 1–9, 11)
  - [x] Cabeçalho e atalhos.
  - [x] Quatro cards de previsibilidade.
  - [x] Leitura do Dia e Ação sugerida.
  - [x] Equipe em foco desktop/mobile.
  - [x] Radar Financeiro e gráfico Recharts horizontal clicável.
- [x] 5. Reproduzir navegação e retorno contextual (AC: 7, 9, 10)
  - [x] Persistir o contrato `mx_contexto_navegacao` antes das navegações.
  - [x] Validar Meta, Rotina do Dia, Minha Equipe e Rotina da Equipe como destinos.
- [x] 6. Corrigir somente os dois ícones autorizados do sidebar (AC: 12)
- [x] 7. Validar e fechar a story (AC: 13–15)
  - [x] Rodar unitários/componentes, lint, typecheck, suíte completa e build.
  - [x] Rodar E2E autenticado em três viewports.
  - [x] Capturar Base44, ambiente local estabilizado e produção na mesma geometria.
  - [x] Atualizar checkboxes, Dev Agent Record, File List e QA Results.

## Dev Notes

### Fontes normativas

- `docs/architecture/MODULO_GERENCIAL_BASE44_MIGRATION.md#decisão`: Base44 é o contrato observável; Supabase/RLS são a plataforma de persistência e autorização.
- `docs/architecture/MODULO_GERENCIAL_BASE44_MIGRATION.md#padrão-de-adaptação`: entrega vertical com inspeção, adaptador, testes e Chrome.
- `docs/architecture/MODULO_GERENCIAL_DATA_MAPPING.md#regra-de-transformação`: fontes MX não autorizam fórmulas divergentes.
- `/tmp/mx-gerente-reference-20260713/src/pages/Inicio.jsx`: orquestração, consultas, contexto e navegação da referência extraída.
- `/tmp/mx-gerente-reference-20260713/src/lib/dashboardPrevisibilidade.js`: fórmulas e ramificações normativas.
- `/tmp/mx-gerente-reference-20260713/src/components/inicio/previsibilidade/`: componentes e estados visuais normativos.
- `output/playwright/manager-parity/reference/01-inicio-desktop.png`: captura Base44 estabilizada.
- `output/playwright/manager-parity/production/01-inicio-desktop.png`: captura da produção anterior à story.

### Integração e estrutura

- React 19, TypeScript estrito, Vite, Tailwind v4, Recharts e Lucide já pertencem ao stack. [Source: `docs/architecture/00-overview.md#tech-stack-alignment`]
- Componentes complexos podem consumir hooks; componentes de apresentação recebem dados e callbacks, sem Supabase direto. [Source: `docs/architecture/01-component-arch.md#atomic-design-layer-definitions`]
- Estado remoto e estado de UI devem permanecer separados; filtros e toggles continuam locais. [Source: `docs/architecture/02-data-layer.md#server-state-vs-client-state`]
- A integração deve ser incremental e independente por story. [Source: `docs/architecture/00-overview.md#integration-approach`]
- Pontos atuais de adaptação: `src/features/dashboard-loja/sections/ManagerSellerParityHome.tsx`, `src/features/dashboard-loja/hooks/useDashboardLojaData.ts`, `src/features/dashboard-loja/DashboardLoja.container.tsx` e `src/components/Layout.tsx`.

### Diferenças já comprovadas

- Produção usa data operacional anterior antes das 12h; Base44 usa a data civil atual.
- Produção calcula necessidade pelo saldo mensal dividido por dias restantes; Base44 calcula a meta diária e desconta vendas do dia.
- Produção arredonda a previsão para baixo; Base44 preserva decimal.
- Produção mostra data editável, até oito vendedores, radar resumido e gráfico vertical customizado; Base44 mostra data fixa, cinco vendedores, radar em três linhas e gráfico Recharts horizontal clicável.

### Testing

- Testes unitários e de componente ficam co-localizados; organismos cobrem interações-chave. [Source: `docs/architecture/04-testing-deploy.md#unit-tests-for-new-components`]
- E2E deve cobrir os fluxos por papel e ações críticas. [Source: `docs/architecture/04-testing-deploy.md#integration-tests`]
- Gates obrigatórios: typecheck, lint, testes e build. [Source: `docs/architecture/04-testing-deploy.md#verification-steps-per-story`]
- A validação visual precisa usar conteúdo carregado e o Chrome real, não inferência por DOM ou código.

## Project Structure Notes

- Preferir `src/features/manager/home/` para domínio e componentes específicos da tela; manter o container `dashboard-loja` apenas como resolução de loja/rota.
- Não importar arquivos de `/tmp` ou `/Users/pedroguilherme/Downloads` no bundle; eles são somente fonte normativa de portabilidade.
- Não criar schema/migration nesta story sem auditoria que comprove ausência de contrato persistente equivalente.

## Story Draft Checklist

| Categoria | Status | Observação |
|---|---|---|
| Goal & Context Clarity | PASS | Resultado observável, valor e relação com o epic definidos. |
| Technical Implementation Guidance | PASS | Fórmulas, arquivos, integrações e estados identificados. |
| Reference Effectiveness | PASS | Fontes específicas e diferenças comprovadas resumidas. |
| Self-Containment Assessment | PASS | Precedência, exceções, bordas e estados incluídos. |
| Testing Guidance | PASS | Unitário, componente, E2E, Chrome e gates mensuráveis. |
| CodeRabbit Integration | N/A | Desativado no core-config; revisão manual permanece. |

**Readiness:** READY — clareza 10/10; sem dependência bloqueante conhecida.

## Change Log

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-07-13 | 1.0 | Story criada após aprovação do contrato Base44 1:1. | River (@sm) |
| 2026-07-13 | 1.0.1 | Validated GO (10/10) — Status: Draft → Ready. | Pax (@po) |
| 2026-07-13 | 1.1.0 | Development started (yolo mode) — Status: Ready → InProgress. | Dex (@dev) |
| 2026-07-13 | 1.2.0 | Development complete — Status: InProgress → InReview. | Dex (@dev) |
| 2026-07-13 | 1.2.1 | QA Gate PASS — Status: InReview → Done. | Quinn (@qa) |
| 2026-07-14 | 1.3.0 | Correção de paridade: Início voltou a usar a constante Base44 de 3 agendamentos por venda, meta diária sobre vendas do dia e default de 22 dias úteis. | Dex (@dev) |

## Dev Agent Record

### Agent Model Used

OpenAI Codex (GPT-5)

### Debug Log References

- RED: `bun test src/features/manager/home/manager-home-refresh.test.ts` falhou com `Expected: "function" / Received: "undefined"`; GREEN final com 18 testes e 77 assertions.
- Regressão completa: `npm test` — 852 testes, 2748 assertions, zero falhas.
- Gates: `npm run lint` (0 erros; 22 warnings preexistentes fora da story), `npm run typecheck`, `npm run build` (4985 módulos) e `git diff --check` passaram.
- Chrome real autenticado: refresh exibiu `Performance sincronizada!`; consultas diária, mensal, vendedores, meta e configuração responderam HTTP 200; console sem mensagens de erro/warn/issue.
- Auditoria final sem overflow/loading em `1440×900`, `768×1024` e `390×844`: `output/playwright/manager-parity/local/08-inicio-final-desktop-1440x900.png`, `09-inicio-final-tablet-768x1024.png` e `10-inicio-final-mobile-390x844.png`.
- CodeRabbit CLI 0.6.5 encerrou as duas tentativas sem findings persistidos nem veredito final; revisão manual completa e gates locais foram usados como fallback.

### Completion Notes List

- Cockpit Base44 reconstruído sobre o shell atual, incluindo quatro cards, Leitura do Dia, Ação sugerida, Equipe em foco, Radar Financeiro e Recharts horizontal clicável.
- Fórmulas e mensagens foram isoladas em funções TypeScript e preservam a data civil de `America/Sao_Paulo`, o default de 22 dias úteis e todas as ramificações normativas do ZIP.
- Adaptador Supabase separa consultas diária/mensal, mantém RLS/membership e atualiza todas as cinco fontes do Início sem SDK Base44 ou dados fictícios.
- Navegação persiste `mx_contexto_navegacao`; Meta, Rotina do Dia, Minha Equipe e Rotina da Equipe oferecem retorno contextual, e o gráfico hidrata `?busca=` com o vendedor clicado.
- Sidebar escuro foi preservado; somente os ícones autorizados foram confirmados como `CalendarClock` e `BrainCircuit`.
- QA Results permanece reservado ao `@qa`; a caixa administrativa correspondente registra que o handoff foi preparado, não um veredito antecipado.

### File List

- `.ai/decision-log-MX-MGR-20260713-01.md`
- `.ai/story-validation-MX-MGR-20260713-01.json`
- `docs/architecture/MODULO_GERENCIAL_BASE44_MIGRATION.md`
- `docs/architecture/MODULO_GERENCIAL_DATA_MAPPING.md`
- `docs/stories/epics/epic-modulo-gerencial-base44-rebuild.md`
- `docs/stories/story-MX-MGR-20260713-01-inicio-base44-1x1.md`
- `src/features/dashboard-loja/DashboardLoja.container.tsx`
- `src/features/dashboard-loja/hooks/useDashboardLojaData.ts`
- `src/features/dashboard-loja/sections/ManagerSellerParityHome.test.tsx`
- `src/features/dashboard-loja/sections/ManagerSellerParityHome.tsx`
- `src/features/dashboard-loja/sections/PerformanceTab.tsx`
- `src/features/manager/day-routine/ManagerDayRoutine.container.tsx`
- `src/features/manager/home/ManagerHomeReturnLink.test.tsx`
- `src/features/manager/home/ManagerHomeReturnLink.tsx`
- `src/features/manager/home/manager-home-parity.test.ts`
- `src/features/manager/home/manager-home-parity.ts`
- `src/features/manager/home/manager-home-refresh.test.ts`
- `src/features/manager/home/manager-home-refresh.ts`
- `src/features/manager/meta/ManagerStoreGoalReference.tsx`
- `src/features/manager/team-routine/ManagerTeamRoutine.container.tsx`
- `src/features/manager/team/ManagerTeamPerformance.tsx`
- `src/index.css`
- `src/lib/charts/tokens.ts`

## QA Results

### Review Date: 2026-07-13

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

Implementação coesa e rastreável ao ZIP/Base44, com domínio puro separado da apresentação, adaptador Supabase sem SDK paralelo, navegação contextual isolada e uso correto do shell/RLS existentes. A revisão profunda foi exigida pelo tamanho do diff e pelos 15 ACs; nenhum defeito alto ou médio permaneceu.

### Requirements Traceability

| AC | Evidência principal | Resultado |
|---|---|---|
| 1 | `DashboardLoja.container.tsx`, componente e Chrome autenticado | PASS |
| 2 | Cabeçalho/ações no componente e três capturas finais | PASS |
| 3 | `getManagerCalendarDate`, range diário observado em 13/07 e ausência de date input | PASS |
| 4 | `manager-home-parity.test.ts` cobre fórmulas e ramificações normativas | PASS |
| 5 | Teste de componente + estados explícitos dos quatro cards | PASS |
| 6 | Ordenação pura, limite de cinco e realizado mensal testados | PASS |
| 7 | Tabela/cards responsivos e navegação real para Minha Equipe | PASS |
| 8 | Três indicadores e estado sem regra reproduzidos no Chrome | PASS |
| 9 | Recharts horizontal, ordenação e clique real com `?busca=Daniel%20Santos` | PASS |
| 10 | Contexto/retorno cobertos por teste e cliques reais nos quatro destinos | PASS |
| 11 | Loading, erro, sem loja, sem vendedor, sem meta e sem financeiro têm branches distintos | PASS |
| 12 | Sidebar preservado; `CalendarClock` e `BrainCircuit` confirmados no Chrome | PASS |
| 13 | Unitário, componente e E2E autenticado executados | PASS |
| 14 | Chrome em 1440×900, 768×1024 e 390×844, sem loading/overflow/console | PASS |
| 15 | lint, typecheck, 852 testes, build e diff check passaram | PASS |

### Test Architecture Assessment

- Domínio: funções puras com cobertura de data civil, fórmulas, mensagens, status e ordenação.
- Integração: refresh das cinco fontes provado em RED/GREEN e confirmado por requests HTTP 200.
- Componente: estados sem loja, fórmulas, limite da equipe e persistência de contexto.
- E2E/manual: ações, retorno, busca do gráfico, responsividade e console em Chrome real autenticado.

### Refactoring Performed

Nenhum refactor adicional pelo QA. O patch já estava mínimo e os gates permaneceram verdes.

### Compliance Check

- Coding Standards: ✓ lint com zero erros; cores Recharts centralizadas em tokens.
- Project Structure: ✓ domínio e componentes no feature scope previsto.
- Testing Strategy: ✓ 18 testes focados/77 assertions e regressão completa de 852/2748.
- All ACs Met: ✓ AC 1–15 sem gap.
- File List: ✓ correspondência exata com o diff apresentado ao QA.

### Security Review

Secret scan sem matches; nenhuma credencial, nova dependência, migration ou variável de ambiente foi persistida. O contexto em sessionStorage é apenas UX e toda leitura continua escopada por membership/RLS.

### Performance and Reliability

Consultas diária/mensal são escopadas, o refresh usa paralelismo, o build passou e os três viewports não apresentam overflow. Erros de query/refresh preservam estados e feedback já existentes.

### Tooling Notes

CodeRabbit CLI 0.6.5 encerrou em `summarizing` sem veredito/findings nas tentativas do Dev e do QA; code intelligence não possui provider configurado. Ambos foram tratados como indisponíveis, nunca como aprovação, e substituídos por revisão manual, testes, secret scan e Chrome real.

### Files Modified During Review

- `docs/qa/gates/MX-MGR-20260713-01-inicio-base44-1x1.yml`
- `docs/stories/story-MX-MGR-20260713-01-inicio-base44-1x1.md` (QA Results, gate lifecycle)

### Gate Status

Gate: PASS → `docs/qa/gates/MX-MGR-20260713-01-inicio-base44-1x1.yml`

### Recommended Status

✓ Ready for Done. Publicação e smoke autenticado pós-deploy seguem com `@devops`.
