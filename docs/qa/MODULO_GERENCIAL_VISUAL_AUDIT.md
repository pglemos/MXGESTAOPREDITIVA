# Auditoria visual — Módulo Gerencial

Data: 2026-07-12

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
| Fechamento Diário | sidebar, cards e tabela sem sobreposição | cards empilhados e tabela com scroll controlado | aprovado | Agenda D+1, cobrança, regularização e correção auditável | aprovado |
| Rotina da Equipe | cards, tabela e ações sem clipping | título e navegação mobile corrigidos | aprovado | detalhe do vendedor e cobrança sobre Central de Execução | aprovado |
| Minha Equipe | cards de performance e busca | card 1:1 e CTA de perfil legível | aprovado | perfil em cinco abas | aprovado |
| Meta, Mentor e Ranking | grid e densidade consistentes | controles empilhados sem perder ações | aprovado | regras/fontes oficiais MX | aprovado |
| Feedbacks/PDIs | KPIs, navegação e conteúdo sem header duplicado | três abas e ações legíveis | aprovado | feedback, PDI e agenda persistidos | aprovado |
| Universidade MX | tabs, controles e conteúdo separados | tabs e busca sem card gigante/clipping | aprovado | equipe, matriz e trilha; nenhum `NaN` | aprovado |

## Correções aplicadas durante a auditoria

- Capturas inicialmente feitas durante o fallback foram rejeitadas e recapturadas após esperar o heading real.
- Título mobile alterado de “Rotina do Dia” para “Rotina da Equipe”.
- Navegação inferior do gerente deixou de apontar para rotas do vendedor.
- Os nove itens permanecem acessíveis pelo drawer mobile.

## Referência Base44

O Base44 autenticado foi auditado ao vivo para inventário de telas, cards, ações e fluxos. A implementação copia o contrato de composição e funcionalidade, mas mantém deliberadamente autenticação, Supabase, RLS, regras configuráveis e dados reais do MX. Dados demo, `localStorage`, números fixos e bugs da referência não foram importados.

## Homologação de produção

- Alias: `https://mxperformance.vercel.app`
- Deployment funcional: `dpl_46UfPmzj6x84vnjADRtYsKKBRDzL`
- Login real de gerente e 4/4 testes E2E aprovados após a promoção do alias.
- Nove rotas recapturadas em 1440×900 e 390×844 após reload e conteúdo exclusivo carregado.
- HTTP 200 nas entradas públicas verificadas e nenhuma exceção JavaScript nas nove telas.
- Único aviso de console: Sentry sem `VITE_SENTRY_DSN`, configuração de observabilidade independente do módulo gerencial.
