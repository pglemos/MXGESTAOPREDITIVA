# Story MX-MGR-20260713-03 — Fechamento Diário Base44 1:1

## Status

**In Progress**

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools:
  - bun-test
  - playwright
  - chrome-devtools
  - supabase-contract-review
```

## Story

**Como** gerente autenticado do MX Performance,
**quero** que `/fechamento-diario` reproduza integralmente o Fechamento Diário do Base44,
**para que** eu acompanhe envios, pendências, regularizações, leads, disciplina e histórico com os mesmos estados e fluxos usando dados reais.

## Contexto e precedência

- Story filha do epic `docs/stories/epics/epic-modulo-gerencial-base44-rebuild.md` e sucessora da vertical Rotina do Dia.
- O ZIP `/Users/pedroguilherme/Downloads/mx-gerente.zip` e a aplicação autenticada `https://mx-gerente.base44.app/fechamento-equipe` são o contrato observável.
- O Base44 vence em composição, textos, fórmulas, ordenação, estados, modais e ações; React/Auth/Supabase/RLS permanecem infraestrutura.
- O sidebar escuro atual permanece sem alteração.
- Evidência Chrome real em 2026-07-13: Base44 exibe `0` agendamentos, `8` pendentes, `0` regularizações, disciplina `0%`, movimento vazio com `Ainda não há fechamentos enviados para a data selecionada.` e gráfico de disciplina; o sistema atual renderiza linhas pendentes no movimento mesmo sem fechamento enviado.

## Acceptance Criteria

1. `/fechamento-diario` mantém o shell e sidebar atuais e reproduz o cabeçalho Base44 com título, subtítulo, data civil, unidade e `Atualizar`.
2. Data, unidade, loading, erro e ausência de vendedores são estados distintos; consultas permanecem escopadas à loja e ao gerente autenticado.
3. Os cards `Agendamentos`, `Pendentes Hoje`, `Regularizações` e `Disciplina Média` reproduzem labels, cores, status, pluralização, números reais e ações do Base44.
4. `Movimento da Equipe` usa apenas fechamentos enviados para a data selecionada; quando nenhum foi enviado, mostra exatamente o vazio Base44, sem linhas pendentes inventadas.
5. Quando existem fechamentos, a tabela reproduz colunas, ordenação por entrega mais recente, avatar/iniciais, status, entrega, leads, qualificados, agendamentos, atendimentos, vendas, disciplina e ações contextuais.
6. `Cobrar Pendentes` abre confirmação Base44, envia notificações/auditoria uma vez por vendedor e atualiza o estado sem recarregar a página.
7. `Ver Agenda D+1` abre o fluxo Base44 com vendedores, filtros e ações reais, sem alterar dados do vendedor.
8. `Corrigir Leads` abre conferência com dados oficiais, exige confirmação, persiste auditoria server-side e atualiza a tela; falhas mostram erro explícito.
9. Regularização, aprovação e recusa reproduzem modais, campos obrigatórios, estados, comentários, auditoria e retorno visual do Base44.
10. `Evolução da Disciplina do Fechamento` reproduz períodos `7 dias`, `15 dias` e `30 dias`, gráfico, estado vazio, parcial e oficial sem fabricar médias de rede.
11. `Comparativo de Disciplina` e `Resumo do Fechamento` reproduzem a composição Base44 e exibem ausência de snapshots/dados oficiais sem números fictícios.
12. As ações são acessíveis por teclado, os modais restauram foco/fecham por Escape e não existe overflow horizontal em `1440×900`, `768×1024` e `390×844`.
13. Testes unitários cobrem status, pendências, ordenação, disciplina, agregação e estados vazios; componentes cobrem cards, tabela, modais e ações.
14. E2E autenticado no Chrome cobre refresh, estado vazio, cobrança, agenda, conferência de leads, regularização, aprovação/recusa e retorno.
15. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `git diff --check` passam.
16. Após QA, a story só é concluída com commit em `origin/main`, deployment promovido a `mxperformance.vercel.app` e homologação autenticada nos três viewports sem erro de console ou 4xx/5xx causado pela story.

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `.aiox-core/core-config.yaml`.
> Quality validation will use manual review and the existing repository commands.

