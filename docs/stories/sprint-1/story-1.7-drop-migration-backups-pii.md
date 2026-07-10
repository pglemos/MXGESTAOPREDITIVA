# Story 1.7 — Export-Encrypt-Then-Drop dos `migration_backup_*_20260503` (DB-013)

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 1
**Prioridade:** P0
**Severidade do débito:** Crítica
**Débito relacionado:** DB-013 (tabelas de backup com PII expostas sem RLS)

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO CONDICIONAL (9/10) | Sprint 1 critical-path: CONDICIONAL — DPO approval citado no AC4 mas processo formal (template/SLA/responsável nomeado) não detalhado. Recomenda anexar template de approval ao PR + iniciar processo D1 do sprint conforme Risk Mitigation. Encrypt-then-drop sequence clara (export → checksum → spot-check → approval → DROP)
- 2026-05-21 | @data-engineer (Dara) | Status: Ready → InReview | Migration técnica + runbook + template DPO PRONTOS. **Não aplicado em produção** — aguarda DPO approval externo (template anexo) + export offline encrypted validado + snapshot PITR. Migration usa padrão encrypt-then-drop com gate `eh_administrador_mx()`, auditoria pré/pós-DROP em `logs_auditoria` e idempotência via `IF EXISTS`.

## File List
- `supabase/migrations/_archived/20260521120000_drop_migration_backups_pii.sql` (criado) — SQL manual de drop com gate admin + auditoria + idempotente
- `docs/runbooks/sprint-1-story-1.7-drop-pii-backups.md` (criado) — Runbook execução staging→prod + rollback PITR
- `docs/runbooks/lgpd-dpo-approval-template.md` (criado) — Template formal aprovação DPO (LGPD Art. 16)
**Esforço estimado:** 8h
**Owner sugerido:** @data-engineer + @devops
**RACI:** R=@data-engineer+@devops, A=Tech Lead+DPO, C=@architect+@qa, I=stakeholders
**Created:** 2026-05-17

## Problem Statement
db-specialist-review (DB-013) identifica tabelas `migration_backup_*_20260503` contendo PII (telefones, emails, dados de payroll) sem RLS habilitada e sem retenção definida. Risco LGPD direto. Plano: exportar com criptografia para storage offline (S3 com KMS), validar integridade, então DROP das tabelas no banco.

## Business Value
Elimina maior exposição LGPD ativa do banco. Reduz superfície de ataque e custo de auditoria. Estabelece padrão de tratamento de backups one-off.

## Acceptance Criteria
1. **AC1:** Given as tabelas `migration_backup_*_20260503`, When o processo é executado, Then exportadas em CSV/JSON criptografado AES-256 (chave em KMS) para bucket privado, com checksum SHA-256 registrado.
2. **AC2:** Given o export, When validado, Then row count export == row count tabela origem, e spot-check de 100 linhas confirma fidelidade.
3. **AC3:** Given a validação OK, When DROP é executado, Then as tabelas são removidas do banco; auditoria registra (quem, quando, ticket).
4. **AC4:** Given LGPD, When o processo é concluído, Then DPO/responsável de compliance aprova formalmente o plano de retenção do export offline (default: 1 ano).
5. **AC5:** Given runbook, When publicado em `docs/runbooks/migration-backup-archival.md`, Then documenta processo reutilizável para próximos backups one-off.

## Scope IN
- Identificar todas as tabelas `migration_backup_*_20260503` (inventário).
- Export criptografado (AES-256 + KMS) para bucket privado.
- Checksum SHA-256 + row count validation.
- Aprovação formal DPO/compliance antes do DROP.
- DROP das tabelas; auditoria registrada.
- Runbook reutilizável.

## Scope OUT
- Outras tabelas de backup (escopo se existirem — caso a caso).
- Política geral de retenção do banco (Sprint 2+).
- Re-import (procedimento documentado no runbook mas não automatizado).

## Tasks
- [ ] Inventariar tabelas `migration_backup_*_20260503` (lista exata).
- [ ] Estimar tamanho + custo do storage offline.
- [ ] Configurar bucket privado + KMS key (via @devops).
- [ ] Script de export criptografado + checksum.
- [ ] Validar export (row count + spot-check 100 linhas).
- [ ] Obter aprovação DPO/compliance (anexar ao PR).
- [ ] DROP TABLE com auditoria.
- [ ] Runbook `docs/runbooks/migration-backup-archival.md`.
- [ ] @qa gate.

## Dependências
- **Bloqueada por:** Aprovação DPO/compliance (externa), Sprint 0 done.
- **Bloqueia:** Story 1.8 pode pular essas tabelas se já dropadas.

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Perda de dado por export corrompido | Crítica | Checksum + spot-check; só DROP após validação completa |
| KMS key gerenciada sem disaster recovery | Crítica | Usar KMS gerenciado pelo provedor com backup automatic |
| Aprovação DPO atrasa Sprint | Média | Iniciar processo paralelo no Dia 1 do sprint |
| DROP sem rollback possível | Crítica | Export validado é o rollback; testar restore em staging primeiro |
| Bucket configurado público por engano | Crítica | IaC + auditoria de bucket policy obrigatória |

## Testes Requeridos
- [ ] Staging: export → DROP → restore from export → integridade preservada
- [ ] Checksum SHA-256 validado pré e pós upload
- [ ] Bucket policy auditada (zero acesso público)
- [ ] KMS key rotation testada
- [ ] Spot-check 100 linhas: export == origem

## Definition of Done
- [ ] ACs verdes
- [ ] CodeRabbit sem CRITICAL/HIGH (scripts)
- [ ] Aprovação DPO/compliance anexada
- [ ] Restore testado em staging
- [ ] Tabelas dropadas em produção
- [ ] Runbook publicado
- [ ] @qa gate PASS
- [ ] PR merged (@devops push)

## Rollback Plan
1. **Antes do DROP:** processo abortável a qualquer momento (export apenas).
2. **Após DROP (se necessário):** restore do export criptografado → bucket → decrypt → COPY FROM. RTO: ~2h (dependendo tamanho).
3. **Falha no script de export:** revert do script; tabelas permanecem no banco com RLS de emergência habilitada (story 1.8 cobre RLS se DROP não acontecer).
4. **Bucket comprometido:** rotacionar KMS key; re-criptografar; auditoria de acesso.
5. RTO DROP-rollback: ~2h (planejado, não emergencial).

## Notas Técnicas
- Export: `COPY ... TO PROGRAM 'gpg --encrypt ...'` ou pipeline via worker.
- Auditoria: registrar em tabela `data_lifecycle_audit` (criar se não existir) com quem/quando/ticket/checksum.
- Política retenção padrão: 1 ano (alinhar com retenção legal aplicável).

## Referências
- `docs/reviews/db-specialist-review.md` §DB-013
- `docs/prd/technical-debt-assessment.md` §DB-013
- Story 1.8 (cobertura RLS caso DROP atrase)
