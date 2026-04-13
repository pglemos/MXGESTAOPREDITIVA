# PRD - CRM de Consultoria MX

Status: rascunho para validacao
Data: 2026-04-13
Workflow: `brownfield-fullstack`
Base tecnica: `docs/architecture/mx-consultoria-crm-brownfield-impact.md`
Base de negocio: `docs/prd/mx-consultoria-crm-analysis.md`

## 1. Analise e contexto

### 1.1 Fonte da analise

- Analise documental dos arquivos em `output/analysis/mx-feature-20260413/`.
- Analise da transcricao em RTF da ligacao.
- Analise brownfield do projeto atual: `README.md`, `PRD_MX_PERFORMANCE_90D.md`, `docs/architecture/system-architecture.md`, `src/App.tsx`, `src/types/database.ts`, `supabase/migrations` e `supabase/functions`.

Os audios `.m4a` ainda nao foram transcritos diretamente por falta de `OPENAI_API_KEY`; o RTF foi usado como fonte textual da ligacao.

### 1.2 Estado atual do projeto

O `MX PERFORMANCE` e um sistema React/Vite/Supabase para gestao de performance comercial de lojas automotivas. O produto atual cobre check-in diario, metas, funil, ranking, feedback, PDI, treinamentos, notificacoes, relatorios e auditoria operacional.

O produto atual nao possui CRM interno de consultoria, execucao estruturada de visitas PMR, Google Agenda/Meet, DRE financeiro, estoque de consultoria ou anexos por visita como dominios canonicos.

### 1.3 Escopo da mudanca

Tipo de enhancement:

- [x] New Feature Addition
- [x] Major Feature Modification
- [x] Integration with New Systems
- [x] UI/UX Expansion
- [x] Major Impact - architectural changes required

Descricao:

Criar um CRM interno da MX Consultoria para administrar clientes da consultoria, agenda, visitas PMR, evidencias, documentos, financeiro/DRE, estoque, leads, PDI, treinamentos, eventos e BI. O modulo deve preservar o sistema operacional atual e entrar como um contexto novo de `consultoria`.

### 1.4 Objetivos

- Centralizar a carteira de clientes da MX Consultoria.
- Padronizar visitas PMR de 1 a 7 com objetivo, checklist, evidencia e relatorio.
- Dar continuidade entre consultores sem depender de memoria individual, WhatsApp ou documentos soltos.
- Sincronizar agenda de visitas, aulas e eventos com Google Agenda/Meet.
- Criar base para financeiro/DRE, estoque, leads, PDI e treinamentos por cliente.
- Transformar arquivos atuais em base importavel e auditavel.
- Manter o app atual de performance funcionando sem regressao.

### 1.5 Contexto de negocio

Hoje a MX usa planilhas, documentos, WhatsApp, relatorios e sistemas diferentes para acompanhar consultorias. Isso cria perda de informacao, conflito de agenda, dificuldade de continuidade entre consultores e pouca visibilidade gerencial da propria MX.

O novo modulo deve ser o CRM da consultoria, nao necessariamente o CRM comercial da loja. A loja pode continuar usando seu CRM operacional, enquanto a MX centraliza dados, historico, execucao do metodo e prestacao de contas.

## 2. Requisitos funcionais

FR1: O sistema deve permitir cadastrar clientes da consultoria com nome, produto contratado, dados cadastrais, contatos, unidades, status, consultor responsavel e consultor auxiliar.

FR2: O sistema deve permitir que a MX visualize todos os clientes da consultoria em uma visao master.

FR3: O sistema deve permitir que consultores autorizados acessem o historico completo necessario para dar continuidade ao atendimento.

FR4: O sistema deve registrar historico de visitas, documentos, feedbacks, anexos, pendencias e evidencias por cliente.

FR5: O sistema deve importar ou cadastrar a agenda de consultoria com visita, cliente, produto, data, hora, duracao, modalidade, consultor responsavel, consultor auxiliar, alvo, motivo e ID do Google Agenda.

FR6: O sistema deve suportar visitas, eventos online, eventos presenciais, aulas e bloqueios de agenda.

FR7: O sistema deve sincronizar criacao, atualizacao e troca de consultor com Google Agenda/Meet, mantendo rastreabilidade de `google_event_id`.

FR8: O sistema deve prevenir ou limpar eventos duplicados de agenda.

FR9: O sistema deve transformar os objetivos de visita PMR em templates operacionais de visitas.

FR10: Cada visita PMR deve ter objetivo, tempo, alvo, checklist, evidencias, modelo de relatorio e momento de venda quando aplicavel.

FR11: Ao abrir uma visita agendada, o consultor deve ver o fluxo correto da visita atual e as pendencias/historico das visitas anteriores.

