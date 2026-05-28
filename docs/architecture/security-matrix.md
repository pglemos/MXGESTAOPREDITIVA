# MX Security Matrix

**Data:** 2026-05-27  
**Escopo:** MX-02.2 RLS por entidade, roles canônicos e fundação executiva MX.

## Role Codes

| Code | Tipo | Intenção de acesso |
|---|---|---|
| `master` | Perfil canônico | Dono/Master da loja; acesso executivo ao escopo da própria loja |
| `director` | Perfil canônico | Diretoria/sócio; leitura executiva e ações de gestão dentro do escopo autorizado |
| `sales_manager` | Perfil canônico | Gerente comercial; execução operacional da loja/equipe autorizada |
| `seller` | Perfil canônico | Vendedor; acesso individual e rotinas próprias |
| `marketing` | Perfil canônico | Área de marketing; leitura/escrita apenas em objetos do departamento quando modelado |
| `product` | Perfil canônico | Área de produto/estoque; leitura/escrita apenas em objetos do departamento quando modelado |
| `finance` | Perfil canônico | Financeiro; leitura/escrita apenas em objetos financeiros/planejamento autorizados |
| `hr` | Perfil canônico | RH; leitura/escrita apenas em objetos de pessoas/universidade autorizados |
| `operations` | Perfil canônico | Operações; leitura/escrita apenas em objetos operacionais autorizados |
| `consultant` | Perfil canônico | Consultor MX; análise consultiva, comentário e plano de ação; nunca altera score |
| `admin_mx` | Meta-role MX | Administração interna MX; não é um dos 10 perfis de loja |

## Helpers SQL

| Helper | Migration | Status | Uso |
|---|---|---|---|
| `current_user_role_code(uuid)` | `20260527120000_role_rls_helpers.sql` | Aplicado | Resolve `roles.code` via `usuarios.role_id`, com fallback para `usuarios.role` legado |
| `current_user_role_codes(uuid)` | `20260527120000_role_rls_helpers.sql` | Aplicado | Combina role principal e vínculos ativos em `vinculos_loja` |
| `user_has_role(text[], uuid)` | `20260527120000_role_rls_helpers.sql` | Aplicado | Guard booleano para policies e RPCs |
| `user_has_min_hierarchy(smallint, uuid)` | `20260527120000_role_rls_helpers.sql` | Aplicado | Guard por hierarquia |
| `user_is_master_loja(uuid, uuid)` | `20260527120000_role_rls_helpers.sql` | Aplicado | Verifica Master ativo da loja via `vinculos_loja` |
| `can_access_mx_scope(score_scope_type, uuid, uuid)` | `20260527170000_executive_schema_rls_hardening.sql` | Aplicado localmente | Centraliza leitura por escopo para alerts/planos/benchmark |

## Entity Matrix

