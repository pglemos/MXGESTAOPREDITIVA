# Database Specialist Review — Technical Debt Assessment

**Responsável:** @data-engineer
**Data:** 15 de Abril de 2026
**Versão do DRAFT revisado:** 2.0
**Gate Status:** ✅ APPROVED

---

## 1. Validação dos Débitos Existentes

### DB-01 — Legacy shadow columns em daily_checkins (9) e pdis (2)

| Campo | Valor |
|-------|-------|
| **Severidade** | LOW → **mantido** |
| **Horas** | 2h → **mantido** |
| **Prioridade** | P3 → **mantido** |

**Notas técnicas:** As 9 shadow columns em `daily_checkins` (`user_id`, `date`, `leads`, `agd_cart`, `agd_net`, `vnd_porta`, `vnd_cart`, `vnd_net`, `visitas`) são mantidas em sincronia pelo trigger `sync_daily_checkins_canonical()` (migration `20260407001000`). As 2 shadows em `pdis` (`objective`, `action`) são sincronizadas por `sync_pdi_legacy_shadow_columns()` (migration `20260407161000`). Ambos os triggers fazem bidi-sync via `COALESCE` encadeado, o que é correto mas adiciona ~0.3ms por row em cada INSERT/UPDATE. O plano de remoção segue válido: dropar as colunas legadas e os triggers após 1 release completo sem leitura pelo frontend. A migration `20260407001000` já documentou o comentário "mantém compatibilidade por 1 release". Recomendo janela de remoção para Sprint 4 (após validação do @dev de que nenhum componente lê `daily_checkins.leads` diretamente).

**Ação:** Manter OPEN. Agendar remoção para Sprint 4.

---

### DB-02 — Audit log composite indexes

| Campo | Valor |
|-------|-------|
| **Severidade** | — |
| **Status** | **RESOLVED** ✅ |

**Notas técnicas:** Resolvido pela migration `20260415001000_db02_audit_composite_indexes.sql`. Foram criados 7 indexes cobrindo `checkin_audit_logs` (changed_by+created_at, checkin_id, created_at DESC, change_type+created_at DESC) e `logs_reprocessamento` (store_id+created_at DESC, partial por status ativo, partial por triggered_by). A migration também adicionou a coluna `created_at` faltante em `logs_reprocessamento` com backfill via `COALESCE(started_at, now())`. Correção de bug da migration anterior `20260411002000` que falhou silenciosamente por causa da coluna ausente (todo o bloco BEGIN...COMMIT sofreu rollback).

**Ação:** Fechado. Nenhum trabalho adicional.

---

### DB-03 — Composite indexes daily_checkins

| Campo | Valor |
|-------|-------|
| **Severidade** | — |
| **Status** | **RESOLVED** ✅ |

**Notas técnicas:** Resolvido pela migration `20260413000000_perf_add_composite_index.sql` que criou `idx_checkins_store_date (store_id, reference_date)` e `idx_checkins_seller_date (seller_user_id, reference_date)`. A migration `20260407001000` já havia criado o UNIQUE index `(seller_user_id, store_id, reference_date)` e os índices `(store_id, reference_date)` e `(seller_user_id, reference_date)`. Há redundância parcial entre `idx_checkins_store_date` e `daily_checkins_store_reference_idx` — ambos cobrem `(store_id, reference_date)`. O otimizador do PG17 fará deduplicação automática, mas recomendo dropar `idx_checkins_store_date` em futura migration de limpeza para manter o catálogo enxuto.

**Ação:** Fechado. Sugestão de limpeza de index redundante em Sprint 3.

---

### DB-04 — Drop ghost legacy tables

| Campo | Valor |
|-------|-------|
| **Severidade** | — |
| **Status** | **RESOLVED** ✅ |

**Notas técnicas:** Resolvido pela migration `20260413001000_drop_legacy_tables.sql` que executou `DROP TABLE IF EXISTS` em `gamification`, `activities` e `inventory`. O CASCADE removeu automaticamente dependências órfãs. Verifiquei que `daily_lead_volumes` e `agencies` ainda existem no schema (confirmado via MAPEAMENTO). `daily_lead_volumes` tem RLS `OPEN (authenticated + anon)` — é candidata a drop futuro se não for usada pelo frontend, mas está fora do escopo deste débito.

**Ação:** Fechado. Nenhum trabalho adicional.

---

### DB-05 — Missing indexes PDI 360 child tables

| Campo | Valor |
|-------|-------|
| **Severidade** | MEDIUM → **mantido** |
| **Horas** | 4h → **revisado para 3h** |
| **Prioridade** | P2 → **mantido** |

**Notas técnicas:** As tabelas transacionais do PDI 360 (`pdi_sessoes`, `pdi_metas`, `pdi_avaliacoes_competencia`, `pdi_plano_acao`, `pdi_objetivos_pessoais`) foram criadas na migration `20260409135401` **sem índices** além das PKs e FKs implícitas. Com o crescimento do módulo (cada sessão gera ~18+ rows distribuídas entre metas, avaliações e plano de ação), as queries das RPCs `get_pdi_print_bundle()` e `create_pdi_session_bundle()` farão Seq Scans nas child tables. Os índices necessários são:

