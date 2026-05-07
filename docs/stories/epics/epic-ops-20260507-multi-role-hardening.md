# Epic OPS-20260507: Hardening Multi-Role e Limpeza Técnica Residual

**Epic ID:** EPIC-OPS-20260507-MULTI-ROLE-HARDENING
**Status:** Em execucao
**Onda:** Yolo autorizado
**Owner:** @aiox-master (Orion)
**Implementacao:** @dev (Dex) + @qa (Quinn) + agentes AIOX de suporte
**Origem:** Auditoria multi-role de vendedor, gerente, dono e admin em 2026-05-07

---

## Objetivo

Reduzir os riscos residuais encontrados apos o hardening inicial de permissao, auth, check-in, PDI, consultoria, configuracoes, scripts e Edge Functions, preservando as credenciais atuais e sem rotacionar token ou chave.

---

## Contexto Tecnico

| Area | Estado atual | Direcao |
|---|---|---|
| Rotas e roles | Matriz central ja existe em `src/lib/auth/routeAccess.ts` | Cobrir novas rotas, reduzir fallbacks permissivos e ampliar testes |
| TypeScript | Typecheck passa, mas ainda ha `any` em modulos criticos | Remover casts em UI/hook/Edge por fatias seguras |
| UX de confirmacao | Fluxos admin ainda usam `window.confirm` | Migrar gradualmente para modais/estados confirmaveis |
| Consultoria | Alto volume de payloads amplos | Tipar visitas, anexos, PMR e tracking |
| Automacoes/scripts | Service role e logs operacionais espalhados | Documentar, reduzir fallback anon e conter saida sensivel |
| Performance | Chunks grandes remanescentes | Code split incremental sem mudar funcionalidade |

---

## Stories Planejadas

### Story 7: Segundo Passe Yolo de Rotas e Edge Reports

**Criterios de Aceitacao:**

- [ ] Orquestrar @aiox-master com @qa, @dev e agentes de suporte em nova rodada yolo.
- [ ] Fechar residuos confirmaveis de rota multi-role para fluxo operacional de vendedor.
- [ ] Reduzir consultas amplas em Edge Functions de relatorio/aprovacao tocadas.
- [ ] Registrar gates, residuos, file list e achados por papel.

### Story 6: Workflow Yolo Multiagente de Hardening Total

**Criterios de Aceitacao:**

- [x] Orquestrar @aiox-master com @qa, @dev e agentes de suporte.
- [x] Corrigir itens confirmaveis da auditoria multi-role sem trocar credenciais.
- [x] Preservar autoridade @devops para push/PR/release.
- [x] Registrar gates, residuos, file list e achados por papel.

### Story 1: Correcoes Residual Type Safety UI/Config

**Criterios de Aceitacao:**

- [ ] Remover `any` evitavel em abas de configuracao selecionadas.
- [ ] Remover `Column<any>` de grids simples.
- [ ] Preservar comportamento visual e fluxos existentes.
- [ ] `npm run typecheck` passa.

### Story 2: Consultoria Payload Contracts

**Criterios de Aceitacao:**

- [ ] Tipar anexos, `quant_data`, visitas e relatorios em componentes de consultoria.
- [ ] Reduzir casts `as any` em `ConsultoriaVisitaExecucao`, `VisitReportTemplate`, `VisitOneHighFidelity` e hooks relacionados.
- [ ] `npm run typecheck` e testes focados passam.

### Story 3: Admin Confirmations e Destructive Actions

**Criterios de Aceitacao:**

- [ ] Substituir confirmacoes nativas em fluxos admin por componentes controlados onde o risco justificar.
- [ ] Diferenciar arquivamento, remocao de vinculo e exclusao fisica na UI.
- [ ] Nenhuma exclusao fisica nova e nenhum segredo alterado.

### Story 4: Edge Function Type Hardening

**Criterios de Aceitacao:**

- [ ] Remover `deno-lint-ignore-file no-explicit-any` de funcoes selecionadas.
- [ ] Tipar payloads e clientes Supabase onde possivel.
- [ ] Validar sem deploy automatico quando envolver ambiente remoto.

### Story 5: QA Multi-Role Regression

**Criterios de Aceitacao:**

- [ ] QA revisa vendedor, gerente, dono e admin por rotas criticas.
- [ ] Gates locais passam: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- [ ] E2E smoke/navegacao Chromium passa.
- [ ] Story registra file list, gates e achados residuais.

---

## Definition of Done

- [ ] Stories executadas ou explicitamente fatiadas para rodada posterior.
- [ ] @qa registra PASS ou CONCERNS.
- [ ] Nenhuma chave, token ou segredo rotacionado.
- [ ] Working tree sem artefatos gerados indevidos.
- [ ] Mudancas documentadas em story operacional.

---

## Riscos

| Risco | Mitigacao |
|---|---|
| Escopo amplo demais para uma rodada | Fatiar por modulos e registrar residual |
| Alteracao em rotas quebrar E2E multi-role | Rodar smoke/navegacao Chromium e testes de matriz |
| Tipagem revelar contratos inconsistentes | Corrigir por bordas pequenas, preservando schema atual |
| Scripts com service role serem alterados acidentalmente | Nao editar `.env*` nem rotacionar secrets; revisar diff antes de gates |
