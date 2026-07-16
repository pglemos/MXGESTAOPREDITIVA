# Especificação de Design — Central de Execução Base44 1:1

**Projeto:** MX Gestão Preditiva  
**Repositório:** `pglemos/MXGESTAOPREDITIVA`  
**Branch de destino:** `main`  
**Referência visual e funcional:** Base44 app `6a3b2a814401f8c6bf1653df`, rota `/execucao`  
**Rotas de produção:** `/central-execucao` e `/central-de-execucao`  
**Data:** 16 de julho de 2026  
**Status:** Aprovado para planejamento de implementação

---

## 1. Decisão arquitetural aprovada

A implementação seguirá a **Opção B**:

- reproduzir o design, a experiência, os fluxos e os estados da rota `/execucao` do Base44 com fidelidade visual e comportamental 1:1;
- manter a arquitetura normalizada do MX Gestão Preditiva;
- não importar entidades legadas ou concorrentes do Base44 como fonte paralela;
- integrar a Central diretamente com Carteira, Fechamento Diário, CRM, agendamentos, oportunidades, eventos comerciais, WhatsApp, módulo gerencial, Supabase e Vercel;
- substituir a Central atual diretamente no `main`, sem feature flag.

A implementação não deverá copiar defeitos arquiteturais do Base44. O Base44 será a referência de experiência, interface, conteúdo e comportamento. O Supabase do MX será a fonte de verdade operacional.

---

## 2. Objetivo

Transformar a Central de Execução em uma área operacional completa para o vendedor, capaz de:

1. apresentar tudo que precisa ser executado hoje;
2. priorizar atividades por atraso, tipo, importância e contexto comercial;
3. permitir resolução específica por tipo de atividade;
4. registrar resultado, observação, responsável e horário;
5. reagendar sem duplicar registros;
6. abrir a ficha completa do cliente sem perder o contexto da execução;
7. retomar o registro automaticamente após o retorno do WhatsApp;
8. escalar situações para o gerente;
9. sincronizar Carteira, Fechamento, CRM, Funil, indicadores e eventos;
10. reproduzir visualmente a experiência Base44 sem interpretações livres.

---

## 3. Definição obrigatória de “design 1:1”

“1:1” não significa “inspirado”, “parecido” ou “mesma ideia”. Significa correspondência verificável entre a referência Base44 e o MX.

### 3.1 Elementos obrigatórios de fidelidade

A reprodução deverá cobrir:

- hierarquia visual;
- largura máxima do conteúdo;
- grid e alinhamentos;
- margens externas;
- espaçamentos internos;
- altura e densidade dos componentes;
- tipografia por nível;
- peso, tamanho e altura de linha;
- cores de fundo, texto, borda e estados;
- raios de borda;
- sombras;
- divisores;
- ícones;
- espessura dos ícones;
- tamanhos dos ícones;
- badges;
- chips;
- estados ativos, hover, focus, pressed e disabled;
- filtros;
- ordenação;
- cards;
- banners;
- dropdowns;
- modais;
- sheets laterais;
- estados vazios;
- estados de carregamento;
- estados de erro;
- animações e transições;
- comportamento responsivo;
- conteúdo textual exibido;
- sequência dos fluxos;
- resultado de cada clique.

### 3.2 Matriz de validação visual

A validação deverá ser realizada, no mínimo, nas seguintes larguras:

| Perfil | Largura de validação |
|---|---:|
| Desktop amplo | 1440 px |
| Notebook | 1280 px |
| Tablet | 768 px |
| Mobile | 390 px |

Cada tela e estado deverá ter comparação lado a lado com a referência Base44.

### 3.3 Tolerância visual

Para elementos mensuráveis, a tolerância máxima será:

- posição e dimensão: até 2 px;
- espaçamento: até 2 px;
- raio: correspondência exata ao token ou valor da referência;
- cor: correspondência visual e, quando possível, hexadecimal/RGB equivalente;
- tipografia: mesma família ou substituta aprovada com métricas equivalentes;
- ícone: mesmo desenho ou equivalente visual validado;
- animação: mesma intenção, duração e curva perceptível.

