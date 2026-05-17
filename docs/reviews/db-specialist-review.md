# Database Specialist Review

**Reviewer:** @data-engineer (Dara)
**Date:** 2026-05-16
**Phase:** 5/10 — Brownfield Discovery
**Inputs:** `docs/prd/technical-debt-DRAFT.md` (§2, §4, §7), `supabase/docs/SCHEMA.md`, `supabase/docs/DB-AUDIT.md`, 89 migrations ativas, 15 edge functions
**Análise:** estática (sem conexão a DB de produção). Substitui versão prévia de 15-abr-2026.

---

## 1. Executive Summary

- **Validados:** 19/19 (todos os DB-001..DB-019 confirmados como reais por análise estática)
- **Ajustados:** 4 severidades + 7 reestimativas de esforço
- **Removidos:** 0
- **Adicionados:** 8 novos débitos (DB-020 a DB-027) — categorias: backup/RTO/RPO, observabilidade DB, pooling, extensões, advisors, postgres-superuser, autovacuum, trigger LGPD
- **Total final DB:** **27 débitos**
- **Esforço total estimado (DB):** **~95–100 horas** (vs 50h originais — diferença vem dos 8 novos + reestimativa de DB-017/DB-008/DB-006)
- **Verdict técnico:** todos os 4 críticos do DRAFT são reprodutíveis. Vetor DB-016 é **VIÁVEL** com qualquer JWT `authenticated`. Backups DB-013 contêm PII viva.

---

## 2. Validação dos 19 Débitos

| ID | Status | Sev orig→final | Esforço (h) | Complex | Justificativa |
|----|--------|----------------|-------------|---------|---------------|
| DB-001 | CONFIRMADO | Crítica→Crítica | 1 | Baixa | `submit_checkin_rpc.sql:49,84` checa `coalesce(is_active,true)` em `vinculos_loja`, NÃO em `vendedores_loja`. Vetor real. |
| DB-002 | CONFIRMADO | Crítica→Crítica | 3 | Média | `submit_checkin_rpc.sql:161` `RETURN ... SQLERRM`. Pattern se repete em `auth_self_service_rpcs` e `admin_store_lifecycle_rpcs`. 2→3h para cobrir todas RPCs novas + garantir `logs_auditoria`. |
| DB-003 | CONFIRMADO | Média→Média | 1 | Baixa | Regex E.164 + `^https?://`. |
| DB-004 | CONFIRMADO | Baixa→Baixa | 0.5 | Trivial | Doc JSDoc + comentário SQL. |
| DB-005 | CONFIRMADO | Alta→Alta | 1 | Baixa | 0.5→1h: dedup migration antes do UNIQUE. |
| DB-006 | CONFIRMADO | Alta→Alta | 12 | Alta | 8→12h: ~30 policies referenciam helpers EN; cada DROP/REPLACE exige regression de RLS. Bloqueia DB-016 final. |
| DB-007 | CONFIRMADO | Média→Média | 0.5 | Trivial | Regex de email. |
| DB-008 | CONFIRMADO | Alta→**Crítica** | 6 | Média | Severidade↑: endpoint público (`verify_jwt=false`) com SERVICE_ROLE sem rate limit é vetor DoS + spam de pre-cadastros. 4→6h: throttle KV + reCAPTCHA + monitoring. |
| DB-009 | CONFIRMADO | Média→Média | 1 | Baixa | Allow-list por env. |
| DB-010 | CONFIRMADO | Baixa→Baixa | 1 | Baixa | Code review + 1 teste. |
| DB-011 | CONFIRMADO | Alta→Alta | 3 | Média | 2→3h: feature flag para grace period dos callers ainda usando nome antigo. |
| DB-012 | CONFIRMADO | Média→**Alta** | 24 | Alta | Severidade↑: LGPD Art. 18 (right-to-erasure) é obrigação legal. 16→24h: design `consentimentos` + RPCs `request_data_erasure` + workflow anonimização. |
| DB-013 | CONFIRMADO | Crítica→Crítica | 2 | Baixa | `20260503020000_admin_master_e2e_hardening.sql:6-80` cria backups via `CREATE TABLE AS SELECT` sem RLS. PII viva. 1→2h: export S3 + DROP. |
| DB-014 | CONFIRMADO | Alta→Alta | 2 | Baixa | 1→2h: CI step + diff script `database.generated.ts` vs `src/types/database.ts`. Bloqueia X-1. |
| DB-015 | CONFIRMADO | Média→Média | 5 | Média | 3→5h: 21 FKs exigem análise caso-a-caso + migration por grupo. |
| DB-016 | CONFIRMADO | Crítica→Crítica | 4 | Média | 2→4h: REVOKE + repolicy + testes RLS por role + ajustar scripts admin (DB-026). Bloqueador real do gate 09:45. |
| DB-017 | CONFIRMADO | Alta→Alta | 4 | Baixa | 3→4h. Grep estático achou `handle_new_user` sem `SET search_path` em `20260427175235_*.sql`. DB-AUDIT §1 lista 12 RPCs nessa condição. Patch: `ALTER FUNCTION ... SET search_path = public, pg_temp`. |
| DB-018 | CONFIRMADO | Baixa→**Média** | 4 | Média | Severidade↑: IDX-001 (`vinculos_loja(user_id,is_active)`) é hot-path de toda policy RLS — degradação O(n). 3→4h. |
| DB-019 | CONFIRMADO | Baixa→**Alta** | 2 | Baixa | Upgrade confirmado: `role_assignments_audit` + `store_meta_rules_history` vazam histórico cross-tenant. 1→2h. |

