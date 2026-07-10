# Runbook — Drop PII Backups (Story 1.7 / DB-013)

**Autor:** @data-engineer (Dara)
**Sprint:** 1
**Débito:** DB-013 (Crítico, LGPD)
**SQL manual:** `supabase/migrations/_archived/20260521120000_drop_migration_backups_pii.sql`
**Status:** PREPARADO — aguarda aprovação DPO antes da execução em produção

---

## Escopo

Eliminar definitivamente do banco as tabelas backup com PII:

- `public.migration_backup_vendedores_loja_duplicates_20260503` (PII: nomes, emails, payroll)
- `public.migration_backup_lancamentos_diarios_duplicates_20260503` (PII: lançamentos financeiros vinculados a vendedores)

Padrão: **encrypt-then-drop** — export offline criptografado é o rollback. Migration registra auditoria + executa `DROP TABLE`.

---

## Pré-Requisitos OBRIGATÓRIOS

### 1. Aprovação formal do DPO
- Template: `docs/runbooks/lgpd-dpo-approval-template.md`
- Assinatura digital ou e-mail formal anexado ao PR
- SLA: 5 dias úteis para resposta após envio do template

### 2. Snapshot Supabase pré-execução
- Confirmar PITR habilitado (Supabase Pro+) — janela mínima 7 dias
- Backup explícito on-demand antes da migration: `Settings → Database → Backups → Create`

### 3. Export encrypted offline (retenção LGPD)
- Local: bucket S3 privado (project root account)
- Criptografia: AES-256-GCM com KMS key dedicada (rotação anual)
- Formato: `migration_backup_{table}_{date}.json.gpg` + `.sha256`
- Retenção: 1 ano (alinhado LGPD Art. 16 — período razoável pós-eliminação)
- Política de bucket: `BlockPublicAccess=true`, IAM role-based (zero acesso público)

### 4. Validação pré-DROP
- `row_count(export) == row_count(tabela)` — exato
- Spot-check 100 linhas aleatórias: `SHA-256(export[i]) == SHA-256(origem[i])`
- Checksum SHA-256 do arquivo final validado pré e pós-upload S3

---

## Sequência de Execução

### Fase 1 — Staging
1. `git checkout main && git pull`
2. Linkar staging: `supabase link --project-ref <STAGING_REF>`
3. Executar o SQL manual arquivado com `psql --set=ON_ERROR_STOP=1 --file=supabase/migrations/_archived/20260521120000_drop_migration_backups_pii.sql`
4. Validar auditoria:
   ```sql
   SELECT action, entity, details_json
   FROM public.logs_auditoria
   WHERE action LIKE 'DROP_PII_BACKUP%'
   ORDER BY created_at DESC LIMIT 5;
   ```
5. Confirmar DROP:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema='public' AND table_name LIKE 'migration_backup_%_20260503';
   -- esperado: 0 linhas
   ```
6. Smoke test app staging: dashboards, lançamentos, vinculos loja → tudo verde.

### Fase 2 — Produção
1. **GATE final:** confirmar DPO approval + snapshot PITR + export offline (todos os 3).
2. Linkar prod: `supabase link --project-ref <PROD_REF>`
3. Executar o SQL manual arquivado com `psql --set=ON_ERROR_STOP=1 --file=supabase/migrations/_archived/20260521120000_drop_migration_backups_pii.sql`
4. Validar auditoria em prod (mesma query da fase 1, item 4)
5. Confirmar DROP em prod (mesma query da fase 1, item 5)
6. Comunicar DPO **post-execution** com:
   - Timestamp de execução
   - `row_count` final extraído do `logs_auditoria.details_json`
   - Link para entrada no audit log
   - Confirmação do export offline (URL bucket + checksum)

---

## Rollback

### Caso A — Falha durante migration (transação)
- `BEGIN/COMMIT` envolve tudo: erro = rollback automático, banco intacto.
- Próximo passo: investigar erro, corrigir, re-aplicar.

### Caso B — DPO objeta APÓS execução (cenário raro)
1. **PITR restore** (preferido, Supabase Pro+):
   - Supabase Console → Database → Backups → Point-in-time recovery
   - Selecionar timestamp imediatamente anterior à migration
   - RTO: ~30min
2. **Restore via export offline** (fallback):
   - Decrypt: `gpg --decrypt migration_backup_X.json.gpg > /tmp/X.json`
   - Validar checksum SHA-256
   - `COPY public.migration_backup_X FROM '/tmp/X.json' (FORMAT json)`
   - Reaplicar RLS de emergência (Story 1.8)
   - RTO: ~2h
3. **Falha total** (PITR indisponível + export corrompido):
   - Aceitar perda
   - Comunicar DPO + stakeholders
   - Registrar incidente em `docs/incidents/`

### Caso C — Bucket S3 comprometido
- Rotacionar KMS key imediatamente
- Re-criptografar export com nova key
- Auditar logs de acesso S3 (CloudTrail)
- Comunicar DPO + segurança

---

## Critérios de Sucesso

- [ ] Migration aplicada em staging sem erros
- [ ] Smoke test staging verde
- [ ] DPO approval anexado ao PR
- [ ] Export offline validado (row_count + checksum + spot-check 100 linhas)
- [ ] Snapshot PITR confirmado
- [ ] Migration aplicada em produção sem erros
- [ ] `logs_auditoria` em prod registrou 3 entradas (2 DROP_PII_BACKUP + 1 DROP_PII_BACKUP_COMPLETED)
- [ ] Tabelas removidas (query de verificação retorna 0 linhas)
- [ ] DPO notificado post-execution

---

## Referências
- Story: `docs/stories/sprint-1/story-1.7-drop-migration-backups-pii.md`
- SQL manual: `supabase/migrations/_archived/20260521120000_drop_migration_backups_pii.sql`
- Template DPO: `docs/runbooks/lgpd-dpo-approval-template.md`
- Débito: `docs/reviews/db-specialist-review.md` §DB-013
- LGPD: Art. 5º X (tratamento), Art. 16 (eliminação após cumprimento da finalidade)
