# Implementation Plan: Purga de Terminologia SaaS (story-purge-terminology)

## Objective
Substituir termos genéricos de produto SaaS ("cluster", "node", "pacing", "specialist") por terminologia operacional nativa da Metodologia MX ("loja", "unidade", "ritmo", "vendedor"), aumentando a aderência e autoridade do sistema perante a operação.

---

## Key Files
- `src/pages/PainelConsultor.tsx`: Remoção de "Consolidação de Rede", "Node", "Pacing".
- `src/pages/Lojas.tsx`: Troca de "Nodes" por "Unidades".
- `src/pages/Ranking.tsx`: Troca de "Especialistas" por "Vendedores/Consultores".
- `src/pages/GerentePDI.tsx`: Unificação do termo "Vendedor".
- `src/lib/calculations.ts`: Troca de `pacing` por `atingimento` ou `ritmo` nos comentários e nomes de variáveis (onde não quebrar o banco).

---

## Implementation Steps

### Phase 1: Interface Admin & Consultoria
1. **`PainelConsultor.tsx`**:
   - "Consolidação de Rede" -> "Visão Geral da Rede".
   - "Node" -> "Unidade".
   - "Pacing" -> "Atingimento".
   - "Raio-X da Operação (Unidades)" -> "Performance por Loja".
2. **`Lojas.tsx`**:
   - "Node Identifier" -> "ID da Loja".
   - "Novo Node" -> "Nova Loja".

### Phase 2: Interface de Equipe & Performance
1. **Ranking & Equipe**:
   - "Especialistas Ativos" -> "Vendedores em Arena".
   - "Filtrar Tropa" -> "Filtrar Equipe".
2. **PDI & Feedback**:
   - "Especialista Alvo" -> "Vendedor Analisado".
   - "Mentoria" -> "Feedback Estruturado".

### Phase 3: Engine de Cálculo
1. **`calculations.ts`**:
   - Renomear parâmetro `pacing` para `atingimento` na função `getOperationalStatus`.

---

## Verification & Testing
- [ ] **Auditoria Visual**: Verificar se todos os labels em caixa alta (uppercase) foram atualizados.
- [ ] **Sanity Check**: Garantir que a troca de nomes de variáveis internas não quebrou os cálculos (focar em `pacing` -> `atingimento`).
