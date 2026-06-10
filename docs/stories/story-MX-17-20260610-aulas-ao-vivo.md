# Story MX-17.3 - Aulas ao Vivo Universidade MX

## Status

Ready for Review

## Story

**As a** vendedor, gerente, dono ou consultor MX,
**I want** ver a agenda de aulas ao vivo, acessar gravações e validar presença por prova,
**so that** a Universidade MX registre participação real sem inventar presença ou pontuação.

## Executor Assignment

executor: "dev"
quality_gate: "qa"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build"]

## Epic Reference

- **Epic:** EPIC-MX-17 - Universidade MX
- **PRD:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
- **Related story:** `docs/stories/story-MX-17-20260527-biblioteca-universidade-mx.md`

## Context

O epic EPIC-MX-17 define Universidade MX com biblioteca, trilhas, aulas ao vivo e certificações. A story 17.1 deixou aulas ao vivo para uma story posterior. Esta story implementa a base de agenda, prova e presença validada, reaproveitando a rota atual `/treinamentos` e evitando conteúdo ou progresso falso.

## Acceptance Criteria

1. A rota `/treinamentos` exibe agenda de aulas ao vivo para os perfis autorizados.
2. Aulas podem ser globais ou vinculadas a uma loja.
3. A presença do usuário é registrada somente após prova respondida.
4. O gabarito da prova não é exposto ao cliente.
5. O usuário vê próximas aulas, gravações disponíveis, presença validada, nota e pontos.
6. Estados vazios deixam claro quando não há aula, gravação ou prova cadastrada.
7. RLS permite leitura apenas por usuários autorizados e escrita de presença apenas via RPC.
8. Implementação passa em `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.

## Tasks / Subtasks

- [x] Criar migration para `aulas_ao_vivo`, `aula_provas`, `aula_presencas`, RLS e RPCs.
- [x] Atualizar tipos Supabase gerados para as tabelas/RPCs novas.
- [x] Criar hook de leitura, prova e submissão de presença.
- [x] Criar seção UI de próximas aulas, agenda, gravações e prova.
- [x] Integrar a seção nas experiências de `/treinamentos`.
- [x] Rodar gates de qualidade completos.
- [x] Atualizar Dev Agent Record e File List antes de concluir.

## Dev Notes

- Não criar certificação completa nesta story.
- Não criar recomendação automática por PDI, feedback, score ou alerta nesta story.
- Não expor `correta` no frontend; a correção deve ocorrer server-side.
- Usar dados reais do Supabase e estados pendentes explícitos.

## Testing

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Article IV - Rastreabilidade

| Item | Fonte |
|---|---|
| Universidade MX | PRD §4.1 FR-MENU |
| Biblioteca, trilhas, aulas ao vivo, certificações | PRD §4.1 |
| Aulas ao vivo | `docs/stories/epics/epic-mx-17-universidade-mx-2026-05-27.md` §4 Story 17.3 |
| Estados pendentes sem invenção | EPIC-MX-17 AC-06 |

## File List

- `docs/stories/story-MX-17-20260610-aulas-ao-vivo.md`
- `supabase/migrations/20260610180000_mx_aulas_ao_vivo_foundation.sql`
- `src/types/database.generated.ts`
- `src/hooks/useAulasAoVivo.ts`
- `src/lib/aulas-ao-vivo-migration.test.ts`
- `src/features/universidade/sections/AulasAoVivoSection.tsx`
- `src/features/universidade/sections/UniversidadeMx.tsx`
- `src/pages/VendedorTreinamentos.tsx`
- `src/pages/GerenteTreinamentos.tsx`
- `src/pages/ConsultorTreinamentos.tsx`

## Dev Agent Record

### Debug Log

- 2026-06-10: Story registrada a partir do EPIC-MX-17 Story 17.3 e do PRD §4.1.
- 2026-06-10: Continuação assumida de implementação parcial deixada pelo Claude Code: migration, tipos, hook e seção UI já estavam criados e sem commit.
- 2026-06-10: `AulasAoVivoSection` integrado em `/treinamentos` para vendedor, gerente/dono e consultor, além da seção `UniversidadeMx`.
- 2026-06-10: Teste de contrato adicionado para garantir que o RPC `get_prova_aula` não exponha gabarito e que `submeter_prova_aula` corrija server-side.
- 2026-06-10: Gates executados: `npm run lint`, `npm run typecheck`, `npm test` (411 testes) e `npm run build`.
- 2026-06-10: `supabase migration list` confirmou a migration `20260610180000` já aplicada no remoto; `supabase db lint --linked --fail-on error` falhou por erros preexistentes em funções de Score/Departamento, sem apontar a migration de aulas ao vivo.

### Completion Notes

- Fundação de aulas ao vivo entregue com agenda, gravações, prova de presença e pontuação validada server-side.
- O gabarito permanece restrito à tabela `aula_provas`; o frontend consome prova sem resposta correta.
- Migration recebeu bloco DOWN documentado. O checker completo de reversibilidade ainda falha por migrations antigas sem DOWN, mas a migration nova contém rollback manual.

### Change Log

- 2026-06-10: Story criada em `InProgress` para regularizar a implementação de aulas ao vivo.
- 2026-06-10: Story movida para `Ready for Review` após gates locais verdes.
