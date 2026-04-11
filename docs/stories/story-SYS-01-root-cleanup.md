# Story [SYS-01]: Root Directory Sanitization

**Status:** READY
**Agent:** @architect
**Effort:** 2h
**Priority:** LOW (Hygiene)

## 1. Context
O diretório raiz está poluído com arquivos temporários de auditoria, capturas de tela e scripts de teste `.cjs`/`.mjs` que não pertencem ao ambiente de produção ou CI oficial.

## 2. Acceptance Criteria
- [ ] Remoção de todos os arquivos `.png` e `.html` da raiz.
- [ ] Migração de scripts úteis (ex: `seed_live_sandbox.ts`) para `scripts/`.
- [ ] Exclusão definitiva de arquivos `audit-*`, `test-*` e `debug-*` da raiz.
- [ ] Repositório limpo contendo apenas arquivos de configuração core (`package.json`, `vite.config.ts`, etc.).

## 3. Implementation Tasks
1. Listar todos os arquivos não-rastreados ou órfãos.
2. Identificar quais scripts devem ser preservados em `/scripts`.
3. Executar comando de deleção em massa.
4. Validar que o `npm run dev` e `build` continuam funcionais.

## 4. Definition of Done
- Diretório raiz com menos de 15 arquivos de configuração.
- Sem arquivos binários ou de log na raiz.
