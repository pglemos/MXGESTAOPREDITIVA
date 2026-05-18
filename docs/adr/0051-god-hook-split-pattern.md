# ADR-0051 — Pattern: Split de god-hook com shim agregador

**Status:** Accepted
**Data:** 2026-05-18
**Autor:** @dev (Dex)
**Story piloto:** [Story 2.7 — Split `useAgendaAdmin`](../stories/sprint-2/story-2.7-split-useAgendaAdmin.md)
**Débito relacionado:** UX-002 (god-hooks)

---

## Contexto

A revisão UX (`docs/reviews/ux-specialist-review.md` §4.2) identificou **10 hooks com >300 LOC**, com `useAgendaAdmin` (895 LOC) liderando o ranking. Sintomas:

- Qualquer mudança força entender o hook inteiro
- Re-render em qualquer consumer quando QUALQUER state interno muda
- Impossível memoizar consumers seletivamente
- Testes unitários focados são impraticáveis (mock surface gigante)

A Story 2.7 estabelece o pattern oficial para splits dos demais god-hooks (`useTeam`, `useAuth`, `useCheckins`, ...), validando antes de replicar.

---

## Decisão

Adotamos o **pattern shim-first** para todos os splits de god-hook do projeto:

1. **Identificar grupos de responsabilidade** dentro do hook (CRUD, filtros, view, fetch/cache, sync externo, ...).
2. **Criar sub-hooks focados** em `src/hooks/{dominio}/use{Dominio}{Grupo}.ts`, cada um <200 LOC, com **interface tipada exportada** (`UseXxxReturn`).
3. **Manter o hook original como shim agregador** com JSDoc `@deprecated`, preservando 100% da API pública (mesma forma do return; mesmos types exportados; mesmos helpers).
4. **Side effects isolados por hook** — nenhum `useEffect` deve vazar entre sub-hooks.
5. **Estado compartilhado** entre sub-hooks fica no shim (lifting), passado como `props` para os sub-hooks que precisam. Evitar Context/Zustand a menos que múltiplos consumers precisem do mesmo state.
6. **Migrar consumers em PRs separados** (1 PR por consumer ou por feature) — o shim mantém compat enquanto a migração avança.
7. **Deletar shim** apenas quando `consumer_count == 0`, em PR/story dedicada (geralmente no sprint seguinte).

### Template estrutural

```
src/hooks/{dominio}/
├── types.ts                       # tipos compartilhados
├── use{Dominio}Events.ts          # fetch + cache  (~150 LOC)
├── use{Dominio}Filters.ts         # filtros + URL sync (~200 LOC)
├── use{Dominio}View.ts            # state de UI / derivações
├── use{Dominio}CRUD.ts            # mutações + side-effects externos
├── googleSync.ts | externalSync.ts  # helpers sem hooks
└── index.ts                       # barrel

src/hooks/use{Dominio}Admin.ts     # SHIM @deprecated (<60 LOC)
```

### Template do shim

```ts
/**
 * @deprecated Será removido em Sprint X. Migre para os sub-hooks específicos.
 */
export function useAgendaAdmin() {
  const events = useAgendaEvents()
  const [shared, setShared] = useState(...)  // estado compartilhado entre filters/view
  const filters = useAgendaFilters({ ...events, shared, setShared })
  const view = useAgendaView({ ...filters, shared, setShared })
  const crud = useAgendaCRUD({ ...events })
  return { /* ...mesma forma do hook original... */ }
}
```

---

## Quando aplicar

- Hook >300 LOC **E** múltiplas responsabilidades distinguíveis.
- Consumer count >1 (justifica preservar API via shim em vez de refatorar tudo).
- Existe rota de evolução clara: a equipe pretende migrar consumers ao longo do sprint seguinte.

## Quando NÃO aplicar

- Hook <200 LOC.
- Hook é thin wrapper (ex.: thin wrapper de TanStack Query, react-router, ...) — não há grupos para extrair.
- Consumer único e dedicado (refatorar inline o consumer junto com o hook é mais barato).
- Hook que orquestra side-effect único e indivisível (ex.: subscription Supabase realtime). Tratar como caixa-preta.

---

## Consequências

### Positivas
- **Re-render granular:** consumers que só precisam de filtros não re-renderizam quando CRUD muda.
- **Testabilidade:** cada sub-hook tem mock surface mínimo.
- **Onboarding:** novo dev entende um sub-hook (<200 LOC) em vez do god-hook todo.
- **Zero breaking change inicial** graças ao shim.
- **Reuso parcial:** novos consumers podem importar só o sub-hook que precisam.

### Negativas
- **Indireção curta:** shim adiciona 1 nível de chamada. Custo de runtime desprezível.
- **Estado compartilhado lifted no shim:** quem usa o shim instancia state que sub-hooks consumidos individualmente não pagariam. Mitigado pela migração progressiva (consumers migrados não pagam o custo).
- **Manutenção dupla durante transição:** enquanto consumers usam o shim, mudanças em sub-hooks devem preservar contrato do shim. Resolvido ao deletar o shim quando `consumer_count == 0`.

---

## Validação

Pattern validado na **Story 2.7** (`useAgendaAdmin`, 895 LOC → shim ~93 LOC + 4 sub-hooks). Métricas:

| Item | Antes | Depois |
|------|------:|------:|
| LOC monolíticos | 895 | 0 |
| Maior arquivo (`useAgendaCRUD`) | — | ~265 LOC |
| Shim LOC | — | ~93 |
| API pública (shape) | igual | igual |
| `typecheck` | ✅ | ✅ |
| `npm run build` | ✅ | ✅ |

> Nota: `useAgendaCRUD.ts` ficou levemente acima do limite-alvo de 200 LOC (~265) por conter 7 mutations + Google sync em sequência. Aceitável — todas operações pertencem ao mesmo grupo coeso e o limite é heurística, não regra dura. Ver §"Limites flexíveis".

### Limites flexíveis

O alvo de **<200 LOC por sub-hook** é uma diretriz, não uma trava. Se um grupo coeso (todas mutations de uma entidade, p.ex.) excede o limite por 30-40% sem repetição, é preferível manter coeso a fragmentar artificialmente.

---

## Próximas aplicações

| Story | Hook | LOC est. |
|-------|------|---------:|
| 2.8 | `useTeam` | ~700 |
| 2.9 | `useAuth` | ~500 |
| 2.10 | `useCheckins` | ~600 |

Cada story replica o pattern desta ADR e gera apenas o **migration doc** em `docs/migrations/usage-use{Hook}.md`.

---

## Referências

- `docs/reviews/ux-specialist-review.md` §4.2 — UX-002 god-hooks
- `docs/stories/sprint-2/story-2.7-split-useAgendaAdmin.md` — story piloto
- `docs/migrations/usage-useAgendaAdmin.md` — mapa de consumers (gerado nesta story)
- `docs/adr/0050-pages-decomposition-pattern.md` — pattern análogo para pages
