# Especificação de Design — Central de Execução Base44 1:1

**Projeto:** MX Gestão Preditiva
**Repositório:** `pglemos/MXGESTAOPREDITIVA`
**Branch de destino:** `main`
**Referência visual e funcional:** Base44 app `6a3b2a814401f8c6bf1653df`, rota `/execucao`
**Rotas de produção:** `/central-execucao` e `/central-de-execucao`
**Data:** 16 de julho de 2026
**Status:** Aprovado conceitualmente e aguardando revisão desta especificação escrita

---

## 1. Decisão arquitetural aprovada

A implementação seguirá a **Opção B**:

- reproduzir o design, a experiência, os fluxos e os estados da rota `/execucao` do Base44 com fidelidade visual e comportamental 1:1;
- manter e evoluir a arquitetura normalizada do MX Gestão Preditiva;
- não importar entidades legadas ou concorrentes do Base44 como fontes paralelas;
- integrar a Central diretamente com Carteira, Fechamento Diário, CRM, agendamentos, oportunidades, eventos comerciais, PDI, feedbacks, WhatsApp e módulo gerencial;
- substituir a Central atual diretamente no `main`, sem feature flag;
- aplicar migrations aditivas e reversíveis antes da troca do frontend;
- publicar no projeto Vercel `mxperformance` somente após os gates de banco, testes, build e validação visual.

O Base44 será a referência de interface, conteúdo e comportamento. O Supabase do MX será a fonte de verdade operacional.

---

## 2. Correção arquitetural da auto-revisão

O banco atual já possui a tabela `public.execution_actions`, o hook `useExecutionActions`, RPCs de conclusão e integrações existentes com PDI, feedback, funil e rotina gerencial.

Portanto, esta especificação **não criará uma segunda tabela `atividades_execucao`**. Criar outra tabela produziria exatamente o problema que esta migração pretende eliminar: duas filas concorrentes afirmando representar a execução do vendedor.

A decisão final é:

> **Evoluir `public.execution_actions` para ser a fila operacional canônica da Central de Execução.**

As tabelas de domínio continuam responsáveis pelos fatos que representam:

- `clientes`: identidade e carteira;
- `oportunidades`: negociação e funil;
- `agendamentos`: compromissos comerciais com data e hora;
- `eventos_comerciais`: fatos comerciais imutáveis;
- `execution_actions`: trabalho operacional a executar, resolver, reagendar ou escalar.

A fila será ligada aos fatos por chaves estrangeiras e idempotência. Ela não duplicará a responsabilidade de `agendamentos` nem transformará `execution_actions` em um cadastro monolítico de cliente.

---

## 3. Objetivo

Transformar a Central de Execução em uma área operacional completa para o vendedor, capaz de:

1. apresentar tudo que precisa ser executado hoje;
2. priorizar atividades por atraso, tipo, importância e contexto comercial;
3. permitir resolução específica por tipo de atividade;
4. registrar resultado, observação, responsável e horário;
5. reagendar sem duplicar compromisso ou oportunidade;
6. abrir a ficha completa do cliente sem perder o contexto da execução;
7. retomar o registro automaticamente após o retorno do WhatsApp;
8. escalar situações ao gerente;
9. sincronizar Carteira, Fechamento, CRM, Funil, PDI, feedbacks e indicadores;
10. reproduzir visualmente a experiência Base44 sem interpretações livres.

---

## 4. Definição obrigatória de design 1:1

“1:1” não significa “inspirado”, “parecido” ou “mesma ideia”. Significa correspondência verificável entre a referência Base44 e o MX.

### 4.1 Elementos obrigatórios de fidelidade

A reprodução deverá cobrir:

- hierarquia visual;
- largura máxima do conteúdo;
- grid e alinhamentos;
- margens externas;
- espaçamentos internos;
- altura e densidade dos componentes;
- família, peso, tamanho e altura de linha da tipografia;
- cores de fundo, texto, borda e estados;
- raios de borda;
- sombras;
- divisores;
- ícones, tamanhos e espessuras;
- badges e chips;
- estados active, hover, focus, pressed e disabled;
- filtros e ordenação;
- cards e banners;
- dropdowns;
- modais;
- sheets laterais;
- estados vazios;
- carregamento;
- erro;
- animações e transições;
- comportamento responsivo;
- conteúdo textual;
- sequência dos fluxos;
- resultado de cada clique.

### 4.2 Matriz de validação

