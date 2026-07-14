# MX Gestão Preditiva
## Revisão Funcional Definitiva — Fechamento Diário do Vendedor
### Data operacional, transição D-1 → D0, Histórico, Regularização e integração com o Módulo Gerencial

**Versão:** 2.0
**Data-base:** 14 de julho de 2026
**Status:** regra funcional confirmada
**Fuso oficial:** `America/Sao_Paulo`

---

# 1. Correções aplicadas à auditoria anterior

Esta revisão substitui os pontos anteriores que tratavam a política de horário como decisão em aberto.

## 1.1 A política de horário não está mais em aberto

A regra oficial passa a ser:

- a tela trabalha por **data operacional**;
- o status de uma data nunca pode bloquear globalmente a tela;
- antes de 12:00, D-1 pode ser priorizado enquanto estiver pendente;
- quando D-1 for concluído, D0 é liberado imediatamente, sem esperar 12:00;
- às 12:00 ou depois, D0 é sempre a data principal;
- D-1 pendente após 12:00 é tratado no Histórico/Regularização;
- D-1 concluído ou pendente aparece apenas como card de contexto no topo.

Portanto, o item antigo "decidir política de horário" deve ser removido do backlog. A regra está confirmada e deve ser implementada.

## 1.2 Edição rápida não é lacuna do Fechamento

A edição rápida de cliente, situação, reagendamento e observação permanece na **Rotina do Dia**.

Ela não deve voltar ao Fechamento Diário ao vivo.

No Fechamento:

- o vendedor registra o movimento e encerra a data operacional;
- ajustes posteriores são feitos no Histórico;
- atividades e atualização comercial são tratadas na Rotina do Dia.

## 1.3 Histórico: remover "Observações Operacionais (Justificativa)"

Ao clicar em **Ajustar** no Histórico de Fechamentos:

- remover o campo `Observações Operacionais (Justificativa)`;
- não reutilizar esse campo como motivo genérico;
- a auditoria deve registrar automaticamente usuário, data, valores anteriores, valores novos e diferenças;
- caso exista motivo de regularização, ele deve ser um conceito separado e não o campo de observação operacional do fechamento.

---

# 2. Conceitos obrigatórios

## 2.1 D0

Data atual no fuso `America/Sao_Paulo`.

## 2.2 D-1

Dia imediatamente anterior a D0.

## 2.3 Data operacional

Data à qual o movimento comercial pertence, independentemente:

- da data do dispositivo;
- do horário de envio;
- da data em que o vendedor terminou o preenchimento.

## 2.4 Status por data

Cada fechamento possui status próprio. Não existe um status global chamado "fechamento enviado" capaz de bloquear todas as datas.

Chave lógica mínima:

```text
seller_user_id
+ reference_date
+ metric_scope
+ store_id, quando aplicável
```

A combinação deve ser única.

---

# 3. Regra definitiva da tela principal

## 3.1 Antes de 12:00

### D-1 pendente

A tela pode priorizar D-1 como tarefa operacional.

- cabeçalho: `Ontem · dd/mm`;
- formulário de D-1 editável;
- progresso real de D-1;
- botão: `FINALIZAR FECHAMENTO DO DIA`;
- D0 ainda não substitui a tarefa prioritária;
- após finalizar D-1, trocar imediatamente para D0.

### D-1 concluído

A tela principal deve ser D0.

- card superior: fechamento anterior concluído;
- cabeçalho principal: `Hoje · dd/mm`;
- progresso de D0;
- campos de D0 liberados;
- nenhuma espera até 12:00.

Regra resumida:

```text
Se D-1 foi concluído, liberar D0 imediatamente.
```

## 3.2 Às 12:00 ou depois

A tela principal é sempre D0.

### D-1 concluído

- mostrar card verde "Fechamento anterior concluído";
- mostrar D0 abaixo;
- não exibir D-1 como formulário principal.

### D-1 pendente

- mostrar card de alerta "Fechamento anterior pendente";
- mover D-1 para Histórico/Regularização;
- manter D0 editável;
- não bloquear o trabalho atual.

Regra resumida:

```text
Depois de 12:00, D-1 nunca domina a tela principal.
```

## 3.3 D0 em andamento

Carregar o progresso real salvo para D0.

Não zerar um fechamento de hoje que já começou.

## 3.4 D0 inexistente

Apresentar estado inicial:

- progresso 0%;
- contadores zerados;
- formulários vazios;
- campos habilitados;
- data D0;
- sem herança visual ou de dados de D-1.

