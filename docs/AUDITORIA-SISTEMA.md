# Auditoria do Sistema — MX Gestão Preditiva

> Data: 2026-07-06 · Escopo: repositório completo (`src/`, config, scripts) · Método: análise estática + navegação funcional em produção.

---

## 0. Sumário executivo

Aplicação **React SPA** (Vite + TypeScript + Tailwind v4 + Supabase) para gestão de performance de vendas automotivas (vendedor / gerente / dono / admin / consultoria). Base grande e ativa: **741 arquivos TS/TSX**, **~116k linhas**, **130 arquivos de teste**.

Qualidade geral **acima da média** para um SaaS nesse estágio: design system próprio, container/presentational, tipos gerados do banco, cobertura de testes relevante, RLS no Supabase. Porém há **dívidas arquiteturais claras** que crescem risco: (a) uso de código `base44-reference` como produção via um **shim MongoDB-like sobre Supabase com dados mockados**; (b) **componentes gigantes** (1.500+ linhas); (c) **dois design systems paralelos**; (d) **CSS com overrides frágeis**; (e) roteamento com dezenas de aliases/redirects.

---

## 1. O que já existe (mapa)

### Stack
- **Frontend:** React 18/19, react-router-dom, Vite, TypeScript.
- **Estilo:** Tailwind v4 (`@import "tailwindcss"` + `@theme`), design tokens em `src/index.css`, shadcn (`src/components/ui/*`), design system atômico (`atoms/molecules/organisms`).
- **Dados:** Supabase (`@supabase/supabase-js`) em `src/lib/supabase.ts`; tipos gerados em `src/types/database.generated.ts` (10.8k linhas).
- **Validação:** zod (`src/lib/schemas/*`). **UI utilitária:** recharts, sonner, lucide, moment.
- **Testes:** `bun:test` + Testing Library (130 arquivos `.test.*`), e2e (`test:e2e`).
- **Tooling:** Storybook, lint de tokens/a11y, `gen:db-types`, validação de estrutura/agents, scripts de consultoria/seed.

