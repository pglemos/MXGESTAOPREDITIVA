# Story OWNER-20260526 - Cockpit Executivo da Visao do Dono

**Status:** Ready for Review  
**Data:** 2026-05-26  
**Origem:** Imagem de referencia da visao do dono + transcricao da reuniao de 2026-05-22  
**PRD:** `docs/prd/modulo-visao-dono-cockpit-executivo-2026-05-26.md`  
**Tipo:** Brownfield UI/UX + IA + data integration incremental

---

## Story

Como dono de loja,
quero abrir o MX Performance e ver uma Home executiva simples com KPIs, alertas, plano de acao e eficiencia por departamento,
para entender rapidamente o que realmente importa hoje e decidir o que cobrar ou acompanhar.

---

## Contexto

Na reuniao de 2026-05-22, Daniel definiu que o sistema nao deve ser percebido como "mais um sistema" ou CRM. A visao do dono precisa ser clean, objetiva e orientada a decisao.

A imagem enviada em 2026-05-26 materializa essa direcao visual:

- Sidebar com Home, Consultoria, Resultados, Plano de Acao, Visitas, Departamentos, Treinamentos e Falar com Consultor.
- Header com saudacao e periodo.
- KPIs executivos.
- Panorama planejado x realizado.
- Alertas importantes.
- Plano de acao.
- Desempenho por departamento.
- Entrada para agenda do diretor, comparativo mercado/rede, biblioteca, visitas e falar com consultor.

---

## Escopo

### Incluido

- Criar especificacao e primeira implementacao do cockpit executivo do dono.
- Refatorar navegacao do dono para refletir a IA da reuniao.
- Renderizar tela nova quando `role === dono` na rota atual da loja.
- Reaproveitar dados reais ja existentes no dashboard.
- Mostrar estados vazios para dados ainda inexistentes.
- Reaproveitar alertas atuais em layout executivo.
- Preparar estrutura para plano de acao e departamentos.
- Preparar pontos de entrada para agenda do diretor, comparativo mercado/rede, biblioteca, visitas e falar com consultor.

### Fora do escopo desta story

- Criar o Plano de Acao 2.0 completo.
- Criar data model definitivo de departamentos.
- Integrar AutoCerto.
- Integrar Meta/Instagram.
- Integrar WhatsApp.
- Criar RH completo.
- Criar ticket medio real sem fonte de dados validada.
- Criar estoque real sem fonte de dados validada.

---

## Acceptance Criteria

1. Perfil `dono` ve uma Home executiva em `/lojas/:storeSlug`.
2. A tela contem os blocos: saudacao, periodo, KPIs, panorama, alertas, plano de acao e departamentos.
3. A sidebar do dono usa a nova estrutura: Home, Consultoria, Resultados, Plano de Acao, Visitas, Departamentos, Treinamentos e Falar com Consultor.
4. KPIs com fonte real exibem valor; KPIs sem fonte real exibem estado pendente, nao numero falso.
5. Alertas aparecem curtos na Home; causa detalhada e proxima acao ficam para o drill-down.
6. O dono nao ve os 45 indicadores brutos na primeira tela.
7. O bloco Plano de Acao pode iniciar com estado vazio/pendente se a base final ainda nao existir.
8. O bloco Departamentos pode iniciar com scores preliminares/pendentes, mas deve respeitar a estrutura Comercial, Marketing, Produto, Financeiro, Operacional e RH.
9. A tela funciona em desktop e mobile sem overflow horizontal.
10. O gerente e os perfis internos nao perdem a tela atual de performance durante esta primeira entrega.
11. A Home nao precisa implementar todos os drill-downs nesta story, mas deve deixar rotas/CTAs/estados planejados para Agenda do Diretor, Comparativo mercado/rede, Biblioteca, Visitas e Falar com Consultor.

---

## Tasks

