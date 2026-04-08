# Implementation Plan: Check-in Temporal MX (story-purge-01-checkin)

## Objective
Transformar o Check-in em um **Ritual Operacional MX**, separando a data de produção (Referência) da data de envio (Registro), implementando o bloqueio de 09:30 e a semântica correta de "Ontem" vs "Hoje".

---

## Key Files & Context
- `src/pages/Checkin.tsx`: Interface do terminal de registro.
- `src/hooks/useCheckins.ts`: Lógica de salvamento e recuperação.
- `src/lib/calculations.ts`: Cálculo de totais e projeções.
- `supabase/migrations/`: Ajuste da tabela `daily_checkins` se necessário.

---

## Implementation Steps

### Phase 1: Database & Hooks (The Core)
1. **Refactor `useCheckins.ts`**:
   - Implementar `calculateReferenceDate()`: Se `now() < 09:45`, a data de referência é `yesterday`. Se `now >= 09:45`, a data de referência é `today`.
   - Adicionar campo `submitted_at` (timestamp) e `reference_date` (date) no payload de salvamento.
   - Modificar `fetchTodayCheckin` para buscar pelo `reference_date` calculado, não pelo `now()`.

### Phase 2: Interface & Semantics (The Ritual)
1. **Update `Checkin.tsx` Labels**:
   - Trocar "Terminal de Registro" por **"Check-in Diário MX"**.
   - Trocar "Lançar Performance" por **"Salvar Produção"**.
2. **Implement Visual Lockdown**:
   - Se `now() > 09:30`, exibir aviso vermelho: **"REGISTRO EM ATRASO: IMPACTO NO RANKING E MATINAL"**.
   - Se já existe registro para a `reference_date`, entrar em modo "Visualização/Edição" com alerta.
3. **Semantic Separation**:
   - Garantir que `leads`, `vendas_*`, `visitas` sejam explicitamente rotulados como **"(Produção de Ontem)"**.
   - Garantir que `agd_*` sejam explicitamente rotulados como **"(Compromissos de Hoje)"**.

### Phase 3: Validation & Logic
1. **Business Rules Enforcement**:
   - Bloquear registros futuros (tentativa de lançar amanha).
   - Bloquear registros retroativos manuais fora do fluxo administrativo (somente via admin).

---

## Verification & Testing
- [ ] **Teste de Horário Matinal**: Alterar o relógio do sistema para 08:00 e verificar se a data de referência é o dia anterior.
- [ ] **Teste de Horário Pós-Prazo**: Alterar para 10:00 e verificar se a data de referência é o dia atual (ou bloqueado conforme regra MX).
- [ ] **Auditoria de Banco**: Verificar no Supabase se `reference_date` e `submitted_at` estão gravados corretamente e de forma distinta.
- [ ] **Auditoria Visual**: Rodar `driftx capture` e ler para confirmar que os labels estão alinhados com a metodologia.
