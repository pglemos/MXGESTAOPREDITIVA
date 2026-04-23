# Plano de Implementação: Sincronia 100% do Ecossistema (Ecosystem Sync 100%)

**Status:** Concluído (Orion / AIOX Master)
**Track:** `ecosystem-sync-100`
**Propósito:** Amarrar perfeitamente as funcionalidades, dados, RLS e atualizações em tempo real entre Vendedor, Gerente, Dono e Admin MX. Garantir precisão e ausência de falhas técnicas.

---

## 🎯 Escopo por Papel (Role-Based Sync)

### 1. Vendedor (Seller)
- **Upload de Evidências em PDIs/Feedbacks:**
  - Corrigir e testar políticas do Storage (`storage.objects`) para permitir o upload correto e rastreável pelo próprio Vendedor (INSERT/SELECT limitados).
- **Edição Retroativa de Check-in:**
  - Criar um fluxo de "Solicitação de Edição" (Status: `pending_approval`) ou conceder permissão temporária via RPC/Triggers quando o Gerente habilitar.
- **Realtime Dashboard:**
  - Habilitar `Supabase Realtime` na tabela de `daily_checkins` e `feedbacks` para que o painel atualize instantaneamente ao atingir meta.

### 2. Gerente de Loja (Store Manager)
- **Rotina do Gerente (Event Bus):**
  - Implementar sistema de Webhooks internos (Edge Functions/Triggers) para notificar o Gerente via UI quando um Vendedor preenche formulários ou atinge marcos críticos.
- **Gerenciamento de Exceções:**
  - Tela fluida para aprovar edições de check-ins antigos ou estornos com log de auditoria.
- **Performance de Conversão Agregada:**
  - Refatorar queries do *DashboardLoja* e usar *Memoization* (e.g., `useMemo` com SWR/React Query) para evitar *Hydration errors* e delays.

### 3. Dono da Loja (Store Owner)
- **Painel Financeiro & DRE Consolidado:**
  - Conectar as colunas de DRE (`add_dre_columns.sql`) a um Dashboard Financeiro específico.
- **Relatórios Cruzados (Cross-Store View):**
  - Implementar componente corporativo que agrupe o faturamento de todas as lojas ativas na `memberships` sem quebrar o contexto de `store_id`. O RLS do Owner (`role = owner`) deve refletir visibilidade via JOIN em massa usando `is_manager_of() / is_owner_of()`.

### 4. Admin MX (System Admin)
- **Simulação Blindada (Impersonation):**
  - Implementar rotina segura onde a troca de Contexto (Admin -> Gerente) ocorra apenas no Backend via Sessão Efêmera, nunca misturando o `localStorage` do dispositivo real, prevenindo vazamentos de JWT.
- **Dados Históricos (Google Forms):**
  - Ajuste no script legado para criar as métricas canônicas de vendas, padronizando a fonte (`source_mode`) para que Vendedor e Gerente reconheçam 100% dos dados importados sem lacunas visuais.

---

## 🔄 Cronograma de Execução AIOX

**Fase 1: Backend & RLS Hardening (Semana 1)**
- [x] Ajuste no script `import_google_forms_history.js`.
- [x] Ajuste do RLS no Supabase para Uploads de PDIs/Feedbacks.
- [x] Implementação do mecanismo `pending_approval` para Edição Retroativa de Vendas.
- [x] Teste massivo via `*test-as-user` (Simulação nativa de cada Role).

**Fase 2: Motor de Notificação e Performance (Semana 2)**
- [x] Ativação do *Supabase Realtime* nos dashboards.
- [x] Implementação do `Event Bus` para Rotina do Gerente.
- [x] Eliminação de falhas de Hydration no *DashboardLoja*.

**Fase 3: Visualização do Owner e Segurança do Admin (Semana 3)**
- [x] Painel Consolidado de DRE do Dono.
- [x] Dashboard de Visão Cruzada (Lojas Corporativas).
- [x] Impersonation Efêmero e Estrito para Consultores/Admin MX.

---

**Assinatura:** — Orion, orquestrando o sistema 🎯