### Módulos (`src/features/` = 388 arquivos, maior área)
- **crm/** — Carteira/Mentor Comercial, Central de Execução, Plano de Ataque, Ficha, Modo Ataque.
- **checkin/** — Fechamento Diário (form multi-etapa, CRM inline).
- **vendedor-home/**, **remuneracao/** — dashboards do vendedor (Início / comissão).
- **ranking/**, **dashboard-loja/**, **lojas/**, **consultoria/**, **departamentos/**, **central-mx/**.
- **lib/** (117), **hooks/** (75), **components/** (57), **pages/** (51, roteamento fino).

### Camada de compat Base44
- `src/api/base44Client.js` — adaptador que expõe API estilo Base44 (`base44.entities.X.filter/create/update`) sobre Supabase.
- `src/base44-reference/` — cópia do código-fonte do protótipo Base44. **Agora renderizado em produção** nas rotas `/desenvolvimento`, `/treinamentos`, `/perfil` (decisão de paridade visual).

---

## 2. O que ainda falta (lacunas)

| Área | Lacuna | Recomendação |
|---|---|---|
| Observabilidade | Sem monitoramento de erros de runtime (Sentry/Datadog). Há `web-vitals` mas não captura de exceções. | Adicionar error tracking + alertas. |
| CI/CD | Checks vermelhos por secrets ausentes; testes de páginas roteadas ficaram obsoletos. | Corrigir pipeline; gate de `typecheck`+`test`+`build` obrigatório em PR. |
| Documentação | Sem README de arquitetura/onboarding nem ADRs consolidados (há referências a ADR em comentários, mas dispersas). | `docs/ARCHITECTURE.md` + índice de ADRs. |
| Camada de dados | Acesso a dados espalhado (hooks + shim + supabase direto). Sem repositório/serviço único. | Camada `services/` ou `repositories/` por entidade. |
| Base44 shim | `base44Client.js` tem **dados hardcoded/mock** (políticas de remuneração, faixas, defaults em localStorage). | Migrar para tabelas reais; remover mocks antes de escalar. |
| Testes | Cobertura desigual; e2e depende de ambiente live. | Metas de cobertura por módulo crítico (crm, checkin, remuneração). |
| Feature flags | Ausentes — mudanças de UI vão direto pra prod. | Introduzir flags para releases graduais. |

---

## 3. O que está errado / com problema

1. **`base44-reference` em produção** — código marcado como "referência" (`@ts-nocheck`, 3 arquivos) é renderizado nas rotas reais. Alto acoplamento a um protótipo externo; difícil de manter/testar. *Risco: médio-alto.*
2. **Shim `base44Client.js` com mocks** — políticas de remuneração, faixas, bonificações e alguns defaults são **hardcoded** ou salvos em `localStorage`. Mapeamentos frágeis (ex.: `situacao_atual = oportunidade.etapa`, enum cru) que **degradam lógica** quando usados fora do contexto certo (motivo de eu NÃO ter roteado a carteira pra ele). *Risco: alto para dados financeiros.*
3. **Componentes gigantes** — `OwnerExecutiveCockpit.tsx` (1.782), `CarteiraClientes.container.tsx` (1.509), `CheckinCrmSection.tsx` (1.376), `CheckinForm.tsx` (1.150), `VendedorHome.container.tsx` (1.102). Dificultam leitura, teste e reuso. *Smell de arquitetura.*
4. **CSS frágil** — `src/index.css` tinha bloco `!important` unlayered que quebrava TODO layout responsivo do app (corrigido nesta rodada). Restam **19 `!important`** e overrides manuais de tokens. *Risco de regressão silenciosa.*
5. **Dois design systems** — `components/ui/*` (shadcn) **e** `atoms/molecules/organisms`. Escolha inconsistente por tela. *Duplicação/decisão dividida.*
6. **Roteamento poluído** — `App.tsx` com dezenas de rotas + aliases/redirects (`/carteira`, `/mentor-comercial`, `/vendedor/*`, etc.). Difícil saber a rota canônica. 
7. **`: any` (59 ocorrências)** e **`@ts-nocheck` (3)** — pontos cegos de tipagem.
8. **17 `console.log/debug`** deixados no código.

---

## 4. O que funciona bem (pontos fortes)

- **Design tokens + Tailwind v4** bem estruturados (`@theme`), paleta de marca consistente (`#005BFF`, tokens `mx-*`).
- **Container/Presentational** aplicado em features principais (`*.container.tsx` + `sections/` + `components/`).
- **Tipos gerados do banco** (`database.generated.ts`) — fonte única de verdade tipada para o Supabase.
- **Validação com zod** centralizada em `lib/schemas/`.
- **Cobertura de testes real** (130 arquivos), incluindo e2e e validação de estrutura/tokens/a11y.
- **RLS no Supabase** + fluxo de auth por role (`RoleSwitch`, `ProtectedRoute`).
- **Automação rica** (scripts de db-types, seed, consultoria, sync) — maturidade de tooling.
- **Paridade visual 1:1 com o protótipo Base44** (foco desta sessão) agora verificada em produção nas 9 telas do vendedor.

---

## 5. O que pode melhorar (funciona, mas dá pra ficar muito melhor)

| Tema | Ação |
|---|---|
| **Organização de pastas** | Unificar um único design system (migrar shadcn `ui/*` → atoms/molecules OU vice-versa). Definir dono de cada camada. |
| **Componentes grandes** | Quebrar os 6 arquivos 1.000+ linhas em subcomponentes/hook por seção. Meta: nenhum componente > ~400 linhas. |
| **Camada de dados** | Extrair acesso a Supabase para `services/`/`repositories/` tipados; eliminar o shim `base44Client` (ou isolá-lo atrás de uma interface e remover mocks). |
| **Base44-reference** | Se as 3 telas roteadas forem definitivas, **portar** o código pra `src/features/` (remover `@ts-nocheck`, tipar, testar) em vez de renderizar a "referência". |
| **Tratamento de erros** | Error boundary global + captura (Sentry); padronizar toasts de erro vs. estados de fallback. |
| **Tipagem** | Zerar `: any`/`@ts-nocheck`; ativar `noUnusedLocals`/`strict` se ainda não. |
| **Roteamento** | Extrair rotas para `routes.tsx` declarativo; centralizar aliases em uma tabela de redirects. |
| **CSS** | Eliminar os 19 `!important` restantes; mover overrides pra `@utility`/`@layer`. Nunca sobrescrever utilities crus. |
| **Documentação** | `ARCHITECTURE.md`, guia de onboarding, ADRs versionados, storybook como doc viva dos componentes. |
| **CI** | Corrigir secrets; tornar `typecheck + test + build` obrigatórios; remover testes obsoletos; adicionar visual regression (a paridade Base44 se beneficiaria). |
| **Limpeza** | Remover `console.log`, código morto residual das features antigas (treinamentos/desenvolvimento MX substituídas). |

---

## Prioridades sugeridas (ordem)

1. **Isolar/remover mocks do `base44Client`** (risco financeiro).
2. **Portar as 3 telas Base44 pra `src/features/`** (tirar reference de produção).
3. **Quebrar os componentes 1.000+ linhas** (manutenibilidade).
4. **Unificar design system** + zerar `!important`.
5. **Observabilidade + CI verde** (confiabilidade).
