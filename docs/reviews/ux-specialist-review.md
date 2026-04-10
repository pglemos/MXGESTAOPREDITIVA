# UX Specialist Review (@ux-design-expert)

## 🎯 Respostas às Perguntas da Arquitetura
- **Migração `ui/` para `atoms/`**: Proponho uma migração em 3 ondas:
  1. **Onda 1 (Automática)**: `Badge`, `Input`, `Label`. Substituição via script `sed/grep` por serem 1:1.
  2. **Onda 2 (Manual)**: `Select`, `Dialog`, `Tabs`. Requer validação de portais Radix e acessibilidade.
  3. **Onda 3 (Depreciação)**: Remoção física da pasta `src/components/ui/`.
- **Especificação de Skeletons**: Atualmente temos "flashes" brancos durante o carregamento. Precisamos criar `src/components/atoms/Skeleton.tsx` que suporte os tokens `mx-radius`. Cada `Molecule` (ex: `MXScoreCard`) deve exportar seu próprio componente de `StaticLoading`.

---

## 🔍 Validação de Débitos Técnicos

### FE-01: Dashboards Monolíticos (Médio)
- **Validação**: Concordo totalmente. `VendedorHome.tsx` está difícil de manter. A lógica de "Tactical Prescription" deve ser extraída para um hook `useTacticalPrescription` ou uma feature separada.
- **Impacto UX**: Código complexo = bugs de renderização. Precisamos simplificar para garantir 60fps nas animações `Motion`.

### FE-02: Inconsistência de "Empty States" (Novo)
- **Validação**: Identifiquei que quando um vendedor não tem check-ins, a tela fica vazia ou com cards zerados sem explicação.
- **Recomendação**: Criar um componente `Organism` de `EmptyState` com ilustrações ou mensagens motivacionais (conforme a voz da marca MX).

### FE-03: Performance de Animações em Mobile
- **Validação**: O uso excessivo de `AnimatePresence` em listas grandes (Ranking) pode causar gargalos em dispositivos low-end.
- **Ação**: Implementar `layout transition` apenas nos top 3 do ranking.

---

## 📈 Priorização Uma (Especialista UX)
1. **Padronização de Skeletons (LCP/CLS)**: Alta (Melhora percepção de performance).
2. **Refatoração de Dashboards Monolíticos**: Média.
3. **Migração de Componentes Restantes**: Baixa (Estético/Manutenibilidade).

Salve em: docs/reviews/ux-specialist-review.md
