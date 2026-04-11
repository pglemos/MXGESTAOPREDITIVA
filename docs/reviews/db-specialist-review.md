# Database Specialist Review - MX Performance

**Responsável:** @data-engineer (Dara)
**Data:** 11 de Abril de 2026

## 1. Débitos Validados
| ID | Débito | Severidade | Esforço (h) | Prioridade | Notas |
|----|--------|------------|-------------|------------|-------|
| DB-01 | Migration to Enums | Média | 4h | Média | Impacta integridade de tipos no código. |
| DB-02 | Audit Log Indexes | Alta | 2h | Alta | Crítico para manter performance do histórico. |
| DB-03 | RLS Performance | Baixa | 3h | Baixa | Melhorar `STABLE` para `IMMUTABLE`. |

## 2. Débitos Adicionados
- **[HIGH] Function Security:** Algumas funções do sistema de reprocessamento usam `SECURITY DEFINER`. Precisamos de um audit de permissões nessas funções específicas para garantir que não podem ser escaladas por usuários comuns.
- **[MEDIUM] Membership Orphanage:** Não há trigger para limpar `memberships` se uma `store` for deletada (hard delete).

## 3. Respostas ao @architect
- **R:** Sim, havia risco de recursão em `checkin_correction_requests`, mas a migration `20260411001000` resolveu isso ao usar uma subquery baseada em `memberships` em vez de chamar funções que recorrem à mesma tabela. No entanto, recomendo manter a vigilância em novas políticas.

## 4. Recomendações
1. Priorizar os **Índices de Auditoria (DB-02)** imediatamente.
2. Iniciar a migração para **Enums Nativos (DB-01)** na próxima sprint técnica.
3. Implementar triggers de **Cleanup de Lojas** para evitar lixo no banco.

---
**Status:** VALIDATED
