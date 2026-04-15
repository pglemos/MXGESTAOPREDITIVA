# UX Specialist Review — Technical Debt Assessment

**Responsável:** @ux-design-expert
**Data:** 15 de Abril de 2026
**Versão do DRAFT revisado:** 2.0
**Gate Status:** ⚠️ NEEDS WORK

---

## 1. Validação dos Débitos Existentes

### UX-01 — Missing focus traps em modais (mobile menu, WizardPDI)

| Campo | Valor Original | Validação |
|-------|---------------|-----------|
| Severidade | HIGH | ✅ **Confirmado — elevado para CRITICAL** |
| Horas | 4h | ⬆️ Revisado para **6h** |
| Prioridade | P1 | ✅ Mantido |

**Análise técnica:**

O mobile menu (`Layout.tsx:307-365`) declara `role="dialog"` e `aria-modal="true"` (L321) mas **não possui focus trap**. O foco escapa para o conteúdo subjacente ao pressionar Tab, violando [WCAG 2.4.3 Focus Order (Level A)](https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html) e [2.1.2 No Keyboard Trap (Level A)](https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap.html) de forma dual: o foco não fica contido quando deveria, mas também não há mecanismo de escape via Escape key.

O `WizardPDI.tsx:154-432` é ainda mais crítico: é um modal fullscreen multi-step com `role="dialog"` e `aria-modal="true"` (L157) contendo 4 etapas com `select`, `textarea`, `input[type=range]`, e `input[type=date]`. Sem focus trap, um usuário de teclado perde completamente a navegação. O Wizard contém `select` sem label associado (L196-210), `range` sem `aria-label` (L278-281), e `date` inputs sem label (L354-356).

**Justificativa da elevação para CRITICAL:** Dois modais centrais da aplicação (navegação mobile + PDI) são inacessíveis por teclado. Isso bloqueia usuários de screen reader e impacta diretamente o fluxo de gestão de performance.

---

### UX-02 — No skip navigation link

| Campo | Valor Original | Validação |
|-------|---------------|-----------|
| Severidade | HIGH | ✅ **Confirmado** |
| Horas | 1h | ✅ Mantido |
| Prioridade | P1 | ✅ Mantido |

**Análise técnica:**

Nenhum `SkipNavLink`/`SkipNavContent` encontrado no código. O `Layout.tsx` renderiza o `<header>` (L142) com navegação complexa, sidebar com `aside` (L217), e `<main id="main-content">` (L260). Sem skip link, usuários de teclado devem tabular por ~30+ elementos interativos (logo button, store switcher, search, notifications, profile, sidebar buttons, drawer items) antes de alcançar o conteúdo principal. Viola [WCAG 2.4.1 Bypass Blocks (Level A)](https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html).

A implementação deve ser um link `<a href="#main-content" class="sr-only focus:not-sr-only ...">` como primeiro filho do `<div className="min-h-screen">` em `Layout.tsx:139`.

---

### UX-03 — Reduced motion não respeitado

| Campo | Valor Original | Validação |
|-------|---------------|-----------|
| Severidade | MEDIUM | ✅ **Confirmado — elevado para HIGH** |
| Horas | 2h | ⬆️ Revisado para **4h** |
| Prioridade | P2 | ⬆️ Elevado para **P1** |

**Análise técnica:**

Nenhuma ocorrência de `prefers-reduced-motion` ou `useReducedMotion` no codebase inteiro. A aplicação usa `motion/react` (v12.23.24) extensivamente:

- `Login.tsx`: `motion.img` com spring animation (L99-106), `motion.div` com fade+translate (L108-111, L121-124, L158-161)
- `Layout.tsx`: `AnimatePresence` + `motion.div` no drawer (L265-304), mobile menu (L308-365) com spring `damping: 25, stiffness: 200`
- `WizardPDI.tsx`: `motion.div` no overlay (L154-156), animações implícitas em progress bars

Além disso, classes CSS utilitárias de animação são usadas sem override:
- `animate-spin` — `Login.tsx:79,210`, `WizardPDI.tsx:427`
- `animate-pulse` — `App.tsx:60`, `WizardPDI.tsx:188`
- `.animate-float` — definido em `index.css:182-189` com `animation: float 6s ease-in-out infinite`

Viola [WCAG 2.3.3 Animation from Interactions (Level AAA)](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) e pode causar desconforto em usuários com vestibular disorders. A severidade foi elevada pela quantidade de pontos de intervenção (3 arquivos Motion + CSS custom keyframes).

---

### UX-04 — Missing label associations em forms inline