## 3.5 D0 já concluído

A tela continua representando D0, mas:

- formulário de D0 bloqueado;
- status "Fechamento de hoje concluído";
- Histórico disponível;
- não abrir antecipadamente D+1 como nova data operacional.

---

# 4. Camada de contexto recomendada

Criar uma camada única, pura e testável:

```ts
type ActiveClosingContext = {
  now: Date
  today: string
  yesterday: string

  mainDate: string
  mainLabel: 'Hoje' | 'Ontem'
  mode:
    | 'previous_pending_before_noon'
    | 'today_open_after_previous_done'
    | 'today_open_after_noon_previous_done'
    | 'today_open_after_noon_previous_pending'
    | 'today_in_progress'
    | 'today_submitted'

  mainCheckin: ClosingRecord | null
  previousCheckin: ClosingRecord | null

  isMainDateSubmitted: boolean
  canEditMainForm: boolean
  canSubmitMainForm: boolean

  previousCard:
    | null
    | {
        type: 'previous_done' | 'previous_pending'
        date: string
        status: string
      }
}
```

Função sugerida:

```ts
getActiveClosingContext(now, closingsByDate)
```

Essa função deve ser a única responsável por escolher:

- a data principal;
- o rótulo Hoje/Ontem;
- o fechamento carregado;
- o bloqueio do formulário;
- o card superior;
- o texto do resumo;
- a ação principal.

Não espalhar a regra de 12:00 em diversos componentes.

---

# 5. Pseudológica oficial

```ts
function getActiveClosingContext(now, closings) {
  const today = getDateInSaoPaulo(now)
  const yesterday = subtractOneDay(today)
  const currentTime = getTimeInSaoPaulo(now)

  const previous = closings[yesterday] ?? null
  const current = closings[today] ?? null

  const previousIsOfficial =
    previous?.status === 'finalizado' ||
    previous?.status === 'regularizado_aprovado'

  const currentIsOfficial =
    current?.status === 'finalizado' ||
    current?.status === 'regularizado_aprovado'

  const afterNoon = currentTime >= '12:00'

  if (currentIsOfficial) {
    return {
      mainDate: today,
      mainLabel: 'Hoje',
      mode: 'today_submitted',
      mainCheckin: current,
      previousCheckin: previous,
      isMainDateSubmitted: true,
      canEditMainForm: false,
      canSubmitMainForm: false,
      previousCard: buildPreviousCard(previous, yesterday)
    }
  }

  if (!afterNoon && !previousIsOfficial) {
    return {
      mainDate: yesterday,
      mainLabel: 'Ontem',
      mode: 'previous_pending_before_noon',
      mainCheckin: previous,
      previousCheckin: previous,
      isMainDateSubmitted: false,
      canEditMainForm: true,
      canSubmitMainForm: true,
      previousCard: null
    }
  }

  return {
    mainDate: today,
    mainLabel: 'Hoje',
    mode: previousIsOfficial
      ? afterNoon
        ? 'today_open_after_noon_previous_done'
        : 'today_open_after_previous_done'
      : 'today_open_after_noon_previous_pending',
    mainCheckin: current,
    previousCheckin: previous,
    isMainDateSubmitted: false,
    canEditMainForm: true,
    canSubmitMainForm: true,
    previousCard: previousIsOfficial
      ? { type: 'previous_done', date: yesterday, status: previous.status }
      : { type: 'previous_pending', date: yesterday, status: previous?.status ?? 'pendente' }
  }
}
```

---

# 6. Transição após finalizar D-1

Ao finalizar D-1 antes de 12:00, executar a sequência:

1. Validar todos os dados de D-1;
2. Salvar D-1 com sua própria `reference_date`;
3. Marcar D-1 como finalizado;
4. Persistir `submitted_at`;
5. Invalidar queries de D-1 e D0;
6. Limpar somente o estado local associado a D-1;
7. Recalcular `ActiveClosingContext`;
8. Trocar `mainDate` para D0;
9. Carregar o rascunho real de D0, caso exista;
10. Se D0 não existir, mostrar 0%;
11. Exibir card de sucesso de D-1;
12. Liberar imediatamente os campos de D0.

## Proibição

Não "zerar" D-1 no banco.

O que deve ser zerado é a representação do formulário atual ao mudar para D0. Os dados de D-1 permanecem íntegros no Histórico.

---

# 7. Hierarquia visual da tela

