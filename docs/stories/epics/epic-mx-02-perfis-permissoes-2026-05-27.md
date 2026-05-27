# EPIC-MX-02 — Sistema de Perfis & Permissões

**Data:** 2026-05-27
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
**Wave:** 1 — Foundation (Top-3)

---

## 1. Goal

Implementar o **sistema canônico de 10 perfis com permissões hierárquicas**, materializando o princípio inegociável UX-P6 ("O sistema deve se adaptar ao perfil do usuário") e o poder Master ("libera acessos") definido no PRD §3 / `.docx` §35–§74.

> Sem esse épico, qualquer Home/Dashboard sai genérica e viola o princípio nuclear de personalização.

---

## 2. Background

O `.docx` (§35–§74) define **10 perfis distintos**, cada um com responsabilidades específicas. O Master/Dono tem o poder único de "libera acessos" (§39), o que implica um sistema de gestão de papéis administrável.

**Perfis-alvo:**

| # | Perfil | Responsabilidades-chave |
|---|---|---|
| 1 | Master / Dono | Acesso total, libera acessos |
| 2 | Diretor / Sócio | Visão executiva |
| 3 | Gerente Comercial | Equipe comercial |
| 4 | Vendedor | Rotina operacional |
| 5 | Marketing | Leads, campanhas |
| 6 | Produto | Estoque, giro, margem |
| 7 | Financeiro / Administrativo | DRE, margem, fluxo |
| 8 | RH | Treinamentos, PDIs, feedbacks |
| 9 | Operações | Preparação, pós-venda |
| 10 | Consultor MX | Análise consultiva (sem alterar score — FR-SCORE-5) |

**Estado atual:** O projeto usa Supabase (RLS confirmado em `.aiox-core/data` e MCP rules). Já existe `story-OPS-20260508-role-ui-responsive-hardening.md` em curso — esse épico **complementa**, não substitui, esse trabalho.

---

## 3. Acceptance Criteria (do épico)

| AC | Critério |
|---|---|
| **AC-01** | Tabela canônica de roles persistida com os 10 perfis e descrições |
| **AC-02** | RLS policies no Supabase garantindo isolamento por role (com testes) |
| **AC-03** | Tipos TypeScript exportados (`Role`, `RoleScope`, `Permission`) |
| **AC-04** | UI de gestão de usuários (apenas Master) — listar, convidar, atribuir role, revogar |
| **AC-05** | Route guard cliente + server (Next/React) bloqueando acesso por perfil |
| **AC-06** | Layout/Home dinâmica por perfil — `Layout.tsx` resolve perfil ativo |
| **AC-07** | Restrição especial Consultor MX: pode ler scores, mas **NÃO altera** nota (FR-SCORE-5) |
| **AC-08** | Auditoria: log de mudanças de role (quem/quando/de qual para qual) |

---

## 4. Stories Planejadas (a serem detalhadas por @sm)

| Story | Título | Resumo |
|---|---|---|
| **2.1** | Schema canônico de roles | Migration Supabase + seed dos 10 perfis |
| **2.2** | RLS policies por entidade | Aplicar policies em tabelas-chave (lojas, vendas, scores, planos) |
| **2.3** | Tipos TS + helper `useCurrentRole` | API client de role + hooks |
| **2.4** | UI gestão de usuários (Master) | Lista + convite + atribuição (apenas Master vê) |
| **2.5** | Route guards | Middleware + componente `<RequireRole>` |
| **2.6** | Layout dinâmico por perfil | `Layout.tsx` carrega menu/home conforme role |
| **2.7** | Restrição Consultor MX | Read-only em score; write em observações qualitativas |
| **2.8** | Auditoria de mudanças de role | Tabela `role_audit` + view |
| **2.9** | Reconciliação com `story-OPS-20260508-role-ui-responsive-hardening` | Mesclar entregas e evitar duplicação |

---

## 5. Dependencies

**Bloqueado por:**
- ✅ EPIC-MX-01 (Design System) — para AC-04, AC-06 (UI de gestão e Layout dinâmico)

**Bloqueia:**
- EPIC-MX-03 (Home Dono — depende de role Master/Diretor resolvido)
- EPIC-MX-04 (Home Gerente — depende de role Gerente Comercial)
- EPIC-MX-05 (Home Vendedor)
- EPIC-MX-15 (Departamentos — cada departamento tem perfil próprio)
- EPIC-MX-16 (Pessoas — gestão depende de role)

---

## 6. Article IV — Rastreabilidade (No Invention)

| Item | Fonte |
|---|---|
| Lista de 10 perfis | PRD §3 ← `.docx` §35–§74 |
| Master "libera acessos" | PRD §3 ← `.docx` §39 |
| UX-P6 "adapta-se ao perfil" | PRD §2.1 ← `.docx` §34 |
| Consultor MX read-only no score | PRD §4.7 FR-SCORE-5 ← `.docx` §259–§264 |
| Estado da story OPS-20260508 | git status — arquivo modificado em `docs/stories/` |

---

## 7. Risks & Mitigation

| Risco | Mitigação |
|---|---|
| Conflito com `story-OPS-20260508-role-ui-responsive-hardening` em curso | Story 2.9 explícita para reconciliar |
| RLS mal configurada vaza dados entre lojas | Story 2.2 inclui testes de policy obrigatórios |
| 10 perfis = matriz de permissões grande | Iniciar com baseline RBAC simples; refinar matriz após Wave 1 |

---

## 8. Next Step

@sm `*draft` da story 2.1 (Schema canônico de roles) — bloqueia tudo no épico.