| Perfil | Largura mínima de validação |
|---|---:|
| Desktop amplo | 1440 px |
| Notebook | 1280 px |
| Tablet | 768 px |
| Mobile | 390 px |

Cada estado deverá possuir captura da referência Base44 e captura do MX no mesmo viewport.

### 4.3 Tolerância visual

- posição e dimensão: até 2 px;
- espaçamento: até 2 px;
- raio: valor correspondente à referência;
- cor: equivalente hexadecimal ou RGB quando mensurável;
- tipografia: mesma família ou substituta com métricas equivalentes;
- ícone: mesmo desenho ou equivalente validado;
- animação: mesma intenção, duração e curva perceptível.

### 4.4 Inventário obrigatório de estados

A validação incluirá, no mínimo:

- aba Hoje vazia;
- aba Hoje com atividades;
- atividade vencida;
- cada tipo de atividade;
- filtros ativos;
- ordenação alterada;
- pendências anteriores;
- nova atividade, seleção de tipo;
- nova atividade, formulário;
- cliente encontrado;
- cliente não encontrado;
- resolver atendimento;
- resolver retorno;
- resolver entrega;
- resolver garantia;
- resolver pós-venda;
- resolver documentação;
- registrar venda;
- registrar perda;
- reagendar;
- cancelar;
- escalar ao gerente;
- ficha lateral do cliente;
- retorno do WhatsApp;
- aba Rotina do Dia;
- etapa atual;
- etapa futura;
- etapa concluída;
- conflito com cliente agendado;
- carregamento;
- erro recuperável;
- offline;
- desktop, tablet e mobile.

---

## 5. Escopo funcional

### 5.1 Aba Hoje

A aba Hoje deverá apresentar:

- cabeçalho da página;
- data atual;
- navegação Hoje e Rotina do Dia;
- banner de pendências anteriores;
- título operacional e texto de apoio;
- seletor de ordenação;
- botão Nova atividade;
- filtros por tipo;
- contadores por filtro;
- lista priorizada;
- estado vazio;
- ações rápidas;
- modal de resolução por tipo;
- modal de reagendamento;
- modal de venda;
- modal de perda;
- modal de escalonamento;
- ficha lateral do cliente.

### 5.2 Aba Rotina do Dia

A aba Rotina do Dia deverá apresentar:

- etapas cronológicas;
- horário de cada etapa;
- etapa atual destacada;
- etapas passadas e futuras;
- objetivo;
- instruções;
- meta sugerida;
- atalhos;
- ações de prospecção;
- roteiro “Ver como fazer”;
- alerta de conflito;
- linha do tempo lateral no desktop;
- versão compacta no mobile;
- recomendações contextuais baseadas em dados reais.

### 5.3 Tipos canônicos de execução

`execution_actions.activity_type` aceitará:

- `atendimento`;
- `visita`;
- `retorno`;
- `documentacao`;
- `entrega`;
- `pos_venda`;
- `aniversario`;
- `garantia`;
- `comercial`;
- `test_drive`;
- `negociacao`;
- `pdi`;
- `feedback`;
- `funil`.

Tipos semelhantes poderão compartilhar componentes, mas continuarão filtráveis, mensuráveis e distinguíveis.

---

## 6. Não objetivos

Não faz parte deste trabalho:

- importar o banco Base44;
- manter sincronização bidirecional com Base44;
- copiar `Client`, `CarteiraCliente`, `ExecutionOpportunity` ou `AtividadeExecucao` como fontes concorrentes;
- criar uma segunda fila operacional;
- apagar `execution_actions` existente;
- alterar módulos não relacionados sem necessidade comprovada;
- redesenhar a identidade global do MX;
- substituir o Supabase;
- esconder funcionalidades incompletas atrás de botões sem ação;
- permitir que o frontend faça mutações críticas em várias tabelas sem transação.

---

## 7. Arquitetura de frontend

