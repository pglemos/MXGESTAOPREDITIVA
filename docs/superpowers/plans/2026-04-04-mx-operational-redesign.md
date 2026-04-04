# MX Operational Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the system's core interfaces to align with the MX Methodology (Operational/Disciplined) by updating terminology, navigation, and key performance modules.

**Architecture:** Use a persona-based navigation structure and data-driven analytical views for feedback and reports. Leverage existing calculation logic in `src/lib/calculations.ts`.

**Tech Stack:** React (TypeScript), Tailwind CSS, Lucide React, date-fns, useAppStore (Zustand).

---

### Task 1: Terminology & Language Refactor (7.1)

**Files:**
- Modify: `src/components/Layout.tsx`
    - Replace technical categories with operational terms.
- Modify: `src/pages/Lojas.tsx`
    - Replace "Cluster" with "Loja" in titles and tables.
- Modify: `src/pages/Equipe.tsx`
    - Replace "Nodes" with "Vendedores" in labels and counts.
- Modify: `src/lib/calculations.ts`
    - Update `getOperationalStatus` labels (e.g., 'INDISCIPLINA' already exists, ensure consistent usage).

- [ ] **Step 1: Perform global string replacement for 'Cluster' -> 'Loja' and 'Node' -> 'Vendedor'**
    - [ ] **Action:** Scan all files in `src/pages` and `src/components`.
    - [ ] **Action:** Replace hardcoded strings.

- [ ] **Step 2: Commit Language Refactor**
```bash
git add .
git commit -m "refactor: update terminology to MX operational standards"
```

---

### Task 2: Role-Based Navigation Hierarchy (7.2)

**Files:**
- Modify: `src/components/Layout.tsx`

- [ ] **Step 1: Update `navConfig` to match MX Personas**