## 7.1 Ordem obrigatória

1. Cabeçalho da página;
2. Card de contexto do fechamento anterior;
3. Identificação da data operacional principal;
4. Progresso do fechamento principal;
5. Etapas e formulários;
6. Resumo da data principal;
7. Ação de finalizar;
8. Histórico de Fechamentos.

## 7.2 Card verde: fechamento anterior concluído

**Título**

```text
FECHAMENTO ANTERIOR CONCLUÍDO
```

**Mensagem**

```text
Você enviou o fechamento do dia dd/mm com sucesso.
As informações foram encaminhadas para sua liderança.

Caso precise corrigir algum dado, acesse o Histórico de Fechamentos,
clique em Ajustar e envie a regularização para análise.
```

**Ações**

- `Ver histórico`;
- `Ajustar fechamento`.

O botão `Ajustar fechamento` deve abrir diretamente a data exibida no card.

## 7.3 Card de alerta: fechamento anterior pendente

**Título**

```text
FECHAMENTO ANTERIOR PENDENTE
```

**Mensagem**

```text
O fechamento do dia dd/mm não foi enviado dentro do prazo.
A tela atual já está liberada para o fechamento de hoje.

Para corrigir a pendência, acesse o Histórico de Fechamentos
e envie a regularização para análise da liderança.
```

**Ações**

- `Ver histórico`;
- `Regularizar dd/mm`.

## 7.4 Progresso

O progresso sempre pertence a `mainDate`.

Nunca usar:

- porcentagem de D-1 em D0;
- etapas concluídas de D-1 em D0;
- resumo de D-1 em D0;
- status "concluído" de D-1 para bloquear D0.

## 7.5 Rótulos

### Quando `mainDate = D0`

- `Hoje · dia da semana, dd de mês`;
- `Progresso do fechamento de hoje`;
- `Resumo de hoje`;
- `Finalizar fechamento do dia`.

### Quando `mainDate = D-1` antes de 12:00

- `Ontem · dia da semana, dd de mês`;
- `Progresso do fechamento anterior`;
- `Resumo do fechamento anterior`;
- `Finalizar fechamento do dia`.

---

# 8. Histórico e Regularização

## 8.1 Estados mínimos

- Em andamento;
- Finalizado;
- Pendente de fechamento;
- Fora do horário;
- Aguardando aprovação;
- Regularizado aprovado;
- Regularização recusada.

## 8.2 Ações por estado

### Finalizado

- Ver detalhes;
- Ajustar.

### Pendente ou fora do horário

- Regularizar.

### Aguardando aprovação

- Ver solicitação;
- status `Em análise`.

### Aprovado

- Ver versão original;
- ver versão aprovada;
- ver auditoria.

### Recusado

- Ver motivo da recusa;
- criar nova versão de regularização.

## 8.3 Regra do botão Ajustar

O botão deve:

- carregar exatamente a data escolhida;
- usar a chave da data operacional;
- carregar os dados originais;
- permitir edição autorizada;
- gerar um diff;
- criar uma nova versão;
- não sobrescrever o original silenciosamente;
- não criar duplicidade;
- enviar ao gerente quando aplicável.

## 8.4 Campo removido

Remover do ajuste:

```text
Observações Operacionais (Justificativa)
```

---

# 9. Alterações nos formulários do Fechamento

## 9.1 Novo Cliente / Garantia

### Responsável pela Tratativa

Substituir campo livre por lista de opções.

A lista deve vir de fonte oficial:

- usuários ativos da loja;
- perfis elegíveis;
- vínculo com a unidade;
- sem nomes fictícios;
- sem opção inválida ou inativa.

### Data para Posicionar o Cliente

Valor inicial:

```text
Data: D+1 em relação à data operacional do fechamento
Hora: 09:00
```

A data não deve ser calculada pela data do dispositivo. Deve usar:

```text
reference_date + 1 dia
```

O usuário pode alterar quando permitido.

### Descrição da Garantia

Criar catálogo de opções vinculado ao motivo selecionado.

Exemplo de comportamento:

```text
Motivo da garantia
→ filtra descrições compatíveis
→ vendedor escolhe uma descrição
→ se escolher "Outro", abrir campo de texto obrigatório
```

Requisitos:

- catálogo configurável;
- valor estruturado;
- rótulo amigável;
- opção "Outro";
- texto obrigatório somente quando "Outro";
- histórico preserva código e descrição apresentada.