```text
src/features/central-execucao/
├── pages/
│   └── CentralExecucaoPage.tsx
├── tabs/
│   ├── HojeTab.tsx
│   └── RotinaDiaTab.tsx
├── components/
│   ├── CentralHeader.tsx
│   ├── CentralTabs.tsx
│   ├── AtividadeCard.tsx
│   ├── AtividadeBadge.tsx
│   ├── FiltrosAtividade.tsx
│   ├── OrdenacaoAtividades.tsx
│   ├── PendenciasBanner.tsx
│   ├── PendenciasAnterioresList.tsx
│   ├── LinhaTempoRotina.tsx
│   ├── RotinaStepCard.tsx
│   ├── FichaClienteSheet.tsx
│   ├── EstadoVazio.tsx
│   ├── LoadingState.tsx
│   └── ErrorState.tsx
├── modals/
│   ├── ResolverAtividadeModal.tsx
│   ├── ReagendarAtividadeModal.tsx
│   ├── NovaAtividadeModal.tsx
│   ├── RegistrarVendaModal.tsx
│   ├── RegistrarPerdaModal.tsx
│   └── EscalarGerenteModal.tsx
├── hooks/
│   ├── useExecutionActions.ts
│   ├── useExecutionActionMutations.ts
│   ├── useRotinaContextual.ts
│   ├── useWhatsappReturn.ts
│   └── useCentralFilters.ts
├── lib/
│   ├── activity-results.ts
│   ├── activity-priority.ts
│   ├── activity-mappers.ts
│   ├── routine-context.ts
│   └── whatsapp-return.ts
└── types/
    └── central-execucao.types.ts
```

### 7.1 Regras de componentização

- componentes visuais não acessam Supabase diretamente;
- hooks encapsulam consultas e RPCs;
- regras puras ficam em `lib`;
- modais recebem dados e callbacks tipados;
- a página apenas compõe módulos;
- o arquivo atual `CentralExecucao.container.tsx` será reduzido progressivamente, sem refatoração paralela sem teste;
- o hook atual `src/features/crm/hooks/useExecutionActions.ts` será evoluído, não duplicado com outro hook concorrente.

---

## 8. Modelo canônico de dados

### 8.1 Fonte operacional

```text
public.execution_actions
```

### 8.2 Responsabilidade de cada tabela

| Tabela | Responsabilidade |
|---|---|
| `clientes` | identidade, contato, carteira, resumo da próxima ação |
| `oportunidades` | negociação, etapa do funil, venda e perda |
| `agendamentos` | compromisso comercial com data e hora |
| `eventos_comerciais` | fatos comerciais imutáveis |
| `execution_actions` | fila operacional e ciclo de execução |

### 8.3 Campos existentes preservados

- `id`;
- `store_id`;
- `seller_id`;
- `source_type`;
- `source_id`;
- `title`;
- `description`;
- `due_at`;
- `status`;
- `priority`;
- `alert_tone`;
- `created_by`;
- `completed_at`;
- `completed_by`;
- `justificativa`;
- `metadata`;
- `created_at`;
- `updated_at`;
- `updated_by`.

### 8.4 Campos aditivos propostos

```sql
client_id uuid null references public.clientes(id)
opportunity_id uuid null references public.oportunidades(id)
appointment_id uuid null references public.agendamentos(id)
event_id uuid null references public.eventos_comerciais(id)
parent_action_id uuid null references public.execution_actions(id)

activity_type text not null default 'comercial'
objective text null
result_code text null
result_observation text null

client_name_snapshot text null
phone_snapshot text null
vehicle_snapshot text null

origin_module text not null default 'central_execucao'
source_record_id text null
idempotency_key text null
is_automatic boolean not null default false
active boolean not null default true
started_at timestamptz null

manager_required boolean not null default false
manager_id uuid null references public.usuarios(id)
escalation_reason text null
escalated_at timestamptz null
```

`completed_at` e `completed_by` continuarão representando o encerramento. Não serão criados pares redundantes `resolved_at` e `resolved_by`.

### 8.5 Expansão de `source_type`

Valores existentes serão preservados:

- `pdi`;
- `feedback`;
- `funil`;
- `manual`.

Novos valores:

- `agendamento`;
- `fechamento`;
- `carteira`;
- `cadencia`;
- `sistema`.

### 8.6 Ciclo de status

Valores existentes preservados:

- `pendente`;
- `em_andamento`;
- `concluida`;
- `justificada`;
- `cancelada`.

Novo valor:

- `reagendada`.

Regras:

- `concluida`: resultado operacional confirmado;
- `justificada`: ação de PDI ou feedback não concluída, mas formalmente justificada;
- `reagendada`: ocorrência original encerrada por mudança de data, vinculada à sucessora por `parent_action_id`;
- `cancelada`: encerrada sem sucessora;
- uma ação concluída, justificada, reagendada ou cancelada não pode voltar a pendente por update comum.

### 8.7 Data resumida do cliente

