# Database Security & Quality Audit — MX Gestão Preditiva

| Field | Value |
|-------|-------|
| **Status** | ACTIVE |
| **Version** | 3.0 (Brownfield Discovery Phase 2/10) |
| **Date** | 2026-05-16 |
| **Agent** | @data-engineer (Dara) |
| **Overall Score** | **74/100** (regressão de 8 pts vs v2.0 por dívida acumulada do crescimento PT-BR + consultoria) |

> Esta versão substitui a v2.0 (15-abr-2026, 82/100). A regressão reflete dívida acumulada após adoção do branch consultoria, renomeação PT-BR de ~30 tabelas e introdução de RPCs gateway sensíveis sem revogar `GRANT` direto nas tabelas subjacentes.

---

## 1. Executive Summary

- **Total de tabelas:** ~100 (vs 46 na v2.0)
- **Tabelas COM RLS habilitado:** ~95 (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY` em 109 ocorrências, deduplicado: 95)
- **Tabelas SEM RLS:** 5 — `migration_backup_lancamentos_diarios_duplicates_20260503`, `migration_backup_vendedores_loja_duplicates_20260503`, `role_assignments_audit`, `roles`, `store_meta_rules_history`
- **RLS `USING (true)` (anti-pattern):** 33 ocorrências em 23 tabelas — algumas são catálogos legítimos, outras (ex.: `usuarios`, `lancamentos_diarios`, `vendedores_loja`) representam risco e dependem de gates de RPC para mitigação
- **RPCs auditadas:** 68 únicas (87 ocorrências `SECURITY DEFINER`, 75 com `SET search_path` — 12 sem)
- **Edge Functions auditadas:** 15 — 13 com auth helper, 2 com `verify_jwt = false` (1 público intencional + 1 OAuth callback)
- **Foreign Keys:** ~195 total — 21 sem `ON DELETE` explícito
- **Indexes:** 101 `CREATE INDEX`

### Débitos por severidade

| Severidade | Quantidade |
|-----------|-----------|
| 🚨 Crítica | 4 |
| ⚠️ Alta | 6 |
| ⚙️ Média | 5 |
| ℹ️ Baixa | 4 |
| **Total** | **19** |

---

## 2. RLS Coverage Analysis

### ✅ Tabelas com RLS adequado

Todas as tabelas de **PDI 360**, **feedback semanal**, **regras_metas_loja**, **regras_entrega_loja**, **pre_cadastros_loja**, **vinculos_loja**, **lojas**, **checkin_audit_logs**, **checkin_correction_requests** usam policies baseadas em helpers `eh_administrador_mx()`, `tem_papel_loja()`, `check_user_role_in_store()`. Padrão consistente, evita recursão (helper pattern).

### ⚠️ Tabelas com RLS fraco (`USING (true)`)

23 tabelas distintas com pelo menos uma policy permissiva total:

| Tabela | Risco | Mitigação atual | Recomendação |
|--------|-------|----------------|---------------|
| `usuarios` | Alto — leak de PII | Trigger `bloquear_self_update_usuarios_sensivel` em UPDATE | Restringir SELECT a self + admins; remover USING(true) |
| `lancamentos_diarios` | Alto — multi-tenant | Gate via RPC `submit_checkin` (mas tabela ainda permite INSERT direto se GRANT não revogado) | Endurecer policy ou `REVOKE INSERT, UPDATE, DELETE` |
| `vendedores_loja` | Alto — vínculo seller/loja | Helper `tem_papel_loja` em outras policies | Substituir USING(true) por isolamento por store_id |
| `metas`, `historico_metas` | Médio | — | Filtrar por store_id |
| `daily_lead_volumes` | Médio | — | Filtrar por store_id |
| `report_history` | Médio — pode vazar emails de destinatários | — | Restringir a admins+gestor da loja |
| `digital_products`, `inventory` | Baixo | — | Confirmar se são catálogos públicos MX |
| `agencies` | Baixo | — | Confirmar escopo |
| `perfis`, `permissoes_modulo`, `modulos_sistema` | Baixo (catálogo) | — | Documentar como intencional |
| `automation_configs` | Médio | — | Restringir a admins |
| `communication_instances` | Médio — pode vazar instâncias WhatsApp | — | Restringir |
| `consulting_methodology_steps`, `consulting_metric_catalog`, `consulting_parameter_sets`, `consulting_parameter_values`, `consulting_pmr_form_templates`, `consulting_visit_programs`, `consulting_visit_template_steps`, `consulting_schedule_events` | Baixo a médio | — | Catálogos consultoria — confirmar; `schedule_events` parece operacional → endurecer |
| `goal_logs` | Médio | — | Filtrar por store_id |

### 🚨 Tabelas SEM RLS

| Tabela | Multi-tenant? | Risco | Recomendação |
|--------|--------------|-------|---------------|
| `role_assignments_audit` | Sim (auditoria) | 🚨 Alto — leak global de quem promoveu quem | Habilitar RLS, SELECT só admin |
| `roles` | Não (catálogo) | Baixo | Confirmar intencional; documentar |
| `store_meta_rules_history` | Sim | 🚨 Alto — vaza histórico de metas entre lojas | Habilitar RLS por store_id |
| `migration_backup_lancamentos_diarios_duplicates_20260503` | Sim | 🚨 Crítico — dados de check-in expostos | **DROPAR** após validação |
| `migration_backup_vendedores_loja_duplicates_20260503` | Sim | 🚨 Crítico — vínculos de seller expostos | **DROPAR** após validação |

---

## 3. RPC Security Analysis

### `submit_checkin(jsonb)` — RPC gateway de check-in (2026-05-16)

**Defesas observadas:**
- `SECURITY DEFINER` + `SET search_path = public` ✅
- Valida `auth.uid()` e `usuarios.active = true` ✅
- Bloqueia escopo `daily` fora da janela 09:45 ✅
- Bloqueia data futura (`reference_date > v_official_reference`) ✅
- Bloqueia self-submit por outro usuário em `daily` ✅
- Exige vínculo ativo (`vinculos_loja.is_active`) para sellers ✅
- `ON CONFLICT` na unique key (idempotência) ✅
- `GRANT EXECUTE ... TO authenticated` (não anon) ✅

**Pendências:**
- ⚠️ DB-001 — `vendedores_loja.is_active` NÃO é validado (só `vinculos_loja`). Vendedor encerrado em `vendedores_loja` mas com vínculo ativo poderia lançar.
- ⚠️ DB-002 — `EXCEPTION WHEN others` engolindo qualquer erro e retornando `SQLERRM` ao client — risco de info disclosure (estrutura interna, nomes de coluna).
- ⚠️ Tabela `lancamentos_diarios` permite `USING (true)` em RLS — o gate só funciona se `GRANT INSERT/UPDATE` for revogado do role `authenticated`. **NÃO CONFIRMADO** nas migrations.

### `update_my_profile(jsonb)` / `complete_password_change()` — Self-service auth (2026-05-16)

**Defesas:** `auth.uid()`, `usuarios.active = true`, scoped UPDATE em `WHERE id = v_user_id`. ✅

**Pendências:**
- ℹ️ DB-003 — Não há validação de formato de `phone` ou `avatar_url`. Aceita qualquer string.
- ℹ️ DB-004 — `complete_password_change()` apenas limpa flag — assume que o cliente já fez `auth.updateUser({password})` antes. Se ordem invertida, o flag é limpo sem troca real de senha. Documentar contrato.
- ⚠️ DB-002 (mesma) — `EXCEPTION WHEN others` retorna SQLERRM.

### `admin_create_store(jsonb)` / `admin_update_store(uuid, jsonb)` / `admin_archive_store(uuid)` / `admin_restore_store(uuid)` (2026-05-16)

**Defesas:**
- Valida role `IN ('administrador_geral', 'administrador_mx')` ✅
- Valida `usuarios.active = true` ✅
- Soft-close cascata em `vendedores_loja` + `vinculos_loja` quando `active=false` ✅
- `ON CONFLICT (store_id) DO UPDATE` em `regras_entrega_loja` / `regras_metas_loja` / `benchmarks_loja` ✅

**Pendências:**
- ⚠️ DB-005 — Não há validação de unicidade de `cnpj` antes do INSERT. Lojas duplicadas com mesmo CNPJ são aceitas se constraint não existir (não confirmado).
- ⚠️ DB-002 — `EXCEPTION WHEN others` retorna SQLERRM.
- ℹ️ DB-007 — Cria `regras_entrega_loja` com `matinal_recipients = [manager_email]` sem validar formato de email.

---

## 4. Edge Functions Audit

| Função | Auth | Validação Input | Rate Limit | Secrets | Observações |
|--------|------|----------------|------------|---------|-------------|
| `store-pre-registration` | 🚨 PÚBLICO (`verify_jwt=false`) | `clean()/normalizeEmail()/clientIp()` | ❌ Nenhum | SERVICE_ROLE | DB-008 — Endpoint público sem rate limit nem captcha. Vetor de spam de pré-cadastros. |
| `google-oauth-handler` | 🚨 sem JWT (callback) | parseClientId + state validation | ❌ | GOOGLE_* | DB-010 — Confirmar validação de `state` PKCE em todos os paths |
| `approve-store-registration` | ✅ JWT + role check | Validado | — | SERVICE_ROLE | OK |
| `feedback-semanal` / `relatorio-matinal` / `relatorio-mensal` | ✅ `authorizeReportRequest` | `parseReportBody` | — | SERVICE_ROLE + RESEND | OK; uploadDocumentToStore depende de Google tokens válidos |
| `google-calendar-*` | ✅ sessionClient | parseStrictBody + schemas | — | SERVICE_ROLE + GOOGLE_* | OK; refresh_token criptografado AES-GCM via `crypto.ts` |
| `google-drive-files` | ✅ sessionClient + INTERNAL_ROLES gate | requireEnv | — | SERVICE_ROLE + GOOGLE_* | OK; MAX_FILE_SIZE_BYTES = 25MB enforced |
| `manage-store-team` / `register-user` / `send-individual-feedback` / `send-visit-report` | ✅ `requireAuthenticatedRole` | — | — | SERVICE_ROLE (+RESEND) | OK |

**CORS:** todas via `_shared/cors.ts` com `Access-Control-Allow-Origin: *` ⚠️ DB-009 — Aceitável em dev, restringir em prod ao domínio do app (`mxperformance.vercel.app`).

---

## 5. Performance Risks

### Índices faltantes

Vide SCHEMA.md §4 (IDX-001..IDX-006). Hot paths:
- RLS lookup em `vinculos_loja(user_id, is_active)` chamado por quase toda policy → composite + partial index recomendado.
- Sort de relatórios diários em `lancamentos_diarios(submitted_at)`.
- Lookups de notificações não lidas.

### Queries potencialmente lentas

- ⚠️ DB-011 — `compute_dre` overloaded em `consulting_financials` E `financeiro_consultoria` (rename incompleto). Pode gerar joins duplicados se ambas versões forem chamadas.
- View `view_store_daily_production` agrega `lancamentos_diarios` — verificar plan se cresce >100k rows.

### N+1 risks

- Edge functions `feedback-semanal` / `relatorio-mensal` fazem múltiplas queries por seller. Não auditado se há batching ou single-query com unnest.

---

## 6. Compliance & PII

### PII identificada

- `usuarios.name`, `usuarios.email`, `usuarios.phone` (✅ phone criptografado via `pii_encrypt_phone` migration 2026-04-16; coluna `phone` é `bytea`, `decrypt_phone()` helper)
- `usuarios.avatar_url`
- `lojas.cnpj`, `lojas.administrative_phone`, `lojas.legal_name`, `lojas.partners` (jsonb)
- `pre_cadastros_loja.full_name/email/phone/company_*`
- `consulting_client_contacts.*` (emails, telefones de contatos consultoria)
- Tokens OAuth (`tokens_oauth_consultoria`) — ✅ criptografados via `crypto.ts` AES-GCM

### LGPD/GDPR

- ✅ `logs_acesso_sensivel` existe e parece capturar acessos sensíveis
- ⚠️ DB-012 — Não há tabela explícita de **consentimento** nem rotina de **right-to-erasure**. Para LGPD precisa: registro de consentimento (timestamp, finalidade, IP), workflow de deleção/anonimização sob demanda.
- ⚠️ Trigger `check_orphan_users_after_membership_deletion()` limpa órfãos — verificar se anonimiza ou apaga.
- ⚠️ Backups `migration_backup_*_20260503` mantém PII de meses atrás sem RLS — risco LGPD.

---

## 7. Débitos Técnicos (Database)

| ID | Débito | Severidade | Categoria | Esforço (h) | Notas |
|----|--------|-----------|-----------|------------|-------|
| DB-001 | `submit_checkin` não valida `vendedores_loja.is_active` | 🚨 Crítica | rpc | 1 | Vendedor encerrado mas com vinculo ativo lança check-in |
| DB-002 | `EXCEPTION WHEN others ... SQLERRM` em todas RPCs novas vaza estrutura interna | 🚨 Crítica | rpc/security | 2 | Substituir por mensagem genérica + log em `logs_auditoria` |
| DB-013 | Tabelas `migration_backup_*_20260503` SEM RLS contendo PII histórica | 🚨 Crítica | rls/cleanup | 1 | Validar e DROP |
| DB-016 | `lancamentos_diarios` com `USING(true)` sem REVOKE explícito | 🚨 Crítica | rls | 2 | Confirmar GRANT e endurecer policy/REVOKE |
| DB-005 | Falta UNIQUE constraint em `lojas.cnpj` | ⚠️ Alta | constraint | 0.5 | Adicionar `UNIQUE NULLS NOT DISTINCT` |
| DB-006 | Coexistência de helpers EN (`is_admin`, `is_member_of`) e PT-BR (`eh_administrador_mx`, `tem_papel_loja`) | ⚠️ Alta | refactor | 8 | Plano de deprecação, atualizar policies, drop legados |
| DB-008 | `store-pre-registration` público sem rate limit/captcha | ⚠️ Alta | edge/security | 4 | Adicionar throttle por IP + reCAPTCHA |
| DB-011 | `compute_dre` overloaded em 2 nomes de tabela (rename incompleto) | ⚠️ Alta | refactor/migration | 2 | Dropar versão antiga após confirmação |
| DB-014 | Ausência confirmada de `database.types.ts` gerado por Supabase CLI | ⚠️ Alta | tooling | 1 | Adicionar `supabase gen types typescript --linked > src/types/database.generated.ts` ao pipeline |
| DB-017 | 12 RPCs `SECURITY DEFINER` SEM `SET search_path` (CVE-2018-1058 family) | ⚠️ Alta | security | 3 | Listar via `grep -B1 "SECURITY DEFINER" \| grep -v "SET search_path"` e corrigir |
| DB-003 | `update_my_profile` aceita `phone/avatar_url` sem validar formato | ⚙️ Média | rpc/validation | 1 | Regex E.164 e URL |
| DB-007 | `admin_create_store` aceita `manager_email` sem validar formato | ⚙️ Média | rpc/validation | 0.5 | Regex de email |
| DB-009 | CORS `Allow-Origin: *` em todas edge functions | ⚙️ Média | edge/cors | 1 | Restringir em prod ao domínio do app |
| DB-012 | Sem tabela de consentimento LGPD nem rotina de right-to-erasure | ⚙️ Média | compliance | 16 | Levantar requisitos jurídicos e desenhar |
| DB-015 | 21 FKs sem `ON DELETE` explícito (default RESTRICT) | ⚙️ Média | data-integrity | 3 | Auditar e definir CASCADE/SET NULL caso a caso |
| DB-004 | `complete_password_change` confia que client trocou senha antes | ℹ️ Baixa | rpc/doc | 0.5 | Documentar contrato no JSDoc do client |
| DB-010 | Confirmar validação de `state` PKCE no `google-oauth-handler` em todos paths | ℹ️ Baixa | edge/oauth | 1 | Code review |
| DB-018 | Indexes faltantes IDX-001..IDX-006 (vide SCHEMA.md §4) | ℹ️ Baixa | performance | 3 | Validar com EXPLAIN antes de criar |
| DB-019 | `role_assignments_audit` e `store_meta_rules_history` sem RLS | ℹ️ Baixa→Alta | rls | 1 | Habilitar RLS com policy admin-only / por store_id |

---

## 8. Respostas às Perguntas do @architect

### Q1: `postgres@3.4.8` em paralelo ao client Supabase — por quê?

**Resposta:** Usado APENAS em scripts de manutenção offline:
- `scripts/repair_sql.ts` — conecta via `POSTGRES_URL` para reparar dados
- `scripts/run_fix_rls.ts` — aplica migrations de fix RLS pontuais

Nenhum código de aplicação (`src/`) importa `postgres`. Conexão é direta ao Postgres (`ssl: 'require'`), bypassando PostgREST/RLS — apropriado para scripts admin executados por engenheiros, **não** rota de produção.

**Risco:** scripts assumem `POSTGRES_URL` válido no `.env` local. Se vazar, dá acesso superuser. Recomendação: mover scripts para Edge Function admin com auth ou documentar como "admin-only, never CI".

### Q2: `database.types.ts` gerado?

**Resposta:** Existe `src/types/database.ts` (manual?), mas **NÃO** existe `database.types.ts` nem `database.generated.ts` produzido pelo `supabase gen types`. Vide DB-014. Recomendação: adicionar geração ao pipeline para evitar deriva de tipos vs schema (especialmente crítico com renames PT-BR).

### Q3: RLS auditado em todas tabelas multi-tenant?

**Resposta:** 95 das 100 tabelas têm `ENABLE ROW LEVEL SECURITY`. **5 estão sem RLS** (vide §2 acima — 3 críticas: backups + `store_meta_rules_history`). Adicionalmente, 23 tabelas têm pelo menos uma policy `USING (true)` — destas, algumas são catálogos legítimos, mas pelo menos `usuarios`, `lancamentos_diarios`, `vendedores_loja`, `report_history`, `metas`, `historico_metas`, `communication_instances`, `automation_configs` precisam revisão (DB-016).

### Q4: Surface de ataque dos RPCs sensíveis

| RPC | Surface | Status |
|-----|---------|--------|
| `submit_checkin` | `authenticated` role; payload jsonb com store_id, seller_user_id, reference_date, metric_scope | ✅ Defesa multi-camada, ⚠️ DB-001 (vendedores_loja não validado), ⚠️ DB-002 (SQLERRM leak) |
| `update_my_profile` / `complete_password_change` | `authenticated`; payload limitado a self | ✅ Scoped a `auth.uid()`, ⚠️ DB-003 sem validação de formato |
| `admin_create_store` / `admin_update_store` / `admin_archive_store` / `admin_restore_store` | `authenticated` + role check para admins | ✅ Defesa por role, ⚠️ DB-005 (cnpj), DB-007 (email format) |

---

## 9. Perguntas para Outros Agentes

### Para @ux-design-expert (Fase 3)

1. O frontend ainda usa nomes EN antigos (`stores`, `users`, `memberships`) ou já está migrado para PT-BR (`lojas`, `usuarios`, `vinculos_loja`)?
2. Há subscriptions real-time (`supabase.channel`) em alguma tabela? Quais? (impacto em RLS broadcast)
3. Tipagem: o frontend tem `src/types/database.ts` manual — está sincronizado? Algum lugar usa `any` para Supabase queries?
4. Forms de check-in respeitam a janela 09:45 client-side antes de chamar `submit_checkin`?
5. Telas administrativas (criar loja, aprovar pre-cadastro) têm controle de acesso por role no client OU dependem 100% do RPC?

### Para @qa (Fase 7)

1. Testes E2E cobrem o gate de 09:45 do `submit_checkin`? (timezone America/Sao_Paulo é tricky)
2. Há testes que validam RLS de tabelas com `USING (true)` (especialmente `lancamentos_diarios`)?
3. Existe teste de regressão para o cenário DB-001 (vendedor encerrado em `vendedores_loja` mas com vínculo ativo)?
4. Testes de segurança para os endpoints públicos (`store-pre-registration`, `google-oauth-handler`)?
5. Cobertura de LGPD: há plano de teste para anonimização/deleção de PII?

---

## 10. Recomendações Priorizadas

1. **🚨 Sprint imediata (≤ 8h):** DB-001, DB-002, DB-013, DB-016, DB-019 — fechar gaps críticos de RLS/RPC antes de qualquer release.
2. **⚠️ Sprint seguinte (≤ 20h):** DB-005, DB-008, DB-014, DB-017 — endurecer surface pública e tooling de tipos.
3. **⚙️ Backlog técnico (≤ 30h):** DB-006 (deprecar helpers EN), DB-011 (limpar compute_dre overload), DB-015 (FKs), DB-009 (CORS prod).
4. **📋 Compliance:** DB-012 — discutir com PM/legal a abordagem LGPD antes de codificar.
5. **🔬 Performance:** DB-018 — criar índices só depois de medir com `pg_stat_statements` em ambiente com volume real.
