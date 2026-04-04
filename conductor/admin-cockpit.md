# Implementation Plan: Cockpit Operacional Multi-Loja (story-admin-cockpit)

## Objective
Refatorar o `PainelConsultor.tsx` para se tornar a central de comando da consultoria, focando em dados brutos de funil, gaps operacionais e rituais de controle, eliminando elementos puramente "executivos".

---

## Key Files
- `src/pages/PainelConsultor.tsx`: Interface principal.
- `src/lib/calculations.ts`: Lógica de status e projeções.

---

## Implementation Steps

### Phase 1: Engine de Status MX
1. **Update `calculations.ts`**:
   - Implementar `getOperationalStatus(pacing, disciplinePct)`: Retorna labels como "CRÍTICO", "ATENÇÃO", "NO RITMO", "EXCELÊNCIA".
   - Garantir que a projeção use o peso correto dos dias úteis (se disponível) ou mantenha a linearidade MX.

### Phase 2: Refatoração da Interface (O Painel Sem Dó)
1. **Header**:
   - Manter os gatilhos de relatórios (Matinal, Semanal, Mensal) como "Botões de Disparo".
   - Adicionar KPI de Rede: "Gap Consolidado da Rede".
2. **Grid Operacional**:
   - Reorganizar as colunas da tabela:
     - **Unidade**: Nome + ID curto.
     - **Funil Bruto**: Leads | Agendamentos | Visitas.
     - **Vendas**: Destaque em negrito.
     - **Meta**: Valor absoluto.
     - **Gap**: Diferença negativa destacada em vermelho.
     - **Projeção**: Valor projetado para o fim do mês.
     - **Status Atual**: Label colorido (Crítico/Atenção/OK).
     - **Disciplina**: Registro de Check-ins (X/Y vendedores).

### Phase 3: Interatividade & Auditoria
1. **Navegação**:
   - Clique na linha deve levar ao `DashboardLoja` com o ID da loja.
2. **Filtros**:
   - Adicionar filtro rápido por "Status" (ex: Ver apenas lojas em 'Atenção').

---

## Verification & Testing
- [ ] **Auditoria de Dados**: Comparar o Gap exibido com `Meta - Vendas` manualmente.
- [ ] **Teste de Status**: Forçar uma loja com 10% de pacing e verificar se o status muda para "CRÍTICO".
- [ ] **Auditoria Visual (driftx)**: Capturar tela e validar se a leitura dos dados está fluida e sem distrações visuais.
