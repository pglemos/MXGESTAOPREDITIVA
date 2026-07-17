# Homologação final — Central de Execução & Carteira (segurança)

**Data:** 2026-07-17
**Projeto Supabase:** `fbhcmzzgwjdgkctlfvbo` (MX GESTAO PREDITIVA, sa-east-1) — confirmado
**Vercel:** projeto `mxperformance` (team synvolt) — confirmado
**Verdict:** **GO COM RESSALVAS**

---

## 1. Resumo executivo

Os dois P0 de segurança do escopo foram revalidados no estado atual e fechados:

1. **Mutação cruzada entre vendedores (Central):** já corrigida e **viva em prod** — cada
   `UPDATE` em `agendamentos`/`oportunidades`/`clientes` dentro de `central_resolve_action`
   (e RPCs irmãs) filtra por `loja_id = v_action.store_id AND seller_user_id = v_action.seller_id`
   e aborta com `RAISE EXCEPTION 'Atividade inconsistente...'` quando `NOT FOUND`. Verificado
   lendo o corpo das funções em produção.
2. **Grants perigosos de `anon`/`authenticated`:** estavam **amplamente abertos** — 179/195
   tabelas com template default do Supabase para `anon` (incl. TRUNCATE) e 185 com
   TRUNCATE/TRIGGER/REFERENCES para `authenticated`. Causa raiz: DEFAULT PRIVILEGES do owner
   `postgres` reconcedendo em toda tabela futura. **Corrigido** por 4 migrations forward-only
   aplicadas em prod + guard pgTAP.

Ressalvas (não bloqueadas por código, mas por política de credenciais desta sessão):
rotas autenticadas, E2E com perfis reais, paridade visual Base44 e smoke de produção **não
foram executados** porque exigem login com senha (a política de segurança do agente proíbe
digitar senhas em formulários). Push→CI→redeploy dos commits locais é operação exclusiva de
`@devops`.

## 2. SHA

- **Inicial (HEAD da sessão):** `4bf37ab1b1d7807896c7ef7927cce2c58a9ae62c`
- **Final (local, não publicado):** `db2a237e` (6 commits novos)
- **Deployado em prod (Vercel):** `4bf37ab1` — `READY`. Os commits novos são DB/tests/CI e
  **não alteram o bundle frontend** (as migrations já foram aplicadas no banco de prod), então
  o runtime publicado opera contra o schema endurecido.

## 3. Commits (atômicos, sem force push, branch main)

| SHA | Mensagem |
|---|---|
| `09b522b4` | fix(db): revoke anon grants e privilegios que burlam RLS em todo o schema public |
| `e51cd7c0` | fix(db): revoke execute de anon em RPCs SECURITY DEFINER de escopo |
| `e496f4de` | test(db): grants guard pgTAP |
| `3e1c4694` | chore(db): versiona migrations aplicadas em prod ausentes do git (drift Fase 4) |
| `db2a237e` | chore(db): congela checksums de migrations aplicadas (forward-only) |

## 4. Migrations criadas e aplicadas em prod

| Versão | Efeito | Aplicada |
|---|---|---|
| `20260717270000` | REVOKE ALL anon (tabelas+sequences) + REVOKE TRUNCATE/TRIGGER/REFERENCES authenticated + fix DEFAULT PRIVILEGES do postgres | ✅ |
| `20260717271000` | Cobre views/matviews/partições fora de `pg_tables` (ex.: view `clientes_oportunidades`) | ✅ |
| `20260717272000` | REVOKE EXECUTE de anon em 6 RPCs de escopo | ✅ |
| `20260717273000` | REVOKE EXECUTE de PUBLIC + GRANT explícito authenticated/service_role (anon herdava via PUBLIC) | ✅ |

Registradas em `supabase_migrations.schema_migrations`. Versionadas em git + congeladas no
manifest `.migration-checksums.json` (253 migrations).

## 5. Grants antes/depois (evidência)

| Métrica | Antes | Depois |
|---|---:|---:|
| Tabelas public com grant p/ `anon` | 179 | **0** |
| Tabelas com TRUNCATE/TRIGGER/REFERENCES p/ `authenticated` | 185 | **0** |
| Grant p/ `anon` nas 13 tabelas canônicas | vários | **0** |
| RPCs SECURITY DEFINER de escopo executáveis por `anon` | 6 | **0** |
| DEFAULT PRIVILEGES do postgres reconcedendo `anon` (tabelas) | sim | **não** |
| DML de `authenticated` nas canônicas (`clientes`, `execution_actions`) | ok | **preservado** |

Guard pgTAP `supabase/tests/rls-matrix/grants_guard.test.sql` assevera todos esses invariantes
no clean-bootstrap; validado contra prod (6/6 passam).

## 6. Cross-seller (evidência de código)

`central_resolve_action`, `central_reschedule_action`, `central_escalate_action`,
`central_sync_appointment_action`, `central_create_manual_action`: `SELECT ... FOR UPDATE` na
atividade, checagem `central_can_manage_action(seller_id, store_id)`, e cada mutação em entidade
relacionada com filtro `loja_id`+`seller_user_id` e abort em `NOT FOUND`. Nenhum registro
inconsistente foi encontrado que exigisse correção de dados.

