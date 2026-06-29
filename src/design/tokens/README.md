# MX Design Tokens

Fonte de verdade de design para a camada `src/design`.

## Cores

`mx-action` é a cor de foco e ação primária. `mx-teal` é a cor de apoio da marca.
`mx-muted` e `mx-subtle` são apenas para texto secundário; não usar em informação crítica.

## Acessibilidade

- Texto principal usa `mx-text` sobre `mx-surface` ou `mx-bg`.
- Focus ring usa `mx-action`.
- Estados disabled mantêm contraste com texto em `mx-text` e opacidade moderada.
- Aliases antigos de rosa/purple são legado e apontam para `mx-action`.

## Motion

Tokens de movimento vivem em `src/design/motion`.
Todo componente motion deve respeitar `prefers-reduced-motion`.
