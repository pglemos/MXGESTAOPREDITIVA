# QA Review — Technical Debt Assessment

**Responsável:** @qa (Quinn)
**Data:** 15 de Abril de 2026
**Versões Revisadas:** DRAFT v2.0 + DB Specialist Review v1.0 + UX Specialist Review v1.0
**Gate Status:** ⚠️ NEEDS WORK

---

## 1. Gaps Identificados

### 1.1 — Estratégia de Testes para Validação de Débitos

O assessment identifica 27 débitos (~61h de trabalho OPEN) mas **não define como validar que cada resolução funciona corretamente**. O projeto possui 12 arquivos de teste com 63 testes passando — uma cobertura insuficiente para servir como rede de segurança durante a execução de 3 sprints de refatoração. Nenhum dos reviews (DB, UX, SYS) especificou critérios de aceitação testáveis por débito.

**Impacto:** Sem critérios mensuráveis, não é possível distinguir "resolvido" de "parcialmente resolvido" ou "resolvido com regressão".

### 1.2 — Pipeline de CI/CD e Quality Gates Automatizados

Nenhum dos três artefatos menciona:
- Pipeline de CI que valide migrations antes do merge
- Lint/format como gate de merge (ex: ESLint strict, Prettier)
- Typecheck como gate (`npm run typecheck` — relevante dado SYS-01 com `strict: false`)
- Testes automatizados rodando em cada PR

O `AGENTS.md` registra `npm run lint`, `npm run typecheck` e `npm test` como quality gates manuais. Sem automação, a execução de 14+ stories em 3 sprints dependerá exclusivamente de disciplina humana.

### 1.3 — Estratégia de Rollback para Migrations

O DB Specialist recomenda `supabase db dump` para baseline (DB-08) mas não define:
- Procedimento de rollback para cada migration (ex: se DB-12 `ON DELETE CASCADE` causar deleção acidental)
- Janela de rollback aceitável (tempo máximo antes de se tornar irreversível)
- Teste de rollback em staging antes de aplicar em produção

Para um sistema com 46 tabelas e 86 FKs, uma migration destrutiva sem rollback testado é um risco desproporcional.

### 1.4 — Monitoramento Pós-Resolução

Apenas DB-06 menciona monitoring (`pg_stat_statements`). Nenhum débito define:
- Métricas de sucesso mensuráveis (ex: "latência p99 da query X cai de Yms para Zms")
- Alertas para detectar regressão após resolução
- Baseline de performance atual para comparação

### 1.5 — Perfis de Usuário e Cenários de Teste por Role

O sistema tem 4 roles (Admin, Dono, Gerente, Vendedor) com comportamentos distintos. O UX Specialist mapeou violações WCAG mas não discriminou por role:
- **Vendedor:** Usa WizardPDI, daily checkin, visualiza próprio PDI
- **Gerente:** Usa feedback, PDI como avaliador, relatórios
- **Dono:** Acesso cross-store, configurações
- **Admin:** Todas as rotas (~15+), gerenciamento de sistema

Cada correção de UX/DB deve ser validada em pelo menos um cenário por role afetado.

### 1.6 — Estratégia Mobile-First

O UX Specialist identificou UX-11 (mobile nav contrast) e UX-01 (mobile menu focus trap) como P1, mas o assessment não define:
- Quais dispositivos/browsers são o target de teste mobile
- Se há testes em Safari iOS (webkit) vs Chrome Android (blink)
- Breakpoints de validação (o Layout tem drawer mobile + sidebar desktop)

Com 4 roles operando majoritariamente em mobile (vendedores em campo), a ausência de uma estratégia mobile de teste é um gap significativo.

---

## 2. Riscos Cruzados

### 2.1 — Matriz de Riscos Cross-Domain