## 7. Supabase advisors

- **Segurança:** `0` ERROR/crítico. WARN: 217 (`function_search_path_mutable` 29,
  `anon_security_definer_function_executable` 70 — todos fora do escopo Central/Carteira e cada
  função guarda `auth.uid()`/é predicado; `rls_enabled_no_policy` 5; `auth_leaked_password_protection` 1).
  INFO: 5. Nenhum WARN é P0/P1 de escopo.
- **Ressalva:** hardening amplo dos 70 secdef executáveis por anon (fora do escopo) fica como
  follow-up P2 — não foi feito em massa para evitar quebra de predicados usados por RLS/login.

## 8. Vercel (evidência)

- Deployment `dpl_BugCAVmVHBdTL59TZP6aFR9bdGQU`, `READY`, branch main, SHA `4bf37ab1`, criado
  2026-07-17T11:30Z. Aliases: `mxperformance.vercel.app`, `mxperformance.com.br`.
- Rotas SPA públicas `200 text/html` (refresh direto OK): `/login`, `/carteira-clientes`,
  `/central-execucao`, `/notificacoes`.
- **Ressalva Fase 8.14:** CSP servida como `Content-Security-Policy-Report-Only` — não bloqueia,
  apenas reporta. Endurecer para enforcing é P2.
- **Ressalva:** rotas autenticadas não testadas (login por senha proibido nesta sessão).

## 9. Dados de teste e limpeza

Nenhum dado de teste criado em produção. As alterações foram exclusivamente DDL de grants
(REVOKE/GRANT/ALTER DEFAULT PRIVILEGES), sem INSERT/UPDATE em tabelas de negócio. Sem resíduo.

## 9-bis. Validação executada nesta sessão (API autenticada + browser)

Como a política proíbe digitar senha em formulário, o isolamento foi validado num
nível mais forte que clique de UI: JWT claims impersonados dentro de transação
revertida (zero resíduo) + boundary HTTP real com a anon key.

**Cross-seller (Fase 1.1 / Exemplo 1), contra prod, transação revertida:**
- Fixture: cliente do vendedor A + `execution_action` do vendedor B apontando para o
  cliente de A (mesma loja) → impersonado B via `request.jwt.claims`.
- **Ataque** `central_resolve_action`: `ABORTOU_OK — "Atividade inconsistente: cliente
  vinculado nao pertence ao mesmo vendedor/loja da atividade."`
- **Legítimo** (B no próprio cliente): `SUCESSO_OK` (status concluida, evento gerado).
- Cliente de A **inalterado** (before == after); action do ataque permaneceu `pendente`.
- `ROLLBACK` forçado → nenhum dado de teste persistido.

**Anon no boundary HTTP real (PostgREST + anon key), 6/6 negados `401 permission denied`:**
`GET clientes`, `GET usuarios`, `GET execution_actions`, `RPC vendedor_concluir_execution_action`,
`RPC central_resolve_action`, `POST clientes`.

**Browser (deploy prod `mxperformance.com.br`):** landing e boot do SPA renderizam;
`0` erros no console (runtime limpo). Rotas autenticadas não percorridas (login por senha).

## 10. Matriz de aceite (gate final)

| Gate | Status | Nota |
|---|---|---|
| supabase.correct_project | ✅ | fbhcmzzgwjdgkctlfvbo |
| supabase.anon_private_table_grants = 0 | ✅ | 0 |
| supabase.cross_seller_mutation_blocked | ✅ | **testado**: ataque aborta, legítimo sucede, cliente de A inalterado (tx revertida) |
| supabase.authorized_flows_work | ✅ | RPC legítima retornou SUCESSO com evento; authenticated mantém DML |
| anon HTTP boundary negado | ✅ | 6/6 `401 permission denied` via PostgREST+anon key |
| vercel runtime clean | ✅ | SPA renderiza, 0 erros de console |
| supabase.no_test_residue | ✅ | zero DML de negócio |
| supabase.no_scope_critical_advisors | ✅ | 0 ERROR |
| github.main_clean / atomic / no_force_push | ✅ | working tree limpa |
| github.ci_green | ⏳ | commits locais; push/CI é @devops |
| vercel.deployment_ready | ✅ | READY |
| vercel.deployed_sha_matches | ⚠️ | deploy=4bf37ab1; novos commits DB-only não deployados |
| vercel.authenticated_routes_pass | ⛔ | bloqueado (login por senha) |
| base44_parity.* | ⛔ | bloqueado (login por senha) |
| quality.migration_clean_bootstrap | ⏳ | guard no CI; não executado localmente (precisa stack supabase) |

## 11. Verdict

**GO COM RESSALVAS.** Os P0 de segurança do escopo (cross-seller + grants anon) estão
corrigidos, aplicados em prod e cobertos por guard automatizado. As ressalvas restantes são:
(a) execução das validações que exigem autenticação por senha — devem ser feitas por um operador
humano/@devops; (b) push→CI→redeploy dos commits locais (@devops); (c) hardening P2 de CSP
enforcing e dos secdef anon fora de escopo. Nenhum P0/P1 de escopo permanece aberto.
