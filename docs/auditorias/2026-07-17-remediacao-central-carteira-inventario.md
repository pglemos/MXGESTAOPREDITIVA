# Fase 0 — Inventário e Congelamento do Estado

**Data:** 2026-07-17
**Escopo:** Central de Execução, Carteira, Supabase (`fbhcmzzgwjdgkctlfvbo`), Vercel (`mxperformance`)
**Status:** Fase 0 concluída (só-leitura). Nenhuma alteração em produção foi feita nesta sessão.

## Resumo executivo

O working tree local estava **5 commits atrás de `origin/main`** no início desta sessão — todos os 5 commits ausentes eram fixes de segurança de banco (grants/RLS), aparentemente aplicados por outra sessão/processo sem que este ambiente local tivesse sincronizado (`git fetch` + `git pull --ff-only`, sem perda de trabalho local, sem force-push). Isso confirma o padrão já registrado em memória de commits/pushes para `main` ocorrendo fora da sessão visível.

Achado crítico: as **5 migrations de segurança mais recentes estão commitadas e com CI verde, mas NENHUMA foi aplicada ao banco de produção** (`supabase migration list --linked` mostra coluna `Remote` vazia para todas). Ou seja, a proteção que essas migrations implementam (revogar `anon`/`authenticated` de RPCs administrativas, triggers, views, importação) **ainda não está ativa em produção**.

Achado adicional: existem **5 timestamps de migration na tabela `schema_migrations` remota sem arquivo local correspondente** — drift de schema, alterações aplicadas diretamente em produção fora do histórico versionado do repositório (viola o princípio de reprodutibilidade da Seção 4.3 do plano mestre).

## 1. GitHub

| Item | Valor |
|---|---|
| Repositório | `pglemos/MXGESTAOPREDITIVA` |
| Branch | `main` |
| SHA local no início da sessão | `dc0e2bb5f0812d88694c38b72d172ea4e4a70d08` |
| SHA `origin/main` (após fetch) | `2d86a6ee1036ef6e9b82086bfbd23adaac763be5` |
| Ação tomada | `git pull --ff-only` (fast-forward puro, sem commits locais perdidos — `dc0e2bb5` era ancestral estrito de `origin/main`) |
| SHA local após pull | `2d86a6ee1036ef6e9b82086bfbd23adaac763be5` (= `origin/main`) |
| Working tree | Limpo, exceto 1 arquivo não rastreado (ver §4) |
| CI dos 2 commits mais novos | ✅ verde (Gitleaks, ESLint a11y, Atomic Design, Typecheck+unit) |

### Commits recuperados pelo pull (mais novo → mais antigo)

| SHA | Mensagem | Migration correspondente |
|---|---|---|
| `2d86a6ee` | fix(db): remove anonymous access from authenticated user RPCs | `20260717230000_revoke_anon_authenticated_user_rpcs.sql` |
| `55ee44cd` | fix(db): require internal MX authorization for import processing | `20260717220000_harden_process_import_data_authorization.sql` |
| `a3bc1304` | fix(db): restrict admin and maintenance RPC execution | `20260717210000_revoke_anon_admin_maintenance_rpcs.sql` |
| `3a64cf4c` | fix(db): revoke direct execution from trigger functions | `20260717200000_revoke_trigger_function_execute.sql` |
| `b5795324` | fix(db): enforce caller RLS on operational views | `20260717190000_security_invoker_views.sql` |

Cada commit trouxe também um teste correspondente em `src/lib/*.test.ts` e regenerou `src/types/database.generated.ts` (+1319 linhas).

## 2. Supabase (`fbhcmzzgwjdgkctlfvbo`)

- MCP Supabase **sem permissão neste projeto** (confirmado novamente — `get_project`, `list_migrations`, `get_advisors` retornam `-32600 permission`). Consistente com achado anterior em memória; `list_projects` do MCP só enxerga outro projeto (GOLF FOX). Usar CLI linked.
- CLI Supabase (`v2.75.0`, desatualizada — latest `v2.109.1`) está **linked** ao projeto correto (`fbhcmzzgwjdgkctlfvbo`, MX GESTAO PREDITIVA, sa-east-1) e autenticada (sem precisar exportar token manualmente).