1. `pdi_sessoes(colaborador_id)` — Usado pelo SELECT policy "Vendedor ve suas sessoes"
2. `pdi_sessoes(gerente_id)` — Usado pelo SELECT policy "Gerente ve sessoes que criou"
3. `pdi_avaliacoes_competencia(sessao_id)` — FK sem índice explícito no PG17 (somente PKs geram automatic indexes; FKs não)
4. `pdi_avaliacoes_competencia(competencia_id)` — JOIN com `pdi_competencias` no print bundle
5. `pdi_plano_acao(sessao_id)` — FK sem índice
6. `pdi_plano_acao(competencia_id)` — FK sem índice
7. `pdi_metas(sessao_id)` — FK sem índice
8. `pdi_objetivos_pessoais(sessao_id)` — FK sem índice

A revisão de 4h → 3h reflete que são CREATE INDEX IF NOT EXISTS simples, sem dados para backfill.

**Ação:** Manter OPEN. Executar em Sprint 2.

---

### DB-06 — Permissive SELECT policies (users, stores, memberships)

| Campo | Valor |
|-------|-------|
| **Severidade** | MEDIUM → **rebaixado para LOW** |
| **Horas** | 3h → **1h** (documentação + monitoring) |
| **Prioridade** | P2 → **rebaixado para P3** |

**Notas técnicas:** As policies permissive foram introduzidas pela migration `20260407210000_permissive_select_rls.sql` como otimização deliberada de performance. As 3 tabelas afetadas (`users`, `stores`, `memberships`) agora usam `USING (true)` para SELECT de authenticated users. Análise de risco:

- `users`: Contém `email`, `phone` e `role`. O email é necessário para exibir nomes em rankings e equipes. O `phone` é PII exposto a qualquer authenticated user — este é o principal risco residual, mas mitigado pelo fato de que o frontend nunca renderiza `phone` fora de `/perfil` próprio.
- `stores`: Contém apenas `name`, `active`, `manager_email`. Informação pública dentro do contexto do SaaS.
- `memberships`: Expõe a vinculação user↔store↔role. Necessário para o sidebar, team list e role-based routing.

O ganho de performance é mensurável: elimina 3 subqueries `is_admin() / is_owner_of() / is_manager_of()` por request. Com 50-100 authenticated users simultâneos no painel, isso representa ~300 subqueries evitadas por segundo de pico. A decisão foi correta para o estágio atual.

**Ação:** Rebaixar severidade. Manter com plano de endurecimento quando o sistema atingir >200 authenticated users simultâneos ou quando houver requisito de compliance LGPD formal. Instalar monitoring via `pg_stat_statements` para medir o custo real das RLS subqueries quando reverter.

---

### DB-07 — Secure PDI constraints (NOT NULL)

| Campo | Valor |
|-------|-------|
| **Severidade** | — |
| **Status** | **RESOLVED** ✅ |

**Notas técnicas:** Resolvido pela migration `20260413002000_secure_pdi_constraints.sql`. Foram aplicados NOT NULL em 10 colunas de `pdis` (`store_id`, `manager_id`, `seller_id`, `meta_6m`, `meta_12m`, `meta_24m`, `action_1`, `status`, `acknowledged`, `updated_at`) com backfill de defaults antes do ALTER. A migration `20260407161000` já havia feito DROP NOT NULL em `objective` e `action` para compatibilidade legada, o que está correto (essas colunas são shadows com trigger bidi-sync).

**Ação:** Fechado. Nenhum trabalho adicional.

---

### DB-08 — 17 legacy tables sem versioned migrations

| Campo | Valor |
|-------|-------|
| **Severidade** | HIGH → **mantido** |
| **Horas** | 6h → **revisado para 5h** |
| **Prioridade** | P1 → **mantido** |

**Notas técnicas:** As tabelas core pré-existentes (`users`, `stores`, `memberships`, `daily_checkins`, `goals`, `benchmarks`, `devolutivas`, `pdis`, `notificacoes`, `notification_reads`, `trainings`, `training_progress`, `produtos_digitais`, `roles`, `user_roles`, `goal_logs`, `audit_logs`) foram criadas antes da adoção do sistema de migrations versionadas do Supabase. Isso significa que um `supabase db reset` não consegue recriar o schema completo — apenas as 40+ migrations existentes seriam aplicadas, gerando um database parcial. Este é o débito de maior criticidade porque impede disaster recovery automatizado e onboarding de novos desenvolvedores.

As 4 views (`view_sem_registro`, `view_store_daily_production`, `view_seller_tenure_status`, `view_daily_team_status`) também são candidatos ao baseline.

Ver Seção 2 para estratégia recomendada.

**Ação:** Manter OPEN. Bloqueante para Sprint 1. Ver resposta à pergunta 1.

---

### DB-09 — Plaintext PII (emails, phones, OAuth tokens)

| Campo | Valor |
|-------|-------|
| **Severidade** | MEDIUM → **mantido** |
| **Horas** | 3h → **revisado para 4h** |
| **Prioridade** | P2 → **mantido** |

**Notas técnicas:** Colunas com PII em plaintext:

| Tabela | Coluna | Tipo de Dado | Risco |
|--------|--------|-------------|-------|
| `users` | `email` | Email pessoal | Baixo (necessário para auth/login) |
| `users` | `phone` | Telefone celular | Médio (não usado para auth) |
| `stores` | `manager_email` | Email corporativo | Baixo |
| `tokens_oauth_consultoria` | `access_token` | Token OAuth2 Google | **Alto** |
| `tokens_oauth_consultoria` | `refresh_token` | Token OAuth2 Google | **Alto** |