**Subtotal validado:** 4 Crítica + (1↑) · 6 Alta + (1↑) · 5 Média + (1↑) · 4 Baixa (- 2 promovidos) = **4 Crítica · 7 Alta · 4 Média · 4 Baixa · ~71h**
**Mudanças de severidade aplicadas:** DB-008↑, DB-012↑, DB-018↑, DB-019↑.

---

## 3. Débitos Adicionados (DB-020..DB-027)

| ID | Débito | Severidade | Categoria | Esforço (h) | Justificativa |
|----|--------|-----------|-----------|-------------|---------------|
| DB-020 | **Sem estratégia documentada de backup/RTO/RPO** — Supabase faz PITR (gerenciado) mas projeto não declara RTO/RPO, não testa restore, não documenta cadeia de custódia | Alta | backup/dr | 6 | Bloqueia auditoria SOC2/LGPD. Documentar + drill semestral. |
| DB-021 | **`pg_stat_statements` não habilitado** — sem visibilidade de queries lentas | Média | observability | 1 | `CREATE EXTENSION` + grant. Pré-req para priorizar DB-018. |
| DB-022 | **`pgaudit` não instalado** — sem trilha auditável de DDL/DCL exigida por LGPD/SOC2 | Média | security/compliance | 2 | Habilitar + log levels + retenção 90d. |
| DB-023 | **Connection pooling não validado** — Supavisor existe default no Supabase mas projeto não declara pool size, modo (transaction vs session) nem limite por edge function | Alta | performance/config | 4 | Validar `pool_mode=transaction` Edge / `session` scripts admin. Risco de pool exhaustion. |
| DB-024 | **Auto-vacuum/analyze sem tuning para hot tables** — `lancamentos_diarios`, `notificacoes`, `consulting_schedule_events` recebem inserts diários sem ajuste | Média | performance | 3 | `ALTER TABLE ... SET (autovacuum_*)` por tabela hot. |
| DB-025 | **Supabase Advisors (security + performance) não rodados** — toolkit nativo para detectar anti-patterns | Baixa | tooling | 1 | `supabase advisors lint --linked` + arquivar relatório + agendar quinzenal. |
| DB-026 | **Scripts admin com `postgres@3.4.8` usando `POSTGRES_URL` direto** — bypass total de RLS, conexão superuser, sem auditoria | Alta | security/scripts | 8 | Mover `scripts/repair_sql.ts` e `scripts/run_fix_rls.ts` para Edge Function admin com auth + audit log, OU restringir a CI com role dedicado + audit obrigatório. Relacionado a SYS-005/X-3. |
| DB-027 | **Trigger `check_orphan_users_after_membership_deletion` sem clareza sobre anonimização vs hard-delete** — viola LGPD Art. 16 se apaga sem registro | Média | compliance | 4 | Auditar trigger, decidir política (soft-delete + anonimização), documentar. |