### Estado das migrations (`supabase migration list --linked`)

**Pendentes de aplicação em produção (Local ✅ / Remote ❌):**

| Versão | Migration | Conteúdo |
|---|---|---|
| `20260717190000` | `security_invoker_views.sql` | força `security_invoker` em views operacionais |
| `20260717200000` | `revoke_trigger_function_execute.sql` | revoga EXECUTE direto de funções de trigger |
| `20260717210000` | `revoke_anon_admin_maintenance_rpcs.sql` | revoga `anon` de RPCs admin/manutenção |
| `20260717220000` | `harden_process_import_data_authorization.sql` | exige autorização interna MX para processar import |
| `20260717230000` | `revoke_anon_authenticated_user_rpcs.sql` | revoga `anon` de RPCs de usuário autenticado |

**Drift — aplicadas em produção sem arquivo local no repo (Remote ✅ / Local ❌):**

| Versão (timestamp remoto) | Data/hora | Arquivo local |
|---|---|---|
| `20260717055926` | 2026-07-17 05:59:26 | **inexistente** |
| `20260717095920` | 2026-07-17 09:59:20 | **inexistente** |
| `20260717101407` | 2026-07-17 10:14:07 | **inexistente** |
| `20260717102743` | 2026-07-17 10:27:43 | **inexistente** |
| `20260717104107` | 2026-07-17 10:41:07 | **inexistente** |

Não foi possível inspecionar o conteúdo dessas 5 migrations-fantasma nesta sessão: `supabase db dump` exige Docker (daemon não está rodando neste ambiente) e não há senha de banco disponível para conexão direta via pooler (ver memória `reference_supabase_mx_performance.md` — senha não fica gravada, keychain historicamente instável). **Bloqueio documentado, não contornado com atalho inseguro.**

- **Advisors de segurança:** não obtidos nesta sessão (MCP sem permissão; CLI 2.75 não expõe advisors). Necessário resolver acesso (token de API válido ou upgrade do MCP) antes da Fase 1.
- **Grants de `anon`/`authenticated`** (Seção 4.2 do plano mestre — `clientes`, `oportunidades`, `agendamentos`, `eventos_comerciais`, `notificacoes`, `central_execucao_aberturas`): não verificados nesta sessão pelo mesmo bloqueio de acesso a SQL direto. Achado anterior (memória) indicava commit `fix(db): restrict admin and maintenance RPC execution` reduzindo funções `SECURITY DEFINER` executáveis por `anon` de 102→88 e por `authenticated` de 122→115 — mas isso cobre **funções**, não necessariamente `TRUNCATE`/`DELETE` diretos em tabela, que é o risco específico citado na Seção 4.2.

## 3. Vercel (`mxperformance`, team `synvolt`)

| Item | Valor |
|---|---|
| Team ID | `team_9kUTSaoIkwnAVxy9nXMcAnej` (confirmado via `list_teams`) |
| Project ID | `prj_fpYjxc851kMs55GzR6tgQEr7uWUj` (confirmado via `list_projects`) |
| Deployment de produção atual | `dpl_ELFz78hFmkxeF37azn4EebuuEaZq` — **READY** |
| SHA publicado | `a3bc1304c74144e6ebf3855c81f9c62627ffb647` |
| Aliases | mxperformance.vercel.app, mxperformance.com.br, www.mxperformance.com.br |

**Gap:** o SHA publicado (`a3bc1304`) está **2 commits atrás** do `main` atual (`2d86a6ee`). Os commits `55ee44cd` e `2d86a6ee` (harden import + revoke anon authenticated RPCs) ainda não foram implantados. Combinado com o achado da §2, o cenário atual é: nem o código de produção nem o banco de produção refletem as 2 últimas correções de segurança commitadas.

## 4. Working tree — item não relacionado

- `supabase/migrations/20260520120000_gemini_daily_usage_limits.sql` — arquivo não rastreado, sem relação com os commits acima (nome/data distintos). Não tocado nesta sessão; não interfere na cadeia de migrations pendentes.

## 5. Bloqueios documentados (não contornados)

