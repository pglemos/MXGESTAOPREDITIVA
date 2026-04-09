# Plano de Implementação Detalhado: Comprehensive Fix

Este plano detalha a execução página-a-página para atingir 100% de conformidade técnica.

## 🏁 Fase 1: Fundação & Core (Layout)
- [ ] **src/components/Layout.tsx:**
    - [ ] Adicionar `<nav aria-label="Menu Principal">`.
    - [ ] Adicionar `aria-current="page"` nos links ativos.
    - [ ] Garantir que o Sidebar use `<aside>`.
    - [ ] Botão de Logout com `aria-label="Encerrar Sessão"`.
- [ ] **src/lib/supabase.ts:**
    - [ ] Auditar para garantir que o cliente é exportado como Singleton (prevenir erro GoTrue).

## 📊 Fase 2: Módulo Admin (Operacional)
- [ ] **PainelConsultor.tsx:**
    - [ ] Root em `<main>`.
    - [ ] `<caption>` na tabela de unidades.
    - [ ] `aria-label` nos botões de disparo de relatório.
- [ ] **Lojas.tsx:**
    - [ ] Modais de edição com `role="dialog"` e `aria-modal`.
    - [ ] Inputs com labels explícitos.
- [ ] **DashboardLoja.tsx:**
    - [ ] Gráficos Recharts com `desc` e labels acessíveis.
    - [ ] Skeletons nos cards de KPI.

## 👥 Fase 3: Pessoas e Rituais
- [ ] **GerenteFeedback.tsx:**
    - [ ] Formulário de feedback com `aria-required`.
    - [ ] Histórico de feedbacks com estrutura de lista semântica.
- [ ] **GerentePDI.tsx:**
    - [ ] Wizard de PDI com `aria-live="polite"` nas trocas de step.
    - [ ] Radar Chart com tabela alternativa oculta para leitores de tela.
- [ ] **Equipe.tsx:**
    - [ ] Avatar dos vendedores com `alt` nome do vendedor.

## 📈 Fase 4: Inteligência & Dados
- [ ] **MorningReport.tsx:**
    - [ ] Botão de "Compartilhar no WhatsApp" com `aria-label`.
    - [ ] Projeções com destaque visual e `aria-description`.
- [ ] **AiDiagnostics.tsx:**
    - [ ] Abas (Tabs) com `role="tablist"` e `aria-selected`.
    - [ ] Log de auditoria em container `aria-live`.

## 🛠️ Fase 5: Utilitários & Finalização
- [ ] **Reprocessamento.tsx:**
    - [ ] Input de arquivo (`type="file"`) acessível.
    - [ ] Terminal de logs com scroll automático e `aria-live="assertive"`.
- [ ] **Privacy.tsx / Terms.tsx:**
    - [ ] Hierarquia de texto rigorosa.

---

## 🚀 Workflow de Execução
Para cada arquivo:
1.  Aplicar `aria-labels` e `ids`.
2.  Substituir contrastes baixos.
3.  Implementar `Skeletons` se houver fetch.
4.  Validar no Console do navegador.

*Status: Pronto para iniciar.*
