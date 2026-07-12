# Paridade visual Gerente versus Vendedor

Estado inicial em 2026-07-11. Medidas renderizadas e screenshots serão acrescentados por viewport durante o ciclo de cada tela.

| Tela gerencial | Referência vendedor | Shell | Header | Grid | Cards | Tipografia | Tokens | Ícones | Estados | Mobile | Gap | Ação |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Fechamento Diário | Base44 `/fechamento-equipe` | igual | equivalente | assimétrico 4x | operacionais | equivalente | aprovado | equivalentes | reais | aprovado | fechado | homologar produção |
| Rotina da Equipe | Central de Execução | igual | básico | uniforme | genéricos | parcial | parcial | básicos | placeholder | fraco | crítico | refatorar segundo |
| Início | Meu Dia | igual | parcial | dashboard legado | heterogêneos | parcial | parcial | parcial | parcial | revisar | alto | refatorar terceiro |
| Mentor Gerencial | Consultor/insights | igual | básico | documental | genéricos | parcial | parcial | poucos | parcial | revisar | crítico | refatorar quarto |
| Minha Equipe | Carteira + Ranking | igual | legado | legado | legado | parcial | parcial | parcial | parcial | revisar | alto | alinhar quinto |
| Meta da Loja | Meu Dia + Funil | igual | legado | legado | legado | parcial | parcial | parcial | parcial | revisar | alto | alinhar sexto |
| Feedbacks e PDIs | Feedback/PDI | igual | parcial | funcional | funcional | parcial | parcial | parcial | real | revisar | médio | alinhar sétimo |
| Ranking | Ranking | igual | parcial | funcional | funcional | parcial | parcial | parcial | real | revisar | médio | alinhar oitavo |
| Universidade MX | Universidade | igual | parcial | funcional | funcional | parcial | parcial | parcial | real | revisar | médio | alinhar nono |

## Comparação estrutural inicial

| Critério | Vendedor aprovado | Gerente atual |
|---|---|---|
| composição | grids assimétricos conforme conteúdo | `PageHeading + cards uniformes + tabela` |
| hierarquia | hero, KPI, progresso, ação e detalhe | KPIs com o mesmo peso |
| densidade | informação compacta com respiro de seção | vazios amplos e tabela isolada |
| estados | semântica por cor, ícone, texto e progresso | badges/textos básicos |
| mobile | cards/listas refluem por prioridade | tabela depende de scroll horizontal |
| produto | linguagem operacional própria do MX | aparência de painel administrativo genérico |

## Auditoria renderizada — 2026-07-11

Validação executada no Chrome DevTools MCP com login real de vendedor e gerente. Evidências em `output/playwright/manager-design/`.

- Referências capturadas: Home e Fechamento Diário do vendedor em 1440×900.
- Gerente capturado: nove rotas em 1440×900 e 390×844.
- As nove rotas renderizaram conteúdo significativo sem warnings ou errors no console.
- Interação comprovada: `Fechamento Diário -> Ver Agenda D+1 -> dialog Agenda D+1`, com filtros reais de vendedor, canal e tipo.
- Home vendedor possui linguagem dark especializada em remuneração; Fechamento vendedor usa a família light canônica. A paridade deve seguir a referência de cada superfície, não aplicar dark indiscriminadamente.

### Correções desta rodada

- 2026-07-12: Fechamento Diário ganhou filtros de data/unidade/vendedor, resumo assimétrico, barra de ações, histórico 7/15/30 dias, comparativo sem dados inventados e resumo oficial por canal; Aprovar/Recusar, Agenda D+1, cobrança e correção de leads foram preservados.
- `PageHeading`: escala mobile reduzida, subtítulo mais legível e spacing responsivo.
- `ManagerMetricCard`: densidade mobile reduzida sem perder touch targets.
- Fechamento Diário: cards semânticos, gauge, faixa de ação, tabela premium e mobile recapturado.
- Rotina da Equipe: migrou dos cards genéricos para os primitives compartilhados, ganhou contexto por métrica, container canônico e hover de linhas.
- Mentor Gerencial: deixou o aspecto documental; recebeu hero operacional, hierarquia, categorias, numeração e CTAs.

### Observação de captura

Após mudança de viewport, o Chrome precisa recarregar a rota antes da captura. Sem reload, o shell pode conservar medidas do viewport anterior e produzir clipping falso; as evidências finais usam reload e espera por conteúdo significativo.
