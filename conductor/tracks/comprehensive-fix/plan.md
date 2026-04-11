# Plano de Implementação Detalhado: Comprehensive Fix

Este plano detalha a execução página-a-página para atingir 100% de conformidade técnica.

## 🏁 Fase 1: Fundação & Core (Layout) [DONE]
- [x] **src/components/Layout.tsx:**
    - [x] Adicionar `<nav aria-label="Menu Principal">`.
    - [x] Adicionar `aria-current="page"` nos links ativos.
    - [x] Garantir que o Sidebar use `<aside>`.
    - [x] Botão de Logout com `aria-label="Encerrar Sessão"`.
- [x] **src/lib/supabase.ts:**
    - [x] Auditar para garantir que o cliente é exportado como Singleton (prevenir erro GoTrue).

## 📊 Fase 2: Módulo Admin (Operacional) [DONE]
- [x] **PainelConsultor.tsx:**
    - [x] Root em `<main>`.
    - [x] `<caption>` na tabela de unidades.
    - [x] `aria-label` nos botões de disparo de relatório.
- [x] **Lojas.tsx:**
    - [x] Modais de edição com `role="dialog"` e `aria-modal`.
    - [x] Inputs com labels explícitos.
- [x] **DashboardLoja.tsx:**
    - [x] Gráficos Recharts com `desc` e labels acessíveis. (N/A - Utilizado barras de progresso semânticas)
    - [x] Skeletons nos cards de KPI.
## 👥 Fase 3: Pessoas e Rituais [DONE]
- [x] **GerenteFeedback.tsx:**
    - [x] Formulário de feedback com `aria-required`.
    - [x] Histórico de feedbacks com estrutura de lista semântica (ul/li).
- [x] **GerentePDI.tsx:**
    - [x] Wizard de PDI com `aria-live="polite"` nas trocas de step.
    - [x] Radar Chart com tabela alternativa oculta para leitores de tela.
- [x] **Equipe.tsx:**
    - [x] Avatar dos vendedores com `alt` nome do vendedor.

## 📱 Fase 4: Experiência do Vendedor (Hardening) [DONE]
- [x] **VendedorHome.tsx:**
    - [x] Botão de "Compartilhar no WhatsApp" com `aria-label`.
    - [x] Projeções com destaque visual e `aria-description`.
- [x] **AiDiagnostics.tsx:**
    - [x] Log de auditoria em container `aria-live`.
- [x] **LeadOps.tsx:**
    - [x] Botões de ação com `aria-label`.

## 🛠️ Fase 5: Utilitários & Finalização [DONE]
- [x] **Reprocessamento.tsx:**
    - [x] Input de arquivo (`type="file"`) acessível.
    - [x] Terminal de logs com scroll automático e `aria-live="assertive"`.
- [x] **Privacy.tsx / Terms.tsx:**
    - [x] Hierarquia de texto rigorosa (h1 -> h2).

---

## 🚀 Workflow de Execução
Para cada arquivo:
1.  Aplicar `aria-labels` e `ids`.
2.  Substituir contrastes baixos.
3.  Implementar `Skeletons` se houver fetch.
4.  Validar no Console do navegador.

*Status: 100% CONCLUÍDO - Hardening de Acessibilidade e Performance Finalizado.*