`clientes.proxima_acao_em` é atualmente `date`. Ela continuará como resumo diário da próxima ação.

A hora exata será mantida em:

- `execution_actions.due_at`;
- `agendamentos.data_hora`, quando houver compromisso comercial.

A migration não mudará silenciosamente `clientes.proxima_acao_em` para `timestamptz`. Qualquer mudança desse tipo exigiria auditoria de todos os consumidores do campo.

### 8.8 Índices e unicidade

```sql
CREATE INDEX ... ON execution_actions (seller_id, status, due_at);
CREATE INDEX ... ON execution_actions (store_id, status, due_at);
CREATE INDEX ... ON execution_actions (client_id, due_at DESC);
CREATE INDEX ... ON execution_actions (appointment_id);
CREATE INDEX ... ON execution_actions (opportunity_id);
CREATE INDEX ... ON execution_actions (manager_required, manager_id, status);
CREATE UNIQUE INDEX ... ON execution_actions (source_record_id)
  WHERE source_record_id IS NOT NULL;
CREATE UNIQUE INDEX ... ON execution_actions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
```

### 8.9 Snapshots

Atividades avulsas e históricos preservarão:

- nome;
- telefone;
- veículo.

Esses dados não serão concatenados dentro de `description` ou `observacoes` como substituto de modelagem.

---

## 9. Compatibilidade com integrações existentes

### 9.1 PDI

O fluxo atual que envia `pdi_plano_acao` para `execution_actions` será preservado.

A migration deverá:

- manter `source_type = 'pdi'`;
- manter `source_id` apontando para a ação do PDI;
- preencher `activity_type = 'pdi'`;
- não criar uma segunda ação para registros já enviados;
- preservar `central_enviada_at`.

### 9.2 Feedback e devolutivas

`devolutiva_acoes` continuará como registro de domínio do feedback. A Central receberá ou atualizará uma linha correspondente em `execution_actions` com idempotência.

### 9.3 Funil

Ações atuais de funil continuarão válidas. O novo modelo apenas acrescentará vínculos explícitos com cliente e oportunidade quando disponíveis.

### 9.4 Agendamentos

`agendamentos` continuará representando compromissos. Cada compromisso pendente elegível terá uma ação canônica em `execution_actions`.

A relação será um para um por `appointment_id` para a ocorrência ativa.

### 9.5 Fonte da listagem

Após o backfill e a validação, a aba Hoje lerá `execution_actions` como fila principal.

Dados de cliente, oportunidade e agendamento serão carregados por relacionamentos. O frontend não mesclará três listas e depois tentará deduplicar por nome ou tipo.

---

## 10. Segurança e RLS

### 10.1 Vendedor

O vendedor poderá:

- listar ações próprias;
- criar ações próprias permitidas;
- iniciar, resolver, reagendar ou cancelar ações próprias por RPC;
- visualizar relacionamentos permitidos pelas políticas atuais.

### 10.2 Gerente

O gerente poderá:

- visualizar ações da própria loja;
- visualizar escalonamentos direcionados;
- assumir, orientar ou concluir intervenção gerencial;
- não editar livremente fatos comerciais do vendedor sem RPC de negócio.

### 10.3 Dono e área interna MX

Acesso conforme as funções e políticas existentes de loja e área interna.

### 10.4 Requisitos técnicos

- mutações críticas não confiarão somente no frontend;
- RPCs validarão `auth.uid()`;
- RPCs validarão vínculo com loja;
- funções `SECURITY DEFINER` usarão `SET search_path = public`;
- não usar `SELECT *` em novas funções sensíveis;
- vendedor não poderá trocar `seller_id` ou `store_id` arbitrariamente;
- cada resolução registrará autor e horário;
- conflitos concorrentes retornarão erro estável.

---

## 11. RPCs transacionais

### 11.1 Criar ação

```text
create_execution_action(payload jsonb, idempotency_key text)
```

Responsabilidades:

1. validar sessão, vendedor e loja;
2. validar tipo e data;
3. localizar cliente, oportunidade e agendamento quando informados;
4. criar agendamento quando o fluxo exigir;
5. criar `execution_actions`;
6. criar evento comercial aplicável;
7. atualizar resumo da próxima ação do cliente;
8. retornar IDs;
9. fazer rollback em qualquer falha.

### 11.2 Resolver ação

```text
resolve_execution_action(action_id uuid, result_code text, observation text, payload jsonb)
```

Responsabilidades:

1. bloquear a ação com `FOR UPDATE`;
2. impedir resolução dupla;
3. validar resultado permitido para o tipo;
4. atualizar status, resultado e auditoria;
5. atualizar agendamento, cliente ou oportunidade conforme o catálogo;
6. registrar evento comercial;
7. criar próxima ação quando a regra exigir;
8. criar escalonamento quando aplicável;
9. fazer rollback integral.

### 11.3 Reagendar ação

```text
reschedule_execution_action(action_id uuid, new_due_at timestamptz, reason text)
```

Responsabilidades:

- bloquear a ação atual;
- atualizar o mesmo `agendamentos.id`, quando vinculado;
- marcar a ação original como `reagendada`;
- criar uma única ação sucessora ligada por `parent_action_id`;
- atualizar o resumo da próxima ação;
- registrar evento de reagendamento;
- impedir duplicação por retry.

### 11.4 Escalar ao gerente

```text
escalate_execution_action(action_id uuid, reason text, manager_id uuid)
```

Responsabilidades:

- validar gerente da loja;
- marcar `manager_required`;
- registrar motivo e horário;
- criar notificação gerencial;
- manter a ação visível ao vendedor;
- impedir múltiplos escalonamentos ativos para o mesmo caso.

### 11.5 Conclusão simples existente

A RPC atual `vendedor_concluir_execution_action` será preservada para compatibilidade, mas passará a delegar à regra canônica ou será mantida somente para tipos simples de PDI e feedback. Ela não será usada para venda, perda, garantia ou reagendamento.

---

## 12. Catálogo de resultados por tipo

O catálogo será centralizado no frontend e validado no backend.

### Atendimento e visita

- `confirmado`;
- `compareceu`;
- `nao_compareceu`;
- `remarcado`;
- `venda_realizada`;
- `venda_perdida`.

### Retorno

- `falou_cliente`;
- `nao_atendeu`;
- `nao_respondeu`;
- `reagendar_retorno`;
- `avancou_negociacao`;
- `precisa_gerente`.

### Entrega

- `entrega_realizada`;
- `entrega_confirmada`;
- `entrega_remarcada`;
- `documentacao_pendente`;
- `cliente_nao_compareceu`.

### Garantia

- `retorno_realizado`;
- `aguardando_oficina`;
- `aguardando_peca`;
- `resolvido`;
- `precisa_gerente`;
- `reagendar_acompanhamento`.

### Pós-venda

- `cliente_satisfeito`;
- `cliente_com_duvida`;
- `cliente_com_reclamacao`;
- `oportunidade_recompra`;
- `indicacao_recebida`;
- `reagendar_contato`.

### Documentação

- `documentacao_recebida`;
- `documentacao_pendente`;
- `documento_incorreto`;
- `aguardando_terceiro`;
- `resolvido`;
- `precisa_gerente`.

### Aniversário

- `mensagem_enviada`;
- `ligacao_realizada`;
- `cliente_respondeu`;
- `oportunidade_identificada`;
- `nao_contatado`.

### Comercial

- `contato_realizado`;
- `proposta_enviada`;
- `sem_interesse`;
- `retorno_agendado`;
- `oportunidade_criada`;
- `precisa_gerente`.

### PDI e feedback

- `concluida`;
- `em_andamento`;
- `justificada`;
- `precisa_gerente` quando aplicável.

---

## 13. Fluxos integrados

### 13.1 Fechamento Diário → Central

Ao registrar agendamento, entrega, garantia, retorno ou pós-venda:

1. persistir o fato de domínio;
2. criar ou atualizar a ação canônica;
3. criar evento comercial;
4. atualizar o resumo da próxima ação;
5. preservar `fechamento_id` nos registros que já possuem esse campo;
6. usar `source_record_id` e `idempotency_key`;
7. impedir criação duplicada.

### 13.2 Central → Carteira

Ao resolver ou reagendar:

- atualizar próxima ação;
- atualizar a data-resumo;
- atualizar situação comercial quando aplicável;
- registrar histórico em eventos;
- manter uma única ficha de cliente.

### 13.3 Central → Oportunidade e Funil

Venda:

- atualizar a oportunidade vinculada;
- etapa `ganho`;
- valor, sinal, financiamento e troca;
- data de fechamento;
- evento de venda;
- conclusão da ação.

Perda:

- atualizar a oportunidade vinculada;
- etapa `perdido` ou oportunidade futura conforme escolha explícita;
- motivo estruturado;
- observação;
- evento de perda;
- próxima ação quando aplicável.

