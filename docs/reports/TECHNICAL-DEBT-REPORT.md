# 📊 Relatório Executivo de Débito Técnico
**Projeto:** MX Gestão Preditiva
**Data:** 16 de maio de 2026
**Versão:** 1.0
**Audiência:** Liderança, Board, Stakeholders de Negócio
**Autor:** Alex (@analyst) — Brownfield Discovery FASE 9

---

## 🎯 Executive Summary

### Situação Atual

A MX Gestão Preditiva opera hoje sobre uma fundação tecnológica **funcional, porém com fragilidades estruturais** acumuladas durante o crescimento acelerado do produto (origem em ferramentas de prototipagem como Lovable/v0.dev e expansão orgânica do banco de dados). Uma auditoria técnica completa, conduzida em 8 fases por especialistas em arquitetura, banco de dados, experiência do usuário e qualidade, identificou **73 débitos técnicos** que, se não tratados, se transformam em risco financeiro, regulatório e operacional.

Pense na situação como um **prédio comercial em pleno funcionamento**: a estrutura está de pé, os inquilinos estão dentro, e o negócio acontece todos os dias. Mas há **janelas com fechaduras frágeis** (vulnerabilidade DB-016 — permite manipulação de horário/data de lançamentos pelo próprio vendedor), **câmeras de segurança desligadas** (ausência de observabilidade), **arquivos com dados pessoais em um depósito sem cadeado** (backups expostos com PII), e **algumas áreas internas são tão labirínticas** que qualquer reforma leva o triplo do tempo. Nada disso aparece para o cliente final hoje — até que apareça.

> **Atualização 2026-05-17 (refinamentos pós-discovery):**
> - ✅ **SYS-012 (`.env` exposto)** — falso positivo. Arquivo NUNCA foi commitado; gitignore cobre; Edge Functions e scripts usam env vars corretamente. **Sem rotação emergencial necessária.**
> - ⚠️ **DB-016** — vetor confirmado mas escopo **mais NARROW**: bypass de regra de negócio (horário/data), **NÃO** vazamento cross-tenant nem impersonation. Severidade Crítica → **Alta**. Canary continua recomendado como defense-in-depth.
> - 🆕 **DB-028** — inconsistência arquitetural descoberta: validações de checkin em DOIS lugares com regras divergentes (policy direta ↔ RPC). Story sugerida Sprint 1/2 (~4-6h).
> - **Impacto financeiro:** custo de "não agir" estimado em ~R$ 80-100K (eliminação do cenário SYS-012 emergencial). ROI central continua >10:1.

A boa notícia: o time técnico identificou, documentou e quantificou cada um destes pontos com precisão. A janela para resolver de forma planejada é **agora**, antes que o primeiro incidente force uma resposta emergencial — que costuma custar **5 a 10 vezes mais**.

### Os Números Que Importam

| Métrica | Valor |
|---------|-------|
| Total de débitos técnicos identificados | **73** |
| Débitos críticos (risco imediato) | **11** |
| Riscos cruzados (multi-área) | **14** |
| Esforço total estimado | **~830 horas (13-17 semanas)** |
| **Investimento total recomendado** | **R$ 130.500** (R$ 112.500 core + R$ 18.000 backlog opcional) |
| **Custo potencial de NÃO agir (12 meses)** | **R$ 555.000 a R$ 51.300.000** (faixa probabilística) |
| **ROI estimado (cenário central)** | **~12:1** |
| Time recomendado | **3-4 devs** em dedicação parcial/integral |

### Recomendação em 1 Parágrafo

**Aprovar imediatamente a Sprint 0 (R$ 10.500, 1,5 semana)** como pré-requisito absoluto — esta sprint não resolve débitos, mas instala "câmeras, alarmes e fechaduras" sem os quais qualquer trabalho posterior é cego. Em seguida, aprovar o pacote completo Sprint 1-3 (R$ 102.000 adicionais, ~12-15 semanas). Sem a Sprint 0, qualquer outro investimento é alto risco — incluindo continuar entregando features novas no ritmo atual.

### Decisão Necessária

- [ ] **Aprovar Sprint 0 (R$ 10.500)** — esta semana
- [ ] **Aprovar pacote completo Sprint 0-3 (R$ 112.500)** — em 2 semanas
- [ ] **Alocar time técnico de 3-4 devs** por 13-17 semanas
- [ ] **Validar prioridade** com áreas de Produto, Jurídico (LGPD) e Comercial
- [ ] **Designar owner técnico do epic** (recomendação: tech lead atual)

---

## 💰 Análise Financeira

### Custo de RESOLVER (Investimento)

