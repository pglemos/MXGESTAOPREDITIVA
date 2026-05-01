# Story OPS-20260501 - Hub de Configuracoes e Governanca MX

## Status

Ready for Review

## Contexto

Auditoria completa do sistema MX identificou tabelas e hooks de governanca ja existentes para identidade, lojas, equipe, operacao por loja, consultoria PMR, catalogos, broadcasts, integracoes e auditoria. A tela `/configuracoes` precisava deixar de ser apenas perfil pessoal e virar o hub principal com 12 abas governadas por papel.

## Acceptance Criteria

- [x] `/configuracoes` exibe abas dinamicas por papel autenticado.
- [x] Abas pessoais ficam disponiveis para `administrador_geral`, `administrador_mx`, `consultor_mx`, `dono`, `gerente` e `vendedor`.
- [x] `Equipe & Usuarios` usa `useTeam`, busca/filtro, criacao e edicao administrativa quando o papel permite.
- [x] `Lojas & Rede` usa `useStores`, busca/filtro, criacao, edicao, ativacao/desativacao e exclusao protegida por papel.
- [x] `Operacional por Loja` consolida regras de entrega, metas, benchmarks e politicas por loja.
- [x] `Consultoria PMR`, `Catalogos`, `Broadcasts`, `Integracoes` e `Sistema MX` expõem atalhos e componentes administrativos existentes.
- [x] `Notificacoes` persiste preferencias em `usuarios.notification_preferences`.
- [x] Roles somente leitura recebem indicador visual e bloqueios de mutacao nas abas sensiveis.
- [x] Gates de qualidade: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Agent Record

### Debug Log

- Criado registry de 12 abas em `src/features/configuracoes/tabRegistry.ts` com role gating e read-only roles.
- Substituido `src/pages/Configuracoes.tsx` por shell com navegacao por `?aba=...`.
- Adicionadas abas reutilizando hooks existentes: `useTeam`, `useStores`, `useStoreDeliveryRules`, `useStoreMetaRules`, `useBroadcasts`, `useGoogleCalendar` e auditoria `logs_auditoria_loja`.
- Adicionada migration para preferencias granulares de notificacao em `usuarios.notification_preferences`.
- Corrigidos atalhos de AI Diagnostics para a rota existente `/auditoria`.
- Playwright local validou `/configuracoes` com 12 abas no desktop e `/configuracoes?aba=notificacoes` no mobile 390px sem overflow horizontal.
- Chrome MCP validou que o nome canônico remoto da auditoria de loja é `logs_auditoria_loja`, não `mx_store_audit_log`.
- Chrome MCP validou novamente todas as 12 abas admin no desktop e a aba Notificações no mobile 390px com console limpo e sem overflow.

### File List

- `docs/stories/story-OPS-20260501-configuracoes-governanca.md`
- `src/pages/Configuracoes.tsx`
- `src/features/configuracoes/types.ts`
- `src/features/configuracoes/tabRegistry.ts`
- `src/features/configuracoes/components/ConfigTabsNav.tsx`
- `src/features/configuracoes/components/CreateStoreModal.tsx`
- `src/features/configuracoes/components/EditUserModal.tsx`
- `src/features/configuracoes/components/tabs/PerfilTab.tsx`
- `src/features/configuracoes/components/tabs/SegurancaTab.tsx`
- `src/features/configuracoes/components/tabs/NotificacoesTab.tsx`
- `src/features/configuracoes/components/tabs/EquipeUsuariosTab.tsx`
- `src/features/configuracoes/components/tabs/LojasRedeTab.tsx`
- `src/features/configuracoes/components/tabs/OperacionalLojaTab.tsx`
- `src/features/configuracoes/components/tabs/ConsultoriaPmrTab.tsx`
- `src/features/configuracoes/components/tabs/CatalogosTab.tsx`
- `src/features/configuracoes/components/tabs/BroadcastsTab.tsx`
- `src/features/configuracoes/components/tabs/IntegracoesTab.tsx`
- `src/features/configuracoes/components/tabs/SistemaMxTab.tsx`
- `src/features/configuracoes/components/tabs/AparenciaTab.tsx`
- `src/hooks/useGoogleCalendar.ts`
- `src/types/database.ts`
- `supabase/migrations/20260501020000_user_notification_preferences.sql`