**Subtotal novos:** 0 Crítica · 3 Alta · 4 Média · 1 Baixa = 8 débitos · ~29h

**TOTAL FINAL DB (19+8): 27 débitos · ~95–100h** (71h validados + 29h novos; faixa absorve quick-wins paralelizáveis)

---

## 4. Reprodução de Vulnerabilidades Críticas

### 4.1 DB-016 — Bypass RLS via PostgREST direto em `lancamentos_diarios`

**Status:** **CONFIRMADO VIÁVEL** (análise estática)

**Evidência:**
- DB-AUDIT.md §2 lista `lancamentos_diarios` com policy `USING(true)`
- `grep -l "REVOKE.*lancamentos_diarios" supabase/migrations/*.sql` → **nenhum resultado**
- Não há `REVOKE INSERT,UPDATE,DELETE ON public.lancamentos_diarios FROM authenticated` em nenhuma migration
- Default Supabase: `authenticated` role tem `GRANT ALL` em tabelas públicas
- Combinação: `USING(true)` + GRANT default = qualquer JWT authenticated pode `POST /rest/v1/lancamentos_diarios` com payload arbitrário, bypassando TODAS as validações do `submit_checkin`

**Vetor de ataque exato:**
```http
POST /rest/v1/lancamentos_diarios HTTP/1.1
Host: <project>.supabase.co
Authorization: Bearer <JWT_authenticated_qualquer>
apikey: <anon_key>
Content-Type: application/json
Prefer: return=representation

{
  "store_id": "<UUID_loja_alvo>",
  "seller_user_id": "<UUID_vendedor_alvo>",
  "reference_date": "2026-12-31",
  "metric_scope": "daily",
  "leads_total": 999999,
  "submitted_at": "2026-05-16T03:00:00Z"
}
```
Burla: gate 09:45, vínculo ativo, data futura, self-submit check — tudo no `submit_checkin`, nada na tabela.

**Mitigação SQL (mínima viável):**
```sql
BEGIN;
REVOKE INSERT, UPDATE, DELETE ON public.lancamentos_diarios FROM authenticated, anon;
DROP POLICY IF EXISTS "lancamentos_diarios_select_all" ON public.lancamentos_diarios;
CREATE POLICY "lancamentos_diarios_select_scoped" ON public.lancamentos_diarios
  FOR SELECT TO authenticated
  USING (
    eh_administrador_mx()
    OR tem_papel_loja(store_id, ARRAY['gestor','vendedor','administrador_geral'])
  );
-- GRANT EXECUTE em submit_checkin permanece
COMMIT;
```
**Pré-req:** DB-006 parcial (helpers PT-BR estáveis) + DB-014 (types gerados). Ordem técnica obrigatória: DB-014 → DB-006 parcial → DB-016.

### 4.2 DB-013 — Backups `migration_backup_*_20260503` com PII viva

**Status:** **CONFIRMADO — PII VIVA**

**Evidência:**
- `20260503020000_admin_master_e2e_hardening.sql:6-80` cria via `CREATE TABLE ... AS SELECT ... FROM <tabela_original>` — cópia 1:1 sem filtro/anonimização
- Backup `vendedores_loja_duplicates`: `user_id`, `store_id`, vínculos → permite reconstrução cross-loja
- Backup `lancamentos_diarios_duplicates`: valores comerciais (metas, leads, vendas) + identificadores
- Sem RLS (DB-AUDIT §2)
- Nenhuma migration posterior dropou ou aplicou RLS. Retention: indefinida (criadas há 13 dias).

**Recomendação:**
1. Validar com @pm/legal valor probatório
2. Se sim: `pg_dump --table=migration_backup_* -F c`, encrypt com `gpg`, cold storage (S3 Glacier) + entry em `logs_acesso_sensivel`
3. `DROP TABLE public.migration_backup_vendedores_loja_duplicates_20260503; DROP TABLE public.migration_backup_lancamentos_diarios_duplicates_20260503;`
4. Pre-commit hook: bloquear migrations que criem `migration_backup_*` sem RLS + policy admin-only no mesmo arquivo

### 4.3 DB-001 — Patch SQL para `submit_checkin`

Estado atual: `supabase/migrations/20260516125000_submit_checkin_rpc.sql` linhas 40-90 validam `vinculos_loja` apenas.