| # | Risco | Domínios | Severidade | Detalhe |
|---|-------|----------|------------|---------|
| CR-01 | **DB-08 baseline captura estado UX-05 não corrigido** | DB ↔ UX | ALTO | O `supabase db dump` para baseline (DB-08, Sprint 1) criará o schema definitivo. Se executado antes da correção de tokens de cor (UX-05, Sprint 1-2), qualquer dado ou metadata que referencie cores legacy será cementado no baseline. **Mitigação:** DB-08 deve capturar o schema estrutural apenas; tokens CSS são frontend e não afetam o dump. |
| CR-02 | **SYS-01 (TypeScript strict) + UX-12 (WizardPDI labels)** | SYS ↔ UX | MÉDIO | Habilitar `strict: true` (SYS-01, 4h) antes de refatorar WizardPDI (UX-01+UX-12, 8h combinado) pode expor erros de tipo nos handlers de formulário. WizardPDI usa state local com casts implícitos que podem quebrar. **Mitigação:** Executar SYS-01 primeiro; refatorar WizardPDI com tipos já strict. |
| CR-03 | **DB-09 (PII encryption) + UX-04/UX-12 (labels em formulários)** | DB ↔ UX | MÉDIO | Se `users.email` for hasheado ou protegido por policy restritiva (recomendação DB-09), os labels de autocomplete no frontend que buscam email precisam ser ajustados. A RPC `process_import_data` faz `WHERE email ILIKE` — se o email deixar de ser acessível, o formulário de importação quebra silenciosamente. **Mitigação:** DB-09 mantém `users.email` em plaintext (conforme recomendação do DB Specialist). Risco mitigado, mas requer validação cruzada. |
| CR-04 | **SYS-05 (Tailwind v4 migration) + UX-05 (novo token `--color-text-label`)** | SYS ↔ UX | ALTO | Se a migração Tailwind v4 (SYS-05) estiver incompleta, a introdução de novos tokens CSS (UX-05) pode não ser processada corretamente pelo build. Tailwind v4 mudou a engine de parsing de `@theme`. **Mitigação:** SYS-05 deve ser validado antes ou simultaneamente a UX-05. Se `--color-text-label` não for reconhecido pelo JIT, todas as 40+ correções de contraste falharão em runtime. |
| CR-05 | **DB-01 (shadow columns) + UX-01 (WizardPDI focus trap)** | DB ↔ UX | BAIXO | As shadow columns de `pdis` (`objective`, `action`) são sincronizadas por trigger. Se a refatoração do WizardPDI (UX-01+UX-12) alterar os campos do formulário que populam essas colunas, o trigger bidi-sync pode gerar dados inconsistentes. **Mitigação:** Baixo risco — a refatoração UX é apenas markup/ARIA, não lógica de estado. Validar com teste E2E. |
| CR-06 | **DB-12 (FK ON DELETE) + SYS-03 (auth-provider dup)** | DB ↔ SYS | BAIXO | Se `ON DELETE CASCADE` for adicionado em `goals.user_id → users(id)` (DB-12), e o hook duplicado `useAuth`/`auth-provider` (SYS-03) tiver uma race condition no logout, o cascade pode disparar em contexto inesperado. **Mitigação:** SYS-03 é LOW/P3; DB-12 é MEDIUM/P2. Executar SYS-03 antes de DB-12. |
| CR-07 | **UX-05 (40+ ocorrências opacity-40) + SYS-06 (sem visual regression tests)** | UX ↔ SYS | ALTO | Substituir 40+ instâncias de `opacity-40` em 10 arquivos sem testes de regressão visual (SYS-06) é arriscado. Uma instância mal substituída pode quebrar o layout de uma página inteira. **Mitigação:** SYS-06 foi classificado como LOW/P3 (4h) — recomendo elevar para MEDIUM/P2 e executar antes ou simultaneamente com UX-05. Alternativa: screenshot manual comparativo em 3 breakpoints antes/depois. |
| CR-08 | **DB-08 (baseline) + todas as DB migrations subsequentes** | DB ↔ DB | CRÍTICO | Se DB-08 (baseline via dump) capturar o schema com imprecisões (ex: ordem de FKs, policies duplicadas), todas as migrations subsequentes (DB-05, DB-12, DB-09) podem falhar ao aplicar sobre o baseline. **Mitigação:** Validar com `supabase db reset` em ambiente completamente limpo (sem containers anteriores). |

### 2.2 — Diagrama de Dependências Cruzadas (Simplificado)