Não será permitido escolher a oportunidade apenas por posição na lista.

### 13.4 Central → Gerente

Escalonamentos aparecerão em:

- Rotina da Equipe;
- Mentor Gerencial;
- notificações e alertas;
- ficha do vendedor;
- histórico do cliente.

### 13.5 Carteira → Central

Um próximo passo com data operacional deverá criar ou atualizar uma ação correspondente.

Quando também representar compromisso comercial, deverá manter vínculo com `agendamentos`.

Carteira e Central não poderão exibir datas divergentes para o mesmo compromisso.

---

## 14. Ficha lateral do cliente

A ficha abrirá dentro da Central, por `client_id`, sem navegar para outra rota.

### Conteúdo

- nome;
- telefone;
- WhatsApp;
- canal;
- veículo de interesse;
- valor negociado;
- financiamento;
- troca;
- temperatura;
- situação atual;
- próxima ação;
- oportunidade ativa;
- observações;
- agendamentos;
- ações de execução;
- eventos comerciais;
- histórico cronológico;
- pendências;
- ações rápidas.

### Comportamento

- fechar retorna à mesma posição da lista;
- filtros, ordenação, aba e scroll são preservados;
- permite WhatsApp, ligação, reagendamento e resolução;
- não usa nome como identificador;
- usa focus trap e Escape;
- reproduz visualmente a sheet do Base44.

---

## 15. Fluxo WhatsApp

### Abertura

1. salvar no `sessionStorage` o ID da ação;
2. salvar horário de saída e canal;
3. abrir número normalizado;
4. incluir mensagem sugerida quando houver.

### Retorno

Ao retornar dentro da janela configurada:

- restaurar a ação correta;
- abrir “Como foi o contato?”;
- mostrar resultados compatíveis com o tipo;
- permitir fechar sem alteração;
- limpar o estado após resolução ou expiração.

### Regras

- abrir WhatsApp não conclui ação;
- evento de contato só nasce após confirmação;
- refresh preserva o retorno enquanto válido;
- uma ação antiga não pode abrir o modal de outra;
- o comportamento será coberto por teste de visibilidade da página e expiração.

---

## 16. Rotina contextual

A Rotina do Dia continuará usando:

- `routine_activity_templates`;
- `prospecting_schedule`;
- `story_ideas`;
- horários de `vendedor_perfil`.

Serão acrescentadas entradas:

- meta mensal;
- vendas realizadas;
- faltante e ritmo necessário;
- clientes quentes;
- clientes sem retorno;
- compromissos do dia;
- pendências anteriores;
- perdas dos últimos 30 dias;
- objeção predominante;
- PDI;
- feedbacks pendentes;
- dia e semana do mês;
- conflito de agenda.

Saídas:

- prioridade do dia;
- objetivo adaptado;
- instruções adaptadas;
- meta sugerida;
- lista recomendada;
- roteiro de objeção;
- ação de prospecção;
- alerta de desvio;
- preparação D+1.

As recomendações serão determinísticas e auditáveis. Não alterarão dados automaticamente.

---

## 17. Design system e acessibilidade

### Estratégia

- medir a referência Base44;
- converter valores para tokens existentes;
- criar tokens locais somente quando não houver equivalente;
- proibir valores mágicos repetidos;
- manter a identidade visual da tela 1:1 sem alterar o restante do produto.

### Acessibilidade

- navegação por teclado;
- focus trap em modal e sheet;
- Escape;
- nomes acessíveis;
- contraste mínimo;
- `prefers-reduced-motion`;
- estados não dependem apenas de cor;
- foco visível equivalente ao design.

---

## 18. Priorização

Ordem padrão:

1. vencida;
2. prioridade explícita;
3. prioridade-base do tipo;
4. horário;
5. criação.

| Tipo | Base |
|---|---:|
| Visita, atendimento, negociação | 1 |
| Entrega | 2 |
| Garantia | 3 |
| Retorno, documentação | 4 |
| Pós-venda, comercial, PDI, feedback | 5 |
| Aniversário | 6 |

Mapeamento de prioridade existente:

- `urgent` = 1;
- `high` = 2;
- `medium` = 3;
- `low` = 4.

---

## 19. Backfill e migração

### 19.1 Fontes elegíveis