FR12: O sistema deve permitir preencher online a execucao da visita, marcar etapas, registrar observacoes e anexar evidencias.

FR13: O sistema deve exigir evidencia quando a etapa pedir foto, print, formulario preenchido, documento assinado ou relatorio.

FR14: O sistema deve gerar ou alimentar relatorio padrao de visita com os dados preenchidos.

FR15: O sistema deve permitir anexar diagnosticos executivos, PMRs, relatorios, planilhas e documentos ao cliente e/ou visita.

FR16: O sistema deve modelar DRE por cliente e periodo com receitas, margem, despesas, lucro, volume, ticket, margem por carro, custo por carro, capital e rentabilidade.

FR17: O sistema deve importar DRE de planilha com validacao de erros de formula e campos obrigatorios.

FR18: O sistema deve registrar indicadores de leads por midia: recebidos, pendentes, andamento, agendados, finalizados, sucesso e insucesso.

FR19: O sistema deve sinalizar lead sem atendimento correto, SLA quebrado ou atendimento fora do CRM quando a informacao estiver disponivel.

FR20: O sistema deve importar estoque e classificar veiculos por venda, repasse, uso pessoal, preparacao e vendido.

FR21: O sistema deve sinalizar veiculos acima de 90 dias e calcular tempo medio de estoque.

FR22: O sistema deve vincular PDI a cliente, vendedor/gerente, metas 6/12/24 meses, responsaveis, prazos, evidencias e assinatura quando aplicavel.

FR23: O sistema deve vincular treinamentos, aulas e eventos a clientes, papeis e gargalos identificados.

FR24: O sistema deve exibir BI de evolucao do cliente com vendas, metas, leads, financeiro, estoque, PDI, treinamentos, visitas e pendencias.

FR25: O sistema deve suportar migracao gradual dos clientes, sem exigir que todos os 35 sejam ativados no primeiro uso.

## 3. Requisitos nao funcionais

NFR1: O novo modulo nao deve quebrar as rotas atuais de performance: `/painel`, `/lojas`, `/loja`, `/checkin`, `/funil`, `/ranking`, `/feedback`, `/pdi`, `/treinamentos` e relatorios.

NFR2: O novo dominio deve usar TypeScript estrito e seguir os padroes existentes de hooks, paginas, componentes e tipos canonicos.

NFR3: O acesso a financeiro, documentos e dados de clientes deve respeitar RLS antes da exposicao em UI.

NFR4: Importacoes devem usar staging/validacao antes de gravar dados definitivos.

NFR5: Sincronizacao Google Agenda deve registrar logs de sucesso, erro, duplicidade e ultima sincronizacao.

NFR6: Dados financeiros e anexos devem manter trilha de auditoria.

NFR7: O modulo deve ser testavel por unidade, integracao e fluxo e2e.

NFR8: A UI deve reaproveitar o design system existente e nao criar um app visual paralelo.

NFR9: O sistema deve permitir rollback ou desativacao do modulo de consultoria sem remover o core atual.

NFR10: Performance de listagem deve considerar crescimento para 50 a 80 clientes, multiplas visitas e anexos.

## 4. Requisitos de compatibilidade

CR1: Compatibilidade de autenticacao: manter Supabase Auth, `users`, `memberships` e papeis existentes.

CR2: Compatibilidade de banco: nao substituir `stores` por cliente de consultoria sem migracao planejada; criar contexto separado para evitar regressao em check-ins e relatorios.

CR3: Compatibilidade de UI: novas telas devem entrar no shell autenticado e usar componentes existentes.

CR4: Compatibilidade operacional: relatorios matinal, semanal, mensal, feedback, PDI e treinamentos atuais devem continuar funcionando.

CR5: Compatibilidade de deploy: manter Vite/Vercel/Supabase sem nova infraestrutura obrigatoria fora do escopo aprovado.

## 5. UI e navegacao

Novas telas recomendadas:

- `/consultoria`
- `/consultoria/clientes`
- `/consultoria/clientes/:clientId`
- `/consultoria/agenda`
- `/consultoria/visitas/:visitId`
- `/consultoria/importacoes`
- `/consultoria/financeiro`
- `/consultoria/estoque`
- `/consultoria/bi`

Regras de UI:

- A visao inicial deve ser operacional: clientes, agenda do periodo, visitas pendentes e alertas.
- A tela de cliente deve concentrar dados cadastrais, agenda, visitas, evidencias, financeiro, estoque, leads, PDI, treinamentos e documentos.
- A tela de visita deve abrir diretamente no checklist correto, com historico e pendencias.
- A tela de importacoes deve mostrar arquivos importados, erros, linhas rejeitadas e status de aplicacao.

