# Plano de Implementação: MX Performance v1.1 (Qualidade Operacional)

## 🎯 Objetivo
Elevar a maturidade do sistema de uma ferramenta de "coleta passiva" para um motor de "gestão ativa" de alta precisão. O foco desta trilha é resolver dores operacionais (atritos de correção, projeções enviesadas por finais de semana) e fortalecer a governança de equipe.

---

## 🏗️ Fases de Implementação

### Fase 1: Fundação de Dias Úteis (Projeção Inteligente) [DONE]
- [x] **Banco de Dados:** Adicionar campo `projection_mode` (enum: `calendar`, `business`) na tabela `store_meta_rules`.
- [x] **Lógica de Negócio (`src/lib/calculations.ts`):** 
    - [x] Criar função utilitária para contagem de dias úteis no mês vigente.
    - [x] Adaptar `getDiasInfo` e `calcularProjecao` para respeitar a configuração da loja.
- [x] **UI/UX (`OperationalSettings.tsx`):** Interface para Dono/Gerente alternar o modo de cálculo.

### Fase 2: Auditoria e Correção Retroativa (Zero Atrito) [DONE]
- [x] **Banco de Dados:** 
    - [x] Criar tabela `checkin_correction_requests` (vendedor_id, checkin_id, data_nova, motivo, status: pending/approved/rejected, auditor_id).
    - [x] Criar tabela de log de auditoria `checkin_audit_logs`.
- [x] **App Vendedor (`History.tsx`):** Botão "Solicitar Ajuste" em check-ins antigos, abrindo modal com justificativa.
- [x] **App Gerente (`RotinaGerente.tsx`):** Nova aba "Ajustes Pendentes" permitindo aprovar ou negar (com recálculo automático do funil).

### Fase 3: Matriz de Absorção (Academy) [IN PROGRESS]
- [x] **Banco de Dados:** Nenhuma mudança necessária (dados já existem em `training_progress`).
- [ ] **App Gerente (`GerenteTreinamentos.tsx`):** 
    - [ ] Nova view em formato de Tabela Matricial (Vendedores x Treinamentos).
    - [ ] Ícones visuais rápidos (✅ Visto, ❌ Pendente).
    - [ ] Botão "Cobrar Tropa" (disparo de notificação em massa para quem tem pendência naquele módulo específico).

---

## 🛡️ Critérios de Verificação (QA)
- **QA-01:** Mudar `projection_mode` para `business` deve recalcular imediatamente o card de "Projeção MX" no dashboard do gerente e vendedor, reduzindo o denominador e estabilizando o ritmo.
- **QA-02:** Um vendedor não pode solicitar duas correções para o mesmo check-in se já houver uma pendente.
- **QA-03:** A aprovação de uma correção retroativa deve refletir imediatamente no gráfico 90D e no Score MX do vendedor.

---
*Status: Aguardando Aprovação Formal para sair do Plan Mode.*