### 3.4 Inventário obrigatório de estados

A implementação não será considerada 1:1 se reproduzir somente o estado inicial. Deverão ser capturados e validados:

- aba Hoje vazia;
- aba Hoje com atividades;
- atividade vencida;
- atividade por tipo;
- filtros ativos;
- ordenação alterada;
- pendências anteriores;
- nova atividade, etapa de escolha de tipo;
- nova atividade, formulário;
- cliente encontrado;
- cliente não encontrado;
- resolver atendimento;
- resolver retorno;
- resolver entrega;
- resolver garantia;
- resolver pós-venda;
- registrar venda;
- registrar perda;
- reagendar;
- escalar para gerente;
- ficha lateral do cliente;
- retorno do WhatsApp;
- aba Rotina do Dia;
- etapa atual;
- etapa futura;
- etapa concluída;
- conflito entre rotina e cliente agendado;
- estado de carregamento;
- erro recuperável;
- modo mobile.

---

## 4. Escopo funcional

### 4.1 Aba Hoje

A aba Hoje deverá apresentar:

- cabeçalho da página;
- data atual;
- navegação entre Hoje e Rotina do Dia;
- banner de pendências anteriores;
- título operacional;
- texto de apoio;
- seletor de ordenação;
- botão Nova atividade;
- filtros por tipo;
- contadores por filtro;
- lista priorizada de atividades;
- estado vazio;
- ações rápidas;
- modal de resolução;
- modal de reagendamento;
- modal de venda;
- modal de perda;
- modal de escalonamento;
- ficha lateral do cliente.

### 4.2 Aba Rotina do Dia

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
- alerta de conflito com cliente agendado;
- linha do tempo lateral no desktop;
- versão compacta no mobile;
- recomendações contextuais baseadas em dados reais.

### 4.3 Tipos de atividade

Tipos canônicos:

- `atendimento`;
- `retorno`;
- `documentacao`;
- `entrega`;
- `pos_venda`;
- `aniversario`;
- `garantia`;
- `comercial`;
- `visita`;
- `test_drive`;
- `negociacao`.

Tipos semelhantes poderão compartilhar componentes, mas deverão permanecer filtráveis, mensuráveis e distinguíveis.

---

## 5. Não objetivos

Não faz parte deste trabalho:

- importar o banco Base44;
- manter sincronização bidirecional com Base44;
- copiar `Client`, `CarteiraCliente`, `ExecutionOpportunity` e `AtividadeExecucao` como fontes concorrentes;
- alterar módulos não relacionados sem necessidade comprovada;
- redesenhar a identidade global do MX;
- substituir o Supabase;
- criar uma segunda Central paralela;
- manter feature flag após a publicação;
- esconder funcionalidades incompletas atrás de botões sem ação.

---

## 6. Arquitetura de frontend

A atual concentração de responsabilidades deverá ser substituída por módulos com responsabilidades claras.

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
│   ├── useAtividadesExecucao.ts
│   ├── useAtividadeMutations.ts
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

### 6.1 Regras de componentização

- componentes visuais não acessam Supabase diretamente;
- hooks encapsulam leitura e mutação;
- regras de negócio puras ficam em `lib`;
- modais recebem dados e callbacks tipados;
- nenhum componente deverá conhecer detalhes internos de mais de um domínio;
- componentes devem ser testáveis de forma isolada;
- a página apenas compõe os módulos.

---

## 7. Arquitetura de dados

### 7.1 Fonte única

A Central terá uma única fonte canônica de execução:

```text
atividades_execucao
```

A tabela não substituirá clientes, oportunidades ou agendamentos. Ela representará o trabalho operacional que precisa ser executado e o histórico de sua resolução.

### 7.2 Relacionamentos