```typescript
const navConfig: Record<string, NavCategory[]> = {
  admin: [
    {
      category: 'Gestão Geral', icon: <Grid size={22} />,
      items: [
        { label: 'Painel Geral', path: '/painel', icon: <LayoutDashboard size={16} /> },
        { label: 'Lojas', path: '/lojas', icon: <Building2 size={16} /> },
        { label: 'Metas', path: '/metas', icon: <Target size={16} /> },
        { label: 'Visão Geral', path: '/visao-geral', icon: <Activity size={16} /> },
      ]
    },
    {
      category: 'Rituais MX', icon: <Target size={22} />,
      items: [
        { label: 'Relatório Matinal', path: '/relatorio-matinal', icon: <Presentation size={16} /> },
        { label: 'Feedback Semanal', path: '/feedback', icon: <MessageSquare size={16} /> },
        { label: 'Treinamentos', path: '/treinamentos', icon: <GraduationCap size={16} /> },
      ]
    }
  ],
  gerente: [
    {
      category: 'Operação Loja', icon: <Home size={22} />,
      items: [
        { label: 'Painel da Loja', path: '/loja', icon: <LayoutDashboard size={16} /> },
        { label: 'Equipe', path: '/equipe', icon: <Users size={16} /> },
        { label: 'Check-ins', path: '/checkin', icon: <CheckSquare size={16} /> },
        { label: 'Ranking', path: '/ranking', icon: <Trophy size={16} /> },
      ]
    },
    {
      category: 'Gestão de Gente', icon: <User size={22} />,
      items: [
        { label: 'Feedback Estruturado', path: '/feedback', icon: <MessageSquare size={16} /> },
        { label: 'PDI', path: '/pdi', icon: <TrendingUp size={16} /> },
        { label: 'Treinamentos', path: '/treinamentos', icon: <GraduationCap size={16} /> },
      ]
    }
  ],
  vendedor: [
    {
      category: 'Meu Ritual', icon: <Home size={22} />,
      items: [
        { label: 'Home', path: '/home', icon: <Home size={16} /> },
        { label: 'Lançamento Diário', path: '/checkin', icon: <CheckSquare size={16} /> },
        { label: 'Histórico', path: '/historico', icon: <History size={16} /> },
        { label: 'Ranking', path: '/ranking', icon: <Trophy size={16} /> },
      ]
    },
    {
      category: 'Evolução', icon: <TrendingUp size={22} />,
      items: [
        { label: 'Feedback', path: '/feedback', icon: <MessageSquare size={16} /> },
        { label: 'PDI', path: '/pdi', icon: <TrendingUp size={16} /> },
        { label: 'Treinamentos', path: '/treinamentos', icon: <GraduationCap size={16} /> },
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit Navigation Changes**
```bash
git add src/components/Layout.tsx
git commit -m "feat: implement persona-based navigation hierarchy"
```

---

### Task 3: Hard Operational Morning Report (7.4)

**Files:**
- Modify: `src/pages/MorningReport.tsx`

- [ ] **Step 1: Implement "Rhythm" and "Mathematical Projection" cards**
    - Remove editorial/briefing placeholders.
    - Show `currentSales` | `teamGoal` | `projection` | `gap` (Falta X).

- [ ] **Step 2: Implement "Sem Registro" Alert Section**
    - Show list of sellers who haven't submitted today's check-in or yesterday's result.

- [ ] **Step 3: Implement WhatsApp Resumo formatting**
```typescript
const handleWhatsAppShare = () => {
  const text = encodeURIComponent(
    `*RELATÓRIO MATINAL MX - ${format(new Date(), 'dd/MM')}*\n\n` +
    `📈 *Vendas:* ${metrics.currentSales}\n` +
    `🎯 *Meta:* ${metrics.teamGoal}\n` +
    `🔮 *Projeção:* ${metrics.projection}\n` +
    `🚩 *Gap:* ${metrics.gap}\n\n` +
    `*SITUAÇÃO:* ${metrics.projectedReaching >= 100 ? '✅ NO RITMO' : '⚠️ ABAIXO DA META'}\n\n` +
    `*PENDÊNCIAS:* ${pendingSellers.map(s => s.name).join(', ') || 'Nenhuma'}`
  )
  window.open(`https://wa.me/?text=${text}`, '_blank')
}
```

- [ ] **Step 4: Commit Morning Report Refactor**
```bash
git add src/pages/MorningReport.tsx
git commit -m "feat: redesign morning report as hard operational briefing"
```

---

### Task 4: Tabular Feedback & PDI (7.3)

**Files:**
- Modify: `src/pages/Feedback.tsx` (Vendedor view)
- Modify: `src/pages/GerenteFeedback.tsx` (Gerente audit view)

- [ ] **Step 1: Refactor Feedback to Tabular View**
    - Show weekly history in a table: `Semana | Leads | Agd | Visitas | Vendas | Gap`.
    - Apply conditional coloring for gaps based on 20/60/33 benchmarks.

- [ ] **Step 2: Redesign PDI for Decision-Making**
    - Add competence radar (existing) + Timeline of 5 mandatory actions.

- [ ] **Step 3: Commit Feedback/PDI Changes**
```bash
git add src/pages/Feedback.tsx src/pages/GerenteFeedback.tsx
git commit -m "feat: transform feedback/pdi into analytical audit tools"
```

---

### Task 5: Disciplined Check-in (7.5)

**Files:**
- Modify: `src/pages/Checkin.tsx`

- [ ] **Step 1: Visual Separation (Yesterday vs Today)**
    - Section 1: **ONTEM (Obrigatório)** - Leads, Agendamentos, Visitas, Vendas Reais.
    - Section 2: **HOJE (Planejado)** - Meta Compromisso.

- [ ] **Step 2: Add Deadline Warning**
    - Label: "Lançamento obrigatório até as 10:00. O não lançamento gera Alerta Vermelho no Matinal."

- [ ] **Step 3: Commit Check-in Refactor**
```bash
git add src/pages/Checkin.tsx
git commit -m "feat: refactor check-in for operational discipline"
```

---

### Final Validation (Auditoria Forense)

- [ ] **Step 1: Verify Role Navigation** - Login as Admin, Gerente, and Vendedor.
- [ ] **Step 2: Verify Calculations** - Check if projections and gaps in Matinal match expectations.
- [ ] **Step 3: Verify Terminology** - Ensure no tech terms are visible.