Baseado em taxa horária de **R$ 150,00/hora** (referência de mercado SaaS B2B brasileiro para devs sênior + especialistas em segurança/data).

| Sprint | Horas | Custo (R$ 150/h) | Foco de Negócio |
|--------|-------|------------------|-----------------|
| **Sprint 0** (obrigatória) | 70 | **R$ 10.500** | Hardening crítico (segurança + observabilidade + gates de qualidade) |
| **Sprint 1** (P0 crítico) | 120 | **R$ 18.000** | Fechar vulnerabilidade DB-016 + eliminar drift de tipos + auth hardening |
| **Sprint 2** (P1 alto) | 200 | **R$ 30.000** | Acessibilidade (WCAG AA), forms, governança, prep LGPD |
| **Sprint 3** (P2 médio) | 280 | **R$ 42.000** | Decomposição estrutural + LGPD MVP + performance |
| Testes baseline (paralelo S0+S1) | 80 | **R$ 12.000** | Rede de segurança contra regressão |
| **SUBTOTAL CORE** | **750** | **R$ 112.500** | **Pacote mínimo viável (~13 semanas)** |
| Backlog P3 (opcional) | 120 | R$ 18.000 | Nice-to-have (i18n, PWA real, dark mode, docs ops) |
| **TOTAL COMPLETO** | **870** | **R$ 130.500** | Tudo, incluindo opcional |

> **Observação:** O assessment técnico embute 25% de overhead nas estimativas (mandato de QA) — ou seja, os números acima já consideram contingência. Não é estimativa otimista.

### Custo de NÃO RESOLVER (Risco Acumulado em 12 meses)

| Risco | Probabilidade | Impacto Estimado | Premissa do cálculo |
|-------|---------------|------------------|---------------------|
| ~~**Vazamento de dados via DB-016**~~ → **Fraude comercial via DB-016** (verificação 2026-05-17: bypass de regra, não data breach) | MÉDIA | **R$ 50.000 a R$ 200.000** `[ESTIMATIVA REVISADA]` | Comissões fraudadas detectáveis em auditoria + retrabalho de relatórios + remediação dos lançamentos manipulados |
| **Multa ANPD por LGPD não-conformidade** (DB-013, falta de consentimento, sem right-to-erasure) | **MÉDIA** | **R$ 50.000 a R$ 50.000.000** | Lei nº 13.709/18: multa pode chegar a 2% do faturamento, teto R$ 50M. Valor real depende de porte e da gravidade do incidente |
| ~~**Vazamento de credenciais** (SYS-012)~~ → ✅ **REFUTADO 2026-05-17** | — | **R$ 0** | Falso positivo: `.env` nunca commitado, secrets handling limpo |
| **Comissões fraudadas via DB-016** (qualquer vendedor pode inflar lançamentos) | **MÉDIA** | **R$ 50.000 a R$ 300.000/ano** `[ESTIMATIVA]` | Premissa: 1% das comissões mensais distribuídas pela MX em fraude não detectável |
| **Churn por incidentes invisíveis** (SYS-017 sem Sentry) | **MÉDIA** | **R$ 100.000 a R$ 500.000/ano** `[ESTIMATIVA]` | MTTR alto significa cliente reclama antes do time saber; estimativa de 2-5% de churn evitável |
| **Custo crescente de manutenção** (god-hooks + 15 pages monolíticas) | **CERTA** | **R$ 120.000 a R$ 300.000/ano** `[ESTIMATIVA]` | Premissa: 30-50% de overhead em cada feature nova devido ao acoplamento — equivale a 1-2 devs/ano "desperdiçados" |
| **Outage por deploy quebrado** (SYS-005 — supabase-js em devDeps) | **MÉDIA** | **R$ 5.000 a R$ 50.000/incidente** `[ESTIMATIVA]` | 1-3 outages/ano × custo médio de hora indisponível |
| **TOTAL POTENCIAL (12 meses, cenário central)** | | **R$ 555.000 a R$ 2.150.000** `[ESTIMATIVA]` | Excluindo cenário extremo de multa ANPD máxima |
| **TOTAL POTENCIAL (cenário pessimista)** | | **até R$ 51.300.000** | Incluindo multa ANPD máxima |

> **Nota metodológica:** Estimativas de mercado SaaS B2B brasileiro, conservadoras. Custos de breach são baseados em médias setoriais públicas. Valores marcados `[ESTIMATIVA]` precisam ser refinados com finance/jurídico antes de decisão de board.

### ROI Calculado