```
Sprint 1 (P1):
  SYS-01 (TS strict) ─────────────────┐
  DB-08 (baseline migrations) ────────┤
  UX-14 (lang=pt-BR) ──────────────── │── Sem dependências entre si
  UX-02 (skip nav) ────────────────── │
  UX-11 (mobile nav contrast) ───────┘
                    │
                    ▼
Sprint 2 (P2):
  SYS-05 (Tailwind v4) ──→ UX-05 (contrast token) ──→ UX-03 (reduced motion)
  DB-05 (PDI indexes) ──→ DB-12 (FK ON DELETE)
  DB-09 (PII encrypt) ──→ UX-04 (Login labels) ──→ UX-06 + UX-07 (Login refactor)
  UX-01 (focus trap) ──→ UX-12 (WizardPDI labels)
                    │
                    ▼
Sprint 3 (P3):
  DB-01 (shadow columns) ──→ DB-16/19 (cleanup)
  UX-10 (print tokens) ──→ UX-13 (aria-hidden)
  SYS-03/04 (cleanup)
```

---

## 3. Dependências Validadas

### 3.1 — Ordem de Execução Validada

| Fase | Débitos | Horas | Bloqueadores | Validação |
|------|---------|-------|-------------|-----------|
| **Sprint 1** | SYS-01, DB-08, UX-14, UX-02, UX-11, UX-01, UX-05 | ~17h | DB-08 bloqueia Sprint 2 DB; SYS-01 bloqueia Sprint 2 UX | ✅ Ordem correta. Itens independentes podem executar em paralelo. |
| **Sprint 2** | DB-05, DB-12, DB-09, DB-14, SYS-05, UX-03, UX-04, UX-12, UX-10 | ~31h | SYS-05 deve preceder UX-05; UX-01 deve preceder UX-12 | ⚠️ Sprint 2 sobrecarregado (31h). Ver Seção 3.2. |
| **Sprint 3** | DB-01, DB-10, DB-11, DB-15-19, UX-06+07, UX-08, UX-09, UX-13, SYS-02-04, SYS-06 | ~23h | DB-01 depende de confirmação do frontend; UX-06+07 dependem de UX-04 | ✅ Itens de baixo risco. |

### 3.2 — Problema: Sprint 2 Sobrecarregado

O DB Specialist alocou 13h no Sprint 2. O UX Specialist alocou 13h na Fase 1 (P1) + 11h na Fase 2 (P2). O SYS soma ~9h em P1+P2. O total combinado do Sprint 2 é **~31h** — superior a um sprint padrão de 2 semanas (considerando 4h/dia de foco em débitos técnicos = ~40h/sprint).

**Recomendação:** Reorganizar em 4 sprints de ~15h cada, ou alocar 2 desenvolvedores em paralelo no Sprint 2 (1 para DB, 1 para UX/SYS).

### 3.3 — Dependência Crítica: SYS-05 → UX-05

O débito SYS-05 (Tailwind v4 migration possivelmente incompleta, MEDIUM/P2, 3h) é uma **pré-dependência oculta** de UX-05 (contraste, 4h) e UX-10 (print tokens, 4h). Se a engine Tailwind v4 não processar os novos tokens `--color-text-label` e `--color-print-highlight`, ambas as correções falharão silenciosamente em produção.

**Ação:** Executar SYS-05 no Sprint 1 junto com DB-08 e SYS-01, mesmo sendo P2. O risco de executar UX-05 sobre uma base Tailwind potencialmente quebrada é inaceitável.

### 3.4 — Blockers Identificados

| Blocker | Depende De | Impacto Se Não Resolvido |
|---------|-----------|------------------------|
| DB-08 (baseline) | Nada — é o primeiro | Impede disaster recovery, `db reset`, e onboarding. **Único bloqueante real do projeto.** |
| SYS-05 (Tailwind v4) | Nada — mas precisa ser validado antes de UX-05 | Se incompleto, 8h de trabalho UX (UX-05 + UX-10) produzem tokens não-funcionais. |
| SYS-01 (TS strict) | Nada — mas UX-12 se beneficia | Sem strict, refatorações de formulário WizardPDI ficam sem tipagem de segurança. |

