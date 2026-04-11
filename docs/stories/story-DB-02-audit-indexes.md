# Story [DB-02]: Audit Log Composite Indexing

**Status:** READY
**Agent:** @data-engineer
**Effort:** 2h
**Priority:** HIGH (Performance)

## 1. Context
As tabelas de auditoria (`checkin_audit_logs`, `reprocess_logs`) estão crescendo em volume. Sem índices específicos para `created_at` e `store_id`, as consultas ao histórico gerencial sofrerão degradação de performance em breve.

## 2. Acceptance Criteria
- [ ] Criação de índices B-TREE compostos para as tabelas de log.
- [ ] Redução do tempo de busca histórica para < 100ms em sandbox com 10k registros.
- [ ] Migration versionada e documentada.

## 3. Implementation Tasks
1. Criar migration `20260411002000_add_audit_indexes.sql`.
2. Adicionar index em `checkin_audit_logs (store_id, created_at DESC)`.
3. Adicionar index em `reprocess_logs (store_id, created_at DESC)`.
4. Executar `EXPLAIN ANALYZE` para validar ganho de performance.

## 4. Definition of Done
- Índices ativos em Produção.
- Query plan validado pelo @data-engineer.
