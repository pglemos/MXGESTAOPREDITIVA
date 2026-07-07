# Parte 5 — Features Pequenas

## Resumo
17 features pequenas (~65 arquivos, ~7.500 linhas) auditadas. Código em geral limpo, bem tipado (zero `any`), sem violação de regras de hooks e sem prop drilling grave — a maioria segue o padrão container/hook/section consolidado no projeto. Os problemas reais concentram-se em: 1 componente órfão (dead code), 2 telas roteadas com dados 100% mockados em vez de vir do backend, 2 componentes nunca importados (relatórios impressos), duplicação de mapas de "tonalidade" (tone/status → classe CSS) repetida em 8+ arquivos, e um wizard de 607 linhas concentrando validação + form state + API calls. Achados por severidade: **Alta**: 4 · **Média**: 8 · **Baixa/nota**: 6.

## 1. DRY
- `src/features/central-mx/sections/CentralMxHub.tsx:42-48`, `src/features/central-mx/sections/PlanejamentoEstrategico.tsx:31-39`, `src/features/departamentos/sections/DepartamentoDashboard.tsx:242-249,276-282`, `src/features/marketing/sections/MarketingModulo.tsx` (via `FLUXO_TONE`), `src/features/cultura-felicidade/sections/CulturaFelicidade.tsx:23-28,255-262`, `src/features/universidade/sections/UniversidadeMx.tsx` (`TIPO_TONE`) — o mapa `Record<status, "border-x/30 bg-x-surface text-x">` para success/warning/danger/muted é reescrito com as mesmas classes Tailwind em pelo menos 8 arquivos do repositório (incluindo `crm/CentralExecucao.container.tsx` e `dashboard-loja/sections/CentralMxPlanoSegmentadoPanel.tsx`, fora do escopo desta parte mas confirmando o padrão). Sugestão: extrair um util `getStatusToneClasses(tone)` ou objeto `STATUS_TONE_CLASSES` compartilhado em `src/lib/ui/` e importar nas 8+ ocorrências.
- `src/features/feedback/PrintableFeedback.tsx:26-28` e `src/features/feedback/WeeklyStoreReport.tsx:29-31` — as constantes `TH_BASE`, `TD_BASE`, `TD_LEFT` (classes de célula de tabela para impressão) são idênticas nos dois arquivos. Sugestão: mover para `src/features/feedback/printTableStyles.ts` compartilhado.
- `src/features/organograma/components/BancoTalentos... ` — `Field` (label + children) é redefinido de forma idêntica em `src/features/comportamental/components/BancoTalentos.tsx:112-119` e `src/features/organograma/components/PlanoCarreira.tsx:89-96`. Sugestão: mover para um átomo/molécula compartilhado (`components/molecules/FormField.tsx`) já que o padrão se repete.

## 2. Dead code
- `src/features/central-mx/sections/CentralMxHub.tsx` — componente completo (`CentralMxHub`) não é importado em nenhum outro arquivo do projeto (`grep` não retornou nenhum uso fora da própria definição). Sugestão: remover o arquivo ou religar a uma rota, se o hub ainda for necessário.
- `src/features/feedback/PrintableFeedback.tsx` e `src/features/feedback/WeeklyStoreReport.tsx` — nenhum dos dois componentes é importado por qualquer outro arquivo (`grep` não encontrou uso externo). Sugestão: confirmar com produto se os relatórios de impressão foram descontinuados; se sim, remover; se não, religar ao fluxo que deveria consumi-los.
- `src/features/consultoria-cliente/components/ConsultoriaErrorBoundary.tsx:33` e `src/features/notificacoes/components/NotificacoesErrorBoundary.tsx:36` — comentário `// Bloco indisponível` está dentro de uma `<strong>`, ou seja, é renderizado como texto literal `// Bloco indisponível...` na tela ao usuário, não é um comentário de código. Não é dead code, mas é um bug visual (texto de comentário vazando pro UI). Sugestão: remover o `//` do texto visível.

## 3. TypeScript
- Nenhum uso de `any` encontrado nas 17 features (bom sinal).
- `src/features/equipe/components/UserCreationModal.tsx` — único arquivo do lote que mistura `interface` (linha 26) e `type` (linha 35) para modelos de dados no mesmo arquivo. Inconsistência leve; sugestão: padronizar em `type` (convenção predominante no restante das features).
- `src/features/pdi/WizardPDI.tsx:36-53` — o estado `form` usa objetos inline sem tipo nomeado (`metas: [...]`, `plano_acao: [...]`) — tipos inferidos ficam implícitos e difíceis de reusar/validar. Sugestão: extrair `type WizardPDIForm = {...}` explícito.

