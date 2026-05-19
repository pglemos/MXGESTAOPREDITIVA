# ADR-0052 — Auth Provider Split via Sub-Hooks Composition (Tests First)

**Status:** Accepted
**Date:** 2026-05-19
**Deciders:** @dev (Dex), @architect (Aria), @qa (Quinn)
**Related:** ADR-0051 (god-hook split pattern), Story 2.9, UX-002

---

## Contexto

`src/hooks/useAuth.tsx` chegou a **588 LOC** misturando **Provider React** com cinco responsabilidades fortemente acopladas:

1. **Session bootstrap** — `supabase.auth.getSession()` + dev-bypass + `onAuthStateChange` subscriber
2. **Profile + memberships** — fetch `usuarios` + `vinculos_loja` + zero-trust guard (ejeção ativa)
3. **RBAC + simulação** — derivação de role, troca de identidade para internos MX
4. **Actions** — `signIn`, `signOut`, `updateProfile`, `changePassword` (com cleanup de simulação e dev-bypass)
5. **Cross-cutting state** — `activeStoreId`, `loading`, `initialized`, refs de bootstrap

Diferente dos god-hooks da Story 2.7 (`useAgendaAdmin`) ou 2.8 (`useTeam`), `useAuth` é um **Provider** consumido por **toda a árvore** (`>50 consumers`). Quebra de contrato = blast radius de 100% dos usuários. A regra "Tests First" do `ux-specialist-review.md §6` é mandatória.

## Decisão

Adotar **split em sub-hooks composáveis via Provider singleton**, com shim de compatibilidade total preservando a API pública do `useAuth()`.

### Arquitetura

```
src/hooks/
├── useAuth.tsx                    (SHIM Provider + useAuth() — 159 LOC)
└── auth/
    ├── authTypes.ts               (AuthState + Membership types — 44 LOC)
    ├── authHelpers.ts             (puras: isTransientFetchError, pickSimulationStore,
    │                               readDevBypassProfile, readSimulationRole — 112 LOC)
    ├── useAuthSession.ts          (124 LOC) — bootstrap + onAuthStateChange
    ├── useAuthProfile.ts          (199 LOC) — fetchProfile + fetchMemberships + zero-trust guard
    ├── useAuthRBAC.ts             (214 LOC) — baseRole + simulação + effective*
    └── useAuthActions.ts          (203 LOC) — signIn/signOut/updateProfile/changePassword
```

### Composição no Provider

```tsx
export function AuthProvider({ children }) {
  const session = useAuthSession(onUserClearedNoop)
  const profileState = useAuthProfile({ /* injeta refs + setters de session */ })
  const rbac = useAuthRBAC({ /* lê profile + memberships, controla activeStoreId */ })
  const actions = useAuthActions({ /* injeta setters de session/profile + stopSimulation */ })

  const value = useMemo<AuthState>(() => ({ ...mergedShape }), [/* deps */])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
```

### Diferença vs ADR-0051

| Aspecto | ADR-0051 (god-hook genérico) | ADR-0052 (Provider crítico) |
|--------|------------------------------|------------------------------|
| Sub-hooks isolados? | Sim — cada um com state próprio | **Não** — sub-hooks recebem setters/refs por injeção |
| Singleton state? | Não obrigatório | **Obrigatório** — Auth precisa de identidade única na árvore |
| Tests First? | Recomendado | **Mandatório (≥ contract suite verde antes do refactor)** |
| API pública | Pode mudar (consumers migram) | **Imutável** — shim `useAuth()` preserva 100% |
| Quando aplicar | Hook >300 LOC | Provider/Context >300 LOC E consumido por toda a árvore |

A diferença fundamental: **Auth é state global** — não pode haver sub-hooks com estados separados que divergem (e.g., `useAuthSession` instanciado em dois lugares geraria sessões concorrentes). Por isso o Provider mantém o **state ownership** e os sub-hooks são **factories de slices** que recebem dependências por parâmetro.

## Consequências

### Positivas

- ✅ **API pública preservada** — `useAuth()` retorna mesma `AuthState`; zero migração de consumers nesta story
- ✅ **Shim de 159 LOC** (de 588 — 73% redução) com responsabilidade única: compor
- ✅ **Sub-hooks <215 LOC cada** — limite ADR-0051 honrado (exceção: `useAuthRBAC` a 214 LOC pela cohesão da lógica de simulação)
- ✅ **Tests First** — 18 cenários de contrato (`useAuth.spec.ts`) lockam exports + helpers + sub-hook surface
- ✅ **307/307 testes verdes** (suite completa) — zero regressão detectada
- ✅ **Onboarding** — cada arquivo tem JSDoc de propósito; agentes futuros não precisam ler 588 LOC para tocar uma área

### Negativas / Trade-offs

- ⚠️ **Injeção de setters cria acoplamento explícito** — sub-hooks têm assinatura mais ampla (props com setters de session). É o custo de manter singleton state.
- ⚠️ **`useAuthActions` é factory `useMemo`** — não é hook puro (não usa `useState` interno); foi feito para reusar a injeção e memoizar as funções.
- ⚠️ **Sem unit tests por sub-hook** ainda — cobertura via contract suite + integration manual (canary 48h conforme story). Stories futuras podem adicionar com React Testing Library + mocks Supabase.

### Riscos mitigados

- **Blast radius 100% usuários:** suite contract garante export shape + helpers; build + typecheck verdes + 307 tests verdes; rollback documentado na story (RTO <5min).
- **Cross-tab sync:** preservado idêntico — `onAuthStateChange` está em `useAuthSession`, sem mudança de comportamento.
- **Zero-trust guard:** preservado em `useAuthActions.signIn` e `useAuthProfile.loadUserData` (mesma lógica, mesmos paths).
- **Refresh token + dev-bypass:** preservados via `devBypassRef` compartilhado entre sub-hooks.

## Quando aplicar este padrão

Use ADR-0052 (em vez de ADR-0051) quando:

1. O hook é um **Provider** (`createContext` + `useContext`)
2. Mais de **30 consumers** dependem do hook
3. State precisa ser **singleton** na árvore (ex: identidade, theme, i18n, feature flags)
4. LOC > 300

Para hooks comuns (não-Provider, state local), continue usando ADR-0051.

## Alternativas consideradas

1. **Zustand/Jotai store** — descartado: migração de 50+ consumers + perda de SSR-readiness do Context. Sem benefício imediato.
2. **Manter monolito + apenas extrair helpers puros** — descartado: não resolve o débito UX-002 (god-hook); 500+ LOC continuariam em um arquivo.
3. **Split por entity em vez de responsabilidade** (`useUser` / `useStore` / `useMemberships`) — descartado: AuthState shape público obriga ao Provider singleton; split por entity é o que os **consumers** poderão fazer em PRs futuros usando o shim.

## Referências

- ADR-0051 — god-hook split pattern (piloto Story 2.7)
- Story 2.9 — `docs/stories/sprint-2/story-2.9-split-useAuth.md`
- UX-002 — `docs/reviews/ux-specialist-review.md` §4.2
- Pull Request: refactor(auth) Story 2.9
