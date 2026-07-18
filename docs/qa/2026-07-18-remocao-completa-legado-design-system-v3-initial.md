# Diagnóstico e implementação — Remoção completa do legado visual V3

## Evidência confirmada

A auditoria anterior não cobria o sistema completo. O teste visual autenticado verificava somente uma rota por perfil e três padrões de seletor legado.

A auditoria V3 passou a cobrir 38 superfícies dos perfis Administrador Geral, Admin MX, Consultor MX e Dono, incluindo 237 dependências alcançáveis e 170 arquivos exclusivos do conjunto gerencial.

## Causa-raiz confirmada

A divergência era causada pela combinação de:

1. validação centrada no shell e no primeiro header visível;
2. ausência de inventário executável de rotas por perfil;
3. detector de legado limitado a nomes antigos específicos;
4. páginas reais ainda importando primitives, tokens ou composições anteriores;
5. componentes compartilhados mantendo defaults do design antigo;
6. `manager-visual-scope.css` remapeando tokens legados e mascarando a origem dos componentes;
7. falta de interação com filtros, modais, drawers, tabelas e estados secundários.

## RED

O primeiro ledger integral identificou 4.733 violações visuais em dependências exclusivas das rotas de gestão.

Foram detectados, entre outros:

- espaçamentos `*-mx-*`;
- raios `rounded-mx-*`;
- sombras `shadow-mx-*`;
- tokens `text-text-*`, `bg-surface-*` e `border-border-*`;
- ações `brand-primary`, `mx-action` e `mx-teal` fora da matriz canônica;
- wrappers `mxds-*` e `mx-internal-*`;
- componentes compartilhados sem isolamento entre Vendedor e Gestão.

## Implementação aplicada

- Criado manifesto executável com 38 superfícies de gestão.
- Criado auditor estático do grafo de imports, classes e tokens.
- Criado contexto visual explícito para separar Vendedor e Gestão.
- Migrados componentes compartilhados, páginas e features para a matriz canônica.
- Removida a camada de compatibilidade que apenas reinterpretava tokens antigos.
- Adicionada matriz Playwright para rotas reais em desktop e mobile.
- Preservados dados, hooks, queries, contratos, RBAC e funcionalidades.

## GREEN estático

Após a transformação:

- 38 superfícies inventariadas;
- 237 dependências alcançáveis;
- 170 arquivos exclusivos auditados;
- 0 violações no ledger estático;
- snapshot pós-aplicação idêntico byte a byte à implementação local validada.

## Próximos gates obrigatórios

- TypeScript;
- testes unitários;
- ESLint e acessibilidade;
- build de produção e bundle budget;
- Atomic Design;
- paridade estrutural;
- matriz Playwright em desktop e mobile;
- revisão manual dos screenshots;
- preview Vercel READY;
- confirmação Supabase sem mutações.

Nenhuma alteração de schema, migration, RPC, trigger, Edge Function, Auth, Storage ou RLS do Supabase foi aplicada.