## 4. Componentes
- `src/features/pdi/WizardPDI.tsx` — 607 linhas, um único componente concentrando: 4 telas de wizard (setup/metas/skills/actions), todas as validações (`validateMetas`, `validateMapeamento`, `validateAcoes`), cálculo de gaps, chamadas a `usePDI_MX`, e todo o JSX de cada step inline. Sugestão: quebrar em `WizardPDI` (orquestrador) + `StepSetup.tsx`, `StepMetas.tsx`, `StepMapeamento.tsx`, `StepPlanoAcao.tsx`, e mover as validações para `lib/pdi-wizard-validation.ts`.
- `src/features/admin/components/StoreEditModal.tsx` (347 linhas) e `src/features/equipe/components/UserCreationModal.tsx` (348 linhas) — modais grandes mas com responsabilidade única (formulário de edição/criação); aceitável dado o padrão de modal do projeto, mas próximos do limite. Não é ação imediata, apenas observação.
- `src/features/universidade/sections/AulasAoVivoSection.tsx` (313 linhas) e `UniversidadeMx.tsx` (301 linhas) — grandes mas compostos majoritariamente por JSX repetitivo de cards; quebra não traria ganho real de manutenibilidade no momento.

## 5. Estado
- Nenhum prop drilling excessivo identificado — `ConsultoriaClienteDetalhe.container.tsx` usa bem hooks dedicados (`useActiveTab`, `useVisitForm`, `useLegacyCompletion`) e passa dados via props diretas para 1 nível de section, sem atravessar múltiplos componentes intermediários.
- Nenhum uso indevido de Context para dado local identificado nestas features.
- `src/features/pdi/WizardPDI.tsx:26-34` — dois objetos de checklist (`preChecklist`, `closingChecklist`) poderiam ser um único `useReducer` já que são grupos de flags relacionados por etapa, mas o volume (2-3 campos) não justifica a migração agora.

## 6. Hooks
- Nenhuma violação das regras de hooks (chamadas condicionais/em loop) encontrada.
- Todos os `useEffect` auditados em `consultoria-cliente`, `notificacoes`, `central-mx`, `universidade`, `marketing`, `departamentos`, `organograma`, `comportamental`, `cultura-felicidade` têm arrays de dependência consistentes com o corpo do efeito (a maioria delega para `useCallback` memoizado antes do efeito, padrão correto).
- `src/features/pdi/WizardPDI.tsx:65-82` — dois `useEffect` sequenciais dependentes (o segundo depende do resultado do primeiro via `form.cargo_id`) somados a `handleCompetenciaAcaoChange`, `validateMetas`, `validateMapeamento`, `validateAcoes` como funções soltas no componente — esse conjunto é um bom candidato a `useReducer` ou a um hook dedicado `useWizardPdiForm()` que encapsule form + validações.

## 7. Separação lógica/apresentação
- `src/features/gerente/FunilVendasGerente.tsx:31-77` e `src/features/gerente/MetasGerente.tsx:16-22` — as duas telas (roteadas ativamente em `src/App.tsx:311,314` para `gerente`/`dono`) usam **dados 100% hardcoded** (`funnelData`, `teamRanking`, `teamMetas` como arrays literais no componente) em vez de consumir hook/Supabase. É a UI final de produção exibindo números fixos e não reais. Sugestão: criar `useFunilVendasGerente`/`useMetasGerente` (mesmo padrão dos demais hooks da pasta) consumindo dados reais, ou, se ainda for protótipo intencional, sinalizar isso explicitamente na tela (banner "dados de exemplo").
- `src/features/dono/FalarConsultorDono.tsx:5-12,80-85` — `consultorInfo` (contato do consultor) e o histórico de "últimas conversas" também são hardcoded no componente. Mesma observação: tela ativa (rota do dono) exibindo dados estáticos fixos como se fossem reais.
- Demais features (`central-mx`, `universidade`, `marketing`, `departamentos`, `cultura-felicidade`, `comportamental`, `organograma`) seguem bem o padrão hook-consulta-Supabase + section-apresentação, sem regra de negócio embutida na camada de UI.

## 8. Erros
- `src/features/consultoria-cliente/ConsultoriaClienteDetalhe.container.tsx:57-68` — `resolveStoreByName` trata erro do Supabase com `console.warn` (só em DEV) e segue silenciosamente (`setFallbackStoreId('')`), sem notificar o usuário. Como é um fallback best-effort, é aceitável, mas vale registrar que não há qualquer feedback ao usuário em caso de falha.
- `src/features/notificacoes/hooks/useNotificacoesPage.ts:170-231` — `executeReviewPreRegistration` já trata bem erros com `try/catch` + `toast.error`, é o padrão correto seguido na maior parte do código auditado.
- Nenhum outro caso de chamada assíncrona/API sem tratamento de erro identificado nas 17 features — o padrão `try/catch` + `toast.error`/`setError` é consistente em todos os hooks (`useConsultorIa`, `useMarketingModulo`, `useDepartamentoDashboard`, `useCulturaFelicidade`, `useUniversidadeMx`, `useOrganograma`, `useComportamental`).