## 6. Integracao tecnica

### 6.1 Tecnologia existente

Linguagens: TypeScript, SQL.

Frameworks: React 19, Vite 6, React Router 7, Tailwind CSS 4, Radix UI, Recharts.

Banco: Supabase/Postgres com RLS.

Infra: Vercel para frontend, Supabase para backend e Edge Functions.

Dependencias externas novas previstas: Google Calendar API e possivelmente Supabase Storage para anexos.

### 6.2 Estrategia de banco

Criar um bounded context `consultoria` com tabelas novas:

- `consulting_clients`
- `consulting_client_units`
- `consulting_client_contacts`
- `consulting_assignments`
- `consulting_calendar_events`
- `consulting_calendar_sync_logs`
- `pmr_visit_templates`
- `pmr_visit_template_steps`
- `consulting_visits`
- `consulting_visit_steps`
- `consulting_visit_evidence`
- `consulting_documents`
- `consulting_financial_periods`
- `consulting_financial_lines`
- `consulting_financial_imports`
- `consulting_inventory_snapshots`
- `consulting_inventory_items`
- `consulting_lead_imports`
- `consulting_lead_channel_metrics`

### 6.3 Estrategia de frontend

Criar estrutura em `src/features/consultoria`, `src/hooks` e `src/pages` sem misturar com rotas legadas.

Hooks previstos:

- `useConsultingClients`
- `useConsultingAgenda`
- `useConsultingVisits`
- `useConsultingDocuments`
- `useConsultingFinancials`
- `useConsultingInventory`
- `useConsultingLeadMetrics`

### 6.4 Estrategia de integracao externa

Google Agenda/Meet deve ficar em camada backend/Edge Function quando envolver tokens/segredos. A UI deve chamar a operacao de sync e exibir status, nao manipular segredo diretamente.

### 6.5 Estrategia de testes

- Testes de validacao de importacao.
- Testes de RLS para acesso a clientes/documentos/financeiro.
- Testes de hooks e calculos de indicadores.
- E2E minimo: admin cria cliente, importa objetivo, agenda visita, executa checklist e consulta historico.
- Verificacao de regressao: check-in, ranking, funil, feedback, PDI e treinamentos atuais.

## 7. Riscos e mitigacoes

Risco: misturar cliente de consultoria com `stores` e quebrar relatorios atuais.
Mitigacao: criar contexto separado e pontes controladas.

Risco: importar planilhas inconsistentes para tabelas finais.
Mitigacao: staging, preview, validacao e relatorio de erro.

Risco: Google Agenda duplicar eventos.
Mitigacao: chave externa, `google_event_id`, logs e rotina de deduplicacao.

Risco: dados financeiros vazarem entre clientes.
Mitigacao: RLS e testes de isolamento antes da UI.

Risco: escopo ficar grande demais para uma entrega.
Mitigacao: cortar em MVP de fundacao, agenda e visitas antes de financeiro/BI completo.

## 8. Estrutura de epicos e stories

### Epic 1 - Fundacao do CRM de Consultoria

Objetivo: criar o contexto de consultoria sem quebrar o core atual.

Stories:

1. Criar schema base de clientes da consultoria, contatos, unidades e atribuicoes.
2. Criar RLS e testes de isolamento para clientes da consultoria.
3. Criar rotas e tela inicial `/consultoria` para admin/MX.
4. Criar listagem e detalhe de cliente com historico vazio preparado.

Criterios de aceite:

- Cliente pode ser criado e listado.
- Cliente pode ter consultor responsavel e auxiliar.
- Usuario sem permissao nao acessa cliente indevido.
- Rotas atuais continuam funcionando.

### Epic 2 - Agenda de Consultoria

Objetivo: substituir a planilha como fonte operacional da agenda sem perder Google Agenda.

Stories:

1. Criar tabelas de eventos de consultoria.
2. Criar importador da agenda atual.
3. Criar tela `/consultoria/agenda`.
4. Criar sync inicial com Google Agenda/Meet.
5. Criar deduplicacao e logs de sync.

Criterios de aceite:

- Agenda importada preserva cliente, data, hora, consultor, modalidade e ID do evento quando existir.
- Mudanca de data/consultor fica registrada e preparada para sync.
- Eventos duplicados sao detectados.

### Epic 3 - Motor PMR de Visitas

Objetivo: transformar visitas 1-7 em execucao padronizada.

Stories:

1. Criar templates de visitas e etapas a partir do `OBJETIVO_VISITA`.
2. Criar visita vinculada a cliente e evento de agenda.
3. Criar tela de execucao de visita.
4. Criar checklist com evidencias obrigatorias.
5. Criar historico de continuidade entre consultores.
6. Criar geracao/exportacao inicial de relatorio de visita.