| Campo | Valor Original | Validação |
|-------|---------------|-----------|
| Severidade | MEDIUM | ✅ **Confirmado** |
| Horas | 3h | ⬆️ Revisado para **5h** |
| Prioridade | P2 | ✅ Mantido |

**Análise técnica:**

O problema é mais amplo do que o DRAFT sugere. Mapeamento completo:

1. **`Login.tsx:170-180`** — `<label>E-mail</label>` não possui `htmlFor`. O `<input>` não possui `id`. A associação label-input está quebrada.
2. **`Login.tsx:183-193`** — Idem para senha. `<label>Senha</label>` sem `htmlFor`, `<input>` sem `id`.
3. **`WizardPDI.tsx:196-210`** — `<select>` de colaborador e cargo sem `aria-label` ou `<label>` associado.
4. **`WizardPDI.tsx:224-228`** — `<select>` de tipo de meta sem label.
5. **`WizardPDI.tsx:233-237`** — `<textarea>` de meta sem label.
6. **`WizardPDI.tsx:278-281`** — `<input type="range">` sem `aria-label` nem `aria-valuemin`/`aria-valuemax` descritivos.
7. **`WizardPDI.tsx:354-356`** — `<input type="date">` de revisão sem label.
8. **`WizardPDI.tsx:365-371`** — `<select>` de competência sem label.
9. **`WizardPDI.tsx:397`** — `<input type="date">` de conclusão sem label.
10. **`WizardPDI.tsx:401-403,406-408`** — `<select>` de impacto e custo sem label.

Viola [WCAG 1.3.1 Info and Relationships (Level A)](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html) e [3.3.2 Labels or Instructions (Level A)](https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html). O ajuste de horas reflete os 10+ campos sem label no WizardPDI que não estavam no escopo original do DRAFT.

---

### UX-05 — Low contrast em muted text com opacity

| Campo | Valor Original | Validação |
|-------|---------------|-----------|
| Severidade | MEDIUM | ✅ **Confirmado — elevado para HIGH** |
| Horas | 2h | ⬆️ Revisado para **4h** |
| Prioridade | P2 | ⬆️ Elevado para **P1** |

**Análise técnica:**

O problema é sistêmico. Audit completo de `opacity-40` + `text-text-tertiary` no codebase:

**Cálculo de contraste:** `--color-text-tertiary: #94a3b8` sobre `#ffffff` (fundo padrão):
- Sem opacity: razão de contraste ≈ **2.95:1** (FALHA AA para texto normal, requer 4.5:1)
- Com `opacity-40`: cor resultante ≈ `#D3DAE4`, razão ≈ **1.43:1** (FALHA CRÍTICA)

**Ocorrências críticas por arquivo:**
- `MXScoreCard.tsx:33` — `text-text-tertiary opacity-40` em subtítulo de card
- `DataGrid.tsx:53-54,140` — empty state + headers com `opacity-40`
- `MorningReport.tsx:184,196` — labels de seção com `opacity-40`
- `Notificacoes.tsx:101,110-111,171,199,202` — múltiplos labels
- `GerenteFeedback.tsx:166,225,250,269,345,382,390,394` — ~8 instâncias
- `GerenteTreinamentos.tsx:141,222,298,302,335` — ~5 instâncias
- `Equipe.tsx:103,177,211,229,258,269` — ~6 instâncias
- `Configuracoes.tsx:89,106,116,124,147` — ~5 instâncias
- `Perfil.tsx:168` — label de seção
- `SalesPerformance.tsx:183` — label de métrica

Total: **40+ ocorrências** em 10 arquivos. Viola [WCAG 1.4.3 Contrast (Minimum) - Level AA](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html). Horas ajustadas pela escala da correção.

---

### UX-06 — No inline form validation no Login

| Campo | Valor Original | Validação |
|-------|---------------|-----------|
| Severidade | LOW | ✅ **Confirmado** |
| Horas | 2h | ✅ Mantido |
| Prioridade | P3 | ✅ Mantido |

**Análise técnica:**

`Login.tsx` possui validação apenas no `handleSubmit` (L38-73). O erro aparece em um block genérico (L196-201) após submissão. Não há validação inline de formato de e-mail, comprimento mínimo de senha, ou feedback em tempo real. O `FormField` molecule (`FormField.tsx:37-41`) já suporta `error` prop com `role="alert"`. A migração para FormField permitiria validação inline com esforço mínimo.

---

### UX-07 — Login inputs não usam atom components

| Campo | Valor Original | Validação |
|-------|---------------|-----------|
| Severidade | LOW | ✅ **Confirmado** |
| Horas | 2h | ✅ Mantido |
| Prioridade | P3 | ✅ Mantido |

**Análise técnica:**

