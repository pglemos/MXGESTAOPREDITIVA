# Laudo de Auditoria Técnica — MX Gestão Preditiva

> Data: 2026-07-06 · Auditor: revisão arquitetural + code review · Método: análise estática (`741` arquivos TS/TSX, `~116k` linhas), inventário de infra e navegação funcional em produção (`mxperformance.vercel.app`).

---

## 1. Mapa de diretórios (árvore resumida)

```
MX GESTAO PREDITIVA/
├── api/                         # Serverless (Vercel) — store-pre-registration.ts
├── src/
│   ├── App.tsx                  # Router central (rotas + aliases/redirects + RoleSwitch)
│   ├── main.tsx / index.css     # Bootstrap + design tokens (Tailwind v4 @theme)
│   ├── api/base44Client.js      # Shim estilo Base44 sobre Supabase (⚠ mocks)
│   ├── base44-reference/        # Cópia do protótipo Base44 (renderizado em prod)
│   ├── features/                # 30 domínios (núcleo da app) — 388 arquivos
│   │   ├── crm/  checkin/  remuneracao/  vendedor-home/  ranking/
│   │   ├── dashboard-loja/  lojas/  equipe/  departamentos/  organograma/
│   │   ├── consultoria/  consultoria-cliente/  central-mx/  sales-performance/
│   │   ├── pdi/  feedback/  gerente-feedback/  universidade/  comportamental/
│   │   └── admin/  auth/  agenda/  agenda-admin/  notificacoes/  landing/ ...
│   ├── components/              # atoms/molecules/organisms + ui/* (shadcn)  — 57
│   ├── hooks/  (75)   lib/  (117)   pages/  (51, roteamento fino)
│   ├── design/ design-system/ benchmarks/ types/ (database.generated.ts) test/
│   └── assets/
├── supabase/
│   ├── migrations/  (159)       # + migrations_legacy/
│   ├── functions/  (10 edge)    # google-calendar/meet/drive, oauth, feedback-semanal ...
│   └── tests/  config.toml
├── scripts/                     # db-types, seed, consultoria, sync, validações
├── e2e/  (Playwright)   docs/   public/   storybook-static/
├── .github/workflows/  (10 CI)  playwright.config.ts  tailwind.config.js
└── tsconfig.json  eslint.config.js  components.json  vite/bun configs
```

*Ignorados:* `node_modules`, `.git`, `dist`, `coverage`, `tmp/`, `scratch/`, `output/`, `playwright-report/`, `test-results/`, imagens de prova.

---

## 2. Visão Geral do Sistema

### Tecnologias principais
- **Frontend:** React 18/19 + **Vite** + **TypeScript**, **react-router-dom**.
- **Estilo:** **Tailwind v4** (`@import "tailwindcss"` + `@theme` em `src/index.css`), design system atômico (`src/components/atoms|molecules|organisms`) **e** shadcn (`src/components/ui/*`).
- **Backend/Dados:** **Supabase** (Postgres + Auth + RLS) via `src/lib/supabase.ts`; **10 Edge Functions** (Deno) em `supabase/functions/`; **1 serverless Vercel** (`api/`).
- **Validação:** **zod** (`src/lib/schemas/*`). **Gráficos:** recharts. **UI:** lucide, sonner, moment.
- **Testes:** `bun:test` + Testing Library (`130` arquivos), **Playwright** e2e/segurança.
- **Runtime de build:** Bun (`bun.lock`, `bunfig.toml`) + Vercel (`vite build`).

### Arquitetura geral
- **SPA client-side** com roteamento por role (`RoleSwitch` vendedor/gerente/dono/admin em `src/App.tsx`).
- **Feature-first** (`src/features/<domínio>/`) com padrão **container/presentational** (`*.container.tsx` + `sections/` + `components/` + `hooks/`).
- **Camada de dados híbrida:** hooks (`src/features/**/hooks/`) + `src/lib/supabase.ts` direto + shim `base44Client.js`. Sem repositório único.
- **Automação** em `src/lib/automation/` (cron, feedback semanal, fechamento mensal, e-mail).
- **Tipos gerados** do banco: `src/types/database.generated.ts` (10.8k linhas).

