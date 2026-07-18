# Plano de implementação — Paridade integrada do módulo Dono

> Execução orientada por testes. A referência Base44 é uma especificação visual e de interação; o Supabase do MX continua sendo a fonte de verdade.

## Arquitetura

- Shell e navegação: `Layout.tsx` + `MxSidebarShell` existentes.
- Rota canônica: `/lojas/:storeSlug` com `ownerSection` para preservar compatibilidade.
- Orquestração: `OwnerExecutiveCockpit`.
- Dados operacionais: `useDashboardLojaData` e motor `central-mx-engine`.
- Dados executivos persistentes: tabelas canônicas de planejamento, plano de ação, alertas, agenda, departamentos e consultoria.
- Referência Base44: somente composição visual, catálogo de interações e conteúdo demonstrativo.

## Etapas

### 1. Contratos e proteção

- [ ] Criar testes para a arquitetura de navegação do Dono.
- [ ] Criar testes para resolução de `ownerSection` e compatibilidade com departamentos.
- [ ] Criar testes para os indicadores prioritários da Home.
- [ ] Confirmar que Gerente e Vendedor não recebem novos itens ou estilos.

### 2. Navegação

- [ ] Reorganizar o menu do Dono conforme Base44.
- [ ] Mapear novas seções para query string canônica.
- [ ] Manter seleção única e acessível.

### 3. Início

- [ ] Substituir `% Margem` por `Previsão de Vendas Hoje`.
- [ ] Reordenar indicadores sem alterar fontes reais.
- [ ] Tornar estoque e dados ausentes explicitamente configuráveis.
- [ ] Preservar meta, alertas, ações, panorama e departamentos.

### 4. Seções executivas

- [ ] Central de Decisões: derivar de alertas e ações aguardando atuação.
- [ ] Rotina do Dia: compor agenda, riscos e ações do Dono.
- [ ] Consultoria: compor jornada, encontros e preparação com dados existentes.
- [ ] Mercado: reutilizar benchmarking.
- [ ] Universidade MX: reutilizar módulo existente.

### 5. Persistência

- [ ] Planejamento Estratégico: ler catálogo e valores canônicos.
- [ ] Plano de Ação: ler/escrever plano, histórico e evidências canônicos.
- [ ] Não criar tabelas equivalentes a Company, KPI, Decision ou ConsultantRequest.
- [ ] Adicionar RPC somente quando uma escrita multi-tabela exigir atomicidade e segurança.

### 6. Validação

- [ ] TypeScript.
- [ ] Testes unitários e de integração focados.
- [ ] ESLint/a11y.
- [ ] Build de produção e bundle budget.
- [ ] Playwright desktop/mobile.
- [ ] Advisors de segurança e performance do Supabase.
- [ ] Preview Vercel e verificação de runtime.
- [ ] Merge no `main` e deploy de produção.
