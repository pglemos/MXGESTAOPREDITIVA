# Implementation Plan: Notificações Disciplinares MX (story-purge-03-notifications)

## Objective
Canonizar o sistema de notificações para atuar como o **Motor de Disciplina MX**, permitindo alertas segmentados por usuário, cobranças automáticas de rituais (Check-in, Feedback, PDI) e distinção entre alertas críticos e informativos.

---

## Key Files & Context
- `src/hooks/useData.ts`: Hook `useNotifications` que gerencia a leitura e marcação de lidas.
- `src/pages/Notificacoes.tsx`: Interface de listagem de alertas.
- `supabase/migrations/`: Ajuste da tabela `notifications` para suportar multi-tenancy e tipos.

---

## Implementation Steps

### Phase 1: Database & Schema (The Core)
1. **Refactor `notifications` Table**:
   - Adicionar `recipient_id` (UUID references users).
   - Adicionar `store_id` (UUID references stores).
   - Adicionar `type` (discipline, alert, performance, system).
   - Adicionar `priority` (high, medium, low).
   - Adicionar `link` (Opcional: path para redirecionamento).
   - Ativar RLS para que usuários vejam apenas suas próprias notificações.

### Phase 2: Disciplinary Triggers (Automated Enforcement)
1. **Automation Logic**:
   - **Check-in Alert**: Se `now() > 09:45` e não houver `daily_checkin` para a `reference_date`, disparar alerta `discipline` (High) para o vendedor e gerente.
   - **Feedback Alert**: Ao criar um feedback, disparar alerta `performance` para o vendedor.
   - **PDI Alert**: Quando um PDI estiver a 2 dias do `due_date`, disparar alerta `alert` para o gerente.

### Phase 3: Interface & UX (The Inbox)
1. **Update `Notificacoes.tsx`**:
   - **Categorização**: Agrupar por "Hoje", "Ontem" e "Anteriores".
   - **Visual Disciplinar**: Alertas do tipo `discipline` devem ter bordas vermelhas e ícone de `AlertTriangle`.
   - **Redirecionamento**: Clicar em um alerta de Check-in leva direto para a página `/checkin`.
2. **Global Badge**: Garantir que o contador de não lidas no Header reflita apenas as notificações do usuário logado.

---

## Verification & Testing
- [ ] **Auditoria de Segmentação**: Criar uma notificação para o Usuário A e garantir que o Usuário B não a visualize.
- [ ] **Teste de Redirecionamento**: Clicar em uma notificação com `link` e verificar se a navegação funciona.
- [ ] **Auditoria de Prioridade**: Verificar se os alertas disciplinares (Check-in atrasado) aparecem no topo e com destaque visual.
