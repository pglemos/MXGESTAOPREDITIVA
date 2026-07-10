# Story MX-AUDIT-20260710-UNIV-5 — Serviço canônico tipado da Universidade

## Status

Ready for Review

## Story

**Como** vendedor, gerente, dono ou consultor,
**quero** que listagem e progresso de treinamentos sejam acessados pelo mesmo serviço Supabase tipado,
**para que** a Universidade MX não mantenha contratos de leitura/escrita divergentes por tela.

## Acceptance Criteria

1. Um serviço tipado encapsula a listagem de conteúdo, progresso individual e tarefas do vendedor.
2. `useVendedorTreinamentos` não executa consultas Supabase diretas para esses dados; preserva a API e os estados já consumidos pela tela.
3. `useTrainings` reutiliza a mesma leitura/listagem e a mesma escrita de progresso, preservando filtros por papel e loja.
4. O serviço expõe erros de banco e não inventa métricas ou progresso.
5. Testes cobrem o mapeamento da biblioteca, ausência de progresso e a delegação dos hooks.

## Tasks / Subtasks

- [x] Criar testes de contrato para o serviço (RED).
- [x] Implementar serviço tipado e helpers de mapeamento (GREEN).
- [x] Migrar `useVendedorTreinamentos` e `useTrainings`.
- [x] Rodar testes focados, typecheck, lint, suíte, build e atualizar este registro.

## Dev Notes

- Fonte canônica: `docs/adr/ADR-MX-004-universidade-fonte-canonica.md`.
- Não migrar nem apagar `universidade_*` nesta story; isso depende da migration faseada do ADR.
- Manter RLS e filtros existentes; a camada de serviço não amplia acesso.
- Fontes: `docs/architecture/02-data-layer.md`, `docs/architecture/04-testing-deploy.md`.

## Testing

- `bun test src/features/universidade/services/universidade-service.test.ts src/features/vendedor-treinamentos/hooks/useVendedorTreinamentos.test.ts`
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- RED confirmado: `bun test src/features/universidade/services/universidade-service.test.ts` falhou por módulo inexistente.
- Serviço implementado sem alterar schema/RLS; hooks continuam usando o cliente Supabase autenticado.

### Completion Notes List

- `736 pass, 0 fail`; typecheck, lint e build passaram.
- Listagem/progresso/tarefas do vendedor e listagem/progresso compartilhados agora delegam ao serviço tipado.

### File List

- `docs/stories/story-MX-AUDIT-20260710-univ-servico-canonico.md`
- `docs/superpowers/plans/2026-07-10-univ-servico-canonico.md`
- `src/features/universidade/services/universidade-service.ts`
- `src/features/universidade/services/universidade-service.test.ts`
- `src/features/vendedor-treinamentos/hooks/useVendedorTreinamentos.ts`
- `src/hooks/useTrainings.ts`
