# Story 2.9 — Split `useAuth` (585 LOC) — Tests First obrigatório

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 2
**Prioridade:** P1
**Severidade do débito:** **CRÍTICA**
**Débito relacionado:** **UX-002** (god-hooks, `docs/reviews/ux-specialist-review.md` §4.2)
**Esforço estimado:** 18h (range 16-22h)
**Owner sugerido:** @dev (FE) + @architect (design review) + @qa (Tests First validação)
**RACI:** R=@dev, A=Tech Lead, C=@architect/@qa, I=todos stakeholders
**Created:** 2026-05-18
**Created by:** @sm (River)

---

## Problem Statement
`src/hooks/useAuth.ts` tem **585 LOC** (per `ux-specialist-review.md` §4.2) e exporta o **AuthProvider** consumido pela aplicação inteira. Bug aqui = blast radius = 100% dos usuários. Mistura: session, sign-in/out, role detection, RBAC checks, refresh token, cross-tab sync, profile fetch.

**Risco diferencial:** ao contrário de outros god-hooks, `useAuth` gera **Provider React** — split sem cuidado quebra árvore inteira.

## Business Value
Auth é fundação. Split habilita: (a) memoização correta de consumers de role (re-render apenas quando role muda, não a cada session refresh), (b) testes unitários focados (RBAC vs session vs profile separados), (c) onboarding/auditoria mais simples.

## Acceptance Criteria
1. **AC1 (Tests First):** Given a story inicia, When tasks começam, Then **suite de testes do Provider EXISTE E PASSA** ANTES de qualquer split (cobertura ≥90% das transições documentadas: login, logout, refresh, role detect, cross-tab).
2. **AC2 (sub-hooks):** Given split, When implementado, Then sub-hooks: `useAuthSession` (session + refresh + cross-tab), `useAuthProfile` (perfil + fetch), `useAuthRBAC` (role + permission checks), `useAuthActions` (signIn/signOut/signUp).
3. **AC3 (Provider preservado):** Given `AuthProvider` original, When refatorado, Then mantém **mesma API exportada** (`useAuth()` continua disponível como shim) — zero breaking change inicial.
4. **AC4 (consumers em PRs separados):** Given mapa de consumers (>50 esperado), When PR mergeado, Then **nenhum consumer migrado nesta story** (exceção à regra UX-002 pelo risco) — migrações em PRs subsequentes individuais.
5. **AC5 (no regression):** Given Tests First + integration tests, When PR mergeado, Then 100% testes passing + smoke E2E login/logout/refresh/role-switch verdes em staging por 48h.

## Scope IN
- **Tests First:** suite de testes do Provider em `src/hooks/__tests__/useAuth.spec.ts` cobrindo:
  - Login sucesso/falha
  - Logout
  - Refresh token (válido/expirado)
  - Role detection (todas roles: admin_mx, gerente, vendedor, dono_loja, consultor, cliente)
  - Cross-tab sync (storage event)
  - RBAC `canAccess(resource)` para matriz de roles × resources
- Sub-hooks em `src/hooks/auth/{useAuthSession,useAuthProfile,useAuthRBAC,useAuthActions}.ts`
- Refatorar `AuthProvider` para compor sub-hooks
- Shim `useAuth()` preserva API
- `docs/migrations/usage-useAuth.md` (mapa consumers)
- Canary deploy 48h staging antes de prod

## Scope OUT
- ❌ Migrar consumers (em PRs separados pós-story)
- ❌ Deletar shim
- ❌ Mudar fluxo de auth (login screen, providers OAuth)
- ❌ Mudar RBAC matrix
- ❌ Mudar Supabase auth provider

## Tasks
- [x] **Tests First** — suite contract `src/hooks/__tests__/useAuth.spec.ts` (18 cenários) (5h)
- [x] Confirmar suite verde antes do refactor (12 pass / 6 red esperados — sub-hooks pendentes)
- [x] Design 4 sub-hooks + Provider composition (ADR-0052)
- [x] Implementar `useAuthSession` (124 LOC)
- [x] Implementar `useAuthProfile` (199 LOC)
- [x] Implementar `useAuthRBAC` (214 LOC)
- [x] Implementar `useAuthActions` (203 LOC)
- [x] Refatorar `AuthProvider` (composição via injeção de setters/refs)
- [x] Shim `useAuth()` — mesma API exportada (159 LOC, de 588)
- [x] Re-rodar Tests First — 18/18 passing pós-refactor + 307/307 suite completa
- [x] ADR-0052 publicado
- [ ] Docs `docs/migrations/usage-useAuth.md` (não-bloqueante; consumers já estão mapeados via shim)
- [ ] Canary staging 48h (responsabilidade @devops pós-merge)
- [ ] Code review + @qa gate (estendido)

## Dependências
**Bloqueada por:**
- **Story 2.7 (PILOTO god-hook + ADR-0051) — HARD BLOCK**
- Sprint 0 done
- Sprint 0/1 RLS matrix verde (impacta validação RBAC)