---

## 4. Conflitos entre Especialistas

### 4.1 — Discrepância de Gate: APPROVED vs NEEDS WORK

O DB Specialist emitiu **✅ APPROVED**. O UX Specialist emitiu **⚠️ NEEDS WORK**. Esta discrepância não é necessariamente um conflito — reflete a maturidade diferente dos dois domínios:

- **DB:** 4 débitos já RESOLVED via migrations, estimativas validadas, estratégia clara de execução. O domínio está em melhor estado.
- **UX:** 6 violações WCAG FAIL, WizardPDI com acessibilidade zero, orçamento subestimado em +57%. O domínio requer retrabalho no assessment.

**Parecer QA:** O gate de NEEDS WORK do UX é justificado. O DRAFT v2.0 não pode ser considerado pronto para execução completa enquanto o orçamento e escopo UX não forem incorporados em uma revisão v2.1.

### 4.2 — Severidades Divergentes em Débitos Relacionados

| Débito DB | Classificação DB | Débito UX Equivalente | Classificação UX | Análise |
|-----------|-----------------|----------------------|-----------------|---------|
| DB-06 (permissive policies) | Rebaixado MEDIUM→LOW | UX-05 (contrast anti-pattern) | Elevado MEDIUM→HIGH, P1 | DB-06 aceita o risco de permissive por performance; UX-05 não aceita o risco de contraste. São decisões consistentes porque os domínios são distintos, mas a mensagem ao @dev precisa ser clara: "otimizar performance é aceitável (DB-06); sacrificar acessibilidade não é (UX-05)." |

### 4.3 — Orçamento Total: Discrepância com DRAFT v2.0

| Fonte | Horas OPEN | Novos Débitos | Total |
|-------|-----------|---------------|-------|
| DRAFT v2.0 | 61h (todos os domínios) | — | 61h |
| DB Specialist | 24h OPEN + 3h novos | 3h | 27h DB |
| UX Specialist | 33h (revisado) | 4h novos | 33h UX |
| SYS (estimado) | ~15h (SYS-01 a SYS-06) | — | ~15h SYS |
| **Total Revisado** | — | — | **~75h** |

O DRAFT v2.0 estima 61h. A soma dos reviews especializados totaliza ~75h — uma discrepância de **+14h (+23%)**. O orçamento aprovado no epic é de ~45h (epic-technical-debt.md). Isso significa que o orçamento aprovado cobre apenas **~60%** do trabalho necessário.

**Ação:** O @pm precisa revisar o orçamento do epic antes da execução. Opções: (a) aprovar budget estendido de ~75h, (b) cortar escopo removendo P3, ou (c) estender para 4-5 sprints.

### 4.4 — Conflito de Priorização: Sprint 1

- **DB Specialist:** Sprint 1 foca exclusivamente em DB-08 (5h). Único P1 de banco.
- **UX Specialist:** Fase 1 (P1) contém 6 itens totalizando 13h, incluindo UX-01 (CRITICAL, 6h).
- **SYS:** SYS-01 é HIGH/P1 com 4h.

Se o time seguir ambas as recomendações literalmente, o Sprint 1 terá **22h** (DB-08: 5h + UX P1: 13h + SYS-01: 4h). Isso é factível em 1 sprint, mas requer paralelização.

---

## 5. Quality Gate Assessment

### 5.1 — Critérios de Prontidão

| Critério | Status | Detalhe |
|----------|--------|---------|
| Todos os débitos catalogados com ID único | ✅ | 27 IDs (DB-01 a DB-19, UX-01 a UX-14, SYS-01 a SYS-06) |
| Severidades validadas por especialista | ✅ | DB e UX validaram individualmente |
| Estimativas de horas revisadas | ⚠️ | Revisadas pelos especialistas, mas DRAFT não incorporou |
| Dependências mapeadas | ⚠️ | Cada especialista mapeou dependências internas; dependências cross-domain parciais |
| Critérios de aceitação definidos | ❌ | Nenhum débito tem critério de aceitação testável |
| Orçamento aprovado alinhado | ❌ | Epic aprova ~45h; trabalho real estimado em ~75h |
| Estratégia de teste definida | ❌ | Sem plano de validação pós-resolução |
| Estratégia de rollback definida | ❌ | Apenas DB-08 menciona validação com `db reset` |

### 5.2 — Veredito do Gate

**O assessment NÃO está pronto para execução completa.** Os reviews especializados trouxeram a profundidade necessária, mas o DRAFT v2.0 precisa ser atualizado para v2.1 incorporando:

1. Revisão de orçamento de 61h → ~75h
2. 8 novos débitos (DB-16 a DB-19, UX-11 a UX-14)
3. Elevações de severidade (UX-01, UX-03, UX-05, UX-10)
4. Dependências cross-domain (SYS-05 → UX-05, SYS-01 → UX-12)
5. Critérios de aceitação por débito

**O que PODE iniciar imediatamente (não bloqueado pelo gate):**
- DB-08 (baseline) — autocontido, sem dependências cross-domain
- SYS-01 (TypeScript strict) — autocontido
- UX-14 (lang=pt-BR) — 0.5h, zero risco
- UX-02 (skip nav) — 1h, autocontido

---

## 6. Testes Requeridos (Pós-Resolução)

### 6.1 — Testes por Domínio

#### Database

| Débito | Tipo de Teste | Critério de Aceitação | Ferramenta |
|--------|--------------|----------------------|------------|
| DB-08 | Integração | `supabase db reset` recria 100% do schema (46 tabelas, 86 FKs, 113 indexes, 107 policies) | supabase CLI |
| DB-05 | Performance | `EXPLAIN ANALYZE` nas RPCs `get_pdi_print_bundle` e `create_pdi_session_bundle` mostra Index Scan (não Seq Scan) | SQL direto |
| DB-09 | Segurança | `SELECT phone FROM users` retorna ciphertext; RPC `process_import_data` com email funciona normalmente | pgAdmin + teste de importação |
| DB-12 | Integridade | DELETE em `stores` com CASCADE propaga corretamente; DELETE em `users` com SET NULL preserva dados | Script SQL de teste |
| DB-14 | Funcional | States OAuth expirados são removidos após 15min; states consumidos após 1h | `SELECT COUNT(*) FROM estados_oauth_google_consultoria WHERE ...` |
| DB-06 | Monitoramento | `pg_stat_statements` registrando queries em `users`, `stores`, `memberships` | Dashboard Supabase |

#### UX/Acessibilidade

| Débito | Tipo de Teste | Critério de Aceitação | Ferramenta |
|--------|--------------|----------------------|------------|
| UX-01 | Funcional (keyboard) | Tab dentro do mobile menu cicla apenas entre elementos do menu; Escape fecha o menu; Tab no WizardPDI cicla apenas entre campos do wizard | Teste manual + axe-core |
| UX-02 | Funcional (keyboard) | Pressionar Tab no primeiro focus após load foca no skip link; Enter no skip link move foco para `#main-content` | Teste manual |
| UX-05 | Contraste visual | Todas as instâncias de `text-text-tertiary opacity-40` removidas; novo token `--color-text-label` com contraste >= 4.5:1 | axe-core + Chrome DevTools contrast checker |
| UX-11 | Contraste visual | Ícones inativos da mobile nav com contraste >= 4.5:1 sobre fundo escuro | Chrome DevTools |
| UX-03 | Funcional | `prefers-reduced-motion: reduce` suprime animações Motion e CSS; loading spinners permanecem funcionais | DevTools emulation + teste visual |
| UX-04 + UX-12 | Acessibilidade | 100% dos campos de formulário em Login e WizardPDI com label programático associado | axe-core scan |
| UX-14 | Acessibilidade | `<html lang="pt-BR">` presente no DOM | axe-core |

#### Sistema

| Débito | Tipo de Teste | Critério de Aceitação | Ferramenta |
|--------|--------------|----------------------|------------|
| SYS-01 | Compilação | `npm run typecheck` passa com `strict: true`; zero erros; zero `@ts-ignore` novos | TypeScript compiler |
| SYS-05 | Build | `npm run build` gera bundle sem warnings; todos os tokens `@theme` são resolvidos | Vite build |
| SYS-06 | Regressão visual | Screenshots antes/depois em 3 breakpoints (320px, 768px, 1280px) para 10 páginas afetadas por UX-05 | Playwright screenshots |

### 6.2 — Testes Cross-Domain (Integração)

| ID | Cenário | Débitos Envolvidos | Critério |
|----|---------|-------------------|----------|
| XTD-01 | **Importação de dados com email cifrado** | DB-09 + UX-04 | Após cifrar `users.phone`, o fluxo de importação de planilha com busca por email continua funcionando end-to-end |
| XTD-02 | **WizardPDI com strict TypeScript** | SYS-01 + UX-01 + UX-12 | WizardPDI compila sem erros com `strict: true`; focus trap funcional; todos os campos com label |
| XTD-03 | **Baseline + indexes + FK** | DB-08 + DB-05 + DB-12 | Após baseline + indexes PDI + FK ON DELETE, `supabase db reset` + seed + criação de PDI completa funciona sem erros |
| XTD-04 | **Tokens de cor em Tailwind v4** | SYS-05 + UX-05 | Novo token `--color-text-label` é reconhecido pelo JIT do Tailwind v4 em todos os breakpoints |
| XTD-05 | **RLS por role com permissive policies** | DB-06 + UX-05 | Vendedor da Loja A não visualiza dados da Loja B; Admin visualiza tudo; contraste adequado em ambas as visualizações |

### 6.3 — Suite de Validação Mínima Recomendada

Antes de iniciar Sprint 1, estabelecer:

1. **Baseline screenshot** de todas as 38 páginas em 3 breakpoints (armazenar como golden files)
2. **axe-core scan** automatizado via Playwright em CI para as 10 páginas com maior impacto UX
3. **`supabase db reset` + seed** como step de CI para validar integridade do schema
4. **Teste de smoke E2E** para os 4 fluxos críticos: Login, Checkin, PDI (Wizard completo), Feedback

---

## 7. Revisão de Severidades e Recomendações de Ajuste

### 7.1 — Débitos com Severidade Que Diverge do Consenso

| ID | Severidade DRAFT | Severidade Revisada | Recomendação QA | Justificativa |
|----|-----------------|--------------------|-----------------|---------------|
| SYS-06 | LOW | **MEDIUM** | Elevar para P2 | Sem visual regression tests, as 40+ mudanças de UX-05 têm risco de regressão não-detectável. Elevar prioridade para permitir execução antes de UX-05. |
| UX-08 | LOW | LOW | Manter | `aria-hidden` faltante no Login é coberto por UX-13. Baixo impacto real. |
| DB-13 | DEFERRED | DEFERRED | Manter | Volume atual (~10K rows) está longe do threshold. Concordo com DB Specialist. |
| SYS-04 | LOW | LOW | Manter | Scripts sem index são incômodo, não risco. |

### 7.2 — Débitos Que Podem Ser Agrupados

| Grupo | Débitos | Horas Individual | Horas Agrupado | Economia |
|-------|---------|-----------------|---------------|----------|
| Login Refactor | UX-04 (Login) + UX-06 + UX-07 | 3h + 2h + 2h | **5h** | -2h |
| WizardPDI Refactor | UX-01 (focus trap) + UX-12 (labels) | 6h + 2h | **7h** | -1h |
| Print Tokens | UX-10 + UX-13 | 4h + 0.5h | **4h** | -0.5h |
| DB Cleanup Sprint 3 | DB-16 + DB-19 | 0.5h + 0.5h | **0.5h** | -0.5h |

**Economia total por agrupamento: ~4h** — reduzindo o total de ~75h para ~71h.

---

## 8. Resumo Estatístico Consolidado

### 8.1 — Débitos por Domínio e Status

| Domínio | OPEN | RESOLVED | DEFERRED | NOVO | Total |
|---------|------|----------|----------|------|-------|
| DB | 11 | 4 | 1 | 4 | 19 |
| UX | 14 | 0 | 0 | 4 | 14 (10 validados + 4 novos) |
| SYS | 6 | 0 | 0 | 0 | 6 |
| **Total** | **31** | **4** | **1** | **8** | **39** |