**Patch (nova migration `20260517100000_submit_checkin_validate_vendedor.sql`):**
```sql
CREATE OR REPLACE FUNCTION public.submit_checkin(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_store_id uuid := (payload->>'store_id')::uuid;
  v_seller_user_id uuid := (payload->>'seller_user_id')::uuid;
  -- ...resto idêntico...
BEGIN
  -- ...validações existentes (vinculos_loja, gate 09:45, etc.)...

  -- NOVA validação (DB-001):
  IF v_seller_user_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.vendedores_loja vl
      WHERE vl.user_id = v_seller_user_id
        AND vl.store_id = v_store_id
        AND coalesce(vl.is_active, true) = true
    ) THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error_code', 'SELLER_INACTIVE',
        'error', 'Vendedor não está ativo no cadastro da loja.'
      );
    END IF;
  END IF;

  -- ...INSERT existente com ON CONFLICT...
END;
$$;
```

### 4.4 DB-002 — Pattern de wrap correto para SQLERRM

**Anti-pattern atual** (`submit_checkin_rpc.sql:161`):
```sql
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
```
Vaza nomes de colunas, constraint names, search_path, etc.

**Pattern correto:**
```sql
EXCEPTION WHEN others THEN
  INSERT INTO public.logs_auditoria (
    actor_id, action, resource_type, resource_id, payload,
    error_sqlstate, error_message, created_at
  ) VALUES (
    auth.uid(),
    'submit_checkin_error',
    'lancamentos_diarios',
    v_seller_user_id::text,
    payload,
    SQLSTATE,
    SQLERRM,
    now()
  );
  RETURN jsonb_build_object(
    'ok', false,
    'error_code', 'INTERNAL_ERROR',
    'error', 'Não foi possível processar a operação. Tente novamente ou contate o suporte.',
    'trace_id', gen_random_uuid()
  );
```
**Pré-req:** garantir `logs_auditoria` existe com schema compatível (+1h se criar).

---

## 5. Respostas às 7 Perguntas do @architect (DRAFT §7)

**Q1 — Inventário/severidade completos?** Quase. Os 19 estão corretos. Faltavam 8 categorias estruturais — adicionadas como DB-020..DB-027. 4 severidades ajustadas (já refletidas no upgrade que o DRAFT §5 antecipou para DB-019 e DB-018).

**Q2 — Débitos faltantes (backup/RTO/vacuum/pool/pgstats):** Adicionados — DB-020 (RTO/RPO), DB-021 (pg_stat_statements), DB-022 (pgaudit), DB-023 (pool), DB-024 (vacuum), DB-025 (advisors), DB-026 (postgres@superuser), DB-027 (trigger LGPD).

**Q3 — Esforços por débito:** Vide §2 e §3 (coluna "Esforço (h)"). Total final 95–100h.

**Q4 — DB-016 reprodutível?** **Sim, viável.** Vide §4.1.

**Q5 — Backups DB-013 com PII viva?** **Sim.** Criados via `CREATE TABLE AS SELECT` em 2026-05-03, sem RLS, sem cleanup. Recomendação: export-encrypt-then-drop (§4.2).

**Q6 — Ordem técnica considerando dependências:** Vide §7. Resumo: **DB-014 → DB-006 parcial → DB-019 → DB-013 → DB-002 → DB-001 → DB-016 → DB-017**. DB-006 parcial antes de DB-016 evita quebrar policies que ainda usam helpers EN. DB-014 antes de DB-016 evita silent breaks no FE.

**Q7 — Tooling (pgaudit/advisors/pg_repack):**
- `pgaudit`: não instalado (grep migrations = 0 hits) → DB-022.
- `supabase advisors`: sem evidência de execução → DB-025.
- `pg_repack`: não necessário ainda. Avaliar em 6 meses (`lancamentos_diarios` >1M rows).

**Q8 — Edge Functions rate limit/logs:** Sem rate limit nativo no Supabase Edge Functions além do throttle global. Recomendação: Upstash Redis (KV) via fetch + sliding window por IP. Logs estruturados JSON. Já capturado em SYS-017 + DB-008.

---

## 6. Avaliação dos Riscos Cruzados