1. **Docker indisponível** → impede `supabase db dump` para inspecionar grants/ACLs completos e o conteúdo das 5 migrations-drift.
2. **Senha de banco não disponível** → impede conexão direta via pooler para SQL ad-hoc.
3. **Supabase MCP sem permissão** neste projeto → impede `get_advisors`, `list_migrations`, `execute_sql` via MCP.

Nenhum desses bloqueios foi contornado com atalho inseguro (ex.: não usei o token colado no chat para chamadas diretas de API sem necessidade, não tentei senha adivinhada, não subi Docker sem autorização).

## 6. Próximos passos (aguardando decisão)

1. Resolver acesso (subir Docker localmente, ou obter senha de banco, ou token de API válido) para: (a) ler conteúdo real das 5 migrations-drift, (b) rodar advisors de segurança, (c) checar grants de `anon`/`authenticated` tabela a tabela.
2. Decidir se as 5 migrations pendentes (`20260717190000`–`230000`) devem ser aplicadas em produção agora (Fase 3) — isso é mutação de produção, será pausado para confirmação explícita antes de executar, conforme combinado.
3. Decidir se o deployment Vercel deve ser atualizado para incluir os 2 commits ainda não publicados.
4. Investigar quem/o que gerou as 5 migrations-drift sem passar pelo git — repete padrão já registrado em memória de auto-commit/push para `main` fora de sessão visível.

**Nenhuma alegação de "100% concluído", "GO" ou "seguro" é feita neste documento.** Esta é a Fase 0 apenas — inventário.

---

## Fase 3 (parcial) — Aplicação executada em 2026-07-17

Autorização explícita do usuário para aplicar as migrations pendentes e publicar. Execução:

### 1. Reconciliação do ledger de migrations

`supabase db push`/`db pull` recusaram operar por causa do drift das 5 migrations-fantasma (§2 acima). Rodado `supabase migration repair --status reverted` nas 5 versões órfãs (`20260717055926`, `095920`, `101407`, `102743`, `104107`) — **operação de bookkeeping apenas**, não altera schema/dados reais, apenas destrava o ledger para push/pull normais. O conteúdo real dessas 5 migrations-fantasma **continua não documentado** (bloqueio: sem Docker, sem senha de banco — `db pull` para capturar o diff residual falhou pelo mesmo motivo). Pendência registrada abaixo.

### 2. Aplicação das 5 migrations de segurança já commitadas

`supabase db push --linked` aplicou com sucesso, confirmado por `supabase migration list --linked` (todas com `Remote` preenchido agora):

- `20260717190000_security_invoker_views.sql`
- `20260717200000_revoke_trigger_function_execute.sql`
- `20260717210000_revoke_anon_admin_maintenance_rpcs.sql`
- `20260717220000_harden_process_import_data_authorization.sql`
- `20260717230000_revoke_anon_authenticated_user_rpcs.sql`

### 3. Novo achado durante a verificação: grants diretos de `anon` em tabelas críticas (Seção 4.2 do plano mestre)

Query de verificação (`information_schema.role_table_grants`) revelou que **antes desta correção**, `anon` tinha `INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER` em 6 tabelas — resíduo do template default do Supabase, nunca revogado:

| Tabela | Privilégios de `anon` (antes) |
|---|---|
| `clientes` | INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER |
| `oportunidades` | idem |
| `agendamentos` | idem |
| `eventos_comerciais` | idem |
| `notificacoes` | idem |
| `central_execucao_aberturas` | idem |

Diagnóstico antes de corrigir: RLS habilitado (não forçado) nas 6 tabelas; **zero policies referenciando `anon`/`public`** (`pg_policies` vazio para essas tabelas+role) — logo nenhum fluxo legítimo depende desses grants (RLS já bloqueava SELECT/INSERT/UPDATE/DELETE de `anon` na prática; o gap real e explorável é `TRUNCATE`, que RLS não cobre). Padrão de referência: `execution_actions` já tinha zero grants para `anon`.

**Correção:** nova migration forward-only `20260717240000_revoke_anon_direct_table_access_crm_core.sql` — `REVOKE ALL ... FROM anon` nas 6 tabelas. Aplicada via `db push`.

