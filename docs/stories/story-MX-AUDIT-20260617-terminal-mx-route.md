# Story MX-AUDIT-20260617 - Terminal MX vendedor

## Status
Ready Review

## Fonte
- `docs/auditorias/auditoria-modulo-vendedor-2026-06-17.md`
- Pendência C3/H1: Terminal MX sem rota própria no namespace vendedor.

## Story
Como vendedor, quero acessar o Terminal MX por uma rota clara em `/vendedor/terminal-mx` para registrar o fechamento diário e fazer ajuste técnico sem depender do caminho legado `/lancamento-diario`.

## Acceptance Criteria
- [x] `/vendedor/terminal-mx` renderiza o Terminal MX para vendedor.
- [x] `/lancamento-diario` continua funcionando como rota legada para compatibilidade.
- [x] Menu desktop/mobile do vendedor aponta para `/vendedor/terminal-mx`.
- [x] CTAs operacionais de Home, Ajuda, Central e lembretes apontam para `/vendedor/terminal-mx`.
- [x] Matriz `routeAccess` permite `/vendedor/terminal-mx` apenas para vendedor.
- [x] Testes focados e typecheck passam.

## Fora de Escopo
- Remover a rota legada `/lancamento-diario`.
- Alterar o fluxo de aprovação de `checkin_correction_requests`.
- Corrigir RLS do Score ou criar `funnel_metrics`.

## Tasks
- [x] Adicionar rota protegida `/vendedor/terminal-mx`.
- [x] Atualizar menu e links operacionais visíveis.
- [x] Atualizar lembretes de rotina diária.
- [x] Atualizar testes de rotas, Ajuda e rotina diária.
- [x] Atualizar relatório de auditoria.

## Dev Agent Record

### Agent Model Used
Codex GPT-5

### Debug Log References
- `bun test src/lib/auth/routeAccess.test.ts src/lib/daily-routine.test.ts src/pages/VendedorAjuda.test.tsx` - passou.
- `npm run typecheck` - passou.
- `npm run lint` - passou.
- `npm test` - passou.
- `npm run build` - passou.
- `git diff --check` - passou.

### Completion Notes
- O componente existente `Checkin` já exibe Terminal MX com abas Registro Diário e Ajuste Técnico.
- A nova rota torna esse módulo acessível pelo namespace vendedor sem quebrar links antigos.
- `/lancamento-diario` permanece autorizado somente para vendedor como compatibilidade.

### File List
- `docs/auditorias/auditoria-modulo-vendedor-2026-06-17.md`
- `docs/stories/story-MX-AUDIT-20260617-terminal-mx-route.md`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/features/crm/CentralExecucao.container.tsx`
- `src/features/vendedor-home/VendedorHome.container.tsx`
- `src/features/vendedor-home/components/LancamentoGateBanner.tsx`
- `src/features/vendedor-home/sections/DailyCheckinBanner.tsx`
- `src/features/vendedor-home/sections/RitualHojeCard.tsx`
- `src/lib/auth/routeAccess.ts`
- `src/lib/auth/routeAccess.test.ts`
- `src/lib/daily-routine.ts`
- `src/lib/daily-routine.test.ts`
- `src/pages/VendedorAjuda.tsx`
- `src/pages/VendedorAjuda.test.tsx`

### Change Log
- 2026-06-17: Terminal MX exposto em `/vendedor/terminal-mx` com links operacionais atualizados.
