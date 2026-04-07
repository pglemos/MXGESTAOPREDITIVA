# Spec: Operação Grande Purgação: Refatoração Forense e Eliminação de Mocks

> **Story ID:** story-purge-01
> **Generated:** 2026-04-02T22:00:00Z
> **Complexity:** COMPLEX
> **Pipeline Phases:** Research -> Strategy -> Execution -> Validation

---

## 1. Overview

### 1.1 Summary

Esta operação visa resolver os 620 pontos de falha identificados na auditoria forense detalhada. O objetivo é transformar o sistema de um "protótipo visual" em uma plataforma de produção robusta, eliminando mocks, unificando o design system e garantindo integridade de dados e segurança.

### 1.2 Goals

- Eliminar 100% dos dados mockados e integrar com Supabase real.
- Unificar tokens de design (spacing, radius, colors) em todas as 31 telas.
- Implementar Realtime em módulos operacionais (Check-in, Ranking, Equipe).
- Corrigir falhas de segurança (RLS, Tipagem any, Validações).
- Otimizar performance (Queries N+1, Memoização, Layout Shifts).

### 1.3 Non-Goals

- Adicionar novas funcionalidades não previstas no PRD original.
- Alterar a identidade visual core (cores base, logo).

---

## 2. Requirements Summary

### 2.1 Functional Requirements

| ID | Description | Priority | Acceptance Criteria |
| --- | ----------- | -------- | ------------------- |
| RF01 | Integração Real de Dados | P0 | Todas as telas carregam dados do Supabase, zero mocks. |
| RF02 | Unificação de Design System | P0 | Uso de tokens Tailwind padronizados em 31 telas. |
| RF03 | Sincronização em Realtime | P1 | Ranking e Equipe atualizam sem refresh. |
| RF04 | Validação de Formulários | P1 | Todos os inputs com máscara e validação Zod. |

### 2.2 Non-Functional Requirements

| Category | Requirement | Target |
| -------- | ----------- | ------ |
| Performance | LCP (Largest Contentful Paint) | < 2.5s |
| Segurança | RLS Policies | 100% de cobertura nas tabelas |
| Tipagem | TypeScript Coverage | Zero 'any' no código core |

---

## 3. Technical Approach

### 3.1 Architecture Overview

Utilizaremos o framework AIOX para orquestrar a refatoração. A estratégia será atômica por bloco de telas, garantindo que cada mudança seja validada por testes e screenshots.

### 3.2 Key Decisions

- **Supabase JOINs:** Substituir queries paralelas por Views ou RPCs para evitar N+1.
- **Zod Schema:** Implementar validação de schema em todos os formulários.
- **React.memo / useMemo:** Aplicar em listas e cálculos pesados identificados.

### 3.3 Patterns to Use

- Repository Pattern para hooks de dados.
- Compound Components para modais e drawers.
- Custom Hooks para lógica de negócio (Calculations).

---

## 5. Files to Modify/Create

### 5.1 Modified Files

- `src/pages/*.tsx` - Todas as 31 telas.
- `src/hooks/*.ts` - Hooks de dados.
- `src/components/ui/*.tsx` - Componentes base.
- `supabase/migrations/*.sql` - RLS e Views.

---

## 6. Execution Update — Design System Pass — 2026-04-07

### 6.1 Checklist

- [x] Mapear tokens e aliases de design system quebrados.
- [x] Adicionar aliases semânticos para classes legadas ainda usadas em telas.
- [x] Refatorar componentes base para tokens MX em vez de tokens genéricos shadcn.
- [x] Corrigir imagens sem `alt`/dimensões nos pontos auditados.
- [x] Corrigir nesting inválido `Link > button` nos pontos auditados.
- [x] Remover hardcodes hex diretos em páginas públicas/legadas auditadas.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm test`.
- [x] Rodar `npm run build`.

### 6.2 File List — Design System Pass

- `src/index.css`
- `src/components/LegacyModuleShell.tsx`
- `src/components/Layout.tsx`
- `src/components/ui/avatar.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/chart.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/progress.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/sonner.tsx`
- `src/components/ui/switch.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/toaster.tsx`
- `src/components/ui/tooltip.tsx`
- `src/pages/ConsultorTreinamentos.tsx`
- `src/pages/DashboardLoja.tsx`
- `src/pages/Equipe.tsx`
- `src/pages/Gamification.tsx`
- `src/pages/Login.tsx`
- `src/pages/MorningReport.tsx`
- `src/pages/NotFound.tsx`
- `src/pages/PainelConsultor.tsx`
- `src/pages/Perfil.tsx`
- `src/pages/Privacy.tsx`
- `src/pages/SellerPerformance.tsx`
- `src/pages/Terms.tsx`
- `src/pages/Treinamentos.tsx`

---

## Metadata

```yaml
spec:
  version: '1.0'
  generatedBy: aiox-master
  generatedAt: 2026-04-02T22:00:00Z

status: approved
```