### Propósito / escopo (inferido)
SaaS de **gestão de performance de vendas para concessionárias**. Perfis: **vendedor** (carteira/Mentor Comercial, Fechamento Diário, Minha Meta, Ranking, Universidade MX, Desenvolvimento/Feedback/PDI, Remuneração), **gerente/dono** (dashboards de loja, equipe, organograma, feedback), **consultoria** (PMR, planejamento estratégico, resumo executivo), **admin**. Multi-tenant por loja, integrações **Google** (Calendar/Meet/Drive), automações de feedback e fechamento.

---

## 3. Inventário do que já existe

### Backend / API / Integrações
- **Supabase Edge Functions** (`supabase/functions/`): `google-oauth-handler`, `google-calendar-sync`, `google-calendar-events`, `google-calendar-merged`, `google-meet-ata`, `google-drive-files`, `executive-agenda-google-sync`, `feedback-semanal`, `approve-store-registration`, `_shared`.
- **Serverless Vercel:** `api/store-pre-registration.ts` (pré-cadastro público de loja).
- **Automação** (`src/lib/automation/`): `cron-scheduler`, `weekly/feedback-engine`, `monthly/close-engine`, `email/sender`, `logger`.
- **Consultoria** (`src/lib/consultoria/pmr-engine.ts`, 842 linhas): motor de PMR + scripts (`scripts/consultoria:*`).
- **Compat Base44:** `src/api/base44Client.js` — `entities.{CarteiraCliente,DailyClose,Feedback,Training,PDI,ActionPlan,...}.{filter,create,update,list}`.

### Frontend / Apps
- **Telas do vendedor (9, paridade Base44 verificada):** Início (`features/remuneracao/MinhaRemuneracaoPage`), Fechamento Diário (`features/checkin`), Rotina do Dia (`features/crm/CentralExecucao.container`), Mentor Comercial (`features/crm/CarteiraClientes.container`), Minha Meta (`features/*meu-funil`), Ranking (`features/ranking`), Universidade MX / Desenvolvimento / Meu Perfil (`base44-reference/pages/*`).
- **Gerente/Dono:** `features/dashboard-loja` (`OwnerExecutiveCockpit` 1.782 linhas), `features/lojas` (`StoreTeamPanel` 1.058), `features/equipe`, `features/organograma`, `features/gerente-feedback`.
- **Design system:** `src/components/molecules/PageHeading`, `atoms/*`, `organisms/Modal`, além de `ui/*` (shadcn).
- **Rotas:** `src/App.tsx` (dezenas + muitos aliases/redirects: `/carteira`→`/carteira-clientes`, `/funil`→`/meu-funil`, `/vendedor/*` ...).

### Banco / Dados
- **159 migrations** em `supabase/migrations/` + `migrations_legacy/`.
- **RLS** ativo; testes de isolamento (`src/test/security/RLS-Isolation.playwright.ts`, workflow `rls-matrix.yml`).
- **Tipos gerados** (`src/types/database.generated.ts`) via `scripts` `gen:db-types` / `verify:db-types`.

### Infra / DevOps
- **CI (10 workflows GitHub):** `atomic-lint`, `bundle-budget`, `coderabbit-review`, `db-types-diff`, `eslint-a11y`, `gitleaks` (scan de segredos), `migration-reversibility`, `rls-matrix`, `smoke-403`, `storybook-build`.
- **Deploy:** Vercel (auto-deploy no push `main`). **Storybook**, **Playwright**, lint de tokens/a11y.

### Outros (jobs / utilitários)
- Scripts npm: `seed:sandbox:live`, `validate:e2e:live`, `export:team-contacts`, `reconcile:pre-cadastro-team`, `supabase:update-recovery-email`, `consultoria:*` (carregar parâmetros, importar fechamento, sincronizar PMR, gerar planejamento/resumo).

---

## 4. O que NÃO foi criado e deveria existir (Lacunas)

**Observabilidade**
- *Falta:* captura de exceções de runtime (Sentry/Datadog). Só há `web-vitals` (`src/lib/observability/web-vitals.ts`).
- *Por quê:* erros em produção passam despercebidos; sem alerta.
- *Solução:* integrar Sentry (browser + edge functions) + Error Boundary global.

**Camada de acesso a dados**
- *Falta:* `services/`/`repositories/` tipados por entidade. Hoje: hooks + supabase direto + shim.
- *Por quê:* lógica de query espalhada, difícil de testar/trocar, duplicação.
- *Solução:* repositório único por domínio, encapsulando Supabase; remover o shim.

**Documentação**
- *Falta:* `docs/ARCHITECTURE.md`, guia de onboarding, índice de ADRs (há menções soltas a ADR nos comentários).
- *Por quê:* curva de entrada alta; decisões implícitas.
- *Solução:* documento de arquitetura + ADRs versionados + Storybook como doc viva.