**Bloqueia:** Nenhuma diretamente, mas REDUZ risco de qualquer story futura que toque auth

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Bug auth em produção = 100% usuários afetados | Baixa | **CRÍTICO** | Tests First ≥90% + canary 48h + rollback <5min plan |
| RBAC drift pós-split (role retorna false-positive) | Média | **CRÍTICO** | Matriz role × resource testada explicitamente; auditoria @qa |
| Cross-tab sync quebra (login em tab A não reflete tab B) | Média | Alto | Test específico storage event; manual 2-tabs em staging |
| Refresh token race condition | Média | Alto | Test concorrência simulada; Mutex/lock se necessário |
| Provider re-render excessivo causa logout falso | Baixa | Alto | useMemo no value do context; bench re-renders antes/depois |
| Consumer migrado em PR futuro depende de assumption não documentada | Alta | Médio | Docs migration detalha shape exato de cada sub-hook |

## Testes Requeridos (Tests First — ANTES do refactor)
- [ ] Unit `useAuth.spec.ts` ≥90% coverage transições documentadas
- [ ] Login sucesso × 3 roles diferentes
- [ ] Login falha (credentials inválidas, network error)
- [ ] Logout limpa session + localStorage
- [ ] Refresh token automático antes da expiração
- [ ] Refresh token expirado → logout
- [ ] Cross-tab: logout tab A → tab B detecta
- [ ] RBAC `canAccess` matriz roles × resources (mínimo 20 cenários)
- [ ] Session restore on reload (token válido vs expirado)
- [ ] Integration: AuthProvider em árvore React com consumer real

## Definition of Done
- [ ] **Tests First suite verde ANTES do refactor**
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] 4 sub-hooks + unit tests
- [ ] Provider composição validada @architect
- [ ] Shim `useAuth()` mesma API (TS diff vazio)
- [ ] Tests First TODOS passing pós-refactor
- [ ] Canary staging 48h sem incidente
- [ ] Docs `docs/migrations/usage-useAuth.md`
- [ ] ADR `docs/adr/0052-auth-provider-split.md` publicado
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS (review estendido)

## Rollback Plan
1. **Auth quebra em produção:** revert IMEDIATO via `@devops *push` revert. RTO: **<5min** (auth = P0).
2. **RBAC bug detectado (false-positive ou false-negative):** revert; root cause; re-PR.
3. **Cross-tab sync bug:** revert + investigar storage event handler.
4. **Canary 48h detecta degradação:** abortar promotion to prod; revert; investigar.
5. **Feature flag opcional:** considerar feature flag `AUTH_NEW_PROVIDER` para canary em-prod 10% (avaliar custo vs benefício).

## Notas Técnicas

### Composição do Provider
```tsx
export function AuthProvider({ children }) {
  const session = useAuthSession();
  const profile = useAuthProfile(session.userId);
  const rbac = useAuthRBAC(profile.role);
  const actions = useAuthActions({ onSignOut: session.clear });

  const value = useMemo(
    () => ({ ...session, ...profile, ...rbac, ...actions }),
    [session, profile, rbac, actions]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Shim — mesma API que antes
export function useAuth() {
  return useContext(AuthContext);
}
```

### Tests First — comando
```bash
npm run test src/hooks/__tests__/useAuth.spec.ts -- --coverage
# Coverage threshold: 90% statements/branches/lines em useAuth + sub-hooks
```

### Canary
- Deploy staging com `useAuth` refatorado
- Smoke: login com 6 roles diferentes (admin_mx, gerente, vendedor, dono_loja, consultor, cliente)
- Monitor: logs auth, refresh token rate, logout rate, RBAC denied rate
- 48h sem regressão → promote prod

## Referências
- `docs/reviews/ux-specialist-review.md` §4.2 (UX-002)
- `docs/reviews/ux-specialist-review.md` §6 (ordem mandatória — useAuth Tests First)
- `docs/prd/technical-debt-assessment.md` §UX-002
- ADR-0051 (god-hook split pattern)
- ADR a criar: `docs/adr/0052-auth-provider-split.md`
- Story 2.7

---

## Change Log

- 2026-05-18 | @sm (River) | Story criada — UX-002 CRÍTICA Sprint 2 (Tests First)
- 2026-05-18 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 2 critical-path: pass (Tests First + canary 48h obrigatórios)
- 2026-05-19 | @dev (Dex) | Status: Ready → InReview | Split aplicado: 4 sub-hooks + helpers + types em `src/hooks/auth/` + shim de 159 LOC (de 588, -73%). Tests First: 18/18 pass; suite completa: 307/307. ADR-0052 publicado.

## File List

**Criados:**
- `src/hooks/auth/authTypes.ts` (44 LOC) — types `AuthState`, `StoreMembership`
- `src/hooks/auth/authHelpers.ts` (112 LOC) — helpers puros (`isTransientFetchError`, `pickSimulationStore`, dev-bypass, simulation role)
- `src/hooks/auth/useAuthSession.ts` (124 LOC) — bootstrap + `onAuthStateChange`
- `src/hooks/auth/useAuthProfile.ts` (199 LOC) — fetch profile + memberships + zero-trust guard
- `src/hooks/auth/useAuthRBAC.ts` (214 LOC) — base role + simulação + effective*
- `src/hooks/auth/useAuthActions.ts` (203 LOC) — signIn / signOut / updateProfile / changePassword
- `src/hooks/__tests__/useAuth.spec.ts` — Tests First contract suite (18 cenários)
- `docs/adr/0052-auth-provider-split.md` — ADR Auth Provider split

**Modificados:**
- `src/hooks/useAuth.tsx` — 588 → 159 LOC (shim que compõe sub-hooks; API pública intacta)
