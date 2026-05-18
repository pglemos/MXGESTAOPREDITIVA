# Story 1.8 — Habilitar RLS em Tabelas Faltantes (audit, roles, history, backups)

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 1
**Prioridade:** P0
**Severidade do débito:** Crítica
**Débito relacionado:** RLS coverage gap (assessment §RLS)

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 1 critical-path: PASS (rollback DISABLE instantâneo + tier emergencial, bloqueada por 0.5 RLS matrix, coordenação com 1.7 documentada)
**Esforço estimado:** 10h
**Owner sugerido:** @data-engineer
**RACI:** R=@data-engineer, A=Tech Lead, C=@architect+@qa, I=stakeholders
**Created:** 2026-05-17

## Problem Statement
Assessment identifica tabelas sem RLS habilitada: `role_assignments_audit`, `roles`, `store_meta_rules_history` (e as 2 `migration_backup_*_20260503` caso story 1.7 atrase). Sem RLS, qualquer role autenticada lê o conteúdo dessas tabelas. `role_assignments_audit` e `roles` em particular vazam estrutura de autorização — vetor de privilege escalation reconnaissance.

## Business Value
Fecha gaps de leitura indevida em tabelas de segurança/auditoria. Alinha com policy "RLS-by-default" do epic. Reduz superfície de ataque interno.

## Acceptance Criteria
1. **AC1:** Given as 3 tabelas alvo (+ as 2 backup se ainda existentes), When migração aplicada, Then `pg_tables.rowsecurity = true` para todas e `pg_policies` tem ao menos 1 policy por tabela.
2. **AC2:** Given policies criadas, When validadas pelo RLS regression matrix (story 0.5), Then matrix é atualizada e todos os cenários passam (admin lê, role X não lê / lê parcial conforme regra).
3. **AC3:** Given consumidores legítimos, When RLS é habilitada, Then nenhum quebra (validar via smoke tests + inventário de consumidores de cada tabela).
4. **AC4:** Given as policies, When CodeRabbit roda, Then sem `USING (true)` ou `USING (auth.role() = 'authenticated')` sem qualificador adicional (anti-pattern bloqueado).
5. **AC5:** Given history table (`store_meta_rules_history`), When RLS aplicada, Then policy preserva imutabilidade (somente INSERT pelo trigger; SELECT por admin/owner; nenhum UPDATE/DELETE direto).

