# Technical Debt Assessment - DRAFT
## Para Revisão dos Especialistas (Fases 5-7)

**Projeto:** MX Performance
**Data:** 11 de Abril de 2026
**Status:** DRAFT - Awaiting Specialist Review

---

### 1. Débitos de Sistema (Arquitetura & Infra)
- [CRITICAL] **Root Pollution:** ~25+ arquivos órfãos na raiz (`audit-dom.html`, `audit-script.cjs`, capturas de tela antigas).
- [HIGH] **Unit Test Gap:** 0% de cobertura nos algoritmos críticos de `src/lib/calculations.ts`.
- [MEDIUM] **Ghost Directory:** `src/app` deve ser deletado (substituído por `src/pages`).
- [LOW] **Build Optimization:** Chunking manual em `vite.config.ts` precisa ser reavaliado conforme novas rotas são adicionadas.

### 2. Débitos de Database (Dados & Segurança)
- [CRITICAL] **Enum Fragmentation:** Colunas como `source_mode` e `individual_goal_mode` usam `TEXT` + `CHECK` constraint.
- [HIGH] **Audit Indexing:** Falta de índices compostos em `checkin_audit_logs(created_at)` e `reprocess_logs`.
- [MEDIUM] **RLS Logic:** Helper functions em RLS não são `IMMUTABLE`, causando potenciais re-execuções desnecessárias.
- **Pergunta para @data-engineer:** Existe risco de RLS recursion na nova tabela `checkin_correction_requests`?

### 3. Débitos de Frontend/UX (Design System)
- [HIGH] **Organism Scarcity:** Páginas como `DashboardLoja` e `RotinaGerente` re-implementam grades complexas manualmente.
- [MEDIUM] **Icon Inconsistency:** Inconsistência no uso de ícones preenchidos (filled) vs traçados (stroke).
- [MEDIUM] **Utility Overlap:** Classes de layout arbitrárias no `index.css` que deveriam ser integradas ao compilador Tailwind.
- **Pergunta para @ux-design-expert:** Devemos mover a lógica de `Skeleton` para dentro de cada molécula ou manter como átomo independente?

---

### 4. Matriz Preliminar de Priorização

| ID | Débito | Área | Impacto | Esforço | Prioridade |
|----|--------|------|---------|---------|------------|
| SYS-01 | Root Cleanup | Sistema | Baixo | Baixo | Baixa |
| SYS-02 | Cálculos Unit Tests | Sistema | Alto | Médio | Alta |
| DB-01 | Migration to Enums | Database | Médio | Médio | Média |
| DB-02 | Audit Log Indexes | Database | Médio | Baixo | Alta |
| UI-01 | Extraction of Organisms | UX | Médio | Alto | Média |

---
**Próximo Passo:** Ativação das Fases 5, 6 e 7 para validação técnica.