### X-1 — Drift de tipos PT-BR↔EN
**Concordo CRÍTICA.** Ordem técnica obrigatória: DB-014 antes de qualquer DB-006/DB-011. Gate de CI: `supabase gen types` + `tsc --noEmit` falha o PR.

### X-2 — Bypass RLS via PostgREST
**Concordo CRÍTICA.** Confirmação em §4.1. Side-effect: scripts/automation que faziam INSERT direto em `lancamentos_diarios` quebrarão — auditar e migrar para `submit_checkin` antes do REVOKE. **Risco operacional alto** sem feature flag/grace period.

### X-3 — Vazamento de secrets em deploy
**Concordo CRÍTICA.** Contribuição nova: DB-026 cobre `postgres@3.4.8` superuser path. Adicional: rotacionar `POSTGRES_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_*`, `RESEND_API_KEY` se `.env` estiver no histórico git (SYS-012). Treat as compromised by default.

### X-5 — Gate 09:45 sem defesa em profundidade
**Concordo ALTA.** Após DB-016 resolver REVOKE, gate fica server-enforced. Adicional belt-and-suspenders: CHECK constraint em `lancamentos_diarios` validando `submitted_at::time >= '09:45'` para `metric_scope='daily'`.

### X-6 — LGPD multi-camada
**Concordo ALTA.** Reforçado: DB-012 subiu para Alta + DB-022 (pgaudit) + DB-027 (trigger anonimização) cobrem trilha completa. Sequência: DB-013 → DB-027 → DB-022 → DB-012 — total ~46h, candidato a epic dedicado "LGPD Compliance".

---

## 7. Ordem Técnica de Resolução

### Sprint 1 — P0 Hardening Crítico (~22h)
Bloquear deploy de qualquer feature até concluir.
1. **DB-014** (2h) — Gerar `database.generated.ts` + CI gate. *Pré-req cego para tudo abaixo*.
2. **DB-013** (2h) — Export + DROP backups com PII.
3. **DB-019** (2h) — RLS em `role_assignments_audit` + `store_meta_rules_history`.
4. **DB-002** (3h) — Wrap SQLERRM em todas RPCs novas.
5. **DB-001** (1h) — Patch `submit_checkin` validar `vendedores_loja.is_active`.
6. **DB-006 parcial** (4h) — Garantir helpers PT-BR estáveis (não dropar EN ainda).
7. **DB-016** (4h) — REVOKE + repolicy `lancamentos_diarios` + testes RLS. *Depende de #1, #6*.
8. **DB-017** (4h) — `ALTER FUNCTION ... SET search_path` nas 12 RPCs.

### Sprint 2 — P1 Segurança e Governança (~30h)
1. **DB-008** (6h) — Rate limit + reCAPTCHA em `store-pre-registration`.
2. **DB-026** (8h) — Mover scripts `postgres@` para Edge Function admin.
3. **DB-006 final** (8h) — Drop helpers EN + refatorar policies remanescentes.
4. **DB-011** (3h) — Resolver overload `compute_dre` com feature flag.
5. **DB-005** (1h) — UNIQUE em `lojas.cnpj` + dedup migration.
6. **DB-009** (1h) — CORS allow-list por env.
7. **DB-022** (2h) — Habilitar pgaudit.
8. **DB-021** (1h) — Habilitar pg_stat_statements.

### Sprint 3 — P2 Performance, Compliance, Observabilidade (~43h)
1. **DB-012** (24h) — LGPD consent + right-to-erasure.
2. **DB-020** (6h) — Documentar RTO/RPO + drill.
3. **DB-023** (4h) — Validar pool config.
4. **DB-027** (4h) — Auditar trigger orphan.
5. **DB-015** (5h) — FKs `ON DELETE` explícito.
6. **DB-024** (3h) — Tuning autovacuum tabelas hot.
7. **DB-018** (4h) — Criar IDX-001..006 após DB-021 medir.
8. **DB-003** (1h), **DB-007** (0.5h), **DB-004** (0.5h), **DB-010** (1h), **DB-025** (1h) — quick wins.

---

## 8. Dependências Entre Débitos

