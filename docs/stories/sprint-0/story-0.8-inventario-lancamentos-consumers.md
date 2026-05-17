# Story 0.8 — Inventário Completo de Consumers de `lancamentos_diarios` (Pré-DB-016)

**Status:** Ready
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 0
**Prioridade:** P0
**Severidade do débito:** Crítica (pré-requisito DB-016)
**Débito relacionado:** Pré-DB-016 / qa-review §1 item 0.8, §4.1
**Esforço estimado:** 6h
**Owner sugerido:** @data-engineer + @dev
**RACI:** R=@data-engineer+@dev, A=Tech Lead, C=@architect, I=@pm
**Created:** 2026-05-17

## Problem Statement
qa-review §4.1 alerta: DB-016 REVOKE sem migrar os 27 SELECTs cliente + scripts/automation/edge functions consumindo `lancamentos_diarios` diretamente quebra produção. Sem inventário completo e plano de migração para RPCs, o canary rollout de DB-016 (Sprint 1) é deploy às cegas. Sprint 0 item 0.8 do assessment estabelece este levantamento como bloqueante.

## Business Value
Transforma o deploy mais arriscado do roadmap (DB-016) em rollout estruturado com lista exaustiva de pontos de quebra mapeados e plano de migração pré-escrito. Custo de inventariar agora (6h) vs custo de descobrir consumer esquecido em produção (incidente + rollback emergencial): assimetria a favor.

## Acceptance Criteria
1. **AC1:** Given o repositório e os edge functions, When a auditoria é executada, Then `docs/security/lancamentos-diarios-consumers.md` contém **todos** os consumers categorizados: (a) 27 SELECTs cliente confirmados, (b) scripts (automation/cron/jobs), (c) edge functions, (d) consultas ad-hoc/dashboards externos.
2. **AC2:** Given cada consumer listado, When o inventário é revisado, Then cada item tem: caminho do arquivo, linha, role esperada, operação (SELECT/INSERT/UPDATE/DELETE), e marcação de "precisa migrar para RPC?" (sim/não/depende).
3. **AC3:** Given o plano de migração, When um consumer requer RPC nova, Then o nome proposto da RPC + assinatura + role permitida estão documentados (ainda sem implementar — Sprint 1).

## Scope IN
- Varredura por `grep` / `ast-grep` em `src/`, `supabase/functions/`, `scripts/`.
- Inspeção do Supabase dashboard (queries salvas, dashboards) — anotação manual se aplicável.
- Categorização e tabela em `docs/security/lancamentos-diarios-consumers.md`.
- Plano de migração para RPCs (apenas design, sem código).
- Marcação de consumers "ad-hoc humanos" (analistas via SQL editor) como bloco separado.

## Scope OUT
- Implementação das RPCs (Sprint 1).
- REVOKE em si (Sprint 1, DB-016).
- Migração dos clientes para RPCs (Sprint 1).
- Inventário de outras tabelas críticas (cobertura pontual em Sprint 1).

## Tasks
- [ ] Varredura `grep -rn "lancamentos_diarios" src/ supabase/ scripts/`.
- [ ] Identificar 27 SELECTs cliente confirmados pelo assessment.
- [ ] Listar edge functions consumidoras.
- [ ] Listar scripts/cron/automation.
- [ ] Anotar dashboards/queries Supabase (entrevistar @data-engineer).
- [ ] Categorizar cada consumer (role esperada + operação + migrar?).
- [ ] Desenhar assinaturas de RPCs candidatas (nome, params, retorno, role).
- [ ] Publicar `docs/security/lancamentos-diarios-consumers.md`.
- [ ] Revisão cruzada com @architect e @data-engineer.

## Dependências
- **Bloqueia:** DB-016 inteira em Sprint 1 (sem inventário, REVOKE não pode acontecer).

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Consumer esquecido fora do repo (BI externo) | Alta | Validar com stakeholders de produto; aceitar inventário como "best-effort com janela de revisão" |
| Falsos-positivos em comments ou docs | Baixa | Filtrar por extensão `.ts/.tsx/.sql/.sh` |
| Inventário desatualiza rapidamente | Média | Política: PR que modifica consumer atualiza o doc; check CI opcional |

## Testes Requeridos
- [ ] Spot-check: 5 consumers do inventário existem nos arquivos/linhas indicados.
- [ ] Spot-check: 1 consumer alterado intencionalmente é detectado se varredura for re-executada.
- [ ] Plano de RPCs revisado e aprovado por @architect.
- [ ] Documento revisado por @data-engineer.

## Definition of Done
- [ ] ACs verdes
- [ ] Inventário 100% completo e categorizado
- [ ] CodeRabbit sem CRITICAL/HIGH no PR do doc
- [ ] `docs/security/lancamentos-diarios-consumers.md` publicado e linkado no epic
- [ ] Revisão @architect + @data-engineer
- [ ] PR merged
- [ ] @qa gate PASS

## Rollback Plan
1. Inventário é documento — rollback = `git revert` do PR.
2. Sem impacto em runtime.
3. RTO: <2min.

## Referências
- `docs/prd/technical-debt-assessment.md` §1 Sprint 0 item 0.8
- `docs/reviews/qa-review.md` §1 item 0.8, §4.1

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10)
