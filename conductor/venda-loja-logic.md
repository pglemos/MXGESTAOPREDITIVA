# Implementation Plan: Formalização de "VENDA LOJA" (story-venda-loja-domain)

## Objective
Formalizar a entidade "VENDA LOJA" no sistema para que ela seja contabilizada no total da unidade e apareça no ranking, porém sem contaminar as metas individuais e os benchmarks técnicos (20/60/33) da equipe.

---

## Key Files
- `src/types/database.ts`: Inclusão do flag `is_venda_loja`.
- `src/lib/calculations.ts`: Ajuste para ignorar benchmarks em usuários "Venda Loja".
- `src/pages/Ranking.tsx`: Tratamento visual diferenciado.
- `src/hooks/useTeam.ts`: Lógica para identificar/criar a entidade Venda Loja na unidade.

---

## Implementation Steps

### Phase 1: Domínio & Cálculos
1. **Update `calculations.ts`**:
   - Modificar `gerarDiagnosticoMX` para retornar um estado "SISTÊMICO" ou "SALDO" quando o registro for Venda Loja.
   - Garantir que a média da equipe ignore o registro de Venda Loja para não puxar a média de conversão (leads/visitas) para baixo.

### Phase 2: Interface de Ranking & Feedback
1. **Ranking**:
   - Destacar "VENDA LOJA" com estilo visual diferente (ex: fundo slate-100, sem foto).
   - Exibir meta como `0` ou `N/A` para este item específico.
2. **Feedback**:
   - Impedir abertura de feedback estruturado para a entidade "VENDA LOJA".

### Phase 3: Gestão de Unidade
1. **Setup Automático**:
   - Criar uma função no hook de gerenciamento que garanta que toda loja tenha um "usuário virtual" ou registro de saldo chamado "VENDA LOJA".

---

## Verification & Testing
- [ ] **Teste de Ranking**: Inserir uma venda via "VENDA LOJA" e confirmar que o total da loja subiu, mas a média de atingimento dos vendedores não mudou.
- [ ] **Auditoria Visual**: Confirmar que "VENDA LOJA" não aparece no topo do ranking como um competidor comum, mas sim como um item de conciliação.
