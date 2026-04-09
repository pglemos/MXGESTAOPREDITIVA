# Plano de Execução Multiagente: Módulo PDI (End-to-End)

Este plano orquestra de forma cirúrgica o cumprimento das histórias do Módulo PDI, garantindo a ingestão fiel dos dados da MX Escola de Negócios e a automação do fluxo em 45 minutos.

## Etapa 1: Infraestrutura de Dados e Dicionários (Foundation)
*   **Agentes:** `@architect` e `@data-engineer`
*   **Tarefa:** Ler detalhadamente o `epic.md` e a `story-01.md`. Criar as tabelas no Supabase com *migrates* ou scripts SQL. Criar scripts de **Seed** contendo 100% dos textos transcritos no Epic (As 18 competências com indicadores exatos, as faixas de nível 1 a 5 e as ações predefinidas). Implementar as RLS policies para segurança.
*   **Critério de Saída:** Schemas no Supabase ativos e populados; RPCs listados na Story 01 funcionando.

## Etapa 2: Interface PDI - O Cockpit do Gestor
*   **Agentes:** `@dev` e `@ux-design-expert`
*   **Tarefa:** Implementar a `story-02.md`. O frontend (React/Next.js/Vite) deve possuir um assistente (Wizard/Stepper) com 4 passos.
    *   Integrar gráficos via `Recharts` para criar o "Mapa de Competências" (Gráfico de Radar com a escala travada no cargo).
    *   Criar o seletor visual dinâmico com autocomplete para buscar a "Ação Recomendada" baseada na competência fraca.
    *   A interface deve forçar o relógio mental (PDI - Metas 7 min, etc), exibindo indicadores e descrições na própria UI.
    *   Implementar botão de gerar PDF (`jspdf` ou `html2canvas` + `pdfmake`).
*   **Critério de Saída:** Fluxo completo do gestor salvando a sessão no banco e gerando o Radar visual e PDF.

## Etapa 3: Tracking, Evidências e Portal do Colaborador
*   **Agentes:** `@dev` e `@data-engineer`
*   **Tarefa:** Implementar a `story-03.md`.
    *   Criar Bucket no Supabase (`pdi_evidences`).
    *   Criar UI de tabela "Ações de Desenvolvimento" para o Vendedor com botão de Upload e alteração de status.
    *   Criar View/Dashboard do gestor agregando status dos liderados.
*   **Critério de Saída:** Upload funcionando e status da tarefa integrando tempo real no dashboard do gerente.

## Etapa 4: Code Review, Teste Preditivo e Homologação
*   **Agente:** `@qa`
*   **Tarefa:** Simular uma sessão completa ponta a ponta. Validar se regras como (1) mínimo 1 meta pessoal e 1 profissional e (2) limite de 5 ações de foco estão sendo validadas no front e no back.
*   **Critério de Saída:** Aprovação livre de bugs do módulo.

---
Para disparar a máquina de execução (modo engine), digite:
`*run-workflow conductor/tracks/modulo-pdi/plan.md --mode=engine`