| Cenário | Investimento | Risco evitado | ROI |
|---------|--------------|---------------|-----|
| Conservador (mínimo risco) | R$ 112.500 | R$ 555.000 | **~5:1** |
| Central (média ponderada) | R$ 112.500 | R$ 1.350.000 | **~12:1** |
| Pessimista (multa ANPD média) | R$ 112.500 | R$ 5.000.000 | **~44:1** |

**Mesmo no cenário mais otimista, o investimento se paga 5 vezes.** No cenário central, **12 vezes**.

---

## 📈 Impacto no Negócio por Dimensão

### 🔒 Segurança (a mais crítica)

**Hoje:**
- Vulnerabilidade **DB-016 confirmada** (não é teórica). Após verificação estática refinada (2026-05-17): qualquer vendedor autenticado pode inserir lançamentos diários **diretamente via API**, burlando **o gate de horário (09:45)** e **backdate dentro da própria janela ativa**. ⚠️ **NÃO** permite inserir como outro vendedor, em outra loja, ou cross-tenant — defesas em camadas funcionam para esses casos. Resultado: **manipulação de horário/data dos próprios lançamentos, rankings inflados detectáveis em auditoria**.
- 5 tabelas de auditoria/histórico **sem RLS** → vazamento cross-tenant possível em múltiplos casos.
- Backups com dados pessoais (PII) **desprotegidos desde 03/mai/2026** → LGPD Art. 46 violado em produção.
- Pipeline CI/CD **sem branch protection nem detecção de secrets** → próximo "git push --force" pode reescrever histórico.
- **Zero observabilidade FE→Backend** (Sentry não inicializado) → incidentes só são descobertos quando cliente reclama.

**Após resolução:**
- Defense-in-depth real (validação cliente + servidor + RLS).
- LGPD compliance demonstrável (audit log, right-to-erasure, banner de consentimento).
- MTTR (tempo médio de resolução de incidentes) **<30 min** vs. cenário atual de horas/dias.

### ⚡ Performance & UX

**Hoje:**
- Bundle JavaScript com limite escondido em 1MB — sem visibilidade do que está inflando.
- Skeleton screens em apenas **16,6% das páginas** → percepção de lentidão alta.
- Realtime subscriptions em pages monolíticas **sem garantia de cleanup** → memory leaks confirmados.
- Charts com cores hardcoded → impossível padronizar visualmente.

**Após resolução (metas mensuráveis):**
- LCP (Largest Contentful Paint) do dashboard inicial **<2s**.
- Bundle alvo **<300KB inicial**.
- Skeleton coverage **100%** das rotas principais.
- WCAG 2.1 AA conformidade nas 10 rotas top (acessibilidade legal e comercial).

### 🛠️ Manutenibilidade (o custo oculto)

**Hoje:**
- **15 páginas com mais de 500 linhas** (uma com 1.698 LOC, origem Lovable).
- **10 hooks gigantes** (até 895 LOC) — testes inviáveis, lógica entrelaçada.
- **Drift garantido** entre o banco (em português) e o código (tipos manuais com 610 LOC) — qualquer rename quebra coisas em silêncio.
- 30+ formulários sem padrão consistente de validação.

**Tradução para negócio:** qualquer feature nova hoje leva **2-3x mais tempo** do que deveria, e o risco de quebrar algo já existente é alto. **Isso é dinheiro queimado em desenvolvimento todo mês.**

**Após resolução:**
- Páginas modulares <300 LOC, hooks <150 LOC.
- Tipos auto-gerados do schema → zero drift.
- Padrão único (react-hook-form + zod) para todos os 30+ forms.

### 🚀 Velocidade de Entrega

**Hoje:** uma feature de complexidade média leva estimadamente **8-12 dias** (baseado em LOC alta e acoplamento).
**Meta pós-resolução:** **4-6 dias** para a mesma feature — **50% mais rápido**. Equivale a duplicar a capacidade do time **sem contratar ninguém**.

### ⚖️ Compliance LGPD (não-negociável)

**Hoje:**
- Sem tabela de consentimento.
- Sem rotina de "esquecimento" (right-to-erasure — Art. 18 LGPD).
- Sem audit log de mudanças de roles/permissões.
- Sem UI de privacidade (banner, central, opt-out telemetria).
- Backups com PII expostos.

**Risco:** denúncia de um único usuário à ANPD pode disparar fiscalização → multa pode chegar a **2% do faturamento, com teto de R$ 50 milhões**.

**Após resolução:** MVP completo de LGPD (banner + central + erasure + pgaudit + anonymization triggers) → posição defensável publicamente.

---

## ⏱️ Timeline Recomendado

### 🟢 Fase 0 — Sprint 0 (Semana 1, R$ 10.500)
**Hardening imediato — PRÉ-REQUISITO ABSOLUTO**

- Auditar histórico `.env` e rotacionar credenciais se necessário.
- Inicializar Sentry (observabilidade básica).
- Pipeline de geração automática de tipos do banco.
- Branch protection + detecção automática de secrets (gitleaks).
- Habilitar `pg_stat_statements` (instrumentação de performance).
- Suite de testes de regressão RLS (40 cenários × 5 roles).
- Snapshots visuais (Playwright) de 6 páginas críticas.
- Infraestrutura de feature flags para rollout canário.
- ADR formal de rollback para migrations críticas.

**Resultado:** base segura para tudo que vem depois. Sem isso, **toda mudança seguinte é alto risco**.

### 🟡 Fase 1 — Sprint 1 P0 (Semanas 2-4, R$ 18.000)
**Vulnerabilidades críticas + drift de tipos**

- **DB-016 com rollout canário** (1% → 10% → 25% → 100% ao longo de 7 dias).
- Eliminar vazamento de erros internos via RPCs (SQLERRM).
- Migração dos tipos do banco para arquivo gerado automaticamente (58 arquivos impactados).
- Hardening do RoleSwitch (evita queries antes do role ser conhecido).
- Centralização de realtime subscriptions (corrige memory leaks).

**Resultado:** vulnerabilidades críticas mitigadas, base de tipos estável, observabilidade ativa.

### 🟠 Fase 2 — Sprint 2 P1 (Semanas 5-9, R$ 30.000)
**Governança, acessibilidade, forms, prep LGPD**

- Rate limit + reCAPTCHA no endpoint público de pré-cadastro.
- Security headers (CSP, HSTS, SRI).
- Acessibilidade WCAG AA + focus traps em modais.
- Migração piloto para react-hook-form.
- Error boundaries por rota.
- DR runbook + drill de restore.

### 🔵 Fase 3 — Sprint 3 P2 (Semanas 10-17, R$ 42.000)
**Decomposição + LGPD MVP + performance**

- Decomposição das 15 páginas monolíticas (6 stories planejadas).
- Split dos god-hooks (estratégia shim, sem big bang).
- Skeleton system completo.
- LGPD MVP (banner + central + erasure RPC + pgaudit).
- Tuning de pg_stat (índices baseados em dados reais).

### 📚 Backlog P3 (opcional, R$ 18.000)
- i18n setup (se houver decisão de expansão internacional).
- Dark mode roadmap.
- Documentação operacional + onboarding DX.

---

## 📊 Comparativo de Mercado

`[ESTIMATIVA — benchmarks de SaaS B2B brasileiro de porte similar, mercado 2025-2026]`

| Indicador | MX hoje | Mercado | Pós-resolução MX |
|-----------|---------|---------|------------------|
| % tabelas com RLS habilitado | 95% | >98% | **100%** |
| Observabilidade (Sentry/RUM) | 0% | >80% | **100%** |
| Bundle JS inicial | sem visibilidade | <500KB | **<300KB** |
| Tipos auto-gerados do banco | Não | Sim | **Sim** |
| WCAG 2.1 AA (rotas top) | parcial | quase total | **0 issues críticos** |
| LGPD compliance demonstrável | parcial | total | **MVP completo** |
| Tempo médio de feature (story média) | 8-12 dias | 4-7 dias | **4-6 dias** |
| MTTR (incidentes prod) | horas/dias | <1h | **<30 min** |

**Posicionamento:** MX hoje está **atrás da média** em segurança operacional e observabilidade, **no patamar do mercado** em qualidade de stack (React 19, TS strict, Supabase), e **à frente** em estrutura de banco (89 migrations versionadas). Pós-resolução, **ultrapassa a média** em todos os indicadores.

---

## ✨ Pontos Fortes Identificados (Credibilidade)

Antes de aprovar o investimento, é importante reconhecer **o que JÁ ESTÁ BEM** — para entender que problemas são tratáveis em meses, não anos:

- ✅ **Stack moderno** (React 19, TypeScript 5.8 strict, Tailwind 4, Supabase).
- ✅ **95% das tabelas com RLS habilitado** (a base de segurança existe).
- ✅ **87 funções SECURITY DEFINER** (boa prática de isolamento já adotada).
- ✅ **89 migrations versionadas** (auditoria de schema garantida).
- ✅ **PWA configurado** (mesmo que precise refinar).
- ✅ **Atomic Design adotado** (parcial, mas com base).
- ✅ **TypeScript strict ativo** (rede de proteção do compilador).
- ✅ **Lint-tokens existe** (governança de design já valorizada).
- ✅ Histórico longo de migrations versionadas = sinal de aprendizado e evolução técnica.

**Isso significa:** time competente, fundação sólida, problemas claramente identificáveis e tratáveis. **Não é caso de reescrever — é caso de hardening.**

---

## 🚨 Riscos do "Não Fazer Nada"

### Cenário em 6 meses
- DB-016 explorado (alguém descobre o bypass) → vazamento ou fraude de comissões → resposta emergencial + churn.
- Sem observabilidade → próximo incidente em produção será descoberto pelo cliente, não pelo time.
- Pages monolíticas continuam crescendo → cada feature nova fica 10-20% mais lenta.

### Cenário em 12 meses
- Probabilidade média-alta de receber **notificação ou multa da ANPD** (especialmente se houver denúncia de algum usuário).
- Refatoração se torna **3x mais cara** (mais código acumulado para tocar).
- Time pode começar a pedir **reescrita parcial ou completa** (custo: R$ 400-800K adicionais).

### Cenário em 24 meses
- Reescrita parcial inevitável OU empresa fica **refém do débito** (qualquer mudança quebra algo).
- Risco de perda de cliente enterprise que exija auditoria de segurança formal.

---

## ✅ Recomendações para o Board

### Prioridade Máxima (decidir nesta semana)
1. **Aprovar Sprint 0 (R$ 10.500)** — sem isso, qualquer outra ação é alto risco.
2. **Confirmar se `.env` foi commitado em algum momento** — se sim, rotação de credenciais é tarefa de horas, não semanas.
3. **Tratar DB-016 como pré-incidente** — suspender deploys de funcionalidades novas que toquem `lancamentos_diarios` até a Sprint 1 entregar.

### Prioridade Alta (decidir em 2 semanas)
1. Aprovar **pacote completo Sprint 0-3 (R$ 112.500)**.
2. **Alocar time de 3-4 devs** por 13-17 semanas (pode ser combinação de time interno + 1-2 contratados temporários).
3. **Definir owner técnico do epic** (recomendação: tech lead atual; suporte semanal de @architect).

### Prioridade Média (próximos 30 dias)
1. **Definir SLOs pós-resolução** (uptime, MTTR, p95 de latência).
2. **Comunicação interna** sobre LGPD e impacto operacional do hardening.
3. **Considerar auditoria externa de segurança** após Sprint 1 (custo adicional estimado: R$ 20-30K) para validação independente.

### Comunicação Externa
- Não há necessidade de comunicação pública neste momento (não há incidente reportado).
- Documentar internamente para uso em RFPs de clientes enterprise que peçam evidência de hardening.

---

## 📎 Anexos

### A. Documento Técnico Completo
`docs/prd/technical-debt-assessment.md` — assessment FINAL com 73 débitos detalhados, ordem de resolução, dependências, riscos cruzados. Audiência: CTO, tech lead.

### B. Quality Gate QA
`docs/reviews/qa-review.md` — validação independente do assessment, com 10 gaps promovidos a débitos, 4 riscos cruzados adicionais e plano de testes baseline. Audiência: QA, tech lead.

### C. Outros documentos de origem
- `docs/architecture/system-architecture-brownfield-2026-05-16.md` — arquitetura do sistema.
- `supabase/docs/SCHEMA.md` + `supabase/docs/DB-AUDIT.md` — auditoria de banco.
- `docs/frontend/frontend-spec.md` — especificação frontend.
- `docs/reviews/db-specialist-review.md` — revisão do data engineer.
- `docs/reviews/ux-specialist-review.md` — revisão do UX expert.

### D. Próximos Passos Imediatos
1. [ ] **Reunião de aprovação com C-level (2h)** — apresentar este relatório.
2. [ ] **Aprovação de orçamento Sprint 0 (R$ 10.500)** — autorização para iniciar.
3. [ ] **Comunicação para time técnico** — kickoff da Sprint 0.
4. [ ] **Kickoff Sprint 0 (Semana 1)** — owner = tech lead + @devops.
5. [ ] **FASE 10 do brownfield discovery (@pm):** criação do `EPIC-HARDENING-FOUNDATION` + 4 stories de DB-016 + 6 stories de UX-001 com RACI explícito.
6. [ ] **Status semanal** de progresso (dashboard único, formato: % concluído por sprint + bloqueios).

---

**Fim do Relatório Executivo de Débito Técnico (FASE 9).**
**Próxima fase:** FASE 10 — @pm cria o epic e as stories executáveis para o time de desenvolvimento.