- [x] Atualizar navegacao do perfil dono em `src/components/Layout.tsx`.
- [x] Criar `OwnerExecutiveCockpit`.
- [x] Criar cards executivos de KPI dentro de `OwnerExecutiveCockpit`.
- [x] Criar `OwnerEfficiencyGauge`.
- [x] Criar `OwnerPanoramaChart`.
- [x] Criar `OwnerAlertList`.
- [x] Criar `OwnerActionPlanSummary`.
- [x] Criar `OwnerDepartmentScoreGrid`.
- [x] Alterar `PerformanceTab` para renderizar cockpit apenas para `role === dono`.
- [x] Mapear dados reais disponiveis em `useDashboardLojaData`.
- [x] Criar estados vazios para ticket medio, estoque, ano anterior e plano de acao.
- [x] Preparar alerta/entrada para Agenda do Diretor sem recriar o motor de e-mail existente.
- [x] Preparar CTAs ou links para Comparativo mercado/rede, Biblioteca, Visitas e Falar com Consultor.
- [x] Renderizar componentes internos por `ownerSection` para Consultoria, Resultados, Plano de Acao, Visitas, Departamentos e Falar com Consultor.
- [x] Manter o shell visual padrao do sistema, alterando somente os componentes internos do modulo do dono.
- [x] Expandir Central MX do dono com Planejamento Estrategico, Plano de Acao, Alertas Inteligentes, Benchmarking, Agenda Executiva e Consultor IA.
- [x] Remover header legado de "Status de Unidade" somente da Home executiva do dono.
- [x] Implementar telas internas do dono alinhadas as imagens de referencia sem inventar dados ausentes.
- [x] Validar responsividade.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm run typecheck`.
- [x] Rodar testes relacionados quando houver.

---

## File List

- `docs/prd/modulo-visao-dono-cockpit-executivo-2026-05-26.md`
- `docs/stories/story-OWNER-20260526-cockpit-executivo-dono.md`
- `docs/prd/prd-refatoracao-mx-performance-reuniao-2026-05-22.md`
- `src/components/Layout.tsx`
- `src/features/dashboard-loja/DashboardLoja.container.tsx`
- `src/features/dashboard-loja/sections/PerformanceTab.tsx`
- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx`

---

## Dev Agent Record

- `npm run typecheck`: passou.
- `npm run lint`: passou com warnings preexistentes de acessibilidade fora do escopo desta story.
- `npm test`: passou, 308 testes, 0 falhas.
- `npm run build`: passou.
- Browser em `http://localhost:3002/`: validado com login `dono`, rota `/lojas/mx-consultoria?id=467a19d1-af51-4b4f-9b05-d67187a2a759`, desktop e mobile.
- Feedback visual aplicado apos comparacao com a imagem de referencia: mantido o layout global padrao do sistema, incluindo header, sidebar, drawer, bordas, sombras e tokens visuais. O ajuste ficou restrito aos componentes da Home do dono, com cards mais compactos, remocao de textos explicativos longos, alertas mais curtos, reorganizacao dos blocos internos e uso dos tokens de status/brand ja existentes.
- Navegacao interna validada com `ownerSection=consultoria`: a sidebar/header permanecem no padrao do sistema e apenas o conteudo interno do cockpit troca de componente.
- Console no cockpit autenticado: erros 400 preexistentes da consulta de `notificacoes`; a tela do cockpit renderizou.
- Revisao visual 2026-05-27 aplicada com base nas 6 imagens do modulo do dono e no documento `MX PERFORMANCE - DESENVOLVIMENTO.docx`.
- `npm run typecheck`: passou.
- `npm run lint`: passou com 56 warnings preexistentes de acessibilidade fora dos arquivos alterados.
- `npm test`: passou, 308 testes, 0 falhas.
- `npm run build`: passou.
- Browser em `http://localhost:3002/`: validado com login `dono`, rota `/lojas/mx-consultoria?id=467a19d1-af51-4b4f-9b05-d67187a2a759`, Home desktop/mobile sem overflow horizontal.
- Rotas internas validadas por query: `ownerSection=planejamento` e `ownerSection=plano-acao` renderizaram tabelas/estrutura sem overflow horizontal.

---

## Notas de Implementacao

- Nao inventar dado ausente.
- Usar valores reais ja existentes para vendas, funil, meta e disciplina.
- Se ticket medio/estoque nao existirem, exibir pendencia de integracao/cadastro.
- O indice de eficiencia pode nascer como leitura preliminar, mas precisa ter formula clara em story posterior.
- A tela deve seguir a imagem como referencia visual, mas nao deve copiar dados ficticios.
