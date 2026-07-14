# Auditoria visual — Módulo Gerencial

Data: 2026-07-12

> Documento histórico. Os resultados desta captura foram supersedidos pela auditoria de 2026-07-14 em `MODULO_GERENCIAL_FINAL_REPORT.md`; os rótulos `aprovado` abaixo não representam o gate atual do módulo.

## Evidências MX

Capturas renderizadas com login real de gerente em `output/playwright/manager-design/final/`:

- nove páginas em `*-desktop-1440.png` (1440×900);
- nove páginas em `*-mobile-390.png` (390×844);
- `contact-sheet-desktop.png` e `contact-sheet-mobile.png` para revisão conjunta.

Cada captura exige reload e conteúdo exclusivo da página; header, sidebar, skeleton e fallback não contam como carregamento concluído.

## Resultado

| Página | Desktop/notebook | Tablet/mobile | Hierarquia e tokens | Ações/dados | Resultado |
|---|---|---|---|---|---|
| Início | hero, meta, ritmo, prioridades e equipe | composição escura empilhada sem clipping | aprovado | dados reais e CTAs canônicos | aprovado |
| Fechamento Diário | **REABERTO:** largura, hierarquia, gráfico e densidade divergiam do Base44 | pendente de nova recaptura após remediação | **em remediação** | cobrança não possuía a confirmação exigida pela referência; Agenda e modais tinham dimensões/overlay divergentes | **reprovado em 2026-07-12** |
| Rotina da Equipe | cards, tabela e ações sem clipping | título e navegação mobile corrigidos | aprovado | detalhe do vendedor e cobrança sobre Central de Execução | aprovado |
| Minha Equipe | cards de performance e busca | card 1:1 e CTA de perfil legível | aprovado | perfil em cinco abas | aprovado |
| Meta, Mentor e Ranking | grid e densidade consistentes | controles empilhados sem perder ações | aprovado | regras/fontes oficiais MX | aprovado |
| Feedbacks/PDIs | KPIs, navegação e conteúdo sem header duplicado | três abas e ações legíveis | aprovado | feedback, PDI e agenda persistidos | aprovado |
| Universidade MX | tabs, controles e conteúdo separados | tabs e busca sem card gigante/clipping | aprovado | equipe, matriz e trilha; nenhum `NaN` | aprovado |

## Correções aplicadas durante a auditoria

- A aprovação anterior do Fechamento Diário foi invalidada após revisão do usuário com cinco capturas autenticadas. Medir um card isolado não comprova paridade da tela; o gate agora exige página completa e os estados Agenda D+1, Cobrança, Conferência de Leads e Histórico no mesmo viewport da referência.

- Capturas inicialmente feitas durante o fallback foram rejeitadas e recapturadas após esperar o heading real.
- Título mobile alterado de “Rotina do Dia” para “Rotina da Equipe”.
- Navegação inferior do gerente deixou de apontar para rotas do vendedor.
- Os nove itens permanecem acessíveis pelo drawer mobile.

## Referência Base44

O Base44 autenticado foi auditado ao vivo para inventário de telas, cards, ações e fluxos. A implementação copia o contrato de composição e funcionalidade, mas mantém deliberadamente autenticação, Supabase, RLS, regras configuráveis e dados reais do MX. Dados demo, `localStorage`, números fixos e bugs da referência não foram importados.

## Homologação de produção

- Alias: `https://mxperformance.vercel.app`
- Deployment funcional: `dpl_46UfPmzj6x84vnjADRtYsKKBRDzL`
- Na execução histórica, login real de gerente e 4/4 testes E2E foram registrados após a promoção do alias; a reexecução de 2026-07-14 passou em Chromium `5/5` e mobile-chrome `5/5`. O documento continua histórico e não substitui a matriz final.
- Nove rotas recapturadas em 1440×900 e 390×844 após reload e conteúdo exclusivo carregado.
- HTTP 200 nas entradas públicas verificadas e nenhuma exceção JavaScript nas nove telas.
- Único aviso de console: Sentry sem `VITE_SENTRY_DSN`, configuração de observabilidade independente do módulo gerencial.
