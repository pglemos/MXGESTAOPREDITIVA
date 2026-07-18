# Story OWNER-20260718 — Paridade integrada do módulo Dono com Base44

## Status

In Progress

## Contexto

O aplicativo Base44 `6a593eaeb2d720b667d3d5c3` contém uma referência visual e funcional extensa para o ambiente Dono. O MX Performance de produção já possui autenticação, multi-loja, RBAC, shell, dashboard, Planejamento Estratégico, Plano de Ação, alertas, agenda, departamentos, consultoria e persistência canônica no Supabase.

A implementação não deve importar `@base44/sdk`, criar uma segunda árvore de rotas nem replicar entidades locais. A referência Base44 deve ser adaptada ao domínio canônico existente.

## Objetivo

Reproduzir a arquitetura de informação, hierarquia visual e fluxos executivos do Base44 no módulo Dono, preservando o shell e a integração atual com Supabase, Vercel, Gerente e Vendedor.

## Requisitos funcionais

- [ ] Navegação do Dono organizada em Gestão, Estratégia, Negócio, Desenvolvimento e Ação Global.
- [ ] Início com previsão de vendas de hoje, lucro bruto, volume, estoque, MX Score, meta, intervenção prioritária, agenda, alertas e departamentos.
- [ ] Central de Decisões derivada de alertas e planos de ação existentes, sem tabela duplicada.
- [ ] Planejamento Estratégico consumindo `catalogo_indicadores_planejamento` e `valores_indicadores_planejamento`.
- [ ] Plano de Ação consumindo `planos_acao`, `historico_planos_acao` e `evidencias_planos_acao`.
- [ ] Consultoria consumindo visitas e agenda de consultoria existentes.
- [ ] Departamentos, Mercado e Universidade reutilizando módulos existentes.
- [ ] Falar com Consultor reutilizando o fluxo existente e recebendo contexto da tela.

## Restrições

- Não alterar comportamento dos módulos Gerente e Vendedor.
- Não criar entidades equivalentes às já existentes.
- Não importar dependências Base44 em produção.
- Não usar localStorage como fonte oficial de dados de negócio.
- Não expor dados de lojas fora do escopo autorizado.
- Não remover rotas ou query strings compatíveis existentes.

## Critérios de aceite

- [ ] Um único item ativo na sidebar em cada seção do Dono.
- [ ] Todos os módulos do Dono funcionam dentro da rota canônica da loja.
- [ ] Sem overflow horizontal em 390, 768, 1024 e 1440 px.
- [ ] Estados de loading, vazio, erro e dados demonstrativos são explícitos.
- [ ] Build, typecheck, lint e testes passam.
- [ ] Supabase permanece sem tabelas duplicadas.
- [ ] Produção Vercel publica a revisão do `main`.

## File list

Será preenchida após a implementação e validação final.
