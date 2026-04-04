# Plan: Feedback Estruturado de Verdade (MX Official)

## Objective
Transformar o painel do gerente em uma central de auditoria técnica real, permitindo visualizar o histórico do vendedor, comparativo explícito com a média da equipe e diagnósticos automáticos baseados no rigor 20/60/33.

## Key Files
- `src/pages/GerenteFeedback.tsx`: Terminal de aplicação de feedback.
- `src/hooks/useData.ts`: Recuperação de históricos.
- `src/lib/calculations.ts`: Motor de comparação.

## Implementation Steps

### Phase 1: Data & Hooks
1. **Refinar `useFeedbacks`**: Adicionar filtro opcional por `seller_id` para facilitar a busca do histórico específico durante a criação do novo feedback.
2. **Cálculo de Média de Equipe**: Garantir que o cálculo da média da unidade ignore o vendedor selecionado (opcional, mas recomendado para clareza).

### Phase 2: Manager Interface (Audit Terminal)
1. **Histórico Semanal do Vendedor**:
   - Implementar seção `HistoricoVendedor` que aparece ao selecionar um especialista.
   - Mostrar as últimas 4 metas compromisso e se foram atingidas (via cruzamento com check-ins posteriores).
2. **Refinamento do Dashboard 20/60/33**:
   - Visualização de "Gap Técnico": Valor absoluto que falta para atingir o benchmark.
3. **Seções de Texto Canonizadas**:
   - Rotular claramente como: **Diagnóstico de Performance (Automático)**, **Plano de Ação Mandatório** e **Meta Compromisso**.

### Phase 3: Validation & Ritual
1. **Bloqueio de Duplicidade**: Impedir a criação de dois feedbacks "oficiais" para a mesma semana de referência.
2. **Auditoria Visual**: Usar `driftx` para garantir que o layout transmita "autoridade e rigor" em vez de "mentoria leve".

## Verification
- [ ] Selecionar vendedor e ver o histórico de feedbacks anteriores.
- [ ] Verificar se os números da semana batem com os check-ins lançados.
- [ ] Confirmar se o diagnóstico 20/60/33 altera conforme os números mudam.
