# Technical Debt Assessment - FINAL

## Executive Summary
- **Total de débitos:** 16 (incluindo as adições dos especialistas de DB e UX)
- **Críticos:** 2 | **Altos:** 6 | **Médios:** 6 | **Baixos:** 2
- **Esforço total estimado:** ~45 horas (aprox. 1 sprint para estabilização completa)

## Inventário Completo de Débitos

### Sistema (validado por @architect)
| ID | Débito | Severidade | Horas | Prioridade |
|----|--------|------------|-------|------------|
| SYS-01 | Root Pollution (scripts isolados no root) | Baixa | 1 | Média |
| SYS-02 | Unit Test Gap (`src/lib/calculations.ts`) | Alta | 6 | Alta |
| SYS-03 | Ghost Directory (`src/app`) | Baixa | 0.5 | Baixa |
| SYS-04 | Dependency Drift | Baixa | 0.5 | Baixa |

### Database (validado por @data-engineer)
| ID | Débito | Severidade | Horas | Prioridade |
|----|--------|------------|-------|------------|
| DB-02 | Type Sync Debt (`store_sellers`) | Alta | 1 | Crítica |
| DB-03 | N+1 Queries / Missing Indexes | Alta | 2 | Alta |
| DB-04 | Legacy Ghost Tables | Média | 1 | Alta |
| DB-01 | PII Exposure (Plaintext emails) | Média | 8 | Média |
| DB-05 | Service Role Bypass | Média | 4 | Média |
| DB-07 | Falta de Constraint na Tabela de PDI | Média | 2 | Média |
| DB-06 | Large Table Partitioning | Baixa | 16 | Baixíssima |

### Frontend/UX (validado por @ux-design-expert)
| ID | Débito | Severidade | Horas | Prioridade |
|----|--------|------------|-------|------------|
| UX-01 | Login Page Chaos | Crítica | 3 | Crítica |
| UX-02 | Component Library Drift (Shadcn/Radix) | Alta | 4 | Alta |
| UX-03 | Modal/Overlay Viewport Bounds | Alta | 2 | Alta |
| UX-05 | Acessibilidade (A11y) - Aria Labels | Alta | 2 | Alta |
| UX-04 | Hardcoded Inline Styles / Tooltips | Média | 2 | Média |

## Matriz de Priorização Final e Plano de Resolução

### ONDA 1: Correções Críticas (Sprint Imediata)
> **Foco:** Estabilidade, Consistência de Tipagem e Consistência de Marca.
1. **[UX-01]** Refatorar `Login.tsx` para seguir o Atomic Design e os tokens `mx-`.
2. **[DB-02]** Atualizar `src/types/database.ts` para tipar `store_sellers`.
3. **[SYS-02]** Implementar suíte de testes unitários para cálculos críticos (Mitigação QA).

### ONDA 2: Performance e Dívida Base (Sprint Imediata)
> **Foco:** Performance do Banco, Experiência Mobile e Limpeza de Lixo.
1. **[DB-03]** Criar índice composto `idx_checkins_store_date`.
2. **[UX-02]** Reescrever classes Tailwind numéricas na raiz dos componentes `ui/` para tokens `mx-`.
3. **[UX-03]** Corrigir layouts baseados em Viewport (vh/vw) para constraints atômicas (evitar scroll trap no mobile).
4. **[DB-04 & SYS-03]** DROP tables obsoletas (gamification, etc) e deletar pasta `src/app`.
5. **[SYS-01]** Limpar poluição na raiz (scripts mjs/cjs).

### ONDA 3: Qualidade e Segurança (Sprint Seguinte)
> **Foco:** Auditoria, Acessibilidade, Constraints.
1. **[UX-05]** Revisar WCAG (aria-labels) no Painel Consultor.
2. **[DB-07]** Adicionar constraints NOT NULL pendentes na tabela de PDI.
3. **[UX-04]** Migrar cores inline hardcoded do Recharts para Variáveis CSS de Tema.
4. **[DB-05]** Refinar permissões de cron jobs e scripts (Service Role).
5. **[DB-01]** Mover emails PII para `pgcrypto` em repouso.

## Riscos e Mitigações (via QA Review)
- **Risco:** Regressão em Cálculos. **Mitigação:** Suíte de testes unitários (`SYS-02`) é bloqueante antes de grandes refatorações no motor.
- **Risco:** Inconsistência RLS pós-correção. **Mitigação:** Usar workflow de impersonation (`test-as-user`) após qualquer toque no banco.
- **Risco:** Quebra de Layout Atômico. **Mitigação:** CI/CD com step obrigatório de `npm run lint:tokens`.

## Critérios de Sucesso
- A página de Login deve renderizar sem nenhuma violação no `lint:tokens`.
- Nenhuma query na produção deve disparar "Slow Query" superior a 500ms (após índices).
- Os Modais devem ser totalmente manipuláveis em um iPhone SE sem "clipping".
- A pasta raiz não deve conter arquivos obsoletos (.cjs/.mjs/assets temporários) não relacionados ao processo de build.