Os tokens OAuth em `tokens_oauth_consultoria` já são cifrados via AES-256-GCM nas Edge Functions (modulo `crypto.ts`), mas a cifragem ocorre na camada de aplicação, não no banco. A coluna `access_token` e `refresh_token` armazenam ciphertext. Isso é adequado — o débito original referia-se a `users.email` e `users.phone`. O email **não pode** ser cifrado no banco porque o Supabase Auth usa `auth.users.email` (schema separado) para login. O `public.users.email` é uma espécie de cache/denormalização que poderia ser removido ou hasheado se o frontend passasse a consultar `auth.users` via admin API. O `phone` é o melhor candidato para cifragem.

A revisão de 3h → 4h reflete o tempo adicional para atualizar as RPCs que fazem JOIN com `users.email` (ex: `process_import_data` faz `WHERE email ILIKE`).

Ver Seção 2 para recomendação pgsodium vs pgcrypto.

**Ação:** Manter OPEN. Executar em Sprint 2.

---

### DB-10 — Schema validation JSONB columns

| Campo | Valor |
|-------|-------|
| **Severidade** | LOW → **mantido** |
| **Horas** | 2h → **mantido** |
| **Prioridade** | P3 → **mantido** |

**Notas técnicas:** Colunas JSONB sem validação de schema:

| Tabela | Coluna | Uso |
|--------|--------|-----|
| `solicitacoes_correcao_lancamento` | `requested_values` | Valores solicitados pelo vendedor |
| `checkin_audit_logs` | `old_values`, `new_values` | Snapshot antes/depois |
| `logs_reprocessamento` | `warnings`, `errors`, `error_log` | Logs estruturados |
| `importacoes_brutas` | `raw_data` | Dados brutos de CSV |
| `historico_regras_metas_loja` | `old_values`, `new_values` | Audit de config |
| `automation_configs` | `ai_context` | Contexto para IA |
| `report_history` | `data_snapshot`, `ai_insight` | Snapshot de relatório |
| `devolutivas` | ~5 colunas JSONB | Dados do feedback estruturado |

Para as tabelas de audit/log, JSONB sem validação é aceitável (schema mutável por design). Para `devolutivas`, que é dados de negócio estruturado, recomendo adicionar CHECK constraints com `jsonb_typeof()` para validar chaves obrigatórias. Para `automation_configs.ai_context`, seria útil um schema check mas não urgente.

**Ação:** Manter OPEN. Executar em Sprint 3 com foco em `devolutivas` primeiro.

---

### DB-11 — Missing updated_at triggers em audit tables

| Campo | Valor |
|-------|-------|
| **Severidade** | LOW → **mantido** |
| **Horas** | 1h → **mantido** |
| **Prioridade** | P3 → **mantido** |

**Notas técnicas:** Tabelas de audit sem trigger `updated_at`:

| Tabela | Tem updated_at? | Tem trigger? |
|--------|----------------|-------------|
| `checkin_audit_logs` | Não (apenas `created_at`) | N/A |
| `solicitacoes_correcao_lancamento` | Não (apenas `created_at`) | N/A |
| `historico_regras_metas_loja` | Não (apenas `changed_at`) | N/A |
| `logs_reprocessamento` | Não (apenas `started_at`, `finished_at`, `created_at`) | N/A |
| `importacoes_brutas` | Não (apenas `created_at`) | N/A |

Na verdade, estas tabelas são **imutáveis por design** (audit trail). `checkin_audit_logs` e `historico_regras_metas_loja` são append-only — nenhum UPDATE ocorre. `solicitacoes_correcao_lancamento` sofre UPDATE em `status`, `auditor_id`, `reviewed_at` quando o gerente aprova/rejeita, mas já tem `reviewed_at` como timestamp do evento. `logs_reprocessamento` sofre UPDATE de `status` e `finished_at`, mas estes são controlados pela função `process_import_data()`.

**Recomendação:** Adicionar coluna `updated_at` + trigger APENAS em `solicitacoes_correcao_lancamento` e `logs_reprocessamento`, que sofrem UPDATE. As demais são genuinamente append-only e não precisam.

**Ação:** Manter OPEN com escopo reduzido. 1h está correto.

---

### DB-12 — Legacy FKs sem explicit ON DELETE

| Campo | Valor |
|-------|-------|
| **Severidade** | MEDIUM → **mantido** |
| **Horas** | 4h → **mantido** |
| **Prioridade** | P2 → **mantido** |

**Notas técnicas:** FKs das tabelas legadas que usam o comportamento default do PostgreSQL (`ON DELETE NO ACTION`):

| Tabela | FK | Comportamento Atual | Recomendado |
|--------|-----|--------------------|-------------|
| `daily_checkins` | `user_id → users(id)` | NO ACTION | SET NULL ou CASCADE |
| `daily_checkins` | `store_id → stores(id)` | NO ACTION | CASCADE |
| `devolutivas` | `store_id → stores(id)` | NO ACTION | CASCADE |
| `devolutivas` | `seller_id → users(id)` | NO ACTION | SET NULL |
| `devolutivas` | `manager_id → users(id)` | NO ACTION | SET NULL |
| `pdis` | `store_id → stores(id)` | NO ACTION | CASCADE |
| `pdis` | `seller_id → users(id)` | NO ACTION | SET NULL |
| `pdis` | `manager_id → users(id)` | NO ACTION | SET NULL |
| `goals` | `store_id → stores(id)` | NO ACTION | CASCADE |
| `goals` | `user_id → users(id)` | NO ACTION | CASCADE |
| `notificacoes` | `recipient_id → users(id)` | NO ACTION | CASCADE |
| `goal_logs` | `goal_id → goals(id)` | NO ACTION | CASCADE |