**Teste antes/depois (evidência):**
```
ANTES: 42 linhas de grant (7 privilégios × 6 tabelas)
DEPOIS: 0 linhas — SELECT ... WHERE grantee='anon' AND table_name IN (...) retornou []
```

### 4. Regeneração de types

`npm run gen:db-types` rodado duas vezes (após as 5 migrations e após a 6ª). Sem diff em `src/types/database.generated.ts` nas duas vezes — esperado, já que as correções são apenas de GRANT/REVOKE e `security_invoker`, não alteram a superfície de tabelas/colunas/assinaturas de função introspectada.

### 5. Fora de escopo — não tocado

`supabase/migrations/20260520120000_gemini_daily_usage_limits.sql` (untracked): removido temporariamente do diretório antes de cada `db push` (colidia como "fora de ordem"/mesma versão de uma migration já aplicada) e restaurado logo em seguida. **Não commitado, não aplicado.** Precisa de timestamp próprio (o atual `20260520120000` colide com `20260520120000_ai_model_daily_usage_limits.sql`, já aplicada) antes de qualquer decisão sobre ele.

### 6. Pendências que continuam em aberto

- Conteúdo real das 5 migrations-fantasma (§2 e Fase 3.1): não recuperado. Requer Docker rodando (`supabase db pull`) ou senha de banco para conexão direta.
- Advisors de segurança/performance do Supabase: não obtidos (MCP sem permissão neste projeto; CLI 2.75 não expõe advisors via linha de comando).
- Deploy Vercel: SHA publicado ainda não inclui os commits desta sessão até o push abaixo ser feito e o auto-deploy rodar.
- Revalidação completa de grants em **todas** as tabelas públicas (o plano mestre pede isso, não só as 6+4 verificadas aqui) não foi feita — apenas as tabelas nomeadas na Seção 4.2 do prompt mestre foram checadas.
- Reprodução automatizada do cenário de mutação cruzada entre vendedores (Fase 1.1 do plano mestre) não foi executada nesta sessão.

**Verdict desta sessão: GO COM RESSALVAS** — as correções aplicadas são reais e verificadas (evidência acima), mas o escopo do plano mestre completo (Fases 1, 5–11) não foi executado. Não há alegação de conclusão total.

---

## Fase 1–3 — Achado 4.1 (mutação cruzada entre vendedores) — 2026-07-17, continuação

### Hipótese
`central_reschedule_action` e `central_resolve_action` autorizam a chamada via `central_can_manage_action(v_action.seller_id, v_action.store_id)` (campos da própria `execution_actions`), mas em seguida fazem `UPDATE public.clientes/oportunidades/agendamentos WHERE id = v_action.*_id` sem revalidar que esses registros pertencem ao mesmo vendedor/loja. Se `execution_actions` tiver `cliente_id`/`oportunidade_id`/`agendamento_id` apontando para um registro de outro vendedor (drift), a mutação se propaga silenciosamente.

### Evidências
- Definições reais das 5 RPCs da Central (`central_reschedule_action`, `central_resolve_action`, `central_create_manual_action`, `central_sync_appointment_action`, `central_escalate_action`) e das funções de apoio (`central_can_manage_action`, `central_can_access_store`, `central_upsert_appointment_action_internal`) extraídas via `pg_get_functiondef` direto da produção.
- `central_can_manage_action`: um vendedor comum só passa se `auth.uid() = p_seller_id`; `central_create_manual_action` já bloqueia vendedor comum vinculando cliente/oportunidade de outro dono (`central_can_manage_action(v_client_seller, v_client_store)` antes de aceitar `client_id`). Ou seja, a via de criação manual está protegida.
- O vetor real é `central_upsert_appointment_action_internal` (trigger de sincronização de `agendamentos`): copia `seller_id`/`store_id`/`cliente_id`/`oportunidade_id` do agendamento no momento do sync. Se o `agendamentos.seller_user_id` divergir do `clientes.seller_user_id` do cliente vinculado (mesma loja), a `execution_actions` nasce com o drift.
- **Consulta em produção confirmou 1 registro ativo real com esse exato drift**: `execution_actions.id = 9a59623f-7e91-43e0-a57f-b8505a0c305e` (entrega, `source_type=agendamento`, `automatic=true`) — `store_id` igual, mas `seller_id` (vinculado a "Vendedor MX") diferente do `clientes.seller_user_id` do cliente vinculado ("José***"). A oportunidade vinculada concorda com o `seller_id` da action, não com o do cliente. `clientes.updated_at = clientes.created_at` (2026-07-09) — o cliente nunca foi reatribuído; o agendamento (criado 2026-07-12) que nasceu com vendedor diferente do dono do cliente.
- 0 mismatches em `oportunidades`/`agendamentos` isoladamente; 0 `NULL` em `seller_id`/`store_id` nas 21 `execution_actions` ativas — filtro de escopo seguro de aplicar sem falso-positivo por NULL.