- agendamentos pendentes;
- entregas futuras;
- garantias abertas;
- retornos;
- pós-vendas;
- ações de PDI já enviadas;
- ações de feedback;
- ações de funil;
- ações manuais existentes.

### 19.2 Chaves de origem

```text
appointment:<uuid>
pdi:<uuid>
feedback:<uuid>
funnel:<uuid>
delivery:<opportunity_uuid>:<timestamp>
warranty:<event_uuid>
```

Executar o backfill mais de uma vez não poderá criar duplicatas.

### 19.3 Registros existentes em `execution_actions`

A migration deverá enriquecer linhas existentes sem apagar:

- status;
- conclusão;
- justificativa;
- origem;
- metadados;
- vínculos com PDI, feedback e funil.

### 19.4 Registros inconsistentes

- sem cliente: usar snapshot;
- sem loja ou vendedor válido: registrar em relatório de migração e não associar arbitrariamente;
- mais de uma ação para a mesma origem: preservar histórico, escolher a ativa por regra documentada e impedir novas duplicatas.

---

## 20. Observabilidade e auditoria

Eventos mínimos:

- ação criada;
- ação aberta;
- WhatsApp aberto;
- ação iniciada;
- ação concluída;
- ação justificada;
- ação reagendada;
- ação cancelada;
- venda registrada;
- perda registrada;
- escalonamento criado;
- escalonamento resolvido;
- conflito de idempotência;
- erro de RPC;
- erro de sincronização.

Logs não conterão telefone completo, observações sensíveis ou dados pessoais desnecessários.

---

## 21. Tratamento de erros

### Frontend

- mensagens específicas;
- preservar formulário após falha;
- impedir duplo envio;
- permitir retry;
- não fechar modal antes da confirmação;
- mostrar offline;
- atualizar a lista apenas após sucesso confirmado.

### Backend

- transações atômicas;
- códigos de erro estáveis;
- rollback integral;
- idempotência;
- validação de status anterior;
- bloqueio contra resolução concorrente.

### Concorrência

Se outro usuário resolver ou reagendar:

- o segundo envio retorna conflito;
- a interface recarrega a ação;
- nenhuma duplicação é criada.

---

## 22. Testes

### 22.1 Funções puras

- ordenação;
- prioridade;
- filtros;
- catálogo de resultados;
- mapeadores;
- contexto da rotina;
- expiração do retorno WhatsApp;
- chaves de idempotência.

### 22.2 Componentes

- cada estado visual;
- ações do card;
- modais;
- sheet;
- responsividade;
- acessibilidade.

### 22.3 Integração

- criar ação;
- resolver por tipo;
- reagendar sem duplicar;
- venda na oportunidade correta;
- perda com motivo;
- garantia sem reabrir venda;
- escalonamento;
- atividade avulsa com snapshots;
- PDI existente continua funcionando;
- feedback existente continua funcionando;
- Carteira, Fechamento e Central sincronizados.

### 22.4 Banco

- RLS por perfil;
- RPCs;
- rollback;
- idempotência;
- concorrência;
- backfill repetido;
- compatibilidade de linhas antigas;
- índices e consultas.

### 22.5 E2E

1. login vendedor;
2. abrir Central;
3. filtrar e ordenar;
4. resolver retorno;
5. reagendar visita;
6. abrir WhatsApp e retornar;
7. registrar venda;
8. registrar perda;
9. abrir ficha lateral;
10. criar atividade avulsa;
11. escalar garantia;
12. login gerente;
13. visualizar escalonamento;
14. validar Carteira e Fechamento;
15. validar ação de PDI existente.

### 22.6 Regressão visual

Capturas automatizadas nas quatro larguras, comparadas com baselines aprovadas do Base44.

---

## 23. Estratégia de publicação direta

O usuário aprovou substituição direta no `main`, sem feature flag.

### Sequência obrigatória

1. capturar inventário visual completo do Base44;
2. criar testes que falham para os gaps funcionais;
3. criar migrations aditivas no repositório;
4. revisar SQL e políticas;
5. aplicar migrations no Supabase;
6. validar RLS e RPCs;
7. executar backfill diagnóstico;
8. executar backfill definitivo;
9. validar contagens e duplicidades;
10. implementar frontend 1:1;
11. executar testes unitários e integração;
12. executar E2E;
13. executar regressão visual;
14. executar lint, typecheck e build;
15. commit no `main`;
16. aguardar deployment Vercel;
17. validar deployment e logs;
18. smoke test autenticado;
19. comparação final com Base44;
20. monitoramento pós-publicação.

