# Story OPS-20260508 - Simulação de Perfis no Admin Master MX

## Status

Ready for Review

## Contexto

O Admin Master MX precisa apresentar a operação completa da loja sandbox MX durante consultorias, alternando rapidamente entre a experiência de vendedor, gerente e dono sem sair do ambiente administrativo.

## Acceptance Criteria

- [x] Adicionar o conjunto `Simulação` na sidebar esquerda do Admin Master MX.
- [x] Exibir atalhos para `Vendedor`, `Gerente` e `Dono` dentro de `Simulação`.
- [x] Permitir iniciar simulação com usuários vinculados à loja sandbox MX.
- [x] Renderizar os módulos reais de cada perfil simulado.
- [x] Permitir encerrar a simulação e voltar ao Admin Master MX.
- [x] Validar navegação e principais funcionalidades via navegador.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm test`.
- [x] Rodar `npm run build`.

## Dev Agent Record

### Debug Log

- Story criada a partir do requisito direto do usuário.
- Criada rota `/simulacao` e atalhos `/simulacao/vendedor`, `/simulacao/gerente`, `/simulacao/dono`.
- Adicionado modo de simulação no contexto de autenticação, com perfil e vínculo carregados da loja `MX CONSULTORIA`.
- Adicionado banner persistente de simulação ativa e ação `Voltar Admin MX`.
- Corrigido `PROFILE_SELECT` para não buscar `usuarios.store_id`, ausente no schema remoto.
- Corrigido `CHECKIN_SELECT` para não buscar `lancamentos_diarios.is_venda_loja`, ausente no schema remoto, mantendo normalização client-side.
- Corrigida relação ambígua de `solicitacoes_correcao_lancamento` para `usuarios` usando FK explícita do vendedor.
- Validação Chrome MCP: login real Admin MX, sidebar `Simulação`, perfil vendedor com 10 rotas, gerente com 11 rotas, dono com 10 rotas e retorno ao Admin MX; console limpo após correções.
- Gates locais finais: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

### File List

- `docs/stories/story-OPS-20260508-admin-master-simulacao-perfis.md`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/hooks/useAuth.tsx`
- `src/hooks/useCheckinAuditor.ts`
- `src/hooks/useCheckins.ts`
- `src/lib/auth/routeAccess.ts`
- `src/lib/auth/routeAccess.test.ts`
- `src/pages/Simulacao.tsx`