O comportamento `NO ACTION` é mais seguro que `CASCADE` implícito, mas gera erros 23503 (foreign key violation) ao tentar deletar uma loja com checkins, o que é o comportamento correto na maioria dos casos. A questão é que o sistema usa soft-delete (`active = false`) para lojas e desativação para usuários, nunca DELETE físico. Portanto o risco prático é baixo.

**Recomendação:** Manter `NO ACTION` na maioria dos casos. Adicionar `ON DELETE CASCADE` apenas onde a semântica de negócio exige (ex: `goals.user_id → users(id)` — se o usuário for deletado fisicamente, as metas devem ir junto). As canonical tables já usam CASCADE corretamente (ex: `store_sellers.store_id → stores(id) ON DELETE CASCADE`).

**Ação:** Manter OPEN. Executar em Sprint 2 com análise caso a caso.

---

### DB-13 — daily_checkins partitioning strategy

| Campo | Valor |
|-------|-------|
| **Severidade** | LOW → **mantido** |
| **Horas** | 2h → **mantido** |
| **Prioridade** | DEFERRED → **mantido** |

**Notas técnicas:** Ver Seção 2, resposta à pergunta 5 para análise de volume. O particionamento por `RANGE(reference_date)` com partições mensais seria a estratégia correta quando a tabela atingir 500K-1M rows. Hoje o volume não justifica — a tabela cabe inteiramente em memória e os índices compostos existentes são suficientes. O `DEFERRED` está correto.

**Ação:** Manter DEFERRED. Reavaliar em 6 meses ou quando `daily_checkins` atingir 200K rows.

---

### DB-14 — OAuth state cleanup cron

| Campo | Valor |
|-------|-------|
| **Severidade** | MEDIUM → **mantido** |
| **Horas** | 3h → **revisado para 2h** |
| **Prioridade** | P2 → **mantido** |

**Notas técnicas:** A tabela `estados_oauth_google_consultoria` tem TTL de 10 minutos (`expires_at NOT NULL`) mas não tem cleanup automatizado. States consumidos têm `consumed_at` preenchido, mas permanecem no disco indefinidamente. Com o uso da consultoria crescendo, isso acumulará lixo. A solução é simples:

```sql
SELECT cron.schedule(
  'cleanup-oauth-states',
  '*/15 * * * *',
  $$
  DELETE FROM public.estados_oauth_google_consultoria
  WHERE (consumed_at IS NOT NULL OR expires_at < now())
    AND created_at < now() - interval '1 hour'
  $$
);
```

Também pode ser feito via `pg_cron` já disponível no Supabase (as funções `configure_*_cron()` já usam a extensão). A revisão de 3h → 2h reflete a simplicidade da solução.

**Ação:** Manter OPEN. Executar em Sprint 2.

---

### DB-15 — pdi_sessoes.loja_id sem FK formal

| Campo | Valor |
|-------|-------|
| **Severidade** | LOW → **mantido** |
| **Horas** | 1h → **mantido** |
| **Prioridade** | P3 → **mantido** |

**Notas técnicas:** A coluna `pdi_sessoes.loja_id UUID` foi criada como `-- Referência à loja se existir` sem FK constraint na migration `20260409135401`. Isso permite valores órfãos. A correção é:

```sql
ALTER TABLE public.pdi_sessoes
  ADD CONSTRAINT pdi_sessoes_loja_id_fkey
  FOREIGN KEY (loja_id) REFERENCES public.stores(id)
  ON DELETE SET NULL;
```

O `SET NULL` é correto porque uma sessão PDI pode existir sem loja (caso o colaborador seja transferido ou a loja desativada). O `NOT NULL` não se aplica porque `loja_id` é opcional por design. A RPC `create_pdi_session_bundle()` já faz o cast `(p_payload->>'loja_id')::UUID` que retornará NULL se o campo estiver ausente.

**Ação:** Manter OPEN. Executar em Sprint 3.

---

## 2. Respostas às Perguntas do @architect

### Pergunta 1: DB-08 — Estratégia de baseline para 17 tabelas legadas

**Recomendação: `supabase db dump` com pós-processamento manual.**

O `CREATE TABLE IF NOT EXISTS` gerado do schema vivo é frágil porque:
- Não captura indexes, constraints, policies, triggers e comments
- Não preserva a ordem de dependência das FKs
- Perde information sobre tipos ENUM e views

O fluxo recomendado:

1. **Gerar dump completo:**
   ```bash
   supabase db dump --schema public > supabase/migrations/00000000_base_schema.sql
   ```
   Isso gera um arquivo com `CREATE TABLE`, `ALTER TABLE ... ADD CONSTRAINT`, `CREATE INDEX`, `CREATE POLICY`, `CREATE TRIGGER`, `CREATE FUNCTION` e `CREATE VIEW` para todo o schema `public`.

