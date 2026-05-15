# Wave 1 Architecture Notes - Consultoria PMR Pronta para Uso

**Status:** Preflight tecnico preparado por @aiox-master  
**Destino:** @architect, @data-engineer, @ux-design-expert, @dev  
**Stories:** CONS-13, CONS-14, CONS-15, CONS-16

## Decisao de Corte

A Onda 1 nao e fundacional. O repositorio ja possui PMR 1-7, agenda, conclusao legada, relatorio de visita, planejamento estrategico, importadores e scripts CLI. A implementacao deve evoluir esses pontos sem criar um motor paralelo.

## Reuso Obrigatorio

- `scripts/seed_pmr_methodology.ts`: fonte atual de metodologia PMR 1-7.
- `src/hooks/useConsultingClientBySlug.ts`: detalhe do cliente, visitas, evidencias e operacoes administrativas.
- `src/hooks/useAgendaAdmin.ts`: agenda e criacao/edicao de visitas.
- `src/features/consultoria/components/VisitExecutionViews.tsx`: execucao por numero de visita.
- `src/features/consultoria/components/VisitReportTemplate.tsx`: template visual do relatorio.
- `src/lib/schemas/consulting-client.schema.ts`: validacao Zod do dominio de consultoria.
- `docs/stories/story-OPS-20260514-legacy-pmr-visit-completion.md`: fluxo legado que deve continuar restrito a visitas 1-7.

## Achados Tecnicos

### Limites atuais em 1..7

Foram encontrados limites diretos:

- `src/hooks/useConsultingClientBySlug.ts`
  - filtra visitas para `visit_number >= 1 && visit_number <= 7`;
  - valida `input.visit_number > 7` como erro;
  - mensagem: "O PMR trabalha apenas com visitas de 1 a 7."
- `src/hooks/useAgendaAdmin.ts`
  - query usa `.gte('visit_number', 1).lte('visit_number', 7)`;
  - `createVisit` e `updateVisit` chamam `validPmrVisitNumber`;
  - mensagem: "O PMR trabalha apenas com visitas de 1 a 7."
- `scripts/seed_pmr_methodology.ts`
  - `total_visits: 7`;
  - desativa `pmr_9`;
  - insere apenas visitas 1-7.
- `src/hooks/useConsultingClients.ts`
  - sumarizacao tambem filtra visitas 1..7.

### Periodo de analise

Ja existem `period_start` e `period_end` em planejamento estrategico, mas nao no tipo `ConsultingVisit`. Para CONS-15, a opcao mais simples e adicionar campos de periodo diretamente em `visitas_consultoria`.

Campos recomendados:

- `analysis_period_start date`
- `analysis_period_end date`
- `analysis_period_preset text null`

Motivo: periodo pertence ao contexto da visita e do relatorio, nao substitui fechamento mensal nem planejamento estrategico.

### Relatorio e resumo

`VisitReportTemplate.tsx` ja usa:

- `executive_summary`
- `feedback_client`
- `next_cycle_goal`
- `attachments`
- dados base do header

CONS-16 deve criar um builder deterministico em `src/lib/consultoria/visit-report-summary.ts`, para ordenar secoes MX sem depender da ordem da conversa.

## Recomendacao de Implementacao

### CONS-13

1. Criar migration de extensao de metodologia para visita 8.
2. Atualizar seed PMR para total 8 ou criar programa compativel `pmr_8`.
3. Relaxar validadores de visita para aceitar 1..8 nos fluxos normais.
4. Manter conclusao legada em 1..7.

### CONS-14

1. Reorganizar a tela de visita em secoes sequenciais.
2. Separar objetivo/metodologia/checklist de registros operacionais.
3. Nao criar nova rota se a rota atual ja comportar o fluxo.

### CONS-15

1. Adicionar periodo na visita.
2. Expor presets no frontend.
3. Propagar periodo para header/relatorio.

### CONS-16

1. Criar builder deterministico de resumo.
2. Integrar builder ao fluxo de salvar/finalizar visita.
3. Atualizar template para exibir periodo e secoes padrao.

## Riscos

- Alterar limite 1..7 de forma ampla pode afetar dashboards que medem ciclo PMR principal. Ajustar por contexto.
- `current_visit_step` pode assumir 7 como maximo em outros pontos; buscar antes de implementar.
- Se `pmr_7` virar `pmr_8`, relatorios antigos podem mudar sem necessidade. Preferir extensao compativel.
- Relatorio nao deve depender de IA para MVP.

## Gate Arquitetural

Antes de desenvolvimento:

- Confirmar abordagem `pmr_7 + etapa 8` vs `pmr_8`.
- Confirmar nomes finais dos campos de periodo.
- Confirmar quais telas devem listar visita 8 como ciclo principal e quais devem continuar exibindo somente 1-7.

