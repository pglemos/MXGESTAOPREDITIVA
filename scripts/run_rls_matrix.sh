#!/usr/bin/env bash
# ============================================================================
# RLS Regression Matrix — runner local/CI
# Story 0.5 — T-01
# ----------------------------------------------------------------------------
# Requer DATABASE_URL apontando para uma instância Supabase com pgTAP.
# Para Supabase local: `supabase start` e usar a URL do Postgres exposto.
# ============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TESTS_DIR="$ROOT_DIR/supabase/tests/rls-matrix"

: "${DATABASE_URL:?DATABASE_URL é obrigatório (ex.: postgresql://postgres:postgres@localhost:54322/postgres)}"

echo ">>> Aplicando setup + helpers"
psql "$DATABASE_URL" \
  -v ON_ERROR_STOP=1 \
  -f "$TESTS_DIR/setup.sql" \
  -f "$TESTS_DIR/_helpers.sql"

echo ">>> Executando runner pgTAP"
psql "$DATABASE_URL" \
  -v ON_ERROR_STOP=1 \
  --pset=footer=off \
  -f "$TESTS_DIR/runner.sql"

echo ">>> RLS Matrix OK"
