# Epic 4: Ranking UX — Toggle para Ocultar Nome da Loja

**Epic ID:** EPIC-MX-EVOL-04
**Status:** Draft
**Onda:** A (Imediata)
**Estimativa:** 0,5 dia útil
**Owner:** @pm (Morgan)
**Implementação:** @dev (Dex) + @ux-design-expert (Uma)
**Origem:** Tarefa original #5

---

## Objetivo

Adicionar um botão tipo "olho" (Eye / EyeOff — Lucide React) ao módulo de Ranking
([https://mxperformance.vercel.app/ranking](https://mxperformance.vercel.app/ranking))
que permite ao usuário (tipicamente admin MX em sessão de coaching) **ocultar visualmente o nome da loja**
para preservar identidade quando comparando lojas em telas compartilhadas.

---

## Contexto Técnico

A página [src/pages/Ranking.tsx](../../../../src/pages/Ranking.tsx) renderiza `store_name` em pelo menos dois pontos:

- Linha 244: card individual de vendedor (`{seller.store_name}`)
- Linha 390: linha agrupada de loja (`{r.store_name}`)

---

## Stories

### Story 4.1: Implementar toggle de privacidade no Ranking

**Critérios de Aceitação:**

- [ ] Estado local `hideStoreNames: boolean` (default `false`) gerenciado em [src/pages/Ranking.tsx](../../../../src/pages/Ranking.tsx)
- [ ] Botão `<IconButton>` no header da página com ícones `Eye` / `EyeOff` da `lucide-react`
- [ ] Botão exibido apenas para roles `admin` e `dono` (consultar `useAuth`)
- [ ] Quando `hideStoreNames = true`:
  - Linhas 244 e 390 (e quaisquer outras com `store_name`) devem mostrar placeholder estilizado:
    - Sugestão: blur leve + texto "LOJA #{índice anonimizado}" ou apenas "🔒 Loja oculta"
  - Filtros que dependem de `store_name` (linha 55-64) seguem funcionando — só a renderização é afetada
- [ ] Tooltip no botão: "Ocultar lojas" / "Mostrar lojas"
- [ ] Atalho de teclado `H` para toggle (nice-to-have)
- [ ] Persistência em `localStorage` para que admin não precise reativar a cada sessão

### Story 4.2: Adicionar testes de regressão

**Critérios de Aceitação:**

- [ ] Teste unitário: toggle alterna estado e classes CSS
- [ ] Teste E2E: admin abre Ranking, clica botão, verifica que `store_name` não aparece no DOM como texto literal

---

## Definition of Done

- [ ] ACs marcadas
- [ ] `npm run lint` + `npm run typecheck` passam
- [ ] @ux-design-expert valida visual (não pode quebrar layout/grid existente)
- [ ] @qa aprova
- [ ] Teste manual em produção (preview deploy)

---

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Algum componente filho expõe `store_name` em tooltip/aria-label | Audit completa no JSX de Ranking.tsx + ranking subcomponents |
| `hideStoreNames` quebrar navegação por voz/leitor de tela | aria-label fallback "Loja anonimizada {n}" |