**Testes**
- *Falta:* cobertura consistente nos domínios financeiros/críticos (remuneração, checkin); testes das telas roteadas ao Base44 (removidos por obsolescência). E2e depende de ambiente live (`validate:e2e:live`).
- *Por quê:* regressões silenciosas em áreas de dinheiro/pontuação.
- *Solução:* metas de cobertura por módulo; **visual regression** (a paridade Base44 se beneficia).

**Boas práticas ausentes**
- *Falta:* logging estruturado no frontend (há `console.*`); feature flags para releases graduais; tratamento de erro padronizado (toast vs. fallback).
- *Solução:* logger frontend + flags + política de erro unificada.

**Domínio incompleto**
- *Falta:* dados reais para o que hoje é **mock** no `base44Client.js` (políticas de remuneração, faixas, bonificações, defaults em `localStorage`).
- *Solução:* migrar para tabelas Supabase; remover mocks.

---

## 5. Problemas e pontos errados

| Grav. | Arquivo | Problema | Risco | Correção |
|---|---|---|---|---|
| **Alta** | `src/api/base44Client.js` | Dados **hardcoded/mock**: `PoliticaRemuneracao`, `FaixaComissao`, `PremiacaoRemuneracao`, `HistoricoRemuneracao` retornam listas fixas; `AtividadeExecucao/EventoComercial` usam defaults em `localStorage`. | Financeiro/negócio — números de comissão não refletem o banco. | Migrar p/ tabelas reais; isolar shim atrás de interface e eliminar mocks. |
| **Alta** | `src/api/base44Client.js` | Mapeamento frágil `CarteiraCliente.situacao_atual = oportunidade.etapa` (enum cru), `temperatura` indefinida. | Bug — degrada lógica de prioridade/score se reusado fora do contexto. | Mapear etapa→situação explicitamente; nunca usar shim p/ telas com lógica de negócio (ver carteira, que usa hooks próprios). |
| **Alta** | `src/pages/{VendedorDesenvolvimento,VendedorTreinamentos,MeuPerfilVendedor}.tsx` | Renderizam `src/base44-reference/*` (`@ts-nocheck`) em **produção**. | Manutenção/tipagem — "código de referência" virou produção, sem tipos nem testes. | Portar os componentes p/ `src/features/` tipados; retirar `base44-reference` do runtime. |
| **Média** | `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx` (1.782) · `crm/CarteiraClientes.container.tsx` (1.509) · `checkin/CheckinCrmSection.tsx` (1.376) · `CheckinForm.tsx` (1.150) · `vendedor-home/VendedorHome.container.tsx` (1.102) | Componentes **gigantes** (>1.000 linhas). | Manutenção/teste — baixa legibilidade, alto acoplamento. | Quebrar por seção em subcomponentes + hooks; meta <400 linhas. |
| **Média** | `src/index.css` | **19 `!important`** restantes + overrides manuais de tokens (bloco crítico `CSS FORÇADO` já removido nesta rodada). | Regressão visual silenciosa (utility Tailwind sobrescrita). | Migrar overrides p/ `@utility`/`@layer`; zerar `!important` em utilities. |
| **Média** | `src/components/ui/*` + `src/components/{atoms,molecules,organisms}/*` | **Dois design systems** paralelos, uso inconsistente por tela. | Manutenção/UX inconsistente. | Escolher um; migrar o outro gradualmente. |
| **Média** | `src/App.tsx` | Dezenas de rotas + aliases/redirects (`/carteira`, `/mentor-comercial`, `/vendedor/*`, `/funil`, `/minha-meta`...). | Manutenção — rota canônica pouco clara. | Extrair p/ `routes.tsx` declarativo; tabela única de redirects. |
| **Baixa** | 59 ocorrências `: any`/`as any` · 3 `@ts-nocheck` | Pontos cegos de tipagem. | Bug latente. | Tipar; ativar `noUnusedLocals`/`strict`. |
| **Baixa** | `src/lib/automation/*`, `src/api/base44Client.js` | `17` `console.log/debug`. | Ruído/log não estruturado. | Trocar por logger; remover debug. |
| **Baixa** | Raiz do repo | Clutter versionado: `testsprite_tests/`, `provas-google-meet*/`, `node-compile-cache/`, PNGs soltos (`mx-*.png`, `login_page.png`). | Higiene do repo. | Adicionar ao `.gitignore`; remover do versionamento. |

