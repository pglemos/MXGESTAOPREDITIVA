# Engineering Epic: MX Performance Technical Excellence

**Status:** READY
**Owner:** Aria (@architect)
**Priority:** 🔥 HIGH
**Budget Approved:** ~45h

## 1. Context & Objective
Este épico visa erradicar os 12 débitos técnicos críticos identificados no Brownfield Discovery v2.0. O objetivo é transformar o MX Performance em uma plataforma de "Classe Mundial" em termos de segurança, performance e manutenibilidade.

## 2. Stories Backlog

### Wave 1: Security & Performance Foundation (Quick Wins)
- **Story [SYS-01]:** Root Directory Sanitization (Cleanup of legacy audit files).
- **Story [DB-02]:** Audit Log Composite Indexing (Historical performance boost).
- **Story [UI-04]:** Login A11y & Contrast Refactor (Dark mode compliance).

### Wave 2: Business Intelligence Hardening
- **Story [SYS-02]:** Unit Testing Suite for `calculations.ts` (100% logic coverage).
- **Story [DB-01]:** SQL Schema Evolution: Native PG Enums (Data integrity).
- **Story [DB-03]:** RLS Immutable Optimization (Query cost reduction).

### Wave 3: Architecture Scale & Reusability
- **Story [UI-01]:** Extraction of `DataGrid` Organism (Table to Card dynamic logic).
- **Story [UI-03]:** Layout Utility Integration via Tailwind Plugin.
- **Story [DB-04]:** Database Integrity Triggers (Membership orphanage protection).

## 3. Acceptance Criteria (Epic Level)
- [ ] Lighthouse Score para Acessibilidade e Performance >= 95.
- [ ] 100% de cobertura de testes unitários no motor de cálculos.
- [ ] Zero arquivos órfãos na raiz do repositório.
- [ ] Tempo de resposta de consultas históricas < 200ms em produção.

---
**Assinatura:** Morgan (@pm) 📋
