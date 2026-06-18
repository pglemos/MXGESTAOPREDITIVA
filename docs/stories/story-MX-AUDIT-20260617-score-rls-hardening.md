# Story MX-AUDIT-20260617 - Score RLS hardening

## Status
Ready Review

## Fonte
- `docs/auditorias/auditoria-modulo-vendedor-2026-06-17.md`
- Pendência C5/P1: policies temporárias permissivas no score engine.
- Histórico relacionado: `docs/stories/story-MX-02-20260527-rls-policies.md`.

## Story
Como arquiteto de segurança, quero substituir as policies permissivas do Score por RLS escopado para que vendedores, liderança e perfis internos vejam apenas dados permitidos e a escrita direta de cálculos continue bloqueada.

## Acceptance Criteria
- [x] Leitura de `score_inputs` e `score_calculations` usa helper escopado por usuário, loja ou perfil interno.
- [x] `score_history` e `score_observations` usam o cálculo vinculado para decidir leitura.
- [x] Escrita direta em `score_calculations` fica bloqueada para `authenticated`.
- [x] Escrita em `score_observations` exige autor logado e role consultiva/autorizada.
- [x] Policies antigas `USING (true)` do score são removidas por migration nova.
- [x] Teste de contrato cobre a migration.

## Fora de Escopo
- Aplicar a migration no Supabase remoto.
- Remover o arquivo draft histórico `20260527130000_score_rls_final.sql`.
- Criar snapshot `funnel_metrics`.
- Alterar a engine/RPC de cálculo do Score.

## Tasks
- [x] Criar migration idempotente de hardening RLS do Score.
- [x] Adicionar helpers SQL para leitura por escopo/cálculo.
- [x] Bloquear insert direto em `score_calculations`.
- [x] Restringir observações ao autor e roles autorizadas.
- [x] Adicionar teste de contrato.
- [x] Rodar gates locais.

## Dev Agent Record

### Agent Model Used
Codex GPT-5

### Debug Log References
- `bun test src/lib/score-rls-hardening-migration.test.ts` - passou.
- `npm run typecheck` - passou.
- `npm run lint` - passou.
- `npm test` - passou.
- `npm run build` - passou.
- `git diff --check` - passou.

### Completion Notes
- A migration nova substitui policies temporárias sem promover o draft antigo, que tinha decisões históricas e sintaxe não confiável.
- `mx_can_read_score_scope` cobre vendedor próprio, liderança de loja compartilhada, escopo de loja e perfis internos.
- `mx_can_read_score_calculation` permite reutilizar o mesmo escopo em histórico e observações.

### File List
- `docs/auditorias/auditoria-modulo-vendedor-2026-06-17.md`
- `docs/stories/story-MX-AUDIT-20260617-score-rls-hardening.md`
- `supabase/migrations/20260617008000_score_rls_hardening.sql`
- `src/lib/score-rls-hardening-migration.test.ts`

### Change Log
- 2026-06-17: Hardening RLS do Score criado para fechar C5/P1 da auditoria vendedor.