## Tasks / Subtasks

- [x] 1. Fixar baseline Base44 × local no Chrome (AC: 1–12)
  - [x] Capturar desktop, tablet e mobile após conteúdo estabilizar.
  - [x] Registrar estados vazio, carregado, pendente, regularização e modais.
- [ ] 2. Portar domínio e contratos (AC: 3–5, 10–11, 13)
  - [ ] Separar vendedores pendentes de fechamentos enviados na composição da tabela.
  - [ ] Cobrir status, ordenação, disciplina, agregações e pluralizações com testes RED/GREEN.
- [ ] 3. Reconciliar adaptador Supabase/RLS (AC: 2, 6–9, 14)
  - [ ] Confirmar fontes canônicas de checkins, auditoria, notificações, agenda e leads.
  - [ ] Garantir idempotência, isolamento por loja e tratamento explícito de erro.
- [ ] 4. Alinhar UI e fluxos (AC: 1–12)
  - [x] Ligar `Ver Regularizações` a um modal dedicado com métricas e ações de aprovação/recusa.
  - [x] Expor `Detalhes` em cada linha e abrir o detalhe do fechamento com retorno para Agenda D+1.
  - [x] Corrigir movimento vazio e tabela carregada.
  - [x] Garantir fechamento por Escape e restauração de foco nos modais Cobrança, Agenda, Regularizações e Conferência.
  - [ ] Alinhar cards, gráfico, resumo, comparativos, estados e demais modais ao ZIP.
  - [x] Validar teclado, foco, Escape e responsividade dos novos modais no Chrome real.
- [ ] 5. Validar e publicar (AC: 13–16)
  - [ ] Executar gates completos e QA AIOX.
  - [ ] Entregar a publicação via `@devops` e homologar produção autenticada.

## Dev Notes

### Fontes normativas

- `/private/tmp/mx-gerente-source/src/pages/FechamentoEquipe.jsx`
- `/private/tmp/mx-gerente-source/src/components/fechamento/`
- `docs/architecture/MODULO_GERENCIAL_BASE44_MIGRATION.md`
- `docs/architecture/MODULO_GERENCIAL_DATA_MAPPING.md`
- `docs/qa/MODULO_GERENCIAL_PARITY_MATRIX.md`
- `output/playwright/manager-parity/reference/11-fechamento-equipe-desktop-stabilized.png`

### Pontos atuais

- Container: `src/features/manager/daily-closing/ManagerDailyClosing.container.tsx`.
- Componentes de agenda, conferência de leads e métricas estão em `src/features/manager/daily-closing/`.
- A página atual deriva linhas de todos os vendedores; o contrato Base44 deve renderizar o vazio quando `checkins`/fechamentos enviados estiverem vazios.
- O card `Regularizações` agora abre `RegularizationsListModal` e encaminha aprovação/recusa para as RPCs do auditor.
- Cada linha agora possui `Detalhes` e `ClosingDetailsModal`, com métricas reais e ação para Agenda D+1.
- Toda correção deve preservar `useCheckinAuditor`, RLS e os contratos server-side já existentes; migration só é permitida se auditoria provar lacuna real.

### Testing

- Testes co-localizados com domínio e componentes; E2E autenticado cobre ações críticas por papel.
- Chrome é evidência obrigatória; capturas de spinner/loading não aprovam a story.
- O sidebar não entra no escopo de alteração visual.

## Change Log

| Date | Version | Description | Author |
|---|---|---|---|
| 2026-07-13 | 1.0 | Story criada após auditoria Base44 × local no Chrome e identificação do desvio do estado vazio. | River (@sm) |
| 2026-07-13 | 1.1 | Modal de regularizações e detalhe do fechamento implementados em TDD e validados no Chrome local. | Codex (@dev) |
| 2026-07-13 | 1.2 | Estado vazio alinhado ao Base44, Escape habilitado nos modais de Cobrança/Agenda e QA Chrome mobile atualizado. | Codex (@dev) |

