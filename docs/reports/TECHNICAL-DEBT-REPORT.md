# Technical Debt Report: MX Performance (Gestão Preditiva)
## Data: Abril 2026 | Status: Pós-Refatoração Universal UI

## 1. Resumo Executivo
Após a refatoração universal de UI (Story 6.1.2.1), o sistema atingiu um novo patamar de padronização visual. No entanto, o processo de descoberta revelou vulnerabilidades críticas de segurança, uma lacuna severa em testes automatizados e acúmulo de lógica em camadas de visualização que podem comprometer a escalabilidade.

**Pontuação Geral de Saúde Técnica: 68/100**

---

## 2. Matriz de Priorização de Débitos

| ID | Descrição | Área | Impacto | Prioridade | Ação Recomendada |
|----|-----------|------|---------|------------|------------------|
| **SEC-01** | **RLS Permissivo em `daily_checkins`** | Segurança | **CRÍTICO** | 🔥 **Imediata** | Restringir SELECT via `is_member_of(store_id)` |
| **QA-01** | **Falta de Testes E2E (Playwright)** | Confiabilidade| **CRÍTICO** | 🔥 **Imediata** | Criar suite de testes para fluxos de Check-in e PDI |
| **PERF-01**| **Ausência de Skeletons (CLS/LCP)** | Performance | Alto | 🚀 **Alta** | Implementar `MXSkeleton` para Molecules de métricas |
| **ARCH-01**| **Dashboards Monolíticos (>1000 lines)** | Arquitetura | Médio | 🚀 **Alta** | Extrair lógica p/ Hooks e Features |
| **SYS-01** | **Componentes Duplicados (`ui/` vs `atoms/`)** | Sistema | Médio | 🟢 **Média** | Migração em ondas p/ Canonical Atoms |
| **DATA-01**| **Triggers/Colunas Legadas** | Dados | Baixo | 🟢 **Média** | Plano de purge 30 dias pós-estabilidade |

---

## 3. Detalhamento por Especialidade

### 🛡️ Segurança & Riscos (@qa & @data-engineer)
- **Vulnerabilidade Detectada**: Qualquer usuário autenticado pode acessar dados de produção de qualquer loja via API direta.
- **Risco de Regressão**: Sem testes automatizados, futuras mudanças em `lib/calculations.ts` (que já possui conflitos de merge visíveis) podem corromper os rankings sem aviso prévio.

### 🏛️ Arquitetura & Sistema (@architect)
- **Gerenciamento de Estado**: O sistema depende de chamadas diretas ao Supabase espalhadas em dezenas de hooks. Falta uma camada de cache robusta (React Query) para evitar over-fetching e facilitar a sincronização de dados.
- **Acoplamento**: A lógica de negócio está "sequestrada" pelos componentes de UI, dificultando o reaproveitamento em outros contextos (ex: App Mobile nativo ou SSR).

### 🎨 Experiência do Usuário (@ux-design-expert)
- **Percepção de Performance**: A falta de skeletons gera um layout shift (CLS) perceptível no carregamento inicial dos dashboards.
- **Consistência de Estados**: Estados vazios (Empty States) e de erro não seguem a voz da marca MX, prejudicando a experiência em cenários de falha.

---

## 4. Plano de Ação (Próximos Passos)

1. **Sprint de Hardening (Imediato)**:
   - Corrigir RLS da `daily_checkins`.
   - Implementar Smoke Tests com Playwright para os 3 perfis (Admin, Gerente, Vendedor).
2. **Sprint de Performance**:
   - Implementar Skeletons atômicos.
   - Migrar Wave 1 de componentes (`Badge`, `Input`).
3. **Sprint de Refatoração**:
   - Sharding do `VendedorHome.tsx`.
   - Introdução do TanStack Query para gerenciamento de Server State.

---
**Assinado:** Aria (@architect), Dara (@data-engineer), Uma (@ux-design-expert), Quinn (@qa)
