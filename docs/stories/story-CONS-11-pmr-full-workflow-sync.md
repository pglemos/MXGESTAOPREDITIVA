# Story [CONS-11]: PMR Full Workflow Sync - Operacionalização Prática

**Status:** READY FOR DEVELOPMENT
**Agent:** @aiox-developer / @devops
**Priority:** CRITICAL

## Context
Conforme alinhamento estratégico de 17/04/2026, a operação de consultoria (PMR) requer a transição de um modelo híbrido com planilhas/documentos avulsos para uma experiência unificada e nativa no sistema. Os pontos cruciais levantados foram:
1.  **Formulários de Diagnóstico Nativos**: Absorver os quatro questionários atuais (Dono, Gerente, Vendedor, Processos) para dentro do sistema, abandonando a dependência de links externos (Forms).
2.  **Entradas Frequentes e Real-Time**: Integrar o acompanhamento de vendas diárias e fechamento mensal (custos, investimentos).
3.  **Abas Estratégico e Plano de Ação**: Consolidar os dados nessas duas visões já construídas, amarrando o planejado com o executado em tempo real.
4.  **Parâmetros de Mercado (Configurações)**: Centralizar e expor as métricas e benchmarks de referência (e.g. conversões médias de leads, custo de aquisição) em uma aba "Configurações > Consultoria PMR", eliminando números hardcoded no sistema e a dependência do time de TI para alterar pesos e médias do mercado.
5.  **Entregáveis Consolidados**: Garantir a geração via CLI (ou futuramente UI) de relatórios executivos em PDF/Apresentação que espelhem a apresentação comercial existente do PMR.

## User Story

Como Consultor PMR,
quero cadastrar o cliente definindo os seus módulos premium de forma independente dos produtos comerciais,
e ter todo o workflow de diagnóstico, parâmetros base, metas e plano de ação integrados nativamente nas abas de gestão,
para garantir autonomia operacional e gerar entregáveis precisos em tempo real.

## Acceptance Criteria

### 1. Gestão de Módulos Premium e Catálogo (JÁ IMPLEMENTADO/REVISADO)
- [x] O formulário de criação de cliente no CRM de Consultoria agora separa o "Produto Comercial" dos "Módulos Internos" (DRE, Plano de Ação, Diagnóstico).
- [x] Durante a criação do cliente, o consultor pode ticar quais módulos (incluindo o premium DRE) estarão ativados para aquele cliente.
- [x] A configuração persiste no banco (`modulos_cliente_consultoria`).

### 2. Gestão de Parâmetros MX (Configurações) (JÁ IMPLEMENTADO/REVISADO)
- [x] A tela de Parâmetros PMR está acessível no menu de Administração da página de Configurações, restrita para administradores da rede.
- [x] Os usuários podem editar as métricas (Market Average, Best Practice, Default Target e Limites Red/Yellow/Green).
- [x] Os dados são salvos em `valores_parametros_consultoria` baseados nos conjuntos ativos em `conjuntos_parametros_consultoria`.

### 3. Formulários Nativos do Diagnóstico PMR
- [x] Construir a UI de renderização do formulário nativo em `PmrDiagnosticsView.tsx` consumindo `modelos_formulario_pmr`.
- [x] O formulário deve suportar os 4 tipos de roles: Dono, Gerente, Vendedor e Processos.
- [x] Submissão do formulário salva os resultados estruturados em `respostas_formulario_pmr`.
- [x] Respostas alimentam (via summary/LLM) as visões de planejamento estratégico.

### 4. Fluxo de Dados Diário e Mensal
- [x] A aba de `Fechamento Mensal` (ou integração via `DRE`) deve capturar o investimento em Marketing para calcular o Custo por Venda.
- [x] Integração do Tracking de Vendas com as Metas estabelecidas no *Planejamento Estratégico*.

### 5. Artefatos de Saída
- [x] Scripts CLI de geração de documentos e planos de ação lendo do banco e criando saídas .md ou .pptx equivalentes aos arquivos locais (e.g. `PMR - DNA VEICULOS - PLANEJAMENTO ESTRATEGICO.pptx`).
- [x] Resumo executivo (`GED - RELATÓRIO EXECUTIVO DE DIAGNÓSTICO.pdf` equivalente).

## Initial Data Model (Já contido em migrations previas)
- `modelos_formulario_pmr` e `respostas_formulario_pmr`: Estrutura dos questionários nativos.
- `modulos_cliente_consultoria`: Controle granular de módulos premium e não premium.
- `conjuntos_parametros_consultoria` e `valores_parametros_consultoria`: Controle de versões de métricas e benchmarks de mercado.

## Probable File List

**Novos & Modificados (Diagnóstico UI)**
- `src/features/consultoria/components/PmrDiagnosticsView.tsx`
- `src/hooks/useConsultingDiagnostics.ts`

**Scripts & Artefatos (Entregáveis)**
- `scripts/consultoria_gerar_planejamento_estrategico.ts`
- `scripts/consultoria_gerar_resumo_executivo.ts`

**Core/UI (Concluídos)**
- `src/pages/ConsultoriaClientes.tsx`
- `src/hooks/useConsultingClients.ts`
- `src/pages/Configuracoes.tsx`
- `src/features/consultoria/components/ConsultingParametersView.tsx`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

### Completion Notes List

- Motor PMR autônomo criado para derivar indicadores de marketing, vendas, estoque e DRE sem depender de lançamento manual em `resultados_metricas_cliente`.
- Aba Estratégico agora gera planejamento com síntese executiva, SWOT, gargalos, cronograma, contingências, artifact markdown e ações recomendadas quando o plano de ação ainda está vazio.
- Importador mensal passa a calcular snapshot de estoque completo e persistir indicadores PMR derivados.
- Scripts CLI de planejamento e resumo executivo agora usam o mesmo motor PMR e removem placeholders de consolidação pendente.
- Novo comando CLI sincroniza indicadores PMR derivados para um cliente ou para todos os clientes ativos.
- Aba Fechamento Mensal deixou de ser placeholder e agora observa marketing, vendas, estoque e indicadores derivados.
- Artefatos gerados ficam legíveis na aba Estratégico e SWOT manual entra no markdown final do planejamento.

### File List

- `docs/stories/story-CONS-11-pmr-full-workflow-sync.md`
- `src/lib/consultoria/pmr-engine.ts`
- `src/lib/consultoria/pmr-engine.test.ts`
- `src/lib/schemas/consulting-client.schema.ts`
- `src/features/consultoria/types.ts`
- `src/hooks/useConsultingMetrics.ts`
- `src/hooks/useConsultingStrategicPlan.ts`
- `src/features/consultoria/components/ConsultingStrategicView.tsx`
- `src/features/consultoria/components/ConsultingMonthlyCloseView.tsx`
- `src/pages/ConsultoriaClienteDetalhe.tsx`
- `package.json`
- `scripts/README.md`
- `scripts/consultoria_importar_fechamento_mensal.ts`
- `scripts/consultoria_sincronizar_metricas_pmr.ts`
- `scripts/consultoria_gerar_planejamento_estrategico.ts`
- `scripts/consultoria_gerar_resumo_executivo.ts`
- `supabase/migrations/20260503080000_pmr_autonomous_metrics.sql`

### Change Log

- 2026-05-03: PMR consolidado como fluxo autônomo de indicadores, planejamento estratégico, artifacts CLI e geração inicial de ações.
- 2026-05-03: Adicionada visão nativa de fechamento mensal, sincronizador CLI de métricas e leitura in-app dos artefatos gerados.