## Dev Agent Record

### Agent Model Used

Codex GPT-5 — implementação coordenada por `aiox-master`/Orion.

### Debug Log References

- RED: `RegularizationsListModal.test.tsx` falhou por módulo inexistente; GREEN com 1 teste e 8 assertions.
- RED: `ClosingDetailsModal.test.tsx` falhou por módulo inexistente; GREEN com 1 teste e 4 assertions.
- `npm run typecheck` passou após as duas integrações.
- Chrome DevTools real local: `Ver Regularizações` abriu 2 solicitações, `Detalhes Vendedor MX Consultoria 2` abriu o detalhe e `Ver Agenda D+1 deste vendedor` ficou disponível; viewport mobile `390×844` sem quebra visual no cabeçalho/cards.
- Chrome DevTools real local após a correção: com 5 vendedores pendentes e 2 regularizações, Movimento da Equipe mostra exatamente `Ainda não há fechamentos enviados para a data selecionada.`; Cobrança, Agenda D+1, Regularizações e Conferência de Leads abriram com dados reais; Agenda e Cobrança fecharam por Escape; console sem erros.
- Comparação autenticada Base44 × localhost em `1710×800`: conteúdo `1248px`, cabeçalho `148px`, cards `164px`, botões `30px`, Agenda D+1 `1152px` e tabela iniciando em `y=442` foram alinhados às medidas observadas; Cobrança, Agenda, Regularizações, Conferência, Detalhes, Aprovar e Recusar abriram e fecharam por Escape sem mutação remota.
- Gates desta rodada: `npm test` 955 testes/0 falhas/3.166 assertions, `npm run typecheck`, `npm run lint:tokens` e `git diff --check` aprovados.

### Completion Notes List

- Fluxo de regularizações deixou de ser scroll-only e agora abre modal acessível com métricas derivadas dos valores solicitados e callbacks de aprovação/recusa.
- Linhas do movimento agora reproduzem a ação `Detalhes` do Base44 e expõem detalhe por canal, registros, status, disciplina e Agenda D+1.
- O movimento agora separa `sem vendedores`, `sem fechamentos enviados` e `tabela carregada`, sem inventar linhas pendentes quando o Base44 está vazio.
- O heading de Movimento usa o mesmo nível semântico do Base44 e a validação mobile confirmou `390×844`, `scrollWidth=390` e ausência de overflow horizontal.
- Persistência continua exclusivamente no auditor/RPC existente; nenhuma mutação remota foi executada durante a homologação.
- O ajuste visual preserva o shell escuro protegido, RLS, RPCs e dados canônicos; apenas reduz as dimensões e a densidade visual do Fechamento Diário para o contrato Base44.

### File List

- `docs/stories/story-MX-MGR-20260713-03-fechamento-diario-base44-1x1.md`
- `src/features/manager/daily-closing/RegularizationsListModal.tsx`
- `src/features/manager/daily-closing/RegularizationsListModal.test.tsx`
- `src/features/manager/daily-closing/ClosingDetailsModal.tsx`
- `src/features/manager/daily-closing/ClosingDetailsModal.test.tsx`
- `src/features/manager/daily-closing/ManagerDailyClosing.container.tsx`
- `src/features/manager/daily-closing/AgendaD1Panel.tsx`
- `src/components/organisms/Modal.tsx`

## QA Results

- Gates locais após a correção: `npm test` 878 testes, `npm run lint` 0 erros/22 warnings pré-existentes, `npm run typecheck`, `npm run build` e `git diff --check` aprovados.
- QA Chrome real local aprovado para estado vazio, Cobrança, Agenda D+1, Regularizações, Conferência de Leads, Escape, foco e viewport mobile.
- Pendente: validar a tabela com fechamento enviado no ambiente final, executar mutações de cobrança/aprovação/recusa/conferência em dados de homologação, delegar commit/deploy a `@devops` e homologar produção nos três viewports.
