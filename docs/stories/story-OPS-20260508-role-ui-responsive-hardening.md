# Story OPS-20260508 - Hardening Visual Responsivo dos Perfis Operacionais

## Status

Ready for Review

## Story

**As a** Admin Master MX em consultoria,
**I want** que todas as telas de vendedor, gerente e dono estejam visualmente consistentes em desktop e mobile,
**so that** eu possa apresentar o sistema completo sem cards quebrados, textos cortados, ícones desalinhados ou componentes inutilizáveis.

## Executor Assignment

executor: "ux-design-expert"
quality_gate: "dev"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build", "browser responsive audit"]

## Acceptance Criteria

- [x] Auditar as principais rotas dos perfis `vendedor`, `gerente` e `dono` em viewport desktop.
- [x] Auditar as principais rotas dos perfis `vendedor`, `gerente` e `dono` em viewport mobile.
- [x] Corrigir quebras visuais evidentes: texto cortado indevidamente, cards com overflow, botões/ícones desalinhados, tabelas/painéis sem scroll adequado e conteúdo sobreposto.
- [x] Preservar a lógica funcional existente e o escopo dos módulos reais de cada perfil.
- [x] Validar navegação com login/simulação usando os usuários MX disponíveis.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm test`.
- [x] Rodar `npm run build`.

## Tasks / Subtasks

- [x] Mapear rotas e componentes compartilhados usados pelos perfis vendedor, gerente e dono.
- [x] Criar/usar auditoria responsiva com evidências desktop e mobile.
- [x] Corrigir padrões globais e componentes compartilhados.
- [x] Corrigir páginas específicas onde o problema não for compartilhado.
- [x] Reexecutar auditoria visual e quality gates.

## Dev Notes

- Requisito originado diretamente do usuário após entrega da simulação de perfis do Admin Master MX.
- A auditoria deve cobrir o uso real via computador e mobile, priorizando usabilidade de consultoria e apresentação.
- Não alterar permissões, regras de negócio ou dados da loja MX fora do necessário para renderização.

## Testing

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Auditoria Playwright responsiva nas rotas de vendedor, gerente e dono em `1366x768` e `390x844`.

## Dev Agent Record

### Debug Log

- Story criada para cumprir o gate AIOX de desenvolvimento orientado por story.
- Browser plugin abriu o login local, mas falhou ao preencher o input `type=email` por limitação do mecanismo de edição; auditoria seguiu por automação Playwright/Chrome em navegador real.
- Chrome DevTools MCP validou login, abertura do menu `Simulação`, entrada em `Vendedor`, viewport mobile sem overflow horizontal e console sem erros.
- Audit inicial identificou overflow no banner de simulação mobile, aside do check-in sem token de largura, header de Dashboard Loja em 1366px, tabs mobile em Gerente Treinamentos/Dashboard Loja, ranking mobile e botões da Rotina Gerente.
- Audit final severo: 62 verificações em rotas de vendedor, gerente e dono nos viewports desktop e mobile, `issueCount: 0`.
- `npm run lint`: passou após correção dos tokens `gap-mx-xs`.
- `npm run typecheck`: passou.
- `npm test`: passou, 228 testes.
- `npm run build`: passou.

### File List

- `docs/stories/story-OPS-20260508-role-ui-responsive-hardening.md`
- `src/index.css`
- `src/components/Layout.tsx`
- `src/components/molecules/TabNavPill.tsx`
- `src/pages/DashboardLoja.tsx`
- `src/pages/GerenteTreinamentos.tsx`
- `src/pages/Ranking.tsx`
- `src/pages/RotinaGerente.tsx`
