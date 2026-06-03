# Story MX-05.3 - Drill-downs dos Indicadores do Dashboard do Vendedor

## Status

Draft

## Story

**As a** Vendedor,
**I want** abrir uma visão ampliada a partir de cada indicador da Home,
**so that** eu consiga investigar meus resultados sem transformar o dashboard em uma tela densa.

## Acceptance Criteria

1. Cada indicador com fonte real possui CTA ou card clicável para uma visão detalhada.
2. Score MX, Atividades Hoje, Fechar Meu Dia e Conquistas não exibem números hardcoded ou demonstrativos.
3. Indicadores sem fonte real exibem estado pendente ou ficam ocultos até a fonte existir.
4. Drill-downs reutilizam páginas existentes quando elas já representam o detalhe correto.
5. A Home continua mobile-first, sem overflow e sem duplicar funções de CRM.

## Dependencies

- Story MX-05.2 - Drill-down de Minha Remuneração do Vendedor.
- Fontes reais para Score MX, Atividades Hoje, Fechar Meu Dia e Conquistas.

## Dev Notes

- Priorizar rotas existentes: agenda, histórico, ranking, treinamentos, devolutivas e PDI.
- Não criar drill-down para dados demonstrativos.
- Esta story não faz parte da entrega MX-05.2.

## Change Log

- 2026-06-03: Story registrada para conectar os demais indicadores após remoção de números hardcoded.