## 9.2 Novo Cliente / Qualificado

No campo **Passo atual da oportunidade**, incluir ícone de informação.

A ajuda deve explicar cada status:

- significado;
- quando usar;
- efeito no Mentor Comercial;
- próxima ação esperada;
- se cria agendamento;
- se altera temperatura/prioridade;
- se aparece na Rotina;
- se entra em métricas.

Não usar tooltip genérico. A explicação deve ser operacional.

---

# 10. Integração com o Módulo Gerencial

## 10.1 Responsabilidade

O vendedor:

- registra;
- conclui;
- solicita regularização.

O gerente:

- acompanha;
- cobra;
- aprova ou recusa regularização;
- confirma Agenda D+1;
- audita;
- não lança venda ou atendimento no lugar do vendedor.

## 10.2 Contabilização

### Finalizado no prazo

Contabiliza normalmente.

### D-1 pendente após 12:00

- não bloqueia D0;
- aparece no Histórico;
- aparece como pendência gerencial;
- não contabiliza como fechamento oficial.

### Regularização aguardando aprovação

- não entra em Dashboard, Funil ou Ranking como oficial;
- permanece em auditoria.

### Regularização aprovada

- passa a contabilizar;
- preserva versão original;
- recalcula somente os indicadores dependentes;
- registra penalização de atraso na Disciplina quando aplicável.

### Regularização recusada

- não contabiliza;
- preserva dados e motivo da decisão.

---

# 11. Fechamento até 12:00 × Agenda D+1 até 09:30

Existem duas janelas diferentes e elas não devem ser confundidas.

## 11.1 Janela do Fechamento Diário

- D-1 pode ser finalizado até 12:00;
- depois de 12:00, a tela principal muda para D0;
- D-1 pendente passa para regularização.

## 11.2 Janela de consolidação da Agenda D+1

- após finalizar o fechamento, leads, atendimentos e vendas daquela data ficam bloqueados;
- D+1 pode ser ajustado até 09:30 do dia seguinte;
- às 09:31 é criado o snapshot oficial da agenda e da Disciplina;
- alterações posteriores não podem reescrever o snapshot silenciosamente;
- mudanças depois de 09:31 precisam de log, versão e liberação.

## 11.3 Cenário de fechamento entre 09:31 e 12:00

O fechamento ainda pode ser concluído dentro da janela operacional, mas:

- agendamentos D+1 incluídos ou alterados após 09:31 são tardios;
- devem gerar versão/log;
- não podem substituir silenciosamente o snapshot oficial das 09:31;
- o gerente deve enxergar a alteração tardia.

---

# 12. Persistência e integridade

## 12.1 Restrições

Criar índice único equivalente a:

```sql
unique (
  seller_user_id,
  reference_date,
  metric_scope
)
```

Incluir `store_id` caso a arquitetura permita o mesmo vendedor em mais de uma loja no mesmo período.

## 12.2 Separação obrigatória

D-1 e D0 devem ter:

- registros separados;
- rascunhos separados;
- progresso separado;
- status separado;
- timestamps separados;
- eventos separados;
- snapshots separados.

## 12.3 Atualização atômica

Finalização precisa ser idempotente.

Repetir clique, refresh ou retorno de rede não pode:

- duplicar venda;
- duplicar fechamento;
- duplicar eventos;
- criar dois registros para a mesma data;
- apagar D0;
- reabrir D-1 incorretamente.

## 12.4 Auditoria mínima

Salvar:

- usuário;
- perfil;
- loja;
- data operacional;
- data/hora real;
- fuso;
- status anterior;
- status novo;
- valores anteriores;
- valores novos;
- origem da ação;
- versão;
- aprovação/recusa;
- responsável pela decisão.

---

# 13. Estados de interface obrigatórios

- carregando D-1;
- carregando D0;
- salvando rascunho;
- finalizando;
- troca automática de D-1 para D0;
- erro ao finalizar;
- finalização já processada;
- D-1 concluído;
- D-1 pendente;
- D0 aberto;
- D0 em andamento;
- D0 concluído;
- regularização em análise;
- regularização aprovada;
- regularização recusada;
- erro de fuso/data;
- conflito de versão;
- sem conexão;
- retomada após refresh.

---

# 14. Critérios de aceite obrigatórios

## FEV-DATA-01 — Antes de 12:00 com D-1 pendente