Criterios de aceite:

- Visita abre com objetivo/checklist correto.
- Consultor ve visita anterior e pendencias.
- Etapa com evidencia obrigatoria nao fecha sem anexo ou justificativa prevista.

### Epic 4 - Documentos, Diagnosticos e Relatorios

Objetivo: centralizar documentos de consultoria por cliente/visita.

Stories:

1. Criar modelo de documento/anexo.
2. Definir storage e metadados.
3. Importar diagnosticos e PMRs como anexos vinculados.
4. Exibir documentos no detalhe do cliente.

Criterios de aceite:

- Documento tem cliente, tipo, origem, data e usuario.
- Documento pode ser vinculado a visita.
- Acesso respeita RLS.

### Epic 5 - Financeiro/DRE

Objetivo: criar prestacao de contas e analise financeira por cliente.

Stories:

1. Criar schema DRE por cliente/periodo.
2. Criar importador com validacao de `DRE.xlsx`.
3. Criar tela financeira do cliente.
4. Criar indicadores de lucro, margem, ticket, despesas e rentabilidade.

Criterios de aceite:

- Erros como `#VALUE!` sao reportados antes da gravacao final.
- DRE mostra periodos e linhas principais.
- Dados financeiros nao vazam entre clientes.

### Epic 6 - Estoque e Leads

Objetivo: trazer dados de estoque e leads para diagnostico da consultoria.

Stories:

1. Criar importador de estoque.
2. Criar aging e alertas 90+ dias.
3. Criar importador de leads por midia.
4. Criar auditoria de SLA/atendimento quando dados existirem.
5. Exibir estoque/leads no detalhe do cliente.

Criterios de aceite:

- Estoque separa venda, repasse, preparacao e vendido quando informado.
- Veiculos 90+ dias ficam sinalizados.
- Leads por midia batem com totais importados.

### Epic 7 - PDI, Treinamentos e BI

Objetivo: conectar PDI, aulas, eventos e indicadores de evolucao ao cliente.

Stories:

1. Vincular PDI existente ao cliente quando aplicavel.
2. Vincular treinamentos/aulas/eventos a cliente e publico alvo.
3. Criar painel de evolucao do cliente.
4. Criar alertas de pendencias de visita, PDI, treinamento, financeiro e estoque.

Criterios de aceite:

- Cliente mostra progresso PMR e pendencias.
- PDI 6/12/24 meses aparece no contexto correto.
- BI cruza vendas, leads, estoque, financeiro e execucao de visitas.

## 9. Sequencia recomendada de implementacao

1. Epic 1, porque cria a base sem quebrar o sistema atual.
2. Epic 3 parcialmente, para o cliente ja ter visitas e continuidade.
3. Epic 2, para consolidar agenda e Google.
4. Epic 4, porque evidencia/documento e regra central do metodo.
5. Epic 5 e Epic 6, porque financeiro, estoque e leads dependem de importacao segura.
6. Epic 7, consolidando BI e acompanhamento.

## 10. Corte obrigatorio de MVP

O primeiro MVP nao deve tentar entregar todo o CRM de uma vez. O corte inicial aprovado para desenvolvimento deve conter somente:

1. Schema `consulting_*` de clientes, contatos, assignments e auditoria basica.
2. RLS e testes de isolamento.
3. Rotas protegidas `/consultoria` e `/consultoria/clientes`.
4. Tela minima de cadastro/listagem/detalhe de cliente.
5. Importacao ou cadastro manual inicial dos clientes, sem Google Calendar.
6. Verificacao de regressao das rotas atuais do core.

Fora do primeiro MVP:

- Google Calendar/Meet.
- DRE/financeiro.
- Estoque.
- BI completo.
- Importacao definitiva de todos os arquivos.
- Portal do cliente.

Esses itens entram somente depois da fundacao estar verde em lint, typecheck, testes e regressao.

## 11. Regra de rollback por story

Cada story deve declarar:

- Tabelas, rotas e arquivos alterados.
- Como desativar a rota nova sem afetar o core.
- Como reverter a migration, quando aplicavel, ou como marcar a tabela como inativa sem perda de dados.
- Qual teste comprova que `checkin`, `funil`, `ranking`, `feedback`, `pdi` e `treinamentos` continuam funcionando.
- Quais dados importados sao staging e podem ser descartados com seguranca.

## 12. Validacao final esperada

Antes de considerar a feature funcionando:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- testes RLS de isolamento dos dados de consultoria
- teste de importacao com os arquivos reais
- teste de fluxo: cliente -> agenda -> visita -> checklist -> evidencia -> relatorio -> historico
- teste de regressao do core atual: check-in, funil, ranking, PDI, treinamentos e relatorios
