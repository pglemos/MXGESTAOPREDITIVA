# Implementation Plan: Cockpit de Rituais MX (story-manager-rituals)

## Objective
Consolidar a jornada do gerente em um trilho único no `RotinaGerente.tsx`, permitindo a execução completa dos rituais diários, semanais e mensais com contexto imediato.

---

## Key Files
- `src/pages/RotinaGerente.tsx`: Interface central.
- `src/hooks/useData.ts`: Garantir que os hooks de PDI e Feedback tragam os dados necessários.

---

## Implementation Steps

### Phase 1: Ritual Matinal (O Despertar da Operação)
1. **Agenda Consolidada**: Adicionar um card que mostra o volume de leads estagnados e agendamentos totais do dia, divididos por canal (Porta/Digital).
2. **Validação de Ritmo**: Exibir o "Ritmo Necessário" (Daily Run Rate) para bater a meta, comparado ao realizado de ontem.

### Phase 2: Ritual de Segunda (Auditoria Semanal)
1. **Matriz de Feedback Contextual**: Ao clicar em um vendedor pendente, abrir um mini-painel (overlay ou expand) com os números da semana dele (20/60/33) e o botão para "Registrar Compromisso".
2. **Comparativo de Gap**: Exibir quem está puxando a média da unidade para baixo.

### Phase 3: Ritual Estratégico (PDI & Evolução)
1. **Trilho de Evolução**: No tab Mensal, adicionar a funcionalidade de "Revisão Rápida" para PDIs vencendo, permitindo atualizar as "5 Ações Mandatórias" diretamente na lista.

---

## Verification & Testing
- [ ] **Teste de Fluxo**: Simular o disparo do matinal após cobrar a tropa.
- [ ] **Auditoria Visual**: Verificar se o gerente consegue completar o ritual de segunda sem sair da tela de Rotina.