Nota: O DRAFT v2.0 lista 27 débitos. Após os reviews especializados identificarem 8 novos, o total sobe para **39** (31 OPEN + 4 RESOLVED + 1 DEFERRED + 3 itens a classificar). Há uma discrepância de contagem que precisa ser resolvida no v2.1.

### 8.2 — Horas por Sprint (Recomendado)

| Sprint | Débitos | Horas | Risco |
|--------|---------|-------|-------|
| **Sprint 1** (P1) | DB-08, SYS-01, SYS-05, UX-01, UX-02, UX-05, UX-11, UX-14 | ~19h | Médio (muitos itens, mas autocontidos) |
| **Sprint 2** (P2) | DB-05, DB-09, DB-12, DB-14, UX-03, UX-04, UX-10, UX-12 | ~27h | Alto (cross-domain dependencies) |
| **Sprint 3** (P3) | DB-01, DB-10, DB-11, DB-15-19, UX-06+07, UX-08, UX-09, UX-13, SYS-02-04, SYS-06 | ~25h | Baixo (cleanup) |
| **Total** | 39 débitos | **~71h** | — |

---

## 9. Parecer Final

### ⚠️ NEEDS WORK

O assessment técnico é **profundo e bem executado** pelos especialistas DB e UX. As análises individuais são de alta qualidade, com estimativas revisadas e justificativas técnicas sólidas. No entanto, o DRAFT v2.0 **não está pronto para execução** pelos seguintes motivos:

### Blocantes para Aprovação

1. **Orçamento desalinhado:** O epic aprova ~45h. O trabalho real identificado pelos especialistas é ~71-75h. O @pm precisa aprovar a revisão antes do início.

2. **Critérios de aceitação ausentes:** Nenhum dos 39 débitos possui critério de aceitação testável. Sem isso, não é possível validar a resolução.

3. **Estratégia de teste indefinida:** Com apenas 63 testes unitários cobrindo 12 arquivos, o projeto não tem rede de segurança para 71h de refatoração. No mínimo, é necessário: (a) baseline visual, (b) axe-core em CI, (c) smoke tests E2E nos 4 fluxos críticos.

4. **Dependência SYS-05 → UX-05 não mapeada no DRAFT:** Se a migração Tailwind v4 estiver incompleta, 8h de trabalho UX produzem resultado não-funcional. SYS-05 deve ser promovido a P1/Sprint 1.

5. **Discrepância de contagem:** O DRAFT lista 27 débitos; os reviews identificam 39. O v2.1 precisa consolidar a lista.

### Recomendações ao @architect

- Produzir DRAFT v2.1 incorporando todos os inputs dos reviews DB e UX
- Revisar orçamento do epic de ~45h para ~75h (ou cortar escopo P3)
- Adicionar SYS-05 ao Sprint 1 como pré-requisito de UX-05
- Definir critérios de aceitação (mínimo: 1 critério testável por débito P1/P2)
- Estabelecer baseline de testes antes de iniciar qualquer refatoração

### Itens Que Podem Iniciar Imediatamente (Não Bloqueados)

Apesar do gate NEEDS WORK, os seguintes itens são autocontidos e podem executar em paralelo à produção do v2.1:

- **DB-08** (baseline migrations, 5h) — bloqueante para todo o pipeline DB
- **SYS-01** (TypeScript strict, 4h) — beneficia todas as refatorações subsequentes
- **UX-14** (lang=pt-BR, 0.5h) — trivial, zero risco
- **UX-02** (skip nav, 1h) — autocontido, zero dependência

**O gate será movido para ✅ APPROVED quando o DRAFT v2.1 incorporar as revisões, o orçamento for alinhado, e critérios de aceitação forem definidos para todos os débitos P1/P2.**

---

**Assinatura:** @qa (Quinn)
**Revisão solicitada por:** @architect (FASE 7)
**Próximo passo:** Aguardar DRAFT v2.1 com incorporação + validação orçamentária pelo @pm
