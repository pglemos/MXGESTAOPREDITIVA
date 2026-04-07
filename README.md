# MX Gestão Preditiva

Sistema operacional de gestão preditiva para acompanhamento de performance comercial em lojas automotivas, com foco em rituais da Metodologia MX: lançamento diário, funil 20/60/33, ranking, feedback estruturado, PDI, treinamentos, relatórios recorrentes e reprocessamento de dados.

[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3FCF8E?style=flat-square&logo=supabase)](https://supabase.com/)

## Identidade Do Projeto

- Nome do produto: `MX Gestão Preditiva`
- Repositório GitHub: `https://github.com/pglemos/MXGESTAOPREDITIVA`
- Projeto Vercel: `mxgestaopreditiva`
- Vercel Project ID: `prj_fpYjxc851kMs55GzR6tgQEr7uWUj`
- Stack principal: React 19, Vite 6, TypeScript, Supabase, Tailwind CSS 4, Radix UI, Recharts, Motion e Sonner

## O Que Este Projeto Faz

O aplicativo organiza a rotina de vendas por papel operacional:

- Vendedor registra o ritual diário, acompanha histórico, ranking, feedback, PDI, treinamentos e notificações.
- Gerente acompanha painel da loja, equipe, metas, funil, ranking, feedback, PDI, treinamentos e rotina gerencial.
- Dono acompanha suas lojas, performance, metas, funil, relatórios, feedbacks e PDIs da equipe como visão executiva, sem operar a rotina diária.
- Admin representa a MX Gestão Preditiva, com governança total sobre lojas, usuários, metas, benchmarks, treinamentos, produtos digitais, notificações, relatórios, reprocessamento, feedback e PDI.

O código também mantém módulos legados isolados sob `/legacy`, para que funcionalidades antigas continuem acessíveis sem confundir a navegação principal da Metodologia MX.

## Módulos Principais

- Autenticação e autorização por Supabase Auth, tabela `users`, tabela `memberships` e papéis oficiais: `admin`, `dono`, `gerente`, `vendedor`. O alias legado `consultor` é normalizado para `admin`.
- Check-in diário em `daily_checkins`, com data de referência, submissão e métricas de leads, agendamentos, visitas e vendas.
- Painel da loja, painel executivo do dono e painel global do admin com leitura consolidada por loja e por equipe.
- Ranking por vendedor com métricas de vendas, leads, agendamentos, visitas, meta, atingimento e projeção.
- Funil MX com diagnóstico por gargalo usando benchmarks 20/60/33.
- Metas por loja e vendedor em `goals`, com regras em `store_meta_rules`.
- Feedback semanal estruturado em `feedbacks`, com ciência do vendedor.
- PDI 2.0 em `pdis` e `pdi_reviews`, incluindo radar de competências, metas de 6/12/24 meses e plano de ações.
- Treinamentos em `trainings` e `training_progress`, com progresso por público-alvo e relação com gargalos do funil.
- Notificações em `notifications`, incluindo marcação de leitura, exclusão e envio interno.
- Reprocessamento e auditoria operacional em `reprocess_logs` e `audit_logs`.
- Relatórios recorrentes por Supabase Edge Functions: matinal, semanal e mensal.

## Rotas

Rotas públicas:

- `/login`
- `/privacy`
- `/terms`

Rotas protegidas principais:

- `/home`: home do vendedor
- `/checkin`: lançamento diário
- `/historico`: histórico do vendedor
- `/ranking`: ranking
- `/feedback`: feedback por papel
- `/pdi`: PDI por papel
- `/pdi/:id/print`: impressão do PDI
- `/treinamentos`: treinamentos por papel
- `/notificacoes`: notificações por papel
- `/perfil`: perfil do usuário
- `/loja`: painel da loja
- `/equipe`: equipe
- `/metas`: gestão de metas
- `/funil`: funil operacional
- `/rotina`: rotina do gerente
- `/painel`: painel global do admin
- `/lojas`: gestão de lojas para admin e minhas lojas para dono
- `/produtos`: produtos digitais
- `/configuracoes`: configurações
- `/configuracoes/reprocessamento`: reprocessamento
- `/relatorio-matinal`: relatório matinal
- `/auditoria`: diagnóstico/auditoria

Rotas legadas isoladas sob `/legacy`:

- `/legacy/agenda`
- `/legacy/configuracoes/comissoes`
- `/legacy/communication`
- `/legacy/relatorios/vendas-cruzados`
- `/legacy/financeiro`
- `/legacy/inventory`
- `/legacy/leadops`
- `/legacy/leads`
- `/legacy/reports`
- `/legacy/reports/stock`
- `/legacy/relatorios/performance-vendas`
- `/legacy/relatorios/performance-vendedores`
- `/legacy/tarefas`
- `/legacy/gamification`
- `/legacy/activities`

## Arquitetura

- `src/App.tsx`: roteamento, lazy loading e seleção de telas por papel.
- `src/components/Layout.tsx`: shell autenticado, navegação lateral, header e navegação mobile.
- `src/components/ui/`: componentes base Radix/shadcn-like usados na interface.
- `src/hooks/useAuth.tsx`: sessão Supabase, perfil, membership, papel e loja ativa.
- `src/hooks/useData.ts`: treinamentos, feedback, PDI, notificações e comissões.
- `src/hooks/useCheckins.ts`, `src/hooks/useRanking.ts`, `src/hooks/useGoals.ts`, `src/hooks/useTeam.ts`: hooks operacionais por domínio.
- `src/lib/supabase.ts`: cliente Supabase com validação de `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- `src/lib/calculations.ts`: cálculos de funil e diagnóstico MX.
- `src/types/database.ts`: tipos canônicos usados pela aplicação principal.
- `src/pages/`: telas por papel e módulos legados.
- `supabase/migrations/`: schema, RLS, views, crons e ajustes de dados.
- `supabase/functions/`: Edge Functions de relatórios.
- `whatsapp-service/`: serviço Express separado para integração WhatsApp local/auxiliar.

## Banco E Supabase

O domínio operacional usa Supabase como backend:

- Auth: usuários autenticados via Supabase Auth.
- Dados canônicos: `stores`, `memberships`, `daily_checkins`, `goals`, `feedbacks`, `pdis`, `pdi_reviews`, `trainings`, `training_progress`, `notifications`, `audit_logs`, `reprocess_logs`.
- Regras por loja: `store_benchmarks`, `store_delivery_rules`, `store_meta_rules`.
- Segurança: migrações de RLS em `supabase/migrations`, incluindo hardening e normalização final.
- Automação: funções e crons para `relatorio-matinal`, `feedback-semanal` e `relatorio-mensal`.

## Requisitos

- Node.js `>=20`
- npm
- Bun, para executar a suíte de testes atual
- Conta/projeto Supabase configurado
- Vercel CLI local já instalado como dependência de desenvolvimento

## Configuração Local

1. Instale dependências:

```bash
npm install
```

2. Crie `.env` a partir do exemplo:

```bash
cp .env.example .env
```

3. Preencha no mínimo:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

4. Rode o app:

```bash
npm run dev
```

O servidor Vite usa `0.0.0.0:3000` por padrão.

## Scripts

- `npm run dev`: inicia o Vite em `0.0.0.0:3000`.
- `npm run build`: gera build de produção em `dist`.
- `npm run preview`: serve o build localmente.
- `npm run clean`: remove `dist`.
- `npm run lint`: executa `tsc --noEmit`.
- `npm run typecheck`: alias explícito para `tsc --noEmit`.
- `npm test`: executa `bun test src`.
- `npm run deploy`: executa `vercel --prod`.
- `npm run fix:admin-access`: executa script operacional de ajuste de acesso admin.

## Deploy

O deploy principal é Vercel:

- Projeto: `mxgestaopreditiva`
- Project ID: `prj_fpYjxc851kMs55GzR6tgQEr7uWUj`
- Framework: Vite
- Build command: `npm run build`
- Output: `dist`
- Repositório conectado: `pglemos/MXGESTAOPREDITIVA`
- Branch de produção: `main`

O projeto deve usar a identidade `MX Gestão Preditiva` e o slug `mxgestaopreditiva` em documentação, scripts e configurações novas.

## Qualidade

Antes de concluir alterações, use:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Observação: o AGENTS.md do projeto exige também atualização de story quando houver desenvolvimento funcional. Para alterações documentais e metadados, registre claramente os arquivos alterados no resumo final.

## Estado Conhecido

- A aplicação principal usa Supabase real e não Gemini.
- `vite.config.ts` não injeta mais `GEMINI_API_KEY`.
- Scripts, relatórios e documentação foram padronizados para `mxgestaopreditiva`.
- Os módulos sob `/legacy` existem para compatibilidade e não devem ser confundidos com o fluxo operacional principal da Metodologia MX.
- `whatsapp-service/` é um serviço auxiliar separado; não faz parte do bundle Vite principal.

## Arquitetura de Dados Canônica (D-1/D-0)

O sistema opera sob o **Modelo de Vigência MX**, onde a produção é consolidada em **D-1** e os compromissos são firmados para **D-0 (Hoje)**.

### Tabelas Principais (Auditáveis)
- **`store_sellers`**: Vigência operacional dos especialistas (Início/Fim/Ativo).
- **`daily_checkins`**: Única fonte de verdade para produção. Armazena métricas de Ontem (D-1) e Hoje (D-0).
- **`store_meta_rules` / `store_delivery_rules` / `store_benchmarks`**: Regras de governança por unidade. Substituem as colunas legadas da tabela `stores`.
- **`view_daily_team_status`**: View de governança para identificação em tempo real de **Sem Registro** (D-1).

### Fluxo Operacional
1. **Check-in (09:30)**: Vendedor registra produção D-1 e agenda D-0.
2. **Command Center (09:45)**: Gerente audita a grade, cobra pendentes e valida agendas.
3. **Matinal Oficial (10:30)**: Disparo automático (Cron) de relatório XLSX para diretoria via Edge Function.
4. **Feedback Semanal**: Ritual único por vendedor garantido por constraint de unicidade.

---

## Auditoria Final (EPIC-01 a EPIC-05) - Status: 100%

Após o hardening realizado, os seguintes bloqueadores foram eliminados:
- [x] **EPIC-01**: Migrations/RLS consolidadas; `stores.manager_email` removido; View canônica implementada.
- [x] **EPIC-02**: "Sem Registro" fechado sistemicamente via View; Fluxos de vigência validados.
- [x] **EPIC-03**: Dashboard com grade de alta densidade ("Bruta"), métricas de conversão e filtro universal.
- [x] **EPIC-04**: Cobrança em massa via WhatsApp e notificações internas integrada ao Command Center.
- [x] **EPIC-05**: Motor de relatório gera **XLSX** real; Cron 10:30 configurado e comprovado; Zero resquício híbrido.

## Licença E Propriedade

Projeto privado de operação MX/Synvolt no GitHub/Vercel indicados acima. Ajuste esta seção caso seja necessária uma licença formal.
