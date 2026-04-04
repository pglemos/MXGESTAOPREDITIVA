# Implementation Plan: PDI 2.0 & Check-in Temporal (story-purge-04)

## Objective
Transformar o PDI de um objeto leve em um **Processo de Evolução Técnica** e separar definitivamente a **Retrospectiva** do **Planejamento** no Check-in Diário.

---

## Key Files
- `src/pages/GerentePDI.tsx`: Refatoração para Auditoria de Competências.
- `src/pages/Checkin.tsx`: Refatoração da UX Temporal.
- `src/hooks/useCheckins.ts`: Ajuste para persistência temporal.

---

## Implementation Steps

### Phase 1: PDI 2.0 (Auditório Técnico)
1. **Radar de Capacidade**:
   - Implementar visualização de Gap (Atual vs Desejado) no PDI do vendedor.
   - Conectar as "5 Ações Mandatórias" a competências específicas do Radar.
2. **Ciclo de Revisão**:
   - Formalizar o "Acordo Firmado" como um ritual de aceite digital do vendedor.

### Phase 2: Check-in Temporal (Passado vs Futuro)
1. **UX Split**:
   - Seção **RETROSPECTIVA (Ontem)**: Foco total em números brutos (Leads, Visitas, Vendas). Cor de destaque: Emerald (Resultado).
   - Seção **AGENDA (Hoje)**: Foco total em compromissos e agendamentos. Cor de destaque: Blue (Planejamento).
2. **Lógica de Bloqueio**:
   - Se o check-in for enviado após as 09:45, a "Retrospectiva" é marcada como atrasada (Impacto Disciplinar).
   - A "Agenda" deve mostrar os agendamentos feitos *ontem* para hoje como base de comparação.

### Phase 3: Validação
1. **Auditoria Visual**: Verificar se a separação de cores e contextos está explícita.
2. **Integridade**: Garantir que o `reference_date` está sendo gravado corretamente como o dia da produção, não o dia do envio.

---

## Verification & Testing
- [ ] **Teste de Data**: Enviar um check-in na segunda de manhã e verificar se os dados de vendas caíram no domingo (referência).
- [ ] **Auditoria de PDI**: Verificar se o Radar reflete as notas de 0 a 10 salvas no banco.