## 9. Performance
- Nenhum componente com recálculo pesado sem `useMemo` identificado — os hooks usam `useMemo`/`useCallback` de forma consistente para listas filtradas e contagens (`useNotificacoesPage`, `useUniversidadeMx`, `useMarketingModulo`).
- `src/features/notificacoes/sections/NotificacoesListSection.tsx` — lista de notificações sem virtualização, mas o volume esperado (poucas dezenas por usuário) não justifica `react-window` no momento; não é um achado acionável agora.
- Nenhuma imagem não otimizada identificada (avatares usam `object-cover` com dimensões fixas via classes).

## 10. Organização
- As 17 pastas fazem sentido como features de domínio (cada uma mapeia uma tela/módulo de negócio real: PDI, organograma, cultura, marketing, etc.) — não há sobreposição clara que justifique consolidação, exceto pelo padrão de tone-map duplicado (ver item 1), que é um sintoma de falta de uma camada `src/lib/ui/status-tones.ts` compartilhada entre features, não de features mal separadas.
- `src/features/gerente/` contém 2 arquivos soltos na raiz da pasta (`FunilVendasGerente.tsx`, `MetasGerente.tsx`) sem subpastas `hooks/`/`sections/`, inconsistente com o padrão adotado por `central-mx`, `universidade`, `marketing`, `departamentos`, `cultura-felicidade`, que separam `hooks/` e `sections/`. Como as duas telas de `gerente` ainda usam dados mockados (item 7), ao implementar os hooks reais valeria já alinhar a estrutura de pastas ao padrão das demais features do Sprint 2.
- `src/features/dono/`, `src/features/admin/`, `src/features/equipe/`, `src/features/auth/` têm só 1 arquivo cada — correto não fragmentar em subpastas para um único componente.
- Nenhuma dependência circular identificada entre as features auditadas.

## 11. Acessibilidade
- `src/features/dono/FalarConsultorDono.tsx:55-60` — botão "Agendar Reunião" (`<button type="button">`) não possui `onClick` nem qualquer handler — é puramente decorativo em uma tela de produção. Sugestão: implementar a ação ou remover o botão até que a funcionalidade exista.
- `src/features/notificacoes/components/NotificacaoApprovalCard.tsx:29-34` — `<div role="presentation" onClick={...} onKeyDown={...}>` no wrapper externo: os handlers aqui servem apenas para `stopPropagation` (impedir que o clique dentro do card dispare o `onClick` do artigo pai), o que é aceitável, mas o `role="presentation"` com `onKeyDown` é redundante/confuso — não há necessidade de handler de teclado em um elemento puramente de apresentação. Não bloqueante, mas vale simplificar.
- Demais componentes (`OrganogramaVisual`, `BancoTalentos`, `TesteComportamental`, `PlanoCarreira`) usam `aria-label` corretamente em botões ícone-apenas e em selects sem label visível.

## 12. Testes
- `src/features/gerente/FunilVendasGerente.tsx` e `MetasGerente.tsx` — sem testes; combinado com o achado do item 7 (dados mockados em tela ativa), é a maior lacuna de cobertura do lote — quando os hooks reais forem implementados, precisarão de teste.
- `src/features/pdi/WizardPDI.tsx` (607 linhas, lógica de validação complexa: `validateMetas`, `validateMapeamento`, `validateAcoes`) — sem teste correspondente. É o componente com maior complexidade de regra de negócio (validação de datas, obrigatoriedade de metas por prazo, vínculo de ações a lacunas) do lote inteiro e não tem nenhuma cobertura.
- `src/features/consultoria-cliente/hooks/useVisitForm.ts` e `useLegacyCompletion.ts` — sem teste, apesar de conterem lógica de validação e submissão não trivial.
- Cobertura existente e adequada: `organograma/lib/tree.test.ts` (árvore), `comportamental/lib/perfil.test.ts` (cálculo de perfil), `central-mx/hooks/useConsultorIa.test.ts` + `ConsultorIaChat.test.tsx`, `notificacoes/sections/NotificacoesHeader.test.tsx` — mostram que o padrão de teste unitário para lib pura e snapshot de componente simples já é seguido quando aplicado.