### Diagnóstico
Falha de invariante confirmada e ativa em produção, não apenas hipotética. Causa raiz: nenhuma das RPCs de resolução/reagendamento revalida a consistência entre a `execution_actions` e as entidades que ela referencia antes de mutá-las.

### Decisão
Migration `20260717250000_enforce_central_action_scope_consistency.sql`: `CREATE OR REPLACE FUNCTION` em `central_reschedule_action` e `central_resolve_action`, adicionando `AND loja_id = v_action.store_id AND seller_user_id = v_action.seller_id` a cada `UPDATE` de `agendamentos`/`oportunidades`/`clientes`, com `IF NOT FOUND THEN RAISE EXCEPTION 'Atividade inconsistente: ...'` logo depois (7 pontos: 2 em reschedule, 5 em resolve — agendamento + 3 branches de oportunidade + cliente). `central_can_manage_action`, `central_escalate_action` e `central_create_manual_action` não foram alterados (já corretos). Autorização de gerente/dono/admin preservada — o filtro compara o registro vinculado contra `v_action.seller_id`/`store_id` (não contra `auth.uid()`), então não depende de quem está executando.

O registro inconsistente `9a59623f-...` **não foi reatribuído nem cancelado nesta sessão** — decidir se o cliente deve mudar de vendedor ou se a entrega deve ser reassociada é call de negócio, não técnica; fica registrado aqui para triagem manual. Efeito da migration sobre esse registro específico: passa a ser fail-closed (bloqueia com erro explícito) em vez de silenciosamente sobrescrever o cliente de outro vendedor.

### Validação
- Teste de contrato estático `src/lib/central-action-scope-consistency.test.ts` — 5/5 pass localmente (`bun test`), confirma as 7 combinações filtro+guarda presentes na migration e que as funções de autorização não foram tocadas.
- Verificação pós-deploy: `pg_get_functiondef` das duas funções em produção contém o filtro de escopo nos 7 pontos esperados (2 em `central_reschedule_action`, 5 em `central_resolve_action`) — confirmado via query direta pós-`db push`.
- `npm run gen:db-types` sem diff (assinaturas de função não mudaram); `npm run typecheck` limpo.
- **Não executado nesta sessão**: reprodução dinâmica end-to-end (Seção 1.1 do plano mestre) simulando vendedor B autenticado tentando resolver a action `9a59623f-...` e confirmando o erro `Atividade inconsistente` via chamada real de RPC. A verificação acima é estrutural (definição da função em produção contém a guarda), não uma chamada RPC autenticada real. Fica como pendência.

### Pendências abertas desta fase
- Reatribuição/triagem manual do registro `9a59623f-8e91-43e0-a57f-b8505a0c305e` (decisão de negócio).
- Reprodução E2E autenticada (vendedor A/B reais) do cenário de mutação cruzada, incluindo os testes negativos completos da Seção 1.1.
- `central_sync_appointment_action`/`central_upsert_appointment_action_internal` não foram alterados — se `agendamentos.seller_user_id` puder legitimamente divergir do `clientes.seller_user_id` (ex.: entrega conduzida por vendedor diferente do dono da carteira), a nova guarda vai **bloquear esse fluxo por design**. Não há confirmação de que isso seja um fluxo de negócio intencional ou um bug de atribuição — precisa de validação com o time de produto antes de generalizar a regra para outros pontos do sistema.