```text
atividades_execucao
├── cliente_id → clientes.id
├── oportunidade_id → oportunidades.id
├── agendamento_id → agendamentos.id
├── evento_id → eventos_comerciais.id
├── loja_id → lojas.id
├── seller_user_id → auth.users.id
├── gerente_id → auth.users.id
└── resolvido_por → auth.users.id
```

### 7.3 Campos

```sql
id uuid primary key
cliente_id uuid null
oportunidade_id uuid null
agendamento_id uuid null
evento_id uuid null
loja_id uuid not null
seller_user_id uuid not null

tipo text not null
titulo text not null
descricao text null
objetivo text null
prioridade integer not null default 5

data_hora_execucao timestamptz not null
status_execucao text not null default 'pendente'
resultado text null
observacao_resultado text null

nome_cliente_snapshot text null
telefone_snapshot text null
veiculo_snapshot text null

origem_modulo text not null
source_record_id text null
criado_automaticamente boolean not null default false
ativo boolean not null default true

resolvido_em timestamptz null
resolvido_por uuid null

necessita_gerente boolean not null default false
motivo_escalonamento text null
gerente_id uuid null
escalado_em timestamptz null

created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

### 7.4 Status

Valores permitidos:

- `pendente`;
- `em_andamento`;
- `resolvida`;
- `reagendada`;
- `cancelada`.

### 7.5 Índices

Índices mínimos:

```sql
(loja_id, seller_user_id, data_hora_execucao)
(seller_user_id, status_execucao, data_hora_execucao)
(cliente_id, data_hora_execucao desc)
(oportunidade_id)
(agendamento_id)
(source_record_id)
(necessita_gerente, gerente_id, status_execucao)
```

`source_record_id` deverá possuir restrição única quando preenchido, evitando duplicação em rotinas automáticas e retries.

### 7.6 Snapshots

Atividades avulsas e registros históricos deverão preservar:

- nome do cliente;
- telefone;
- veículo.

Esses dados não serão armazenados dentro de `observacoes` como texto improvisado. Campos estruturados permitirão busca, relatórios e vinculação posterior.

---

## 8. Segurança e RLS

### 8.1 Vendedor

O vendedor poderá:

- listar atividades próprias;
- criar atividade própria;
- atualizar atividade própria;
- resolver atividade própria;
- visualizar dados relacionados permitidos pela política atual.

### 8.2 Gerente

O gerente poderá:

- visualizar atividades da própria loja;
- visualizar escalonamentos direcionados;
- assumir ou devolver escalonamento;
- registrar orientação;
- concluir intervenção gerencial quando permitido.

### 8.3 Dono e Admin MX

Acesso conforme regras atuais de loja, rede e perfil interno.

### 8.4 Requisitos de segurança

- nenhuma mutação crítica deverá confiar apenas no frontend;
- RPCs deverão validar `auth.uid()`;
- RPCs deverão validar vínculo com loja;
- RPCs `SECURITY DEFINER` deverão definir `search_path` explícito;
- não usar `SELECT *` em funções sensíveis;
- não permitir que vendedor altere `seller_user_id` ou `loja_id` arbitrariamente;
- registrar autor e horário de cada resolução.

---

## 9. RPCs e transações

### 9.1 Criar atividade

```text
criar_atividade_execucao(payload, idempotency_key)
```

Responsabilidades:

1. validar sessão e loja;
2. validar tipo e data;
3. localizar cliente e oportunidade quando informados;
4. criar ou vincular agendamento quando necessário;
5. criar atividade;
6. criar evento comercial aplicável;
7. atualizar próximo passo do cliente quando aplicável;
8. retornar IDs criados;
9. fazer rollback em qualquer falha.

### 9.2 Resolver atividade

```text
resolver_atividade_execucao(atividade_id, resultado, observacao, payload_especifico)
```

Responsabilidades:

1. bloquear atividade com `FOR UPDATE`;
2. impedir resolução dupla;
3. validar resultado permitido para o tipo;
4. atualizar status e auditoria;
5. atualizar agendamento, cliente e oportunidade;
6. registrar evento comercial;
7. criar próxima atividade quando a regra exigir;
8. criar escalonamento quando necessário;
9. fazer rollback em qualquer falha.

### 9.3 Reagendar atividade

```text
reagendar_atividade_execucao(atividade_id, nova_data_hora, motivo)
```

Responsabilidades:

- atualizar o mesmo agendamento;
- atualizar a atividade atual para `reagendada`;
- criar a nova ocorrência operacional apenas quando a modelagem exigir histórico separado;
- manter vínculo por `source_record_id` ou `atividade_origem_id`;
- atualizar o próximo passo do cliente;
- registrar evento de reagendamento;
- impedir duplicidade por retry.

### 9.4 Escalar ao gerente

```text
escalar_atividade_gerente(atividade_id, motivo, gerente_id)
```

Responsabilidades:

- validar gerente da loja;
- marcar `necessita_gerente`;
- registrar motivo e horário;
- criar alerta gerencial;
- manter a atividade visível para o vendedor;
- evitar múltiplos escalonamentos ativos para o mesmo caso.

---

## 10. Catálogo de resultados por tipo

O catálogo será centralizado em código e validado também no banco.

### 10.1 Atendimento e visita

- Confirmado;
- Compareceu;
- Não compareceu;
- Remarcado;
- Venda realizada;
- Venda perdida.

### 10.2 Retorno

- Falei com o cliente;
- Não atendeu;
- Não respondeu;
- Reagendar retorno;
- Avançou para negociação;
- Precisa de gerente.

### 10.3 Entrega

- Entrega realizada;
- Entrega confirmada;
- Entrega remarcada;
- Pendência de documentação;
- Cliente não compareceu.

### 10.4 Garantia

- Retorno realizado;
- Aguardando oficina;
- Aguardando peça;
- Resolvido;
- Precisa de gerente;
- Reagendar acompanhamento.

### 10.5 Pós-venda

- Cliente satisfeito;
- Cliente com dúvida;
- Cliente com reclamação;
- Oportunidade de recompra;
- Indicação recebida;
- Reagendar contato.

### 10.6 Documentação

- Documentação recebida;
- Documentação pendente;
- Documento incorreto;
- Aguardando terceiro;
- Resolvido;
- Precisa de gerente.

### 10.7 Aniversário

- Mensagem enviada;
- Ligação realizada;
- Cliente respondeu;
- Oportunidade identificada;
- Não contatado.

### 10.8 Comercial

- Contato realizado;
- Proposta enviada;
- Sem interesse;
- Retorno agendado;
- Oportunidade criada;
- Precisa de gerente.

---

## 11. Fluxos integrados

### 11.1 Fechamento Diário → Central

Ao registrar agendamento, entrega, garantia, retorno ou pós-venda no Fechamento:

1. persistir o registro de domínio;
2. criar ou atualizar a atividade;
3. criar evento comercial;
4. atualizar o próximo passo do cliente;
5. preservar `fechamento_id` e `source_record_id`;
6. impedir criação duplicada.

### 11.2 Central → Carteira

Ao resolver ou reagendar:

- atualizar próxima ação;
- atualizar data da próxima ação;
- atualizar situação comercial quando aplicável;
- registrar histórico;
- manter uma única ficha de cliente.

### 11.3 Central → Oportunidade e Funil

Registrar venda ou perda deverá atualizar a oportunidade correta, sem selecionar “a primeira oportunidade encontrada”.

Venda:

- etapa `ganho`;
- valor;
- sinal;
- financiamento;
- troca;
- data de fechamento;
- evento de venda;
- conclusão da atividade.

Perda:

- etapa `perdido` ou oportunidade futura;
- motivo estruturado;
- observação;
- data de fechamento;
- evento de perda;
- próxima atividade quando aplicável.

### 11.4 Central → Gerente

Escalonamentos deverão aparecer em:

- Rotina da Equipe;
- Mentor Gerencial;
- Alertas;
- ficha do vendedor;
- histórico do cliente.

### 11.5 Carteira → Central

Novo próximo passo com data e hora deverá criar ou atualizar atividade correspondente quando representar compromisso operacional.

Não será permitido que Carteira e Central exibam datas divergentes para o mesmo compromisso.

---

## 12. Ficha lateral do cliente

A ficha será aberta dentro da Central, sem navegar para outra página.

### 12.1 Conteúdo

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
- data da próxima ação;
- oportunidade ativa;
- observações;
- agendamentos;
- atividades;
- eventos comerciais;
- histórico cronológico;
- pendências;
- ações rápidas.

### 12.2 Navegação

- abrir pelo `cliente_id`;
- fechar e retornar à mesma posição da lista;
- manter filtro, ordenação e scroll;
- permitir abrir WhatsApp, ligar, reagendar e resolver;
- não usar busca por nome como identificador.

---

## 13. Fluxo WhatsApp

### 13.1 Abertura

Ao abrir WhatsApp:

1. registrar em `sessionStorage` o ID da atividade;
2. registrar horário de saída;
3. registrar canal escolhido;
4. abrir a URL com telefone normalizado;
5. incluir mensagem sugerida quando houver.

### 13.2 Retorno

Ao retornar à aba dentro da janela configurada:

- reabrir contexto da atividade;
- apresentar modal “Como foi o contato?”;
- exibir resultados compatíveis com o tipo;
- permitir ignorar sem alterar o registro;
- limpar o estado após resolução ou expiração.

### 13.3 Regras

- não marcar atividade como resolvida apenas por abrir WhatsApp;
- não criar evento de contato sem confirmação;
- permitir retomada após refresh quando o estado ainda for válido;
- impedir que uma atividade antiga abra modal incorreto.

---

## 14. Rotina contextual

A Rotina do Dia usará templates existentes e contexto operacional real.

### 14.1 Entradas

- meta mensal;
- vendas realizadas;
- faltante para meta;
- ritmo necessário;
- clientes quentes;
- clientes sem retorno;
- agendamentos do dia;
- pendências anteriores;
- perdas dos últimos 30 dias;
- objeção predominante;
- PDI;
- dia da semana;
- semana do mês;
- horário de trabalho;
- conflitos de agenda.

### 14.2 Saídas

- prioridade do dia;
- objetivo da etapa;
- instruções adaptadas;
- meta sugerida;
- lista de clientes recomendados;
- roteiro de objeção;
- ação de prospecção;
- conteúdo sugerido;
- alerta de desvio;
- preparação D+1.

### 14.3 Princípio

A rotina deverá ser determinística e auditável. Recomendações não poderão alterar dados automaticamente. A ação final dependerá do vendedor.

---

## 15. Design system e implementação visual

### 15.1 Estratégia

O Base44 será capturado e medido. Os valores serão convertidos para tokens do MX ou tokens locais da feature quando não houver equivalente.

### 15.2 Tokens locais permitidos

Tokens locais poderão ser criados para:

- superfícies;
- azul principal da Central;
- cores por tipo;
- sombras;
- raios;
- densidade;
- largura máxima;
- transições.

Não será permitido espalhar valores mágicos repetidos em componentes.

### 15.3 Acessibilidade

Mesmo com fidelidade 1:1:

- navegação por teclado deverá funcionar;
- modais e sheets terão focus trap;
- Escape fechará camadas quando apropriado;
- ícones terão `aria-label` ou texto acessível;
- contraste não poderá ficar abaixo do mínimo aceitável;
- animações respeitarão `prefers-reduced-motion`;
- botões não dependerão apenas de cor.

---

## 16. Priorização

Ordem padrão:

1. atividade vencida;
2. prioridade manual;
3. prioridade base do tipo;
4. horário;
5. data de criação.

Prioridade base sugerida:

| Tipo | Prioridade |
|---|---:|
| Visita/atendimento/negociação | 1 |
| Entrega | 2 |
| Garantia | 3 |
| Retorno/documentação | 4 |
| Pós-venda/comercial | 5 |
| Aniversário | 6 |

A prioridade específica do registro poderá sobrescrever a prioridade base.

---

## 17. Backfill

A migração deverá criar atividades para registros existentes elegíveis:

- agendamentos pendentes;
- entregas futuras;
- garantias abertas;
- retornos agendados;
- pós-vendas pendentes;
- compromissos ainda não tratados.

### 17.1 Regras de idempotência

Cada item deverá receber `source_record_id`, por exemplo:

```text
agendamento:<uuid>
entrega:<oportunidade_uuid>:<data>
garantia:<evento_uuid>
pos_venda:<agendamento_uuid>
```

Executar o backfill mais de uma vez não poderá criar duplicatas.

### 17.2 Registros legados inconsistentes

Registros sem cliente poderão usar snapshots. Registros sem loja ou vendedor válido deverão ser reportados e não associados arbitrariamente.

---

## 18. Observabilidade e auditoria

Eventos mínimos:

- atividade criada;
- atividade aberta;
- WhatsApp aberto;
- atividade resolvida;
- atividade reagendada;
- atividade cancelada;
- venda registrada;
- perda registrada;
- escalonamento criado;
- escalonamento resolvido;
- erro de RPC;
- erro de sincronização;
- conflito de idempotência.

Logs não deverão conter telefone completo, observação sensível ou dados pessoais desnecessários.

---

## 19. Tratamento de erros

### 19.1 Frontend

- mensagens específicas;
- preservar formulário após falha;
- impedir duplo envio;
- permitir retry;
- não fechar modal antes da confirmação;
- mostrar estado offline;
- atualizar lista após sucesso confirmado.

### 19.2 Backend

- transações atômicas;
- erros com códigos estáveis;
- rollback integral;
- idempotência;
- validação de status anterior;
- bloqueio contra resolução concorrente.

### 19.3 Conflito concorrente

Se outro usuário resolver ou reagendar a atividade:

- o segundo envio deverá falhar com conflito;
- a interface deverá recarregar o registro;
- nenhuma duplicação será criada.

---

## 20. Testes

### 20.1 Funções puras

- ordenação;
- prioridade;
- filtros;
- catálogo de resultados;
- mapeamento de atividade;
- contexto da rotina;
- expiração do retorno WhatsApp.

### 20.2 Componentes

- cada estado visual;
- ações do card;
- modais;
- sheet;
- responsividade;
- acessibilidade.

### 20.3 Integração

- criar atividade;
- resolver por tipo;
- reagendar sem duplicar;
- venda na oportunidade correta;
- perda com motivo;
- garantia sem reabrir venda;
- escalonamento para gerente;
- atividade avulsa com snapshots;
- Carteira e Central sincronizadas;
- Fechamento e Central sincronizados.

### 20.4 Banco

- RLS por perfil;
- RPCs;
- rollback;
- idempotência;
- concorrência;
- backfill repetido;
- índices e consultas.

### 20.5 E2E

Fluxos mínimos:

1. login vendedor;
2. abrir Central;
3. filtrar;
4. resolver retorno;
5. reagendar visita;
6. abrir WhatsApp e retornar;
7. registrar venda;
8. abrir ficha lateral;
9. criar atividade avulsa;
10. escalar garantia ao gerente;
11. login gerente;
12. visualizar escalonamento;
13. validar reflexo na Carteira e no Fechamento.

### 20.6 Regressão visual

Capturas automatizadas nas quatro larguras definidas, comparadas com baselines aprovadas.

---

## 21. Estratégia de publicação direta

O usuário aprovou substituição direta no `main` e produção, sem feature flag.

### 21.1 Sequência obrigatória

1. criar migrations aditivas;
2. aplicar migrations no Supabase;
3. validar RLS e RPCs;
4. executar backfill em modo de diagnóstico;
5. executar backfill definitivo;
6. validar contagens e duplicidades;
7. implementar frontend;
8. executar testes;
9. executar lint e typecheck;
10. executar build;
11. realizar commit no `main`;
12. aguardar deploy Vercel;
13. validar deployment;
14. realizar smoke test autenticado;
15. comparar visualmente com Base44;
16. monitorar erros e logs.

### 21.2 Rollback

- migrations serão aditivas;
- colunas e tabelas antigas não serão removidas nesta entrega;
- frontend poderá voltar ao deployment anterior;
- backfill deverá ser reversível por origem e lote;
- atividade criada pelo backfill deverá carregar identificador de lote;
- nenhuma exclusão destrutiva será executada sem auditoria posterior.

---

## 22. Critérios de aceite

A entrega será aceita somente quando todos os itens abaixo forem comprovados:

### Visual

- design 1:1 nas larguras definidas;
- todos os estados inventariados reproduzidos;
- comparação visual aprovada;
- responsividade equivalente;
- animações e interações equivalentes.

### Funcional

- filtros funcionam;
- ordenação funciona;
- pendências anteriores não são resolvidas automaticamente como comparecimento;
- resultados variam por tipo;
- observação é persistida;
- reagendamento não duplica;
- venda atualiza a oportunidade correta;
- perda exige motivo;
- garantia não reabre venda;
- ficha abre sem abandonar a Central;
- WhatsApp retoma o registro;
- atividade avulsa usa campos estruturados;
- escalonamento chega ao gerente;
- Carteira, Fechamento e Central permanecem sincronizados.

### Dados e segurança

- RLS validada;
- RPCs transacionais;
- idempotência validada;
- backfill sem duplicação;
- nenhuma fonte concorrente criada;
- nenhum dado pessoal exposto em logs.

### Qualidade

- testes unitários aprovados;
- testes de integração aprovados;
- testes E2E aprovados;
- regressão visual aprovada;
- typecheck aprovado;
- lint aprovado;
- build aprovado;
- deploy saudável;
- smoke test autenticado aprovado.

---

## 23. Riscos e controles

| Risco | Controle |
|---|---|
| Publicação direta no `main` | migrations aditivas, testes completos e rollback de deployment |
| Duplicação no backfill | `source_record_id` único e execução idempotente |
| Divergência Carteira/Central | RPC transacional e fonte canônica |
| Resolução concorrente | bloqueio `FOR UPDATE` e verificação de status |
| Reprodução visual incompleta | inventário de estados e regressão visual |
| Importação de legado Base44 | proibição explícita de fontes concorrentes |
| Atividade avulsa sem identidade | snapshots estruturados |
| Escalonamento sem responsável | validação de gerente da loja |
| Erro após abrir WhatsApp | estado temporário recuperável e confirmação explícita |
| Regressão em Fechamento | integração e E2E obrigatórios |

---

## 24. Decisões finais

1. Base44 é referência visual e funcional, não fonte de dados.
2. Supabase do MX é a fonte de verdade.
3. Design será validado 1:1, estado por estado.
4. A Central utilizará uma única tabela operacional.
5. Mutações críticas serão transacionais.
6. Reagendamento preservará identidade.
7. Pendência não será tratada como comparecimento por padrão.
8. A ficha abrirá por ID dentro da Central.
9. WhatsApp exigirá confirmação de resultado no retorno.
10. Escalonamento será integrado ao gerente.
11. Rotina contextual será baseada em dados reais e auditáveis.
12. Publicação será direta no `main`, com rollback preparado.

---

## 25. Gate para implementação

A implementação só poderá começar depois de:

1. revisão deste documento pelo usuário;
2. aprovação explícita da especificação escrita;
3. criação de um plano de implementação detalhado;
4. decomposição em tarefas testáveis;
5. definição dos comandos de verificação e rollback.
