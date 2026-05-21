#!/usr/bin/env bash
# Stories 1.3 + 1.4 — DB-016 Canary Controller
# Orquestra rollout do REVOKE em lancamentos_diarios via feature flag
# Uso:
#   ./scripts/db016-canary-controller.sh stage 1     # canary 1%
#   ./scripts/db016-canary-controller.sh stage 10    # rampa 10%
#   ./scripts/db016-canary-controller.sh stage 25    # rampa 25%
#   ./scripts/db016-canary-controller.sh stage 100   # rampa 100% (flag full)
#   ./scripts/db016-canary-controller.sh revoke      # aplicar migration REVOKE (D7)
#   ./scripts/db016-canary-controller.sh rollback    # voltar flag a 0% + aplicar rollback migration
#   ./scripts/db016-canary-controller.sh status      # mostra estágio atual

set -euo pipefail

STAGE_FILE=".canary-state/db016-stage"
mkdir -p .canary-state

# Env obrigatório
: "${VERCEL_PROJECT_ID:?defina VERCEL_PROJECT_ID}"
: "${VERCEL_TOKEN:?defina VERCEL_TOKEN}"
: "${SUPABASE_PROJECT_REF:?defina SUPABASE_PROJECT_REF}"

ACTION="${1:-status}"

set_vercel_flag() {
    local pct="$1"
    echo "▶ Vercel: setando VITE_FLAG_LANCAMENTOS_VIA_RPC_PERCENTAGE=${pct}"
    # Atualiza env var no Vercel (production)
    curl -sf -X POST \
        "https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env" \
        -H "Authorization: Bearer ${VERCEL_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"key\":\"VITE_FLAG_LANCAMENTOS_VIA_RPC_PERCENTAGE\",\"value\":\"${pct}\",\"type\":\"plain\",\"target\":[\"production\"]}" \
        > /dev/null
    echo "✓ Flag setada. Trigger deploy manual no Vercel para propagar."
}

health_check() {
    echo "▶ Health checks (Sentry/smoke):"
    if [ -f scripts/smoke_403_postgrest.mjs ]; then
        node scripts/smoke_403_postgrest.mjs || { echo "❌ Smoke 403 falhou"; return 1; }
    fi
    # TODO: query Sentry error rate via API
    echo "✓ Health OK (smoke). Validar Sentry dashboard manualmente."
}

case "$ACTION" in
    stage)
        PCT="${2:?stage requer pct: 1/10/25/100}"
        set_vercel_flag "$PCT"
        echo "$PCT" > "$STAGE_FILE"
        echo "✓ Canary stage=${PCT}% gravado em ${STAGE_FILE}"
        echo ""
        echo "Próximo passo:"
        case "$PCT" in
            1)   echo "  → Monitorar 24h. Se verde: ./db016-canary-controller.sh stage 10" ;;
            10)  echo "  → Monitorar 48h. Se verde: ./db016-canary-controller.sh stage 25" ;;
            25)  echo "  → Monitorar 24h. Se verde: ./db016-canary-controller.sh stage 100" ;;
            100) echo "  → Monitorar 24h. Se verde: ./db016-canary-controller.sh revoke (D7)" ;;
        esac
        ;;

    revoke)
        if [ ! -f "$STAGE_FILE" ] || [ "$(cat $STAGE_FILE)" != "100" ]; then
            echo "❌ Bloqueio: stage atual ≠ 100%. Subir flag a 100% antes do REVOKE."
            exit 1
        fi
        echo "▶ Aplicando migration REVOKE em produção via supabase CLI"
        echo "⚠️  IRREVERSÍVEL sem migration rollback. Confirmar (y/N):"
        read -r CONFIRM
        [ "$CONFIRM" = "y" ] || exit 1
        supabase db push --linked --db-url "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres"
        echo "REVOKED" > "$STAGE_FILE"
        echo "✓ REVOKE aplicado. Monitorar Sentry/smoke 24h."
        ;;

    rollback)
        echo "▶ ROLLBACK — restaurando GRANTs + flag 0%"
        set_vercel_flag "0"
        if [ -f "$STAGE_FILE" ] && [ "$(cat $STAGE_FILE)" = "REVOKED" ]; then
            echo "⚠️  Aplicando migration rollback (REVOKE foi feito)"
            supabase db push --linked --include 20260521131000_db016_revoke_rollback.sql
        fi
        echo "0" > "$STAGE_FILE"
        health_check
        echo "✓ Rollback completo. Investigar causa via Sentry."
        ;;

    status)
        if [ -f "$STAGE_FILE" ]; then
            echo "Stage atual: $(cat $STAGE_FILE)%"
        else
            echo "Stage atual: 0% (não iniciado)"
        fi
        health_check
        ;;

    health)
        health_check
        ;;

    *)
        echo "Uso: $0 {stage <pct>|revoke|rollback|status|health}"
        exit 1
        ;;
esac
