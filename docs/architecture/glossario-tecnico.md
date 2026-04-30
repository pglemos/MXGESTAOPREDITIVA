# Glossario Tecnico MX

Este documento e a fonte obrigatoria para nomenclatura tecnica do sistema MX.

## Regras

- Codigo, banco, rotas e nomes tecnicos usam portugues sem acento.
- Textos de interface usam portugues com acento normalmente.
- Siglas consolidadas podem permanecer: MX, PMR, PDI, DRE, ROI, RTA.
- Nomes de fornecedores e marcas permanecem originais: Google Calendar, Supabase, Vercel.
- Novos modulos devem consultar este glossario antes de criar tabelas, hooks, rotas, arquivos ou labels.

## Papeis canonicos

| Papel tecnico | Texto de interface | Uso |
| --- | --- | --- |
| `administrador_geral` | Administrador Geral | Governanca maxima da plataforma MX |
| `administrador_mx` | Administrador MX | Operacao interna MX com acesso amplo |
| `consultor_mx` | Consultor MX | Acompanhamento de clientes com restricoes sensiveis |
| `dono` | Dono da loja | Visao das proprias lojas |
| `gerente` | Gerente | Gestao da equipe da propria loja |
| `vendedor` | Vendedor | Lancamentos, metas e evolucao propria |

## Tabelas canonicas

| Nome legado | Nome canonico |
| --- | --- |
| `users` | `usuarios` |
| `stores` | `lojas` |
| `memberships` | `vinculos_loja` |
| `store_sellers` | `vendedores_loja` |
| `daily_checkins` | `lancamentos_diarios` |
| `trainings` | `treinamentos` |
| `training_progress` | `progresso_treinamentos` |
| `consulting_clients` | `clientes_consultoria` |
| `consulting_visits` | `visitas_consultoria` |
| `consulting_action_items` | `itens_plano_acao` |
| `consulting_strategic_plans` | `planejamentos_estrategicos` |
| `consulting_financials` | `financeiro_consultoria` |
| `goals` | `metas` |
| `goal_logs` | `historico_metas` |
| `audit_logs` | `logs_auditoria` |

## Rotas canonicas

| Rota legada | Rota canonica |
| --- | --- |
| `/checkin` | `/lancamento-diario` |
| `/ranking` | `/classificacao` |
| `/feedback` | `/devolutivas` |
| `/dashboard` | `/painel` |
| `/training` | `/treinamentos` |

## Termos de interface

| Evitar | Usar |
| --- | --- |
| Check-in | Lancamento Diario |
| Ranking | Classificacao |
| Feedback | Devolutiva |
| Dashboard | Painel |
| Store | Loja |
| Seller | Vendedor |
| Goal | Meta |
| Training | Treinamento |
| Attachment | Evidencia ou documento |