### Rollback

- migrations aditivas;
- nenhuma tabela existente removida nesta entrega;
- nenhum campo antigo removido nesta entrega;
- frontend volta ao deployment anterior;
- backfill identificado por chave de origem e lote;
- rollback de lote não apaga ações manuais ou históricas;
- restauração da Central anterior disponível pelo Git.

---

## 24. Critérios de aceite

### Visual

- design 1:1 nos viewports definidos;
- todos os estados inventariados;
- comparação visual aprovada;
- responsividade equivalente;
- interações e animações equivalentes.

### Funcional

- filtros e ordenação funcionam;
- pendência não é marcada automaticamente como comparecimento;
- resultados variam por tipo;
- observação é persistida;
- reagendamento preserva o mesmo compromisso e não duplica;
- venda atualiza a oportunidade correta;
- perda exige motivo;
- garantia não reabre venda;
- ficha abre sem abandonar a Central;
- retorno do WhatsApp funciona;
- atividade avulsa usa snapshots estruturados;
- escalonamento chega ao gerente;
- PDI, feedback e funil existentes continuam integrados;
- Carteira, Fechamento e Central permanecem coerentes.

### Dados e segurança

- `execution_actions` é a única fila operacional;
- RLS validada;
- RPCs transacionais;
- idempotência validada;
- backfill sem duplicação;
- linhas existentes preservadas;
- dados pessoais não aparecem em logs.

### Qualidade

- testes unitários aprovados;
- integração aprovada;
- E2E aprovado;
- regressão visual aprovada;
- typecheck aprovado;
- lint aprovado;
- build aprovado;
- deployment saudável;
- smoke test autenticado aprovado.

---

## 25. Riscos e controles

| Risco | Controle |
|---|---|
| Publicação direta no `main` | migrations aditivas, gates completos e rollback de deployment |
| Segunda fila de execução | evolução obrigatória de `execution_actions`, proibição de nova tabela concorrente |
| Duplicação no backfill | `source_record_id` e idempotência únicos |
| Regressão do PDI | preservar RPCs, fontes e teste de compatibilidade |
| Divergência Carteira/Central | RPC transacional e vínculos explícitos |
| Resolução concorrente | `FOR UPDATE` e validação de status |
| Visual incompleto | inventário de estados e regressão visual |
| Atividade avulsa sem identidade | snapshots estruturados |
| Escalonamento sem responsável | validação de gerente da loja |
| Erro após WhatsApp | estado recuperável e confirmação explícita |
| Regressão em Fechamento | integração e E2E obrigatórios |

---

## 26. Questão de segurança preexistente identificada

A inspeção do Supabase identificou RLS desabilitada em:

- `public.user_roles`;
- `public.migration_backup_vendedores_loja_duplicates_20260503`;
- `public.migration_backup_lancamentos_diarios_duplicates_20260503`.

Essa condição é preexistente e não será alterada automaticamente dentro da implementação da Central. Habilitar RLS sem políticas apropriadas pode bloquear acessos necessários; deixar desabilitado pode expor tabelas ao papel autenticado ou anônimo conforme grants existentes.

Deverá existir uma tarefa de segurança separada para:

1. auditar grants;
2. determinar consumidores;
3. definir políticas;
4. habilitar RLS;
5. testar acesso por perfil.

---

## 27. Decisões finais

1. Base44 é referência visual e funcional, não fonte de dados.
2. Supabase do MX é a fonte de verdade.
3. Design será validado 1:1, estado por estado.
4. `execution_actions` será evoluída como fila canônica.
5. `agendamentos` continua sendo a fonte do compromisso comercial.
6. PDI, feedback e funil existentes serão preservados.
7. Mutações críticas serão transacionais.
8. Reagendamento preservará identidade e histórico.
9. Pendência não será tratada como comparecimento por padrão.
10. A ficha abrirá por ID dentro da Central.
11. WhatsApp exigirá confirmação de resultado no retorno.
12. Escalonamento será integrado ao gerente.
13. Rotina contextual será baseada em dados reais e auditáveis.
14. Publicação será direta no `main`, com rollback preparado.

---

## 28. Gate para implementação

A implementação só poderá começar depois de:

1. revisão deste documento pelo usuário;
2. aprovação explícita da especificação escrita;
3. criação de plano de implementação detalhado;
4. decomposição em tarefas testáveis;
5. definição dos comandos de verificação e rollback.
