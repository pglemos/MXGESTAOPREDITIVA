#!/usr/bin/env bash
# Story 0.4 / CI-001 — Setup branch protection em main
# Requer: gh CLI autenticado com permissão admin no repo
# Uso: ./scripts/setup-branch-protection.sh

set -euo pipefail

REPO="${GITHUB_REPO:-pglemos/MXGESTAOPREDITIVA}"
BRANCH="main"

if ! command -v gh &>/dev/null; then
    echo "❌ gh CLI não instalado. Instale: brew install gh"
    exit 1
fi

if ! gh auth status &>/dev/null; then
    echo "❌ gh CLI não autenticado. Rode: gh auth login"
    exit 1
fi

echo "▶ Configurando branch protection em ${REPO}@${BRANCH}"

# Lista de status checks que DEVEM passar antes de merge
# (descobre via `gh api repos/${REPO}/branches/main/protection` se já existir)
REQUIRED_CHECKS=(
    "Detect Secrets"               # gitleaks
    "Smoke 403 (PostgREST RLS)"    # Story 0.6
    "ESLint (jsx-a11y + WCAG)"     # Story 3.11
    "RLS Regression Matrix"        # Story 0.5
    "Bundle Size Budget"           # Story 3.15
    "DB Types Drift Check"         # Story 0.1
    "Migration Reversibility"      # Story 0.7
)

# Build JSON payload via jq
PAYLOAD=$(jq -n \
    --argjson checks "$(printf '%s\n' "${REQUIRED_CHECKS[@]}" | jq -R . | jq -s .)" \
    '{
        required_status_checks: {
            strict: true,
            contexts: $checks
        },
        enforce_admins: false,
        required_pull_request_reviews: {
            dismiss_stale_reviews: true,
            require_code_owner_reviews: false,
            required_approving_review_count: 1
        },
        restrictions: null,
        required_linear_history: false,
        allow_force_pushes: false,
        allow_deletions: false,
        block_creations: false,
        required_conversation_resolution: true,
        lock_branch: false,
        allow_fork_syncing: true
    }')

echo "▶ Aplicando configuração:"
echo "$PAYLOAD" | jq .

read -p "Continuar? (y/N) " -r CONFIRM
[ "$CONFIRM" = "y" ] || { echo "Cancelado."; exit 0; }

gh api -X PUT \
    "repos/${REPO}/branches/${BRANCH}/protection" \
    --input - <<< "$PAYLOAD"

echo ""
echo "✓ Branch protection aplicada em ${REPO}@${BRANCH}"
echo ""
echo "Verifique em: https://github.com/${REPO}/settings/branches"
echo ""
echo "Configuração ativada:"
echo "  • PR review obrigatório (1 aprovação)"
echo "  • Status checks obrigatórios (${#REQUIRED_CHECKS[@]} workflows)"
echo "  • Force-push bloqueado"
echo "  • Deletes bloqueado"
echo "  • Conversation resolution obrigatório"
echo "  • Stale reviews dismissed em novo push"
