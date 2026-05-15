# PRD Brownfield - MX Consultoria Digital e Desenvolvimento de Pessoas

**Status:** Draft pronto para validacao PO  
**Origem:** `docs/prd/escopo-reuniao-daniel-sistema-2026-05-15.md`  
**Epic Set:** `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/`  
**Orquestracao:** @aiox-master  
**Produto:** @pm  
**Validacao:** @po

## 1. Problema

O sistema MX ja possui fundacoes de consultoria, PMR, agenda, importadores, PDI, treinamentos, matinal e relatorios. A reuniao com Daniel reposicionou o produto: o sistema precisa deixar de ser apenas ferramenta interna e passar a sustentar a entrega de consultoria e um produto de entrada para lojistas.

O ponto central e que admin/admin master MX, dono/lojista, gerente e vendedor devem operar dentro do sistema, sem depender de planilhas, documentos soltos ou trabalho manual posterior.

## 2. Objetivos

1. Permitir que o admin/admin master MX execute visitas PMR dentro do sistema, com passo a passo claro, filtros de periodo e relatorio padrao.
2. Entregar ao lojista/dono resumo e relatorio sem retrabalho apos a reuniao.
3. Criar visao do dono com performance, planejamento e alertas.
4. Transformar o acompanhamento diario em insumo confiavel para consultoria.
5. Evoluir Treinamentos para Desenvolvimento de Pessoas, com biblioteca, trilha de novo colaborador, PDI e feedback.
6. Preparar o produto para uso mobile/app nos fluxos essenciais.

## 3. Papeis

| Papel | Descricao | Necessidade principal |
|---|---|---|
| Admin/admin master MX | Consultor MX que conduz metodologia e acompanha clientes | executar visitas, registrar dados, gerar relatorios |
| Dono/lojista | Cliente da consultoria | enxergar valor, performance, plano e proximos passos |
| Gerente | Lider operacional da loja | validar rotina, cobrar equipe, aplicar feedback/PDI |
| Vendedor | Usuario operacional | preencher rotina diaria, seguir desenvolvimento, consumir conteudo |

## 4. Escopo por Onda

### Onda 1 - Consultoria PMR pronta para uso

Esta e a primeira onda executavel. Ela aproveita o que ja existe e fecha lacunas detectadas na reuniao.

Stories:

1. `CONS-13` - Visita 8 de acompanhamento mensal.
2. `CONS-14` - Fluxo sequencial e limpo da visita PMR.
3. `CONS-15` - Filtro de periodo para visita e relatorio.
4. `CONS-16` - Relatorio executivo e resumo em tempo real.

### Onda 2 - Visao do dono e planejamento estrategico

Entregar leitura bonita e clara para dono/lojista, com planejamento semelhante ao DRE financeiro, porem focado em planejado x realizado.

### Onda 3 - Acompanhamento diario e rotina mobile

Simplificar preenchimento do vendedor, validacao do gerente e notificacoes de rotina.

### Onda 4 - Desenvolvimento de pessoas

Reposicionar Treinamentos como Desenvolvimento/Evolucao/Meu Plano de Carreira, conectando biblioteca, trilha de novo colaborador, feedback e PDI.

### Onda 5 - Personalizacao por loja e app readiness

Preparar trilhas institucionais, conteudos premium e checklist Apple/Google.

## 5. Requisitos Funcionais

### RF-01 - Visitas PMR dentro do sistema

O admin/admin master MX deve abrir a agenda, iniciar a visita, seguir objetivo/metodologia/checklist, registrar dados e finalizar a visita sem sair do sistema.

### RF-02 - Visita 8 de acompanhamento mensal

O PMR deve suportar visita adicional mensal de acompanhamento, alem das visitas PMR 1 a 7, sem quebrar migracao legada nem o historico de clientes existentes.

### RF-03 - Fluxo sequencial

A tela da visita deve orientar o consultor em ordem de execucao, deixando objetivo da visita, periodo, checklist, campos principais, anexos e finalizacao claramente separados.

### RF-04 - Filtro de periodo

O admin/admin master MX deve selecionar o periodo discutido com o lojista/dono. O periodo deve alimentar indicadores, resumo e relatorio.

### RF-05 - Relatorio executivo

Ao final da visita, o sistema deve gerar relatorio padronizado MX com diagnostico, periodo, resultado, pontos positivos, pontos a melhorar, tarefas, proximos passos e anexos, quando aplicavel.

### RF-06 - Resumo em tempo real

O resumo da reuniao deve ficar disponivel imediatamente no historico do cliente/visita e preparado para envio ao grupo/cliente.

### RF-07 - Visao do dono

O dono/lojista deve ter visao separada da visao admin MX, com indicadores principais e alertas sem acesso a dados de outras lojas.

### RF-08 - Rotina diaria

Vendedor deve preencher rotina diaria de forma simples, preferencialmente mobile; gerente deve validar; admin MX deve usar os dados para consultoria.

### RF-09 - Desenvolvimento de pessoas

Treinamentos deve evoluir para ambiente de desenvolvimento, com biblioteca, trilha de novo colaborador, PDI, feedback estruturado e recomendacoes.

## 6. Requisitos Nao Funcionais

- RLS obrigatoria antes de expor dados para dono, gerente ou vendedor.
- Compatibilidade com tabelas e rotas existentes.
- Nenhum requisito deve quebrar `checkin`, `funil`, `ranking`, `feedback`, `pdi`, `treinamentos`, agenda e relatorios.
- Fluxos mobile devem ser responsivos e testados.
- Relatorios devem ter geracao reprodutivel e padrao.
- Mudancas de banco devem ter migration, rollback mental documentado e teste de schema.

## 7. Fora de Escopo Inicial

- IA completa para recomendacao automatica em todos os fluxos.
- Marketplace de cursos.
- Trilha complexa para vendedores antigos.
- Personalizacao obrigatoria para todos os clientes.
- BI completo com os 45 indicadores antes do recorte MVP.
- Submissao efetiva Apple/Google antes do app readiness checklist.

## 8. Metricas de Sucesso

- Percentual de visitas iniciadas e finalizadas no sistema.
- Tempo entre fim da visita e relatorio/resumo disponivel.
- Percentual de visitas com periodo preenchido.
- Percentual de clientes com visita 8/acompanhamento ativo.
- Uso da visao dono.
- Preenchimento diario por vendedor.
- Validacao diaria por gerente.
- Consumo e avaliacao de conteudos.
- PDIs ativos e revisados.

## 9. Dependencias e Artefatos Existentes

- `docs/prd/mx-consultoria-crm/`
- `docs/stories/story-CONS-07-pmr-operational-inputs.md`
- `docs/stories/story-CONS-08-strategic-plan-action-plan.md`
- `docs/stories/story-CONS-11-pmr-full-workflow-sync.md`
- `docs/stories/story-CONS-12-cronograma-2026-import.md`
- `docs/stories/story-OPS-20260514-legacy-pmr-visit-completion.md`
- `src/features/consultoria/components/VisitExecutionViews.tsx`
- `src/features/consultoria/components/VisitReportTemplate.tsx`
- `scripts/seed_pmr_methodology.ts`

## 10. Proxima Execucao

Executar Onda 1 com stories `CONS-13` a `CONS-16`, seguindo:

1. @po valida stories.
2. @architect cria plano tecnico quando necessario.
3. @data-engineer valida schema/RLS quando houver banco.
4. @ux-design-expert valida fluxo visual.
5. @dev implementa.
6. @qa valida.
7. @devops faz push/PR/deploy quando aprovado.