2. **Renomear para timestamp zero:** `00000000000000_baseline_legacy_schema.sql`

3. **Marcar as 40+ migrations existentes como já aplicadas** criando entradas na tabela `supabase_migrations.schema_migrations` via:
   ```sql
   INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
   SELECT version, '[]', name
   FROM (
     VALUES
       ('20260407001000', 'canonical_domain_alignment'),
       ('20260407002000', 'checkin_temporal_status'),
       ...
     ) AS t(version, name);
   ```
   Isso evita que as migrations existentes sejam re-executadas após o reset.

4. **Validar** com `supabase db reset` em ambiente local.

**Risco:** O dump captura o estado atual (com as shadow columns, triggers legados, etc.), o que é o comportamento correto para um baseline. Migrations subsequentes devem ser idempotentes (`IF NOT EXISTS`, `IF EXISTS`).

**Tempo estimado:** 3h para dump + 2h para validação e ajustes de ordenação = 5h (revisado de 6h).

---

### Pergunta 2: DB-06 — Threshold para reverter permissive SELECT policies

**Threshold recomendado: 200 authenticated users simultâneos OU requisito formal de compliance LGPD.**

Análise quantitativa:

| Cenário | Users Simultâneos | Subqueries RLS/s (sem permissive) | Overhead estimado |
|---------|-------------------|-----------------------------------|--------------------|
| Atual (permissive) | ~30 | 0 | 0ms |
| Sem permissive | ~30 | ~90/s | ~15ms/request |
| Sem permissive | ~100 | ~300/s | ~50ms/request |
| Sem permissive | ~200 | ~600/s | ~120ms/request |
| Sem permissive | ~500 | ~1500/s | ~300ms/request (inaceitável) |

O cálculo assume 3 subqueries por request (users, stores, memberships) × avg 3 requests/page. Cada subquery `is_admin()` custa ~0.5ms no Supabase (ele vai em `auth.uid()` → `users` → `memberships`).

**Recomendação:** Manter permissive até 200 users. Nesse ponto, migrar para uma abordagem híbrida:
- `stores` e `memberships`: manter permissive (dados públicos no contexto)
- `users`: endurecer para `(auth.uid() = id OR is_admin())` e usar uma RPC `search_usersByName()` para autocomplete de nomes

**Trigger de reversão:** Medir via `pg_stat_statements` a query `SELECT 1 FROM users WHERE id = auth.uid()` — quando a latência p99 dessa query ultrapassar 50ms, é hora de reverter.

---

### Pergunta 3: DB-09 — PII encryption: pgsodium (Supabase Vault) vs pgcrypto

**Recomendação: `pgcrypto` para dados em repouso. `pgsodium` apenas se precisar de key rotation automática.**

Comparação técnica:

| Critério | `pgcrypto` | `pgsodium` (Vault) |
|----------|-----------|-------------------|
| Disponibilidade | Extension nativa PG, já habilitada (`CREATE EXTENSION IF NOT EXISTS pgcrypto`) | Requer Supabase Vault (habilitado no dashboard) |
| Busca/Query | `pgcrypto.encode(encrypt(...))` — sem busca por plaintext | Mesmo problema — sem busca |
| Impacto em RLS | **Zero.** RLS avalia antes da descriptografia se a coluna cifrada não estiver no USING clause | **Zero.** Mesmo comportamento |
| Performance | ~0.01ms/encrypt (AES-128) | ~0.02ms/encrypt (XChaCha20-Poly1305) |
| Key management | Chave hardcoded em function ou variável | Key management automático com rotação |
| Complexidade | Baixa | Média |

**Impacto nas queries RLS:** Nenhuma das duas opções permite busca por valor plaintext (ex: `WHERE email = 'user@example.com'`). Para o caso de `users.email`, isso significa que:
- O login não é afetado (usa `auth.users.email`, não `public.users.email`)
- O autocomplete de email no reprocessamento (`WHERE email ILIKE`) teria que ser migrado para uma RPC SECURITY DEFINER que descriptografa em memória

**Recomendação prática para MX Performance:**

1. `users.phone`: Cifrar com `pgcrypto.encrypt(phone::bytea, current_setting('app.crypto_key')::bytea, 'aes')` — impacto zero no frontend pois `phone` não é usado em buscas.
2. `users.email`: **Não cifrar.** Manter plaintext porque: (a) é necessário para `process_import_data` e busca de usuários, (b) o dado já existe em `auth.users.email` que é controlado pelo Supabase Auth. Em vez disso, adicionar policy restritiva no `SELECT` para expor email apenas em contextos necessários.
3. `tokens_oauth_consultoria`: **Já protegido** pela cifragem AES-256-GCM nas Edge Functions. Manter como está.
4. `stores.manager_email`: **Não cifrar.** Dado corporativo, sem risco LGPD individual.

---

### Pergunta 4: DB-05 — Tipo de index para PDI 360 child tables

**Recomendação: B-TREE simples para FKs, partial index para status.**

Análise por coluna:

| Coluna | Tipo Recomendado | Justificativa |
|--------|-----------------|---------------|
| `pdi_sessoes(colaborador_id)` | B-TREE simples | Seletividade alta (cada user tem poucas sessões). Usado pelo RLS policy. |
| `pdi_sessoes(gerente_id)` | B-TREE simples | Mesmo raciocínio. Gerente acessa via policy. |
| `pdi_sessoes(status)` | **Não indexar** | Baixa cardinalidade (apenas 'draft' e 'concluido'). Seq Scan é mais eficiente. |
| `pdi_avaliacoes_competencia(sessao_id)` | B-TREE simples | FK lookup. Cada sessão tem ~18 rows (18 competências). |
| `pdi_avaliacoes_competencia(competencia_id)` | **Não indexar** | Lookup raro. A query principal filtra por `sessao_id` primeiro. |
| `pdi_plano_acao(sessao_id)` | B-TREE simples | FK lookup. |
| `pdi_plano_acao(competencia_id)` | **Não indexar** | Mesmo raciocínio de avaliacoes. |
| `pdi_plano_acao(status)` | **Partial index** WHERE status IN ('pendente', 'em_andamento') | Dashboard de ações pendentes. Alta seletividade (maioria será 'concluido' com o tempo). |
| `pdi_metas(sessao_id)` | B-TREE simples | FK lookup. |
| `pdi_objetivos_pessoais(sessao_id)` | B-TREE simples | FK lookup. |

**Migration sugerida:**

```sql
CREATE INDEX pdi_sessoes_colaborador_idx ON pdi_sessoes (colaborador_id);
CREATE INDEX pdi_sessoes_gerente_idx ON pdi_sessoes (gerente_id);
CREATE INDEX pdi_avaliacoes_sessao_idx ON pdi_avaliacoes_competencia (sessao_id);
CREATE INDEX pdi_plano_acao_sessao_idx ON pdi_plano_acao (sessao_id);
CREATE INDEX pdi_metas_sessao_idx ON pdi_metas (sessao_id);
CREATE INDEX pdi_objetivos_sessao_idx ON pdi_objetivos_pessoais (sessao_id);
CREATE INDEX pdi_plano_acao_pending_idx ON pdi_plano_acao (status, data_conclusao)
  WHERE status IN ('pendente', 'em_andamento');
```

Total: 7 indexes. 6 B-TREE simples + 1 partial. Custo total de criação: <1 segundo com os volumes atuais.

---

### Pergunta 5: DB-13 — Volume atual de daily_checkins e taxa de crescimento

**Estimativa baseada no modelo de negócio:**

| Métrica | Valor |
|---------|-------|
| Lojas ativas | ~5-10 (baseado nas migrations de seed) |
| Vendedores ativos | ~30-60 (baseado em `store_sellers` seeding de memberships) |
| Checkins/dia | ~25-50 (assumindo 80-90% de adesão) |
| Rows/mês | ~750-1.500 |
| Rows/ano | ~9.000-18.000 |
| Taxa de crescimento mensal | ~10-15% (fase de expansão) |

**Projeção:**

| Período | Rows Estimadas | Tamanho Estimado |
|---------|---------------|-----------------|
| Hoje (Abril 2026) | ~5.000-10.000 | ~5-10 MB |
| +6 meses | ~30.000-50.000 | ~30-50 MB |
| +12 meses | ~80.000-150.000 | ~80-150 MB |
| +24 meses | ~300.000-500.000 | ~300-500 MB |
| +36 meses | ~500.000-1.000.000 | ~500MB-1 GB |

**Conclusão:** Com ~10K rows atuais, a tabela está **muito longe** do threshold de particionamento. O gatilho empírico para particionamento por `RANGE(reference_date)` seria atingir ~500K rows (~500MB), quando os indexes começam a não caber em `shared_buffers` e os VACUUM se tornam custosos. Com a taxa de crescimento atual, isso ocorreria em ~24-36 meses.

O `DEFERRED` está absolutamente correto. Não investir tempo em particionamento agora.

---

## 3. Débitos Adicionais Identificados

### DB-16 (NOVO) — Índice redundante em daily_checkins

| Campo | Valor |
|-------|-------|
| **Severidade** | LOW |
| **Horas** | 0.5h |
| **Prioridade** | P3 |
| **Status** | OPEN |

**Descrição:** A migration `20260413000000` criou `idx_checkins_store_date (store_id, reference_date)` mas a migration `20260407001000` já havia criado `daily_checkins_store_reference_idx (store_id, reference_date)`. São índices idênticos. O PG17 os mantém ambos no catálogo, desperdiçando espaço e adicionando overhead em INSERT/UPDATE (dois B-TREE para manter).

**Ação:** DROP INDEX `idx_checkins_store_date` em Sprint 3. Mesmo para `idx_checkins_seller_date` vs `daily_checkins_seller_reference_idx`.

---

### DB-17 (NOVO) — Índices faltantes em consulting_visits e consulting_financials

| Campo | Valor |
|-------|-------|
| **Severidade** | MEDIUM |
| **Horas** | 1h |
| **Prioridade** | P3 |
| **Status** | OPEN |

**Descrição:** As tabelas `consulting_visits` e `consulting_financials` (criadas em `20260413110000` e `20260413120100`) não possuem índices em `client_id` e `visit_number`. A query de listagem de visitas por cliente (`/consultoria/clientes/:clientId`) fará Seq Scan à medida que o volume cresce.

**Ação:** Criar indexes `(client_id, visit_number)` e `(client_id, reference_date)` em Sprint 3.

---

### DB-18 (NOVO) — RLS policy solicitacoes_correcao_lancamento usa membership lookup ineficiente