| Entidade | Leitura atual | Escrita atual | Evidência | Pendência |
|---|---|---|---|---|
| `roles` | `authenticated` lê catálogo | `authenticated` bloqueado; service role bypass | `20260527100000_canonical_roles_schema.sql` | Deprecar consumo direto de `usuarios.role` após migração dos consumidores |
| `usuarios` | Legado permanece; `role_id` populado | Fora do tightening desta wave | `20260527100000_canonical_roles_schema.sql` | Policy final: Master vê usuários da loja; demais veem só si; Admin MX por allowlist/função existente |
| `lojas` | Legado permanece | Fora do tightening desta wave | Baseline + helpers `tem_papel_loja`, `is_owner_of`, `is_manager_of` | Policy final: Master/Gerente por loja; Consultor/Admin MX por escopo interno |
| `score_inputs` | Temporariamente amplo em MX-7.1 | INSERT autenticado temporário em MX-7.1 | `20260527110000_score_engine_schema.sql` | Draft `20260527130000_score_rls_final.sql` ainda bloqueado por decisões de `scope_id` |
| `score_calculations` | Temporariamente amplo em MX-7.1 | INSERT bloqueado para `authenticated`; UPDATE/DELETE bloqueado por trigger | `20260527110000_score_engine_schema.sql` | Aplicar policy final só após staging; score continua service-only |
| `score_history` | Temporariamente amplo em MX-7.1 | UPDATE/DELETE bloqueado por trigger | `20260527110000_score_engine_schema.sql` | Filtrar por escopo quando `score_inputs.scope_id` estiver decidido |
| `score_observations` | Temporariamente amplo em MX-7.1 | INSERT pelo autor; trigger limita a `consultant`/`master` | `20260527110000_score_engine_schema.sql` | Reforçar com `user_has_role(['consultant','master','admin_mx'])` após staging |
| `alerts` | `can_access_mx_scope(scope_type, scope_id)` | Engine cria; roles operacionais atualizam status dentro do escopo | `20260527140000_alerts_engine_schema.sql`, `20260527170000_executive_schema_rls_hardening.sql` | Validar `department`/`process` após MX-15 mapear store |
| `alert_channels` | Herda acesso do alerta | Write bloqueado para `authenticated` | `20260527140000_alerts_engine_schema.sql`, `20260527170000_executive_schema_rls_hardening.sql` | Validar canais reais push/WhatsApp quando integrações existirem |
| `planos_acao` | Escopo via `can_access_mx_scope` ou responsável | Operacionais criam/atualizam no escopo; responsável atualiza próprio; delete `master`/`admin_mx` | `20260527150000_planos_acao_schema.sql`, `20260527170000_executive_schema_rls_hardening.sql` | Validar em RLS regression suite com dados multi-loja |
| `historico_planos_acao` | Herda acesso do plano | INSERT bloqueado para `authenticated`; trigger registra alterações | `20260527170000_executive_schema_rls_hardening.sql` | Validar auditoria em banco local/branch |
| `benchmark_snapshots` | Interno MX, Master/Gerente da loja ou helpers legados owner/manager | INSERT bloqueado para `authenticated`; UPDATE/DELETE bloqueado por trigger | `20260527160000_benchmarking_schema.sql`, `20260527170000_executive_schema_rls_hardening.sql` | Revalidar quando `loja_id` e vínculos M:N estiverem 100% normalizados |
| `eventos_agenda_executiva` | Loja/responsável/created_by conforme policy | Usuário cria/atualiza eventos próprios/de escopo permitido | `20260527190000_executive_agenda_schema.sql` | Validar integração Google/Outlook com payload privado |
| `departamentos_mx` e planejamento/regras consultivas | Por departamento, role e escopo | Roles autorizados por departamento/escrita planejada | `20260527180000_departments_planning_consultive_rules_schema.sql` | Conectar `department`/`process` a loja para RLS de escopo fino |

## Score RLS Draft

`20260527130000_score_rls_final.sql` permanece **DRAFT/NOT APPLIED**. Não aplicar sem branch/staging porque o próprio arquivo registra decisões pendentes:

1. Definir se `score_inputs.scope_id` com `scope_type='store'` aponta sempre para `lojas.id`.
2. Definir filtro por loja do usuário para `score_inputs`.
3. Definir se Consultor MX vê todas as lojas associadas por vínculo M:N ou por outro modelo de carteira.

## Regression Gates

Antes de mover MX-02.2 para Done:

- Rodar RLS regression suite com pelo menos duas lojas e usuários `master`, `director`, `sales_manager`, `seller`, `consultant`, `admin_mx`.
- Provar negação cross-store para `usuarios`, `lojas`, `score_*`, `alerts`, `planos_acao`, `benchmark_snapshots`.
- Provar que Consultor MX consegue inserir `score_observations` e não consegue alterar `score_calculations`.
- Provar que `seller` não lê score/alerta/plano de outro usuário/loja fora do escopo.
- Regenerar `src/types/database.generated.ts` apenas contra schema aplicado.