## Scope IN
- Migrações `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + policies para 3 (ou 5) tabelas.
- Inventário rápido de consumidores de cada tabela.
- Atualização do RLS regression matrix (story 0.5).
- Testes pgTAP de policy enforcement.
- Documentação em `docs/architecture/rls-policies.md`.

## Scope OUT
- Refator amplo do sistema de roles (escopo próprio).
- Outras tabelas sem RLS (verificar — se houver mais, escopo Sprint 2).
- Drop das `migration_backup_*` (story 1.7 — se atrasada, esta cobre defensivamente).

## Tasks
- [ ] Confirmar status RLS atual (`pg_tables.rowsecurity`) para as 5 tabelas.
- [ ] Inventariar consumidores de cada tabela (grep + scripts/edge functions).
- [ ] Desenhar policies por tabela (com @architect).
- [ ] Migração SQL ENABLE RLS + CREATE POLICY.
- [ ] Testes pgTAP por tabela × role.
- [ ] Atualizar RLS regression matrix (story 0.5).
- [ ] Documentar em `docs/architecture/rls-policies.md`.
- [ ] Coordenar com story 1.7 (se backups dropadas, pular essas 2).
- [ ] CodeRabbit + @qa gate.

## Dependências
- **Bloqueada por:** Story 0.5 (RLS matrix), Sprint 0 done.
- **Relacionada:** Story 1.7 (se backups dropadas primeiro, escopo reduz para 3 tabelas).

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Quebra de consumer legítimo (audit dashboard etc.) | Alta | Inventário antes; policies validadas em staging primeiro |
| Policy permissiva demais (`USING true`) | Crítica | CodeRabbit rule + revisão @architect obrigatória |
| History table perde imutabilidade | Crítica | Policy explícita: sem UPDATE/DELETE; trigger preservado |
| Performance de policies complexas | Média | Índices apropriados; bench EXPLAIN ANALYZE |
| `roles` lookup quebra fluxo de autenticação | Crítica | Policy permite SELECT para `authenticated` (info estrutural OK); restringe colunas sensíveis se houver |

## Testes Requeridos
- [ ] pgTAP por tabela × role: matriz completa de permissões esperadas
- [ ] Smoke tests (story 0.6) pós-RLS: zero regressão
- [ ] EXPLAIN ANALYZE em queries críticas: sem degradação >20%
- [ ] Teste de imutabilidade `store_meta_rules_history`: UPDATE/DELETE retorna 0 linhas afetadas
- [ ] CodeRabbit: anti-patterns bloqueados

## Definition of Done
- [ ] ACs verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] RLS habilitada nas tabelas alvo
- [ ] RLS regression matrix atualizada
- [ ] @qa gate PASS
- [ ] Documentação publicada
- [ ] PR merged (@devops push)

## Rollback Plan
1. **Quebra de consumer:** `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` (instantâneo); investigar; re-aplicar com policy ajustada.
2. **Performance degradada:** revert da migração + adicionar índices antes de re-aplicar.
3. **Policy errada bloqueia admin:** policy de emergência `USING (current_user = 'postgres')` enquanto corrige.
4. RTO: <5min para DISABLE; <30min para re-aplicar corrigida.
5. Comunicação: Slack #incidents se quebra em produção.

## Notas Técnicas
- Padrão `roles`: policy permite SELECT para `authenticated` (a estrutura é por design pública internamente); restringir INSERT/UPDATE/DELETE para admin.
- Padrão `role_assignments_audit`: SELECT apenas para admin; INSERT via trigger; sem UPDATE/DELETE.
- Padrão `store_meta_rules_history`: SELECT por admin + owner da loja; INSERT via trigger; bloqueio UPDATE/DELETE.
- ⚠️ **`store_meta_rules_history` foi RENOMEADA** para `historico_regras_metas_loja` em migration `20260430230000` — usar o NOVO nome nos patches.

## Verificação Estática (2026-05-17)
✅ **5 tabelas confirmadas SEM RLS:**
| Tabela | Risco | Source |
|--------|-------|--------|
| `role_assignments_audit` | Alto (audit cross-tenant) | `baseline_legacy:573` |
| `roles` | Baixo (referência) | `baseline_legacy` |
| `historico_regras_metas_loja` (renomeada) | Alto (multi-tenant) | `baseline:623` + rename |
| `migration_backup_vendedores_loja_duplicates_20260503` | Crítico (PII) | tratada em Story 1.7 |
| `migration_backup_lancamentos_diarios_duplicates_20260503` | Crítico (PII) | tratada em Story 1.7 |

**Patch SQL pronto:**
```sql
ALTER TABLE public.role_assignments_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_assignments_audit_select ON public.role_assignments_audit
  FOR SELECT TO authenticated
  USING (public.eh_administrador_mx());

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY roles_select ON public.roles
  FOR SELECT TO authenticated USING (true);
-- Sem INSERT/UPDATE/DELETE policy → bloqueia escrita por padrão

ALTER TABLE public.historico_regras_metas_loja ENABLE ROW LEVEL SECURITY;
CREATE POLICY historico_regras_metas_loja_select ON public.historico_regras_metas_loja
  FOR SELECT TO authenticated
  USING (
    public.eh_area_interna_mx()
    OR public.tem_papel_loja(store_id, ARRAY['dono', 'gerente'])
  );
```

## Referências
- `docs/reviews/sprint-1-quick-verifications.md` §2 (evidência + patches)
- `docs/prd/technical-debt-assessment.md` §RLS coverage
- `docs/reviews/db-specialist-review.md` §RLS
- Story 0.5 (RLS matrix)
- Story 1.7 (cobertura backups PII)