---

## 6. O que está funcionando bem (Pontos Fortes)

- **`src/types/database.generated.ts`** — tipos gerados do schema (fonte única tipada), com CI `db-types-diff.yml` garantindo sincronia. *Padrão maduro.*
- **`.github/workflows/` (10 checks)** — `gitleaks` (segredos), `rls-matrix` (RLS), `migration-reversibility`, `bundle-budget`, `eslint-a11y`. *Cobertura de qualidade rara nesse estágio.*
- **`src/index.css` (`@theme`)** — design tokens de marca bem definidos (`#005BFF`, escala `mx-*`), habilitando paridade visual consistente.
- **Padrão container/presentational** — ex.: `src/features/checkin/` (`sections/` + `hooks/useCheckinPage.ts` + `components/`) separa dados de UI com clareza.
- **`src/lib/schemas/` (zod)** — validação centralizada e reutilizável.
- **Segurança:** RLS + testes de isolamento (`src/test/security/RLS-Isolation.playwright.ts`) + `smoke-403.yml`. *Segurança tratada como cidadão de primeira classe.*
- **Automação de domínio** — `src/lib/automation/monthly/close-engine.ts`, `weekly/feedback-engine.ts`: lógica de negócio isolada e testável.
- **159 migrations versionadas** + `migrations_legacy/` — histórico de schema disciplinado.

---

## 7. O que precisa melhorar (Refino e Otimização)

**Alta**
- **Unificar design system** (`ui/*` vs `atoms/molecules/organisms`). Definir um padrão e migrar.
- **Quebrar componentes 1.000+ linhas** (6 arquivos). Extrair seções e hooks.
- **Eliminar `base44-reference` do runtime** — portar p/ `features/` tipado.

**Média**
- **Camada `services/repositories`** — desacoplar acesso a dados do componente/hook.
- **Padronizar tratamento de erro** — Error Boundary + política de toast/fallback.
- **Roteamento declarativo** — `routes.tsx` + tabela de aliases.
- **Zerar `!important`/`any`/`@ts-nocheck`.**

**Baixa**
- **Higiene do repo** — gitignore de clutter, remover PNGs/pastas de prova.
- **Logging estruturado** no frontend; remover `console.*`.
- **Storybook** como doc viva ligada ao design system unificado.

---

## 8. Plano de Ação Prioritário

### Curto prazo (0–7 dias) — crítico/rápido
1. **Isolar mocks financeiros** do `base44Client.js` atrás de flag/interface; sinalizar claramente o que é mock (risco de comissão errada).
2. **Higiene:** adicionar `testsprite_tests/`, `provas-google-meet*/`, `node-compile-cache/`, `*.png` de prova ao `.gitignore`; remover do repo.
3. **Remover `console.log/debug`** e trocar por logger em `src/lib/automation/*`.
4. **CI verde:** ajustar/limpar testes obsoletos; garantir `typecheck + build` obrigatórios no PR.

### Médio prazo (8–30 dias) — estrutural
5. **Portar as 3 telas Base44** (`Desenvolvimento`, `Treinamentos`, `MeuPerfil`) p/ `src/features/` tipadas + testadas; aposentar `base44-reference` do runtime.
6. **Quebrar os 6 componentes gigantes** em subcomponentes/hooks (<400 linhas).
7. **Unificar design system**; migrar telas para o padrão único; zerar `!important` em `index.css`.
8. **Observabilidade:** Sentry (frontend + edge) + Error Boundary global.

### Longo prazo (30+ dias) — refatoração maior
9. **Camada de dados** (`repositories/` por domínio) substituindo shim + acessos diretos.
10. **Roteamento declarativo** e consolidação de aliases.
11. **Estratégia de testes:** cobertura mínima por domínio crítico + **visual regression** (proteger a paridade Base44) + reduzir dependência de e2e live.
12. **Documentação viva:** `ARCHITECTURE.md`, ADRs, Storybook conectado ao DS unificado.

---

*Observação de contexto:* nesta sessão foram corrigidos o bug sistêmico de CSS (`!important` unlayered que quebrava o layout responsivo do app inteiro) e alcançada **paridade visual 1:1 com o protótipo Base44 nas 9 telas do vendedor**, verificada em produção. O item 5 (portar Base44 p/ `features/`) é a maior redução de dívida sem impacto visual.
