# Pipeline Design System — Build Quality (Módulo Vendedor)

**Workflow:** `design-system-build-quality` · **Modo:** yolo · **Escopo:** módulo vendedor
**Data:** 2026-06-17 · **Executor:** @ux-design-expert (orquestrado por Orion)
**Superfície:** 41 arquivos (telas + sections + componentes do vendedor)

---

## Fase 1 — Build & Compile ✅ PASS

| Critério | Resultado |
|----------|-----------|
| Build completo sem erros | ✅ `vite build` OK (~7s) |
| Tokens compilados | ✅ `lint-tokens-ast` — 522 arquivos, **0 hex hardcoded** |
| Componentes exportados | ✅ typecheck 0 erros |

Tokens de design (cor/tipografia/espaçamento) centralizados e enforced por gate de lint. Nenhum literal de cor fora do sistema.

---

## Fase 2 — Documentation ⚠️ PARCIAL

| Critério | Resultado |
|----------|-----------|
| Reuso de DS | 118 imports de `atoms`/`molecules` em 41 arquivos |
| Pattern library formal | ❌ ausente (sem Storybook stories para telas vendedor) |
| Style guide | ✅ tokens via `@theme` (implícito) |

Vendedor consome o DS compartilhado (Card, PageHeader, Typography, Badge, Button, Input, EmptyState). Falta documentação navegável (stories) das composições específicas do vendedor.

---

## Fase 3 — A11y Audit (WCAG 2.1 AA) ⚠️ CONCERNS

### ✅ Aprovado
- **0** `onClick` em `<div>`/`<span>` — sem clicáveis não-semânticos
- **0** botões só-ícone sem `aria-label`
- **84** `aria-label` em uso
- **0** hex hardcoded → contraste governável por token central
- **0** `<img>` sem `alt`

### ❌ Violações
| Critério WCAG | Violação | Evidência |
|---------------|----------|-----------|
| 1.3.1 Info & Relationships | **60 `<th>` sem `scope`** | 0 `scope=` em 8 tabelas |
| 4.1.3 Status Messages | **aria-live só 2 ocorrências** | status dinâmico (gate, prescrição) sem região live |
| 2.4.7 Focus Visible | **focus-visible explícito só em 4/41 arquivos** | resto depende de ring global não verificado |
| 1.3.1 / consistência | **100 elementos HTML raw** (43 button, 27 input, 16 select, 14 table) bypassam atoms do DS | a11y não herdada do componente |

### ⚠️ Não cobertos (exigem render/axe-core)
Contraste real (4.5:1), navegação por teclado end-to-end, screen reader. Recomenda-se `@axe-core/playwright` por rota.

---

## Fase 4 — ROI Analysis 📊

| Métrica | Valor |
|---------|-------|
| Imports de componentes DS (atoms/molecules) | 118 |
| Elementos HTML raw (button/input/select/table) | ~100 |
| **Taxa de reuso do DS** | **~54%** |
| Arquivos vendedor | 41 |

**Savings potencial:** migrar os ~100 elementos raw → atoms (`Button`/`Input`/`Select`/`Table`) elevaria reuso para ~85%+ e embutiria a11y (focus, aria, scope) por padrão — eliminando V-1/V-4 na origem em vez de patch por tela. Estimativa: ~20h migração, reduz superfície de bug a11y recorrente.

---

## Fase 3b — A11y Audit Autenticado (runtime, prod) 🔍

Login `vendedor@…` em `mxperformance.vercel.app` (sessão real, dados reais). Auditoria DOM por rota:

| Rota | Tabelas | th | th sem scope | img s/ alt | btn s/ nome | input s/ label | headingSkips |
|------|---------|-----|-------------|-----------|------------|---------------|-------------|
| /home | 0 | 0 | 0 | 0 | 0 | 0 | **3** |
| /central-execucao | 1 (sem caption) | 11 | **11** | 0 | 0 | 0 | 0 |
| /carteira-clientes | 1 (sem caption) | 12 | **12** | 0 | 0 | 0 | 0 |
| /devolutivas | 3 | 26 | **26** | 0 | 0 | 0 | 0 |

**Confirmado em runtime:** 49 `<th>` renderizados, **49 sem `scope` (100%)**; tabelas sem `<caption>`/`aria-label`.

**Limpo em runtime (não-violação):** 0 imagem sem alt, 0 botão sem nome acessível, **0 input sem label** (todos os forms rotulados), skip-link "Pular para conteúdo principal" presente (2.4.1), 0 `tabindex` positivo, 0 id duplicado.

**Novo achado:** `/home` pula nível de heading (h1→h3) — WCAG 1.3.1 menor.

**Validação de deleção:** menu lateral autenticado NÃO contém Leads nem Trilhas — deleção confirmada live em prod. "Trilha atual: Vendedor N1" aparece em Treinamentos (confirma /trilhas era mock redundante).

## Veredito do Pipeline

**CONCERNS** — Build e tokens sólidos (Fase 1 ✅). A11y com base boa mas 1 violação sistêmica (60 `<th>` sem scope) + reuso parcial do DS (54%).

### Remediação priorizada
1. **`th scope="col"`** nas 8 tabelas (~3h) — resolve 1.3.1, mecânico, zero risco
2. **aria-live** em banners de status (~2h) — 4.1.3
3. **Migrar raw inputs/selects → atoms** (~12h) — eleva reuso + a11y na origem
4. **axe-core baseline** por rota vendedor (~4h) — cobre contraste/teclado/SR

Artefato cruza com `auditoria-padrao-ux-vendedor-2026-06-17.md` (V-1, V-4).