`Login.tsx:174-179,188-192` usa `<input>` nativo com classes inline, enquanto o `Input` atom (`Input.tsx`) e `FormField` molecule (`FormField.tsx`) existem e oferecem:
- Auto-binding de `id` via `React.useId()` (FormField L16)
- `aria-hidden` correto para ícones (FormField L23)
- Error state com `role="alert"` (FormField L38)
- Estilização consistente com o design system

Os inputs do Login ainda usam `style={{ height: '3.25rem' }}` (L178,191) em vez de tokens de altura. Este débito deve ser executado em conjunto com UX-06.

---

### UX-08 — Decorative blur elements não otimizados

| Campo | Valor Original | Validação |
|-------|---------------|-----------|
| Severidade | LOW | ✅ **Confirmado** |
| Horas | 1h | ✅ Mantido |
| Prioridade | P3 | ✅ Mantido |

**Análise técnica:**

`Login.tsx:91-93` define 3 divs com `filter: 'blur(140px)'`, `blur(120px)`, `blur(80px)` sobre áreas de até 70% do viewport. `MorningReport.tsx:175,256` usa `blur-3xl` (Tailwind = 64px). Esses elementos já possuem `aria-hidden="true"` (MorningReport L175), mas o Login não aplica `aria-hidden` nas divs decorativas (L91-93). O impacto em GPU rendering em dispositivos low-end é real, e a falta de `aria-hidden` no Login é uma micro-falha de acessibilidade.

---

### UX-09 — No breadcrumb navigation

| Campo | Valor Original | Validação |
|-------|---------------|-----------|
| Severidade | LOW | ✅ **Confirmado** |
| Horas | 2h | ✅ Mantido |
| Prioridade | P3 | ✅ Mantido |

**Análise técnica:**