1. Simular 09/07 às 08:15;
2. D-1 = 08/07 pendente;
3. Abrir a tela;
4. D-1 pode ser priorizado;
5. Finalizar D-1;
6. Persistir D-1;
7. Tela muda para D0 = 09/07;
8. Card verde de 08/07 aparece;
9. D0 começa em 0% ou no progresso real;
10. Campos de D0 ficam editáveis.

## FEV-DATA-02 — Antes de 12:00 com D-1 concluído

- tela principal abre diretamente em D0;
- card de D-1 concluído aparece;
- não mostrar "Ontem" como tela ativa;
- não herdar 100%;
- não aguardar 12:00.

## FEV-DATA-03 — Depois de 12:00 com D-1 concluído

- tela principal = D0;
- card verde = D-1 concluído;
- D0 editável;
- resumo = hoje.

## FEV-DATA-04 — Depois de 12:00 com D-1 pendente

- tela principal = D0;
- card de alerta = D-1 pendente;
- D-1 aparece no Histórico;
- botão regularizar abre D-1;
- D0 continua editável.

## FEV-DATA-05 — D0 em andamento

- refresh mantém D0;
- progresso real é carregado;
- dados não somem;
- D-1 não reaparece como tela principal indevidamente.

## FEV-DATA-06 — D0 sem registro

- progresso 0%;
- formulário vazio;
- status aberto;
- nenhum dado herdado.

## FEV-DATA-07 — D0 concluído

- D0 bloqueado;
- status de hoje concluído;
- não abrir amanhã antecipadamente.

## FEV-DATA-08 — Idempotência

- duplo clique em finalizar produz um único fechamento;
- uma única venda por evento;
- nenhuma duplicidade por data operacional.

## FEV-DATA-09 — Fuso horário

- executar próximo da meia-noite;
- `reference_date` permanece correta em São Paulo;
- não usar UTC para definir Hoje/Ontem na interface.

## FEV-DATA-10 — Histórico

- Ajustar 08/07 carrega somente 08/07;
- regularização não modifica 09/07;
- retorno mantém data e contexto;
- campo "Observações Operacionais (Justificativa)" não existe.

## FEV-DATA-11 — Gerencial

- pendência aparece para o gerente;
- regularização aguardando não contabiliza;
- aprovação contabiliza e versiona;
- recusa preserva auditoria.

## FEV-DATA-12 — Snapshot D+1

- até 09:30 permite ajuste;
- às 09:31 consolida;
- alteração posterior cria log/versão;
- não reescreve snapshot silenciosamente.

## FEV-FORM-01 — Garantia

- responsável é lista oficial;
- data padrão = D+1;
- hora padrão = 09:00;
- descrição depende do motivo;
- "Outro" abre texto obrigatório.

## FEV-FORM-02 — Qualificado

- ícone de informação aparece;
- todos os status possuem explicação;
- ajuda informa consequência operacional.

---

# 15. Alterações no backlog

## Remover

- "Decidir política oficial de horário do Fechamento";
- "Avaliar se edição rápida deve voltar ao Fechamento".

## Adicionar como P0

1. Implementar `ActiveClosingContext`;
2. Separar bloqueio por data operacional;
3. Transicionar D-1 → D0 imediatamente após conclusão;
4. Forçar D0 como principal a partir de 12:00;
5. Criar cards de D-1 concluído e pendente;
6. Impedir herança de progresso;
7. Garantir unicidade por vendedor + data + escopo;
8. Criar testes de fuso, refresh e idempotência;
9. Integrar estados com Histórico/Regularização;
10. Conciliar janela de 12:00 com snapshot D+1 de 09:31.

## Adicionar como P1

1. Ajustar formulário de Garantia;
2. Criar catálogo motivo → descrição;
3. Criar ajuda dos status de Qualificado;
4. Remover Observações Operacionais do Ajustar;
5. Melhorar textos pós-finalização;
6. Preservar navegação contextual.

---

# 16. Veredito atualizado

O problema central do Fechamento Diário não é apenas visual.

É uma falha de modelagem de estado:

```text
status global
```

está sendo usado onde deveria existir:

```text
status por vendedor + data operacional + escopo
```

A correção deve ocorrer em quatro níveis:

1. seleção da data operacional;
2. persistência separada de D-1 e D0;
3. hierarquia visual com card anterior + formulário atual;
4. integração auditável com Histórico e Módulo Gerencial.

Somente alterar o rótulo "Ontem" para "Hoje" produziria uma tela bonita e ainda errada, a especialidade favorita de sistemas que fingem funcionar.
