# Story [CONS-10]: Estabilizacao PMR e Gates AIOX

**Status:** READY FOR REVIEW
**Agent:** @aiox-master + @dev
**Priority:** HIGH

## Context

Apos o corte PMR nativo, a validacao em modo autenticado e os comandos do AGENTS.md precisavam rodar sem falhas operacionais, drift de IDE ou warnings de teste.

## User Story

Como admin MX,
quero que o modulo PMR e o ambiente AIOX estejam estaveis,
para navegar, validar e evoluir a consultoria sem erros silenciosos ou comandos quebrados.

## Acceptance Criteria

- [x] Login real de admin navega pelas telas PMR sem console errors, page errors ou responses 4xx/5xx inesperadas.
- [x] Diagnostico, realizado, meta, planejamento e plano de acao foram validados em browser real com limpeza dos dados temporarios.
- [x] Scripts do AGENTS.md existem em `package.json`.
- [x] `sync:ide:check` passa sem drift apos `sync:ide`.
- [x] Skills locais Codex existem e validam.
- [x] Warnings React de `asChild` nos testes de modal foram removidos.
- [x] Formularios PMR rejeitam valores numericos invalidos antes de gravar.

## File List

- `docs/stories/story-CONS-10-stabilization.md`
- `package.json`
- `.codex/skills/`
- `.antigravity/rules/agents/aiox-developer.md`
- `.antigravity/rules/agents/aiox-orchestrator.md`
- `.antigravity/rules/agents/db-sage.md`
- `.antigravity/rules/agents/github-devops.md`
- `.claude/commands/AIOX/agents/aiox-developer.md`
- `.claude/commands/AIOX/agents/aiox-orchestrator.md`
- `.claude/commands/AIOX/agents/db-sage.md`
- `.claude/commands/AIOX/agents/github-devops.md`
- `.codex/agents/aiox-developer.md`
- `.codex/agents/aiox-orchestrator.md`
- `.codex/agents/db-sage.md`
- `.codex/agents/github-devops.md`
- `.cursor/rules/agents/aiox-developer.md`
- `.cursor/rules/agents/aiox-orchestrator.md`
- `.cursor/rules/agents/db-sage.md`
- `.cursor/rules/agents/github-devops.md`
- `.gemini/rules/AIOX/agents/aiox-developer.md`
- `.gemini/rules/AIOX/agents/aiox-orchestrator.md`
- `.gemini/rules/AIOX/agents/db-sage.md`
- `.gemini/rules/AIOX/agents/github-devops.md`
- `.github/agents/aiox-developer.md`
- `.github/agents/aiox-orchestrator.md`
- `.github/agents/db-sage.md`
- `.github/agents/github-devops.md`
- `src/features/consultoria/components/ConsultingParametersView.tsx`
- `src/features/consultoria/components/ConsultingStrategicView.tsx`
- `src/features/consultoria/components/PmrDiagnosticsView.tsx`
- `src/test/molecules/ModalTrigger.test.tsx`
- `src/test/organisms/Modal.test.tsx`

## Validation

- [x] `npm run validate:structure`
- [x] `npm run validate:agents`
- [x] `npm run sync:ide:check`
- [x] `node .aiox-core/infrastructure/scripts/codex-skills-sync/validate.js`
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run build`
- [x] `git diff --check`
- [x] Playwright autenticado com usuario admin.