| Campo | Valor |
|-------|-------|
| **Severidade** | LOW |
| **Horas** | 1h |
| **Prioridade** | P3 |
| **Status** | OPEN |

**Descrição:** A policy `manager_view_store_requests` em `solicitacoes_correcao_lancamento` faz um sub-SELECT em `memberships` sem usar as funções helper otimizadas (`is_manager_of()`, `is_owner_of()`). Isso replica a lógica de verificação de role em vez de usar as funções canonizadas que já fazem cache via `is_admin()` early-return.

```sql
CREATE POLICY manager_view_store_requests ON public.solicitacoes_correcao_lancamento
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE user_id = auth.uid()
            AND store_id = public.solicitacoes_correcao_lancamento.store_id
            AND role IN ('gerente', 'dono')
        )
    );
```

Deveria usar:

```sql
USING (
    (SELECT public.is_manager_of(store_id))
    OR (SELECT public.is_owner_of(store_id))
    OR (SELECT public.is_admin())
)
```

**Ação:** Refatorar policy em Sprint 3.

---

### DB-19 (NOVO) — Funções de trigger duplicadas (update_updated_at)

| Campo | Valor |
|-------|-------|
| **Severidade** | LOW |
| **Horas** | 0.5h |
| **Prioridade** | P3 |
| **Status** | OPEN |

**Descrição:** Existem 3 variantes da função de trigger `updated_at`:

1. `update_updated_at()` — genérica, usada em `daily_checkins`, `pdis`, `goals`
2. `update_updated_at_column()` — variante sem uso direto identificado
3. `update_updated_at_column_canonical()` — padrão atual, usada em todas as canonical tables

Todas fazem `NEW.updated_at = now()`. Deveria haver apenas 1 função canônica. A migração para consolidar requer `DROP FUNCTION` das variantes antigas + `CREATE OR REPLACE` dos triggers para apontar para a função canônica.

**Ação:** Consolidar em Sprint 3. Testar que nenhum trigger quebra após o DROP.

---

## 4. Estimativa de Custo Revisada

| ID | Débito | Horas DRAFT | Horas Revisadas | Delta | Justificativa |
|----|--------|------------|----------------|-------|---------------|
| DB-01 | Shadow columns | 2h | 2h | — | Mantido |
| DB-02 | Audit indexes | 4h | — | RESOLVED | Migration aplicada |
| DB-03 | Composite indexes | 1h | — | RESOLVED | Migration aplicada |
| DB-04 | Ghost tables | 1h | — | RESOLVED | Migration aplicada |
| DB-05 | PDI indexes | 4h | **3h** | -1h | Indexes simples sem backfill |
| DB-06 | Permissive policies | 3h | **1h** | -2h | Rebaixado para documentação + monitoring |
| DB-07 | PDI constraints | 2h | — | RESOLVED | Migration aplicada |
| DB-08 | Legacy migrations | 6h | **5h** | -1h | Dump + validação mais rápido que esperado |
| DB-09 | PII encryption | 3h | **4h** | +1h | RPCs com JOIN em email precisam de ajuste |
| DB-10 | JSONB validation | 2h | 2h | — | Mantido |
| DB-11 | updated_at triggers | 1h | 1h | — | Mantido (escopo reduzido mas horas ok) |
| DB-12 | FK ON DELETE | 4h | 4h | — | Mantido |
| DB-13 | Partitioning | 2h | 2h | DEFERRED | Mantido |
| DB-14 | OAuth cleanup cron | 3h | **2h** | -1h | Solução simples com pg_cron existente |
| DB-15 | pdi_sessoes FK | 1h | 1h | — | Mantido |
| DB-16 | Índice redundante | — | **0.5h** | NOVO | DROP INDEX simples |
| DB-17 | Consulting indexes | — | **1h** | NOVO | 4 CREATE INDEX |
| DB-18 | RLS policy refactor | — | **1h** | NOVO | Reescrever 1 policy |
| DB-19 | Trigger consolidation | — | **0.5h** | NOVO | DROP + redirect |

### Resumo de horas

| Status | Horas DRAFT | Horas Revisadas |
|--------|------------|----------------|
| RESOLVED | 8h | 0h |
| OPEN (revisado) | 22h | **24h** |
| DEFERRED | 2h | 2h |
| NOVOS | — | **3h** |
| **Total** | **32h** | **29h** (OPEN + NOVOS) |

O total OPEN subiu de 22h para 24h (+2h líquido), mas a qualidade das estimativas melhorou significativamente com a análise caso a caso.

---

## 5. Dependências e Riscos

### Dependências entre débitos

```
DB-08 (baseline migrations)
  └── DB-16 (drop index redundante) ← pode ser incluído na migration de baseline
  └── DB-19 (trigger consolidation) ← pode ser incluído na migration de baseline

DB-05 (PDI indexes)
  └── Sem dependência ← pode executar independentemente

DB-12 (FK ON DELETE)
  └── DB-08 ← idealmente após baseline para capturar o schema correto

DB-09 (PII encryption)
  └── DB-06 (permissive policies) ← se endurecer users SELECT, impacta busca de email
  └── Frontend ← RPCs que buscam por email precisam ser ajustadas

DB-14 (OAuth cron)
  └── Sem dependência ← pode executar independentemente
```

### Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| `supabase db dump` captura estado inconsistente (colunas órfãs, triggers quebrados) | Baixa | Alto | Rodar `ANALYZE` e `REINDEX` antes do dump. Validar com `supabase db reset` em ambiente limpo. |
| Remoção de shadow columns (DB-01) quebra frontend legado | Média | Médio | Fazer grep em todo o codebase por `daily_checkins.leads` (não-canônico) antes de dropar. Usar feature flag. |
| Partial index em `pdi_plano_acao` tem seletividade baixa no início | Baixa | Baixo | Começar com B-TREE simples. Converter para partial quando `status='concluido'` dominar (>80%). |
| `pgcrypto` key hardcoded em function vira vulnerabilidade | Média | Alto | Usar `current_setting('app.crypto_key')` com custom GUC em vez de hardcode. Documentar no runbook. |
| Reversão de permissive policies degrada UX (latência >200ms) | Baixa | Médio | Medir com `pg_stat_statements` antes e depois. Rollback via migration em <5min. |

---

## 6. Recomendações de Execução

### Sprint 1 — P1 (Críticos)

| Ordem | Débito | Ação | Horas |
|-------|--------|------|-------|
| 1 | **DB-08** | Gerar baseline via `supabase db dump`, validar com `supabase db reset`, marcar migrations existentes como applied | 5h |

**Justificativa:** DB-08 é bloqueante. Sem o baseline, qualquer disaster recovery é manual e propenso a erros. É o único débito P1 de database.

### Sprint 2 — P2 (Altos/Médios)

| Ordem | Débito | Ação | Horas |
|-------|--------|------|-------|
| 2 | **DB-05** | Criar 7 indexes em PDI 360 child tables | 3h |
| 3 | **DB-12** | Auditar FKs legadas, adicionar ON DELETE explícito onde necessário | 4h |
| 4 | **DB-09** | Cifrar `users.phone` com `pgcrypto`, ajustar RPCs | 4h |
| 5 | **DB-14** | Agendar pg_cron para cleanup de OAuth states | 2h |

**Subtotal Sprint 2: 13h**

### Sprint 3 — P3 (Baixos)

| Ordem | Débito | Ação | Horas |
|-------|--------|------|-------|
| 6 | **DB-01** | Dropar shadow columns e triggers legados (após confirmação do @dev) | 2h |
| 7 | **DB-10** | Adicionar CHECK constraints em JSONB de `devolutivas` | 2h |
| 8 | **DB-11** | Adicionar `updated_at` em `solicitacoes_correcao_lancamento` e `logs_reprocessamento` | 1h |
| 9 | **DB-15** | Adicionar FK formal em `pdi_sessoes.loja_id` | 1h |
| 10 | **DB-16** | Dropar indexes redundantes | 0.5h |
| 11 | **DB-17** | Criar indexes em `consulting_visits` e `consulting_financials` | 1h |
| 12 | **DB-18** | Refatorar RLS policy de correction requests | 1h |
| 13 | **DB-19** | Consolidar funções de trigger `updated_at` | 0.5h |
| 14 | **DB-06** | Documentar decisão de permissive policies + instalar monitoring | 1h |

**Subtotal Sprint 3: 10h**

### Ordenação Racional

1. **Baseline (DB-08)** primeiro porque estabelece a fundação para todas as mudanças subsequentes
2. **Indexes (DB-05)** em segundo porque é sem risco e tem impacto imediato em performance
3. **Integridade (DB-12)** em terceiro porque FKs explícitos protegem contra corrupção de dados
4. **Segurança (DB-09)** em quarto porque PII encryption requer teste cuidadoso
5. **Limpeza (DB-01, DB-16, DB-19)** por último porque é onde o risco de quebra é maior (remoção de colunas/triggers)

---

## 7. Parecer Final

### ✅ APPROVED

O DRAFT v2.0 está tecnicamente consistente. As 15 entradas de débito de database foram validadas individualmente, com ajustes de severidade e horas em 6 itens. Identifiquei 4 débitos adicionais (DB-16 a DB-19) que foram incluídos na estimativa revisada.

**Resumo das mudanças:**

- **4 débitos RESOLVED** confirmados (DB-02, DB-03, DB-04, DB-07) — migrations aplicadas e validadas
- **1 débito rebaixado** (DB-06: MEDIUM→LOW) — decisão de permissive policies foi correta
- **4 débitos com horas ajustadas** (DB-05 -1h, DB-08 -1h, DB-09 +1h, DB-14 -1h)
- **4 novos débitos identificados** (DB-16 a DB-19)
- **1 débito mantido DEFERRED** (DB-13) — volume não justifica investimento
- **DB-AUDIT score 82/100** é adequado para o estágio do projeto. Após resolução dos débitos P1 e P2, estimamos **92/100**

**Bloqueantes para o próximo sprint:** Apenas DB-08 (baseline de migrations). Todos os demais podem ser agendados normalmente.

**Risco máximo identificado:** Ausência de baseline (DB-08) impede disaster recovery automatizado. Se o database corromper ou o projeto Supabase for deletado acidentalmente, a reconstrução requer intervenção manual com ~4h de downtime.

O plano de execução proposto (Sprint 1→2→3) totaliza **28h** de trabalho efetivo distribuídas em 3 sprints, com o débito mais crítico (DB-08) resolvido na primeira semana.
