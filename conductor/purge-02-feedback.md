# Implementation Plan: Feedback Estruturado MX (story-purge-02-feedback)

## Objective
Transformar o módulo de Feedback em um **Ritual de Auditoria Semanal MX**, instalando a análise técnica baseada no critério 20/60/33, comparativo com a equipe e diagnósticos automáticos.

---

## Key Files & Context
- `src/pages/GerenteFeedback.tsx`: Terminal de aplicação do feedback (Gerente).
- `src/pages/VendedorFeedback.tsx`: Cockpit de recepção do feedback (Vendedor).
- `src/hooks/useFeedbacks.ts`: Lógica de persistência e snapshots.
- `src/lib/calculations.ts`: Motor de diagnóstico 20/60/33.

---

## Implementation Steps

### Phase 1: Business Engine (20/60/33)
1. **Refactor `calculations.ts`**:
   - Formalizar `MX_BENCHMARKS = { lead_agd: 20, agd_visita: 60, visita_vnd: 33 }`.
   - Implementar `gerarDiagnosticoMX(funil)`: Retorna orientações rígidas baseadas no gap de cada etapa.
2. **Refactor `useFeedbacks.ts`**:
   - Implementar `getWeeklySnapshot(userId)`: Captura leads, agendamentos, visitas e vendas da semana atual do vendedor para travar no registro de feedback.

### Phase 2: Interface do Gerente (O Ritual)
1. **Update `GerenteFeedback.tsx`**:
   - **Header**: Trocar "Ciclo de Mentoria" por **"Feedback Estruturado MX"**.
   - **Dashboard In-Form**: Ao selecionar o vendedor, exibir imediatamente o card:
     - [ ] **Real vs Ideal (20/60/33)**: Barras comparativas.
     - [ ] **Comparativo Equipe**: Mostrar se o vendedor está acima ou abaixo da média da unidade.
   - **Auto-Fill**: Preencher o campo "Pontos de Atenção" com o diagnóstico técnico gerado automaticamente.
   - **Mandatory Fields**: Meta Compromisso (Vendas) e Ação de Correção de Gap.

### Phase 3: Interface do Vendedor (O Alinhamento)
1. **Update `VendedorFeedback.tsx`**:
   - Exibir o snapshot da semana em que o feedback foi dado (para que ele veja os números que geraram a crítica).
   - Botão de **"Compromisso Firmado"** para o vendedor dar ciência.

---

## Verification & Testing
- [ ] **Auditoria de Cálculo**: Simular um funil com 10% de conversão Lead->Agd e verificar se o diagnóstico aponta falha na etapa 1 (Benchmark 20%).
- [ ] **Teste de Snapshot**: Criar um feedback, mudar as vendas do vendedor no banco e verificar se o feedback antigo mantém os números originais (Snapshot).
- [ ] **Auditoria Visual**: Verificar se os termos "Mentoria" e "Elogios" foram substituídos por terminologia técnica MX.
