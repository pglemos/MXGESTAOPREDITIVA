# Runbook — Branch Protection + Gitleaks (Story 0.4 / CI-001)

**Owner:** @devops (admin GitHub repo)
**Duração:** ~30min execução + propagação

---

## Objetivo

Bloquear push direto em `main`, exigir PR review, validar 7 status checks obrigatórios e detectar secrets em PRs antes do merge.

---

## Pré-requisitos

- [ ] `gh` CLI instalado: `brew install gh`
- [ ] `gh auth login` autenticado com permissão admin no repo
- [ ] Workflows base em main (já estão):
  - `.github/workflows/gitleaks.yml` ✓
  - `.github/workflows/smoke-403.yml` ✓
  - `.github/workflows/eslint-a11y.yml` ✓
  - `.github/workflows/rls-matrix.yml` ✓
  - `.github/workflows/bundle-budget.yml` ✓
  - `.github/workflows/db-types-diff.yml` ✓
  - `.github/workflows/migration-reversibility.yml` ✓ (Story 0.7)

---

## Execução

### Passo 1 — Validar gitleaks rodando

Após próximo PR, confirmar que workflow `Gitleaks (Secret Scanning)` aparece em status checks.

### Passo 2 — Aplicar branch protection

```bash
chmod +x scripts/setup-branch-protection.sh
./scripts/setup-branch-protection.sh
```

O script vai:
1. Verificar `gh` auth
2. Mostrar payload JSON da configuração
3. Pedir confirmação
4. Aplicar via `gh api -X PUT`

### Passo 3 — Verificar via UI

Acessar `https://github.com/pglemos/MXGESTAOPREDITIVA/settings/branches`

Deve mostrar `main` com:
- ✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Status checks: 7 workflows listados
- ✅ Require conversation resolution before merging
- ✅ Do not allow force pushes
- ✅ Do not allow deletions

### Passo 4 — Smoke test

Tentar push direto em main (não como admin):
```bash
echo "test" >> README.md && git commit -am "test" && git push origin main
```
Esperado: **rejeitado** pelo GitHub com mensagem de branch protection.

Reverter:
```bash
git reset --hard HEAD~1
```

### Passo 5 — Atualizar Status story

Story 0.4: Status → Done após confirmação visual.

---

## Rollback

Se algo bloquear merges legítimos:

```bash
gh api -X DELETE repos/pglemos/MXGESTAOPREDITIVA/branches/main/protection
```

ou via UI: Settings → Branches → Delete rule.

---

## Próximos hardenings (Sprint 4)

- Require code owners review (CODEOWNERS file)
- Require signed commits
- Restrict who can push to matching branches
- Required deployments before merge

---

## Referências

- `.github/workflows/gitleaks.yml`
- `.gitleaks.toml`
- `scripts/setup-branch-protection.sh`
- Story 0.4 / CI-001 (`docs/stories/sprint-0/story-0.4-ci-branch-protection-gitleaks.md`)
