#!/bin/bash
LOG_FILE="/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/testsprite_tests/admin_frontend_run.log"

echo "Iniciando testes do frontend (31 testes)..." > "$LOG_FILE"
cd "/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA"

node /Users/pedroguilherme/.npm/_npx/8ddf6bea01b2519d/node_modules/@testsprite/testsprite-mcp/dist/index.js generateCodeAndExecute >> "$LOG_FILE" 2>&1

echo "Testes finalizados!" >> "$LOG_FILE"
osascript -e 'display notification "Os 31 testes do módulo Admin terminaram de rodar no TestSprite!" with title "TestSprite" sound name "Glass"'
