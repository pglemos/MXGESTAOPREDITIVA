# Implementation Plan: Motor de Feedback Semanal MX (story-feedback-engine)

## Objective
Consolidar a Edge Function de Feedback Semanal como o "Motor de Auditoria" oficial, integrando cálculos por loja/vendedor, benchmark 20/60/33, meta semanal aproximada e disparo automático.

---

## Key Files
- `supabase/functions/feedback-semanal/index.ts`: O coração do motor.
- `src/lib/calculations.ts`: Centralização das regras de negócio.

---

## Implementation Steps

### Phase 1: Refatoração da Edge Function (O Motor)
1. **Cálculo de Metas Semanais**:
   - Buscar meta mensal da loja em `store_meta_rules`.
   - Calcular `meta_semanal = meta_mensal / 4`.
2. **Benchmark & Diagnóstico**:
   - Garantir uso do critério 20/60/33 nativamente.
   - Refinar a geração de diagnóstico e ação orientada.
3. **Comparativo de Equipe**:
   - Implementar cálculo de desvio (Vendedor vs Média da Unidade).
   - Expor no HTML do relatório quem está acima/abaixo da média de vendas.

### Phase 2: Automação & Trigger
1. **Agendamento Cron**:
   - Atualizar/Verificar o trigger no Supabase para toda Segunda-feira às 12:30.
2. **Idempotência**:
   - Reforçar a trava de `reprocess_logs` para evitar disparos duplicados na mesma semana.

### Phase 3: Validação Forense
1. **Teste de Carga**: Simular fechamento de uma semana com dados fictícios.
2. **Auditoria de HTML**: Verificar se o layout do e-mail é "sem dó" e focado em gaps.

---

## Verification & Testing
- [ ] **Auditoria de Cálculo**: Validar se a taxa de conversão na função bate com o manual MX.
- [ ] **Teste de Disparo**: Executar a função manualmente via CLI e verificar o log de recebimento.