| A bloqueia B | Motivo |
|--------------|--------|
| DB-014 → DB-006, DB-011, DB-016 | Sem types gerados, rename/drop em DB quebra FE em runtime silenciosamente |
| DB-006 (parcial) → DB-016 | Repolicy de `lancamentos_diarios` precisa usar helpers PT-BR estáveis |
| DB-021 → DB-018 | Sem `pg_stat_statements`, criação de índices é especulativa |
| DB-013 → DB-022 | Limpar backups antes de habilitar pgaudit evita ruído de auditoria |
| DB-026 → DB-016 (REVOKE) | Scripts admin atualmente fazem INSERT direto; quebram se REVOKE ocorrer antes |
| DB-016 → mitigação X-5 (gate 09:45) | Gate só fica server-enforced após REVOKE |
| DB-022 + DB-027 → DB-012 | pgaudit + anonimização-trigger são pré-reqs do consent/erasure workflow |
| DB-002 → DB-008 | Rate limit deve registrar tentativas em `logs_auditoria` (criado/migrado em DB-002) |

---

## 9. Ferramentas Recomendadas

| Ferramenta | Status atual | Recomendação | Débito |
|-----------|--------------|--------------|--------|
| `pgcrypto` | INSTALADO (4 migrations) | Manter. Usado em PII encrypt + tokens OAuth. | — |
| `pg_cron` | INSTALADO (oauth_state_cleanup) | Manter; expandir para cleanup de `notificacoes` antigas. | — |
| `pg_stat_statements` | **NÃO** instalado | HABILITAR — pré-req para priorizar índices. | DB-021 |
| `pgaudit` | **NÃO** instalado | HABILITAR — exigido por LGPD/SOC2. | DB-022 |
| `supabase advisors` (security+performance) | Sem evidência de execução | RODAR + agendar quinzenal. `supabase advisors lint --linked`. | DB-025 |
| `pg_repack` | **NÃO** instalado | Não urgente. Reavaliar quando `lancamentos_diarios > 1M`. | — |
| `Supavisor` (pool) | Default ativo, não validado | DOCUMENTAR config (`pool_mode`, `pool_size`). | DB-023 |

---

## 10. Questões para Outros Agentes

### @ux-design-expert (FASE 6)
1. Após DB-016 REVOKE em `lancamentos_diarios`, há código em `useCheckins.ts` ou similar que faz `supabase.from('lancamentos_diarios').insert(...)` direto, ou tudo passa pelo RPC `submit_checkin`? Se direto: migrar urgente.
2. Após DB-014 (types gerados), as 30+ tabelas renomeadas EN→PT-BR causarão quebras de tipo em quantos arquivos? Estimativa de blast radius para planejar sprint 1.
3. `<RoleSwitch>` (UX-016): hooks que disparam antes do gate fazem queries em tabelas com `USING(true)`? Se sim, RBAC client é única defesa — não é defesa.

### @qa (FASE 7)
1. **Test gate proposto antes de Sprint 1:**
   - RLS regression matrix: 8 tabelas críticas × 5 roles = 40 cenários (mínimo).
   - E2E gate 09:45 com manipulação de relógio (timezone America/Sao_Paulo).
   - Smoke test que faz `POST /rest/v1/lancamentos_diarios` direto e DEVE retornar 403 após DB-016.
2. Existe baseline de performance (p95) para `submit_checkin`, `compute_dre`, queries de relatório? Sem baseline, DB-018 vira chute.
3. Pode escrever contract tests entre `submit_checkin` e o client React antes da Sprint 1?

### @architect (FASE 8)
1. Confirmar se os upgrades de DB-008 (Alta→Crítica) e DB-012 (Média→Alta) batem com o framework de priorização do consolidador.
2. DB-026 (postgres superuser scripts) é DB ou SYS? Listo aqui por ser DB-touching, mas pode duplicar com SYS-005. Sugiro mover para SYS na consolidação final.
3. O esforço total DB de ~95–100h cabe em 1 epic ou precisa quebrar em 2 (Hardening Crítico + LGPD/Compliance)?

---

**Fim da revisão @data-engineer (FASE 5).** Recomendação para o gate QA (FASE 7): **APPROVED viável** condicionado à execução validada da Sprint 1 (P0). Sem Sprint 1, gate deve ser **NEEDS WORK** — vetor DB-016 é demonstrável e bloqueia produção.