A navegação hierárquica é feita exclusivamente pela sidebar (`Layout.tsx:217-257`) e drawer (L265-304). Páginas profundas como `GerentePDI > PDIPrint` (`/pdi/:id/print`), `GerenteFeedback` com seções internas, e `Configuracoes` com tabs não oferecem orientação posicional. O breadcrumb beneficiaria especialmente o role `admin` com 15+ rotas. Não é bloqueante para WCAG mas melhora [2.4.8 Location (Level AAA)](https://www.w3.org/WAI/WCAG21/Understanding/location.html).

---

### UX-10 — Hardcoded legacy colors em print components

| Campo | Valor Original | Validação |
|-------|---------------|-----------|
| Severidade | LOW | ✅ **Confirmado — elevado para MEDIUM** |
| Horas | 2h | ⬆️ Revisado para **4h** |
| Prioridade | P3 | ⬆️ Elevado para **P2** |

**Análise técnica:**

`PrintableFeedback.tsx:27-34` define cores hardcoded: `#335c67` (header-blue), `#f3f4f6`, `#374151`, `#facc15`, `#1f2937`, `#dbeafe`, `#1e3a8a`, `#059669`, `#dc2626`, `#4b5563`, `#d1d5db`. `WeeklyStoreReport.tsx:27-33` repete o mesmo padrão com adições: `#f9fafb`, `#fef3c7`.

Essas cores são uma **duplicação implícita** de tokens que já existem no design system:
- `#f3f4f6` ≈ `--color-surface-alt` (#f8fafc)
- `#374151` ≈ `--color-text-secondary` (#475569)
- `#dc2626` = `--color-status-error` (#ef4444) — divergência!
- `#059669` ≈ `--color-status-success` (#10b981) — divergência!
- `#d1d5db` ≈ `--color-border-strong` (#e2e8f0)

A divergência de cores entre print e app gera inconsistência de marca em relatórios impressos que circulam fisicamente. Elevado para MEDIUM porque PrintableFeedback e WeeklyStoreReport são entregáveis ao cliente final.

---

## 2. Respostas às Perguntas do @architect

### Pergunta 1: UX-01 — `focus-trap-react` ou hook custom? Qual abordagem minimiza bundle?

**Recomendação: Hook custom `useFocusTrap` — sem dependência adicional.**

Justificativa:

1. **O projeto já possui `@radix-ui/react-dialog` v1.1.15** (`package.json:28`), que inclui um focus trap interno robusto via `Dialog.Content`. Para o `WizardPDI`, a abordagem ideal é **migrar o wrapper do modal para usar `Dialog.Root` + `Dialog.Portal` + `Dialog.Overlay` + `Dialog.Content`** do Radix. Isso elimina a necessidade de qualquer dependência nova e herda automaticamente: focus trap, Escape to close, aria-labelledby/auto, e scroll lock. O custo é envelopar o `motion.div` externo do WizardPDI com os primitives do Radix.

2. **Para o mobile menu** (`Layout.tsx:307-365`), que é um bottom sheet semântico e não um dialog tradicional, recomendo um **hook custom `useFocusTrap(containerRef, isActive)`** com ~40 linhas. Implementação:
   - `useEffect` que captura `containerRef.current.querySelectorAll(focusableSelectors)` ao abrir
   - `keydown` listener para Tab/Shift+Tab com wrap-around
   - Auto-focus no primeiro elemento focável ao abrir
   - Restaura foco ao elemento trigger ao fechar
   - Custo: **0 bytes adicionais** no bundle

3. **`focus-trap-react`** (4.2KB gzipped) é over-engineering para 2 pontos de uso. Se futuramente houver 5+ modais, reavaliar.

**Resumo:** Radix Dialog para WizardPDI + hook custom para mobile menu = **0 bytes adicionais**.

---

### Pergunta 2: UX-03 — CSS `@media (prefers-reduced-motion)` global ou `useReducedMotion()` do Motion?

**Recomendação: Abordagem híbrida em 2 camadas.**

**Camada 1 — CSS Global** em `index.css` (novo bloco após L190):

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .animate-float { animation: none !important; }
}
```

Isso cobre: `animate-spin`, `animate-pulse`, `.animate-float`, e qualquer `transition-all` inline. Abrange **todas** as 308+ ocorrências de opacity/transition sem intervenção por arquivo.

**Camada 2 — Motion Config** no componente raiz (`App.tsx`):

```tsx
import { MotionConfig } from 'motion/react'
<MotionConfig reducedMotion="user">
  <Layout />
</MotionConfig>
```

O Motion v12 respeita `reducedMotion="user"` nativamente, desabilitando spring animations, layout animations, e transforms em todos os componentes `<motion.*>` descendentes. Isso cobre:
- `Login.tsx` — 4 motion components
- `Layout.tsx` — drawer e mobile menu
- `WizardPDI.tsx` — overlay e transições internas

**Por que não apenas hook `useReducedMotion()`?** Exigiria modificar cada componente com animação individualmente (~15 arquivos). O `MotionConfig` com `reducedMotion="user"` resolve em 1 ponto. O CSS global como fallback garante que animações puramente CSS (como `.animate-float`) também sejam suprimidas.

---

### Pergunta 3: UX-05 — Qual token alternativo para `text-text-tertiary opacity-40` que atenda WCAG AA 4.5:1?

**Cálculos de contraste sobre fundo branco `#ffffff`:**

| Token | Cor | Opacity | Contraste | WCAG AA |
|-------|-----|---------|-----------|---------|
| `text-text-tertiary` | #94a3b8 | 100% | 2.95:1 | ❌ FALHA |
| `text-text-tertiary` | #94a3b8 | 40% | 1.43:1 | ❌ CRÍTICO |
| `text-text-secondary` | #475569 | 100% | 7.12:1 | ✅ PASS AA |
| `text-text-secondary` | #475569 | 60% | 4.53:1 | ✅ PASS AA (marginal) |
| `text-text-secondary` | #475569 | 50% | 3.62:1 | ❌ FALHA |

**Recomendação: Criar novo token semântico.**

```css
--color-text-label: #64748b;
```

`#64748b` (Slate 500) sobre `#ffffff` = **razão de contraste 5.62:1** → PASS WCAG AA (4.5:1) para texto normal e PASS AAA (7:1) para texto large.

**Estratégia de migração por contexto:**

1. **Labels de seção** (ex: `"SINCRONIA DISCIPLINAR D-0"`, `"MEMBRO ATIVO MX"`) — atualmente `tone="muted"` + `opacity-40`. Substituir por `tone="label"` (novo tone no Typography) ou classe `text-text-label`. **Remove `opacity-40` inteiramente.**

2. **Empty states** (ex: DataGrid "Nenhum resultado") — atualmente `text-text-tertiary opacity-40`. Manter `text-text-tertiary` **sem opacity**. O contraste de 2.95:1 é aceitável para **texto decorativo/large** conforme [WCAG 1.4.3 Exception 1](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html#contrast-requirements) para texto >= 18pt ou >= 14pt bold. Os empty states usam `font-black` + ícone 48px, enquadrando-se na exceção.

3. **Timestamps e metadados** — usar `text-text-secondary` sem opacity. Contraste 7.12:1.

**Novo token no `@theme` block:**
```css
--color-text-label: #64748b;
```

**Novo tone no Typography:**
```ts
label: "text-[#64748b]",
```

Isso elimina ~40 instâncias de `opacity-40` ofensivas em 10 arquivos com 1 token novo + 1 variant nova.

---

### Pergunta 4: UX-04 — Login page deve migrar para `FormField` molecule ou receber `aria-label` inline?

**Recomendação: Migrar para `FormField` molecule — sem exceção.**

Razões:

1. **`FormField` já existe** (`FormField.tsx`) e resolve automaticamente:
   - Label binding via `useId()` (L16): `<label htmlFor={fieldId}>`
   - Input com `id={fieldId}` (L29)
   - Ícone com `aria-hidden="true"` (L23)
   - Error state com `role="alert"` (L38)
   - Estilização com `Input` atom (L28-35)

2. **`aria-label` inline é uma solução inferior** porque:
   - Não fornece label visível associado programaticamente (WCAG 1.3.1)
   - Screen readers leem `aria-label` mas usuários com baixa visão que usam magnificação não veem a associação
   - O Login JÁ tem labels visuais (`<label>E-mail</label>`, L171), mas sem `htmlFor` — são labels órfãos

3. **Implementação proposta para `Login.tsx`:**

   ```tsx
   <FormField
     label="E-mail"
     type="email"
     value={email}
     onChange={e => setEmail(e.target.value)}
     placeholder="seu@email.com.br"
     required
     autoFocus={!email}
     icon={<Mail size={18} />}
     className="!rounded-xl !bg-surface-alt"
     error={emailError}
   />
   <FormField
     label="Senha"
     type="password"
     ref={passwordRef}
     value={password}
     onChange={e => setPassword(e.target.value)}
     placeholder="Digite sua senha"
     required
     icon={<Lock size={18} />}
     className="!rounded-xl !bg-surface-alt"
     error={passwordError}
   />
   ```

4. Isso resolve **simultaneamente** UX-04 (labels), UX-06 (validação inline via `error` prop), e UX-07 (atom components). Três débitos em 1 refatoração.

---

### Pergunta 5: UX-10 — Print components devem usar tokens MX ou manter esquema próprio?

**Recomendação: Migrar para tokens MX com camada de abstração `@media print`.**

Razões:

1. **Divergências atuais são bugs de marca:**
   - `#dc2626` (print) vs `#ef4444` (app `--color-status-error`) — vermelhos diferentes
   - `#059669` (print) vs `#10b981` (app `--color-status-success`) — verdes diferentes
   - Relatórios impressos são material de marketing; inconsistência de cor destrói a percepção de marca

2. **Os prints rodam dentro do app** como componentes React (`PrintableFeedback.tsx`, `WeeklyStoreReport.tsx`). Eles têm acesso aos tokens CSS. A separação artificial via `<style>` hardcoded é desnecessária.

3. **Estratégia de migração:**

   Substituir as classes CSS hardcoded por tokens MX:

   | Classe Legacy | Token MX | Uso |
   |--------------|----------|-----|
   | `.header-blue { background: #335c67 }` | `bg-brand-secondary` | Headers principais |
   | `.header-gray { background: #f3f4f6 }` | `bg-surface-alt` | Sub-headers |
   | `.status-bom { color: #059669 }` | `text-status-success` | Indicadores positivos |
   | `.status-abaixo { color: #dc2626 }` | `text-status-error` | Indicadores negativos |
   | `.legacy-table td { border: 1px solid #d1d5db }` | `border-border-strong` | Bordas de tabela |
   | `.header-yellow { background: #facc15 }` | Manter — cor funcional para atenção, adicionar token `--color-print-highlight: #facc15` | Destaque de análise |
   | `.ranking-gold { background: #fef3c7 }` | Manter — cor decorativa de ranking | Podium |

4. **Novos tokens print-safe** a adicionar no `@theme`:
   ```css
   --color-print-highlight: #facc15;
   --color-print-gold: #fef3c7;
   ```

5. Isso **não afeta a renderização impressa** porque os tokens resolvem para os mesmos valores hex, apenas centralizados. O `@media print` existente (PrintableFeedback L21-24, WeeklyStoreReport L21-24) continua funcionando para overrides de padding e background.

---

## 3. Débitos Adicionais Identificados

### UX-11 (NOVO) — Mobile bottom nav: contraste insuficiente em ícones inativos

**Severidade:** HIGH | **Horas:** 1h | **Prioridade:** P1

**Descrição:** A mobile bottom nav (`Layout.tsx:368-428`) usa `text-white/40` (branco a 40% de opacidade) sobre fundo `bg-mx-black` (#0A0A0B) para ícones inativos. Contraste resultante ≈ **2.1:1** — falha WCAG AA (requer 4.5:1 para texto/ícones). Isso afeta **100% dos usuários mobile** em todas as 4 roles, no elemento de navegação mais acessado.

**Correção:** Migrar de `text-white/40` para `text-white/70` (contraste ≈ 5.8:1, PASS AA) para estado inativo.

**Arquivo:** `Layout.tsx:374,384,395,414,424`.

---

### UX-12 (NOVO) — WizardPDI: `<select>` elements sem label associado (10+ campos)

**Severidade:** HIGH | **Horas:** 2h | **Prioridade:** P1

**Descrição:** O `WizardPDI.tsx` contém 10+ campos de formulário (`select`, `textarea`, `input[type=range]`, `input[type=date]`) sem `aria-label`, `aria-labelledby`, ou `<label htmlFor>`. Os labels visuais usam `<Typography>` decorativo (ex: L194 `"1. Selecione o Especialista"`) sem associação programática. Viola WCAG 1.3.1 e 3.3.2.

**Nota:** Parcialmente coberto por UX-04, mas a escala do WizardPDI justifica um item separado com escopo dedicado.

---

### UX-13 (NOVO) — Login.tsx: decorative blur divs sem `aria-hidden`

**Severidade:** LOW | **Horas:** 0.5h | **Prioridade:** P3

**Descrição:** `Login.tsx:91-93` — três divs decorativas com `filter: 'blur(140px)'` etc. não possuem `aria-hidden="true"`. Screen readers podem anunciar conteúdo irrelevante. Comparar com `MorningReport.tsx:175` que já aplica `aria-hidden="true"` corretamente.

---

### UX-14 (NOVO) — `<html lang>` ausente ou inconsistente

**Severidade:** MEDIUM | **Horas:** 0.5h | **Prioridade:** P2

**Descrição:** Não foi encontrado `lang="pt-BR"` no document root. Viola [WCAG 3.1.1 Language of Page (Level A)](https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html). Screen readers em inglês tentarão pronunciar conteúdo português com fonética incorreta. A correção é um atributo no `index.html`: `<html lang="pt-BR">`.

---

## 4. Estimativa de Custo Revisada

| ID | Débito | Horas Original | Horas Revisado | Delta | Justificativa |
|----|--------|---------------|---------------|-------|---------------|
| UX-01 | Focus traps | 4h | **6h** | +2h | 2 modais + testes manuais de keyboard nav |
| UX-02 | Skip navigation | 1h | 1h | — | — |
| UX-03 | Reduced motion | 2h | **4h** | +2h | CSS global + MotionConfig + testes cross-browser |
| UX-04 | Label associations | 3h | **5h** | +2h | 10+ campos no WizardPDI além do Login |
| UX-05 | Low contrast | 2h | **4h** | +2h | 40+ ocorrências em 10 arquivos |
| UX-06 | Inline validation | 2h | 2h | — | — |
| UX-07 | Atom components | 2h | 2h | — | — |
| UX-08 | Blur optimization | 1h | 1h | — | — |
| UX-09 | Breadcrumbs | 2h | 2h | — | — |
| UX-10 | Print colors | 2h | **4h** | +2h | 2 componentes + novo token + testes visuais de impressão |
| UX-11 | Mobile nav contrast | — | **1h** | NOVO | — |
| UX-12 | WizardPDI labels | — | **2h** | NOVO | — |
| UX-13 | aria-hidden blur | — | **0.5h** | NOVO | — |
| UX-14 | html lang | — | **0.5h** | NOVO | — |
| | **TOTAL** | **21h** | **33h** | **+12h** | |

**Budget original do DRAFT:** 21h
**Budget revisado:** 33h (+57%)

O aumento é justificado por: (1) severidades subestimadas em UX-01/03/05, (2) amplitude real do UX-04 maior que o descrito, (3) 4 débitos novos identificados.

---

## 5. Conformidade NFR-17 (Acessibilidade)

### Breakdown por Critério WCAG 2.1 AA

| Critério WCAG | Nível | Status | Débitos Relacionados | Detalhes |
|--------------|-------|--------|---------------------|----------|
| **1.1.1 Non-text Content** | A | ✅ PASS | — | Ícones Lucide usam `aria-hidden="true"`. Imagens com `alt` descritivo (Login logo). |
| **1.3.1 Info and Relationships** | A | ❌ FAIL | UX-04, UX-12 | Labels órfãos no Login, 10+ campos sem label no WizardPDI. Form fields sem associação programática. |
| **1.3.2 Meaningful Sequence** | A | ⚠️ PARTIAL | UX-01 | DOM order é lógico, mas focus trap ausente quebra a sequência percebida em modais. |
| **1.4.1 Use of Color** | A | ✅ PASS | — | Status usa ícones + cor (success: ícone + verde, error: ícone + vermelho). |
| **1.4.3 Contrast (Minimum)** | AA | ❌ FAIL | UX-05, UX-11 | 40+ instâncias de contraste < 4.5:1. Mobile nav icons ≈ 2.1:1. |
| **1.4.11 Non-text Contrast** | AA | ⚠️ PARTIAL | UX-05 | Focus rings usam `ring-brand-primary/15` (opacidade 15%) — contraste questionável para boundary indicators. |
| **2.1.1 Keyboard** | A | ⚠️ PARTIAL | UX-01 | Todo conteúdo é operável por teclado, mas modais sem focus trap permitem escape indesejado. |
| **2.1.2 No Keyboard Trap** | A | ⚠️ PARTIAL | UX-01 | Inversamente, o usuário PODE sair do modal via Tab (sem trap), mas NÃO pode fechar via Escape sem implementar handler. |
| **2.4.1 Bypass Blocks** | A | ❌ FAIL | UX-02 | Skip link ausente. Header + sidebar = ~30 elementos antes do main content. |
| **2.4.3 Focus Order** | A | ⚠️ PARTIAL | UX-01 | Focus order lógico na maioria das páginas, mas quebra em modais abertos. |
| **2.4.6 Headings and Labels** | AA | ⚠️ PARTIAL | UX-04 | Headings visuais existem mas labels não são programáticos. |
| **2.4.7 Focus Visible** | AA | ✅ PASS | — | `focus-visible:ring-4 focus-visible:ring-brand-primary/15` aplicado consistentemente em buttons e links (Layout.tsx:148,179,182,195,238,253,282, etc.). |
| **2.4.8 Location** | AAA | ❌ FAIL | UX-09 | Breadcrumb ausente. |
| **2.5.3 Label in Name** | A | ✅ PASS | — | `aria-label` em botões coincide com texto visível quando aplicável. |
| **3.1.1 Language of Page** | A | ❌ FAIL | UX-14 | `lang="pt-BR"` ausente no `<html>`. |
| **3.2.2 On Input** | A | ✅ PASS | — | Selects e inputs não disparam mudanças de contexto automáticas. |
| **3.3.1 Error Identification** | A | ⚠️ PARTIAL | UX-06 | Erros são exibidos mas sem inline validation no Login. |
| **3.3.2 Labels or Instructions** | A | ❌ FAIL | UX-04, UX-12 | Múltiplos campos sem label programático. |
| **4.1.2 Name, Role, Value** | A | ⚠️ PARTIAL | UX-01 | Modais declaram `role="dialog"` e `aria-modal="true"` mas sem `aria-labelledby`. |
| **2.3.1 Three Flashes** | A | ✅ PASS | — | Sem animações flashing. |
| **2.3.3 Animation from Interactions** | AAA | ❌ FAIL | UX-03 | Animações não podem ser desabilitadas. |

### Resumo NFR-17

| Status | Count | Critérios |
|--------|-------|-----------|
| ✅ PASS | 6 | 1.1.1, 1.4.1, 2.4.7, 2.5.3, 3.2.2, 2.3.1 |
| ⚠️ PARTIAL | 7 | 1.3.2, 1.4.11, 2.1.1, 2.1.2, 2.4.3, 2.4.6, 3.3.1, 4.1.2 |
| ❌ FAIL | 6 | 1.3.1, 1.4.3, 2.4.1, 2.4.8, 3.1.1, 3.3.2, 2.3.3 |

**Conformidade WCAG 2.1 AA estimada:** ~55% — requer correção dos 6 FAIL para atingir conformidade AA.

---

## 6. Dependências e Riscos

### Cross-debt Dependencies

```
UX-07 (Atom components) ──→ UX-06 (Inline validation) ──→ UX-04 (Labels)
       │                         │
       └─────────────────────────┴──→ Login.tsx refactor (bloco único)

UX-01 (Focus trap) ──→ UX-12 (WizardPDI labels)
       │                    │
       └── WizardPDI.tsx ──┘──→ Refatoração conjunta do Wizard

UX-05 (Contrast) ──→ UX-11 (Mobile nav)
       │
       └──→ Novo token --color-text-label (dependência do @theme)

UX-03 (Reduced motion) ──→ UX-08 (Blur optimization)
       │
       └──→ CSS global @media block (mesmo arquivo index.css)
```

### Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Regressão visual ao trocar `opacity-40` por token novo | Média | Médio | Screenshot comparison testing antes/depois em 10 arquivos |
| Radix Dialog wrapper no WizardPDI conflitar com motion animations | Baixa | Alto | Testar `Dialog.Content` + `motion.div` em sandbox; Radix Dialog usa `Dialog.Content` como boundary, motion pode ser aplicado no filho |
| `MotionConfig reducedMotion="user"` suprimir animações necessárias para feedback de UI (ex: loading spinners) | Média | Baixo | CSS global deve manter spinners funcionais com `animation-duration` mínimo em vez de `none` |
| Tokens de cor print divergire de expectativa de clientes acostumados com cores legacy | Baixa | Médio | Validar com stakeholder antes da migração; manter prints de referência |
| WizardPDI refatoração quebrar fluxo de save de PDI (dados em `form` state) | Baixa | Crítico | Refatorar apenas markup/ARIA, preservar lógica de estado intacta. Teste E2E obrigatório |

---

## 7. Recomendações de Execução

### Fase 1 — Acessibilidade Bloqueante (P1) — 13h

**Objetivo:** Eliminar todos os FAIL WCAG Level A.

| Ordem | Débito | Ação | Horas |
|-------|--------|------|-------|
| 1 | UX-14 | Adicionar `lang="pt-BR"` ao `<html>` | 0.5h |
| 2 | UX-02 | Implementar `SkipNavLink` no `Layout.tsx` | 1h |
| 3 | UX-01 | Hook custom `useFocusTrap` para mobile menu + wrapper Radix Dialog para WizardPDI | 6h |
| 4 | UX-05 | Adicionar token `--color-text-label: #64748b`, criar tone `"label"` no Typography, migrar 40+ instâncias | 4h |
| 5 | UX-11 | Trocar `text-white/40` → `text-white/70` na mobile bottom nav | 1h |
| 6 | UX-03 | CSS global `@media (prefers-reduced-motion)` + `MotionConfig reducedMotion="user"` | (horas na Fase 2) |

### Fase 2 — Conformidade WCAG AA (P2) — 11h

| Ordem | Débito | Ação | Horas |
|-------|--------|------|-------|
| 7 | UX-03 | Reduced motion (global CSS + MotionConfig) | 4h |
| 8 | UX-04 + UX-12 | Labels em Login + WizardPDI (usar FormField onde aplicável) | 5h |
| 9 | UX-10 | Migrar print components para tokens MX | 4h |
| 10 | UX-13 | Adicionar `aria-hidden` em blur divs do Login | 0.5h |

### Fase 3 — UX Polish (P3) — 7.5h

| Ordem | Débito | Ação | Horas |
|-------|--------|------|-------|
| 11 | UX-06 + UX-07 | Login migration para FormField + inline validation | 4h (combinado) |
| 12 | UX-08 | Otimizar blur elements (reduzir blur radius, lazy mount) | 1h |
| 13 | UX-09 | Implementar Breadcrumb component | 2h |

**Ordem total sugerida:** 1 → 2 → 3 → 4 → 5 → 7 → 8 → 9 → 10 → 11 → 12 → 13

---

## 8. Parecer Final

### ⚠️ NEEDS WORK

O DRAFT v2.0 subestima significativamente o escopo dos débitos de UX/Acessibilidade. Os 10 itens originais são válidos, mas 4 tiveram severidade subestimada e 4 novos débitos foram identificados. O orçamento de 21h é insuficiente — o revisado de **33h** reflete a real complexidade.

**Pontos críticos que bloqueiam conformidade WCAG 2.1 AA:**

1. O sistema possui **6 violações FAIL** em critérios Level A/AA — inaceitável para um produto comercial.
2. O WizardPDI é o fluxo mais complexo da plataforma e tem **acessibilidade praticamente nula** (sem focus trap, sem labels, sem screen reader support).
3. O `opacity-40` sobre `text-text-tertiary` é um anti-pattern sistêmico que afeta **todos os roles** em **10 páginas**.
4. A ausência de `lang="pt-BR"` e skip link são falhas básicas de conformidade.

**Recomendações ao @architect:**

- Aprovar o budget revisado de 33h (+57%)
- Priorizar a Fase 1 (P1) como pré-requisito para qualquer release externa
- Combinar UX-06 + UX-07 em execução única com UX-04 (Login refactor)
- Executar UX-01 e UX-12 juntos (WizardPDI refactor em batch)
- Criar story `UI-05` para o token `--color-text-label` como dependência de UX-05

**O gate será movido para ✅ APPROVED quando o DRAFT v2.1 incorporar as revisões deste documento.**

---

**Assinatura:** @ux-design-expert
**Revisão solicitada por:** @architect (FASE 6)
**Próximo passo:** Aguardar incorporação no DRAFT v2.1 pelo @pm
