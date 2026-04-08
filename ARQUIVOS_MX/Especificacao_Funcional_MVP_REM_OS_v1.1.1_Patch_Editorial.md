# Especificação Funcional MVP
## Produto: REM OS / REM Control Center Brasil
## Versão: 1.1
## Data: 2026-04-02
## Base: PRD REM Gestão Nacional v1.2
## Status: Documento funcional consolidado para UX, engenharia, automação, QA e freeze MVP

---

## 1. Objetivo desta especificação

Este documento transforma o PRD em especificação funcional do MVP, com foco em:
- fluxos fechados
- regras de negócio operacionais
- matriz de permissões
- estados e transições
- campos obrigatórios por tela
- critérios objetivos por ação
- regras de validação
- comportamento esperado do sistema
- condições de bloqueio, alerta e auditoria

Este documento é a base para:
- design de telas
- modelagem de banco
- APIs
- automações
- histórias de usuário
- QA funcional
- testes de aceite do MVP

---

## 2. Escopo do MVP

O MVP cobre:

1. portal público / landing page
2. autenticação e controle de acesso
3. gestão de sedes
4. gestão de usuários e papéis
5. gestão de conteúdo oficial com versionamento
6. gestão de edições
7. gestão de casais, famílias/equipes e staff
8. trilha operacional por ACTO
9. checklist de compras, logística e execução por ACTO
10. leitura obrigatória e compliance
11. notificações e alertas operacionais mínimos
12. auditoria de acessos e consumo
13. homologação de sedes com scorecard
14. dashboards nacional e local
15. upload de evidências e relatórios exportáveis básicos

Fora do MVP:
- app nativo
- NFC
- offline completo
- automação avançada de WhatsApp
- financeiro completo
- inscrições públicas internas avançadas
- edição colaborativa simultânea rica

---

## 3. Princípios funcionais obrigatórios

1. Todo ACTO é uma entidade, não apenas um PDF anexado.
2. Nenhuma sede local pode sobrescrever conteúdo oficial global.
3. Todo conteúdo obrigatório possui rastreabilidade de consumo.
4. Todo ACTO do evento deve ser navegável com material, responsável, checklist e status.
5. Todo ciclo de homologação deve deixar evidência auditável da decisão.
6. O sistema deve impedir execução “às cegas” quando faltar item crítico.
7. A mesma plataforma deve servir à direção nacional e ao diretor local com visões diferentes do mesmo domínio.
8. O sistema deve ser simples para operação de campo e forte para governança.

---

## 4. Modelo de domínio funcional do MVP

### 4.1 Entidades centrais
- Sede
- Usuário
- Papel
- Edição
- Casal participante
- Participante individual
- Família/Equipe
- Staff da edição
- ACTO
- Versão de ACTO
- Conteúdo oficial
- Versão de conteúdo
- Checklist
- Item de checklist
- Evidência
- Log de acesso
- Confirmação de leitura
- Incidente
- Avaliação de homologação
- Scorecard de homologação
- Penalidade
- Notificação
- Página pública

### 4.2 Hierarquia funcional
- Direção nacional gerencia sedes
- Sede possui múltiplas edições
- Edição possui 30 ACTOS padrão do REM
- Edição possui casais, famílias/equipes e staff
- Cada ACTO possui conteúdo, responsáveis, checklists e evidências
- Cada conteúdo possui versões e regras de leitura
- Cada sede possui ciclo de homologação com avaliações

---

## 5. Papéis e matriz de permissões do MVP

Legenda:
- V = visualizar
- C = criar
- E = editar
- P = publicar/aprovar
- D = baixar/exportar
- X = executar ação operacional
- A = auditar/ver logs
- N = não permitido

### 5.1 Papéis
- Super Admin Nacional
- Diretor Nacional
- Avaliador/Homologador
- Diretor Local
- Coordenador Operacional Local
- Staff/Guia/Preletor/Mídia
- Participante Público

### 5.2 Matriz resumida

| Módulo / Ação | Super Admin | Diretor Nacional | Avaliador | Diretor Local | Coord. Local | Staff | Público |
|---|---|---|---|---|---|---|---|
| Landing page pública | V/E/P | V/E/P | V | V | V | V | V |
| Cadastro de sede | C/E/P/A | V/E/P/A | V | N | N | N | N |
| Gestão de usuários nacionais | C/E/P/A | V/E/A | N | N | N | N | N |
| Gestão de usuários locais da sede | V/E/A | V/E/A | N | C/E | E restrito | N | N |
| Criar edição | C/E | V/E | V | C/E na própria sede | E restrito | N | N |
| Ver dashboard nacional | V/A | V/A | V parcial | N | N | N | N |
| Ver dashboard local | V | V | V | V | V | V parcial | N |
| Ver trilha por ACTO | V | V | V | V | V | V restrito | N |
| Editar ACTO oficial global | C/E/P | E/P | N | N | N | N | N |
| Editar observação local do ACTO | V | V | V | E | E | E restrito se delegado | N |
| Criar checklist por ACTO | V | V | V | C/E | E | E restrito se delegado | N |
| Marcar item de checklist | V | V | V | X | X | X se delegado | N |
| Subir conteúdo oficial | C/E/P | E/P | N | N | N | N | N |
| Subir evidência local | V | V | V | C/E | C/E | C/E se delegado | N |
| Confirmar leitura obrigatória | V | V | V | X | X | X | N |
| Ver logs de auditoria | V/A | V/A | V/A parcial homologação | V parcial própria sede | V parcial própria sede | N | N |
| Criar avaliação de homologação | V | V | C/E | N | N | N | N |
| Decidir homologação | C/E/P | E/P | recomendação | N | N | N | N |
| Registrar penalidade | C/E/P | E/P | C sugestão | N | N | N | N |
| Exportar relatório | V/D | V/D | V/D | V/D própria sede | V/D própria sede | D restrito | N |

### 5.3 Regras de permissão
1. Diretor Local só opera a própria sede.
2. Coordenador Local só atua nas edições da própria sede.
3. Staff só vê ACTOS, arquivos e tarefas vinculadas ao papel e/ou edição.
4. Avaliador não publica conteúdo oficial.
5. Só Super Admin e Diretor Nacional podem aprovar publicação oficial.
6. Dados sensíveis de saúde só podem ser visualizados por perfis autorizados por política de acesso.
7. Logs completos são restritos ao nível nacional; a sede vê somente sua trilha local.

---

## 6. Estados e transições do domínio

## 6.1 Sede

### Estados
- em implantação
- aguardando 1ª edição
- 1ª edição concluída
- 2ª edição concluída
- 3ª edição em avaliação
- homologada
- em reciclagem
- aguardando nova edição
- suspensa
- inativa

### Transições válidas
- em implantação -> aguardando 1ª edição
- aguardando 1ª edição -> 1ª edição concluída
- 1ª edição concluída -> 2ª edição concluída
- 2ª edição concluída -> 3ª edição em avaliação
- 3ª edição em avaliação -> homologada
- 3ª edição em avaliação -> em reciclagem
- em reciclagem -> aguardando nova edição
- qualquer estado ativo -> suspensa
- suspensa -> aguardando nova edição ou inativa
- homologada -> suspensa ou inativa
- qualquer estado -> inativa

### Regras
- Não existe homologação antes da 3ª edição concluída com avaliação válida.
- “Homologada” exige média mínima, ausência de critério eliminatório e parecer favorável.
- “Em reciclagem” exige plano corretivo aberto.
- O estado “aguardando nova edição” é usado para sedes que já possuem histórico e aguardam uma nova edição após reciclagem, reativação ou nova rodada aprovada pela direção.

---

## 6.2 Edição

### Estados
- rascunho
- em preparação
- pronta
- em execução
- concluída
- concluída com ressalvas
- cancelada

### Transições válidas
- rascunho -> em preparação
- em preparação -> pronta
- pronta -> em execução
- em execução -> concluída
- em execução -> concluída com ressalvas
- rascunho -> cancelada
- em preparação -> cancelada

### Regras para “pronta”
A edição só pode ser marcada como pronta quando:
- possuir data, local e sede válidos
- possuir trilha de 30 ACTOS replicada
- possuir staff mínimo obrigatório
- possuir responsável principal para todos os ACTOS
- possuir checklist crítico da edição acima de 90% concluído
- não possuir item crítico vencido em aberto
- possuir leitura obrigatória mínima dos perfis críticos acima de 80%

### Staff mínimo obrigatório da edição para estado “pronta”
Papéis bloqueantes mínimos:
- 1 responsável geral da edição
- 1 diretor local ativo ou delegado formal
- 1 host / mestre de cerimônias ativo
- 1 responsável de logística ativo
- 1 responsável de mídia / audiovisual ativo
- 1 responsável de saúde / segurança ou primeiros socorros ativo
- mínimo de 1 guia ativo para cada 10 casais confirmados, com arredondamento para cima
- responsáveis principais definidos para os 30 ACTOS

### Regras de bloqueio por staff mínimo
- ausência de qualquer papel bloqueante impede mudança da edição para “pronta”
- quantidade de guias abaixo da proporção mínima impede mudança da edição para “pronta”
- papéis bloqueantes podem ser acumulados pela mesma pessoa somente quando compatíveis e aprovados pela direção local

### Regras para “em execução”
- só pode iniciar se estado atual = pronta
- o sistema grava timestamp de início
- a edição entra em visão de guerra automaticamente

---

## 6.3 ACTO

### Estados
- não iniciado
- em preparação
- pronto
- aguardando início
- iniciado no horário
- iniciado com atraso
- em execução
- pausado
- concluído no horário
- concluído com atraso
- concluído com ressalva
- bloqueado
- cancelado

### Transições válidas
- não iniciado -> em preparação
- em preparação -> pronto
- pronto -> aguardando início
- aguardando início -> iniciado no horário
- aguardando início -> iniciado com atraso
- iniciado no horário -> em execução
- iniciado com atraso -> em execução
- em execução -> pausado
- pausado -> em execução
- em execução -> concluído no horário
- em execução -> concluído com atraso
- em execução -> concluído com ressalva
- qualquer estado operacional -> bloqueado
- aguardando início -> cancelado

### Regras para “pronto”
- responsável principal definido
- checklist crítico do ACTO 100% concluído
- materiais obrigatórios marcados como disponíveis
- conteúdos obrigatórios do papel principal confirmados
- dependências anteriores satisfeitas

### Regras para iniciar ACTO
- o ACTO só pode ser iniciado a partir de “aguardando início”
- a transição de “pronto” para “aguardando início” ocorre automaticamente a partir de T-15 minutos do horário previsto ou manualmente por usuário autorizado
- se horário real <= horário planejado + tolerância de 5 min => iniciado no horário
- se horário real > horário planejado + 5 min => iniciado com atraso

### Regras de encerramento
- concluído no horário: terminou até 5 min após o previsto
- concluído com atraso: ultrapassou tolerância
- concluído com ressalva: existe incidente grave ou pendência registrada

---

## 6.4 Conteúdo oficial

### Estados
- rascunho
- em revisão
- aprovado para publicação
- publicado
- superseded
- arquivado
- bloqueado

### Transições válidas
- rascunho -> em revisão
- em revisão -> aprovado para publicação
- aprovado para publicação -> publicado
- publicado -> superseded
- superseded -> arquivado
- qualquer estado -> bloqueado

### Regras
- conteúdo oficial global não pode ir direto de rascunho para publicado
- publicação exige changelog
- publicação de nova versão obrigatória invalida ciência da versão anterior para perfis impactados

---

## 6.5 Leitura e treinamento

### Estados de leitura
- não aberto
- aberto
- consumido parcialmente
- consumido minimamente
- leitura confirmada
- expirado por nova versão

### Estados de treinamento
- não atribuído
- atribuído
- em andamento
- concluído
- bloqueado por pendência

### Regras
- leitura confirmada sem consumo mínimo é inválida
- leitura expirada por nova versão volta a exigir consumo e confirmação
- treinamento concluído exige todos os itens obrigatórios do pacote do papel

---

## 7. Fluxos fechados do MVP

## 7.1 Fluxo 1 - Cadastro e ativação de sede

### Objetivo
Permitir à direção nacional criar uma nova sede com diretor local e iniciar o ciclo de homologação.

### Passo a passo
1. Super Admin ou Diretor Nacional acessa “Sedes”.
2. Clica em “Nova sede”.
3. Preenche dados obrigatórios.
4. Sistema valida unicidade de nome + cidade + estado.
5. Usuário vincula diretor local principal.
6. Sistema cria sede em estado “em implantação”.
7. Usuário define data prevista da primeira edição.
8. Sistema muda para “aguardando 1ª edição” se data estiver preenchida e diretor local ativo.

### Campos obrigatórios
- nome da sede
- país
- estado
- cidade
- diretor local principal
- e-mail institucional ou principal
- telefone principal
- data prevista da 1ª edição

### Critérios objetivos por ação
- Salvar sede: todos campos obrigatórios válidos; status inicial definido automaticamente pelo sistema como “em implantação”
- Ativar sede para edição: diretor local ativo + data da 1ª edição + sede não inativa

---

## 7.2 Fluxo 2 - Criação de edição local

### Objetivo
Criar uma edição a partir do template oficial REM com 30 ACTOS.

### Passo a passo
1. Diretor Local acessa “Edições”.
2. Clica em “Nova edição”.
3. Seleciona sede.
4. Informa nome da edição, local e datas.
5. Sistema replica template padrão de 30 ACTOS.
6. Sistema cria edição em “rascunho”.
7. Diretor preenche dados complementares e avança para “em preparação”.

### Campos obrigatórios
- sede
- nome da edição
- data de início
- data de término
- local principal
- template oficial aplicado
- responsável geral da edição

### Regras
- edição deve pertencer a uma sede ativa
- não pode existir edição com mesmo nome e mesma data na mesma sede
- template padrão é obrigatório no MVP

### Critérios objetivos por ação
- “Criar edição”: template aplicado + campos obrigatórios completos
- “Enviar para preparação”: 30 ACTOS replicados com ordem válida

---

## 7.3 Fluxo 3 - Cadastro/importação de casais

### Objetivo
Registrar casais participantes da edição.

### Formas no MVP
- cadastro manual
- importação CSV padronizada

### Passo a passo manual
1. Diretor ou Coordenador acessa “Casais”.
2. Clica em “Novo casal”.
3. Preenche dados dos dois participantes.
4. Sistema vincula participantes ao casal.
5. Usuário define status inicial.
6. Sistema salva casal em “pré-inscrito” ou “confirmado”.

### Campos obrigatórios do casal
- nome completo participante A
- nome completo participante B
- telefone principal
- status do casal
- edição vinculada

### Campos recomendados
- e-mail principal
- data de nascimento
- contato de emergência
- alergias / restrições
- observações
- termo assinado
- presença esperada

### Regras
- um participante não pode pertencer a dois casais na mesma edição
- dados de saúde exigem perfil autorizado
- no MVP, presença é marcada por casal, não individualmente

### Critérios objetivos por ação
- “Confirmar casal”: nomes válidos + telefone principal + edição + sem conflito de vínculo
- “Marcar presente”: edição em execução ou concluída

---

## 7.4 Fluxo 4 - Formação de famílias/equipes

### Objetivo
Distribuir casais e guias em grupos operacionais.

### Passo a passo
1. Diretor abre “Famílias/Equipes”.
2. Cria grupo com cor/número/nome.
3. Vincula guia principal.
4. Adiciona casais ao grupo.
5. Sistema mostra capacidade e distribuição.
6. Usuário salva.

### Campos obrigatórios
- edição
- identificador da família/equipe
- guia principal
- ao menos 1 casal

### Regras
- casal não pode estar em duas famílias na mesma edição
- guia pode liderar múltiplas famílias apenas se política permitir
- equipe pode ser reorganizada até o início da edição

### Critérios objetivos por ação
- “Salvar família”: identificador único + guia válido + pelo menos 1 casal
- “Fechar alocação de famílias”: todos os casais confirmados alocados ou explicitamente marcados como pendentes

---

## 7.5 Fluxo 5 - Publicação de conteúdo oficial

### Objetivo
Publicar nova versão oficial de conteúdo com rastreabilidade.

### Passo a passo
1. Autor cria ou edita conteúdo.
2. Envia para revisão.
3. Revisor aprova.
4. Aprovador nacional marca “aprovado para publicação”.
5. Publicador publica.
6. Sistema gera nova versão, changelog e notifica impactados.
7. Sistema marca versão anterior como superseded quando aplicável.

### Campos obrigatórios
- título
- tipo
- escopo (global/local)
- descrição
- versão
- changelog
- público impactado
- leitura obrigatória sim/não
- anexos ou corpo do conteúdo

### Regras
- conteúdo global exige fluxo editorial completo
- conteúdo local complementar não substitui o global
- publicação sem changelog é bloqueada

### Critérios objetivos por ação
- “Enviar para revisão”: título + corpo/arquivo + tipo
- “Publicar”: changelog + público impactado + status aprovado para publicação

---

## 7.6 Fluxo 6 - Consumo de conteúdo obrigatório

### Objetivo
Garantir ciência real do conteúdo por papel e edição.

### Passo a passo
1. Usuário acessa conteúdo obrigatório.
2. Sistema registra abertura.
3. Usuário consome conteúdo.
4. Sistema mede consumo mínimo.
5. Usuário confirma leitura.
6. Sistema grava acknowledgement.
7. Conteúdo passa a constar como “lido” para aquele usuário/versão.

### Critérios objetivos por tipo
- documento textual: permanência mínima de 45 segundos por 500 palavras ou confirmação após scroll mínimo de 80%
- vídeo: mínimo de 80% reproduzido
- checklist: todos os itens do pacote marcados
- arquivo de impressão: download + confirmação manual

### Regras
- só confirmação sem consumo mínimo = inválido
- nova versão obrigatória expira a anterior
- perfil sem leitura obrigatória concluída pode ser bloqueado para executar ACTO crítico

---

## 7.7 Fluxo 7 - Preparação do ACTO

### Objetivo
Deixar um ACTO elegível para execução.

### Passo a passo
1. Diretor/Coordenador abre o ACTO.
2. Define responsável principal.
3. Confere materiais críticos.
4. Preenche checklist de compras/logística.
5. Confere leitura obrigatória do papel principal.
6. Marca materiais como disponíveis.
7. Sistema valida dependências.
8. ACTO pode ir para “pronto”.
9. Em T-15 minutos, ou por comando de usuário autorizado, o sistema move o ACTO para “aguardando início”.

### Campos obrigatórios por ACTO
- responsável principal
- horário previsto
- local/cenário
- checklist crítico completo
- materiais obrigatórios disponíveis
- versão oficial do conteúdo vinculada

### Critérios objetivos por ação
- “Marcar pronto”: checklist crítico = 100%, responsável principal definido, materiais obrigatórios disponíveis, conteúdo obrigatório lido, dependência anterior satisfeita
- “Marcar em preparação”: basta abertura do ACTO e qualquer alteração local relevante

---

## 7.8 Fluxo 8 - Execução ao vivo do ACTO

### Objetivo
Operar o cronograma em tempo real.

### Passo a passo
1. ACTO chega em “aguardando início”.
2. Diretor ou responsável autorizado clica “Iniciar ACTO”.
3. Sistema compara horário real vs previsto.
4. ACTO assume estado iniciado no horário ou com atraso.
5. Sistema abre área de observações, incidentes e tempo real.
6. Ao término, responsável clica “Encerrar ACTO”.
7. Sistema calcula resultado e status final.
8. Se houver incidente crítico, exige justificativa.

### Campos obrigatórios para encerramento
- hora real de término
- status final
- justificativa se atraso > 5 min
- justificativa se concluído com ressalva
- evidência opcional, obrigatória se incidente crítico

### Critérios objetivos por ação
- “Iniciar ACTO”: estado = aguardando início; dependências satisfeitas
- “Encerrar ACTO”: hora de término preenchida
- “Concluir com ressalva”: incidente grave ou pendência registrada obrigatória

---

## 7.9 Fluxo 9 - Registro de incidente

### Objetivo
Documentar desvios de padrão durante preparação ou execução.

### Passo a passo
1. Usuário autorizado abre “Registrar incidente”.
2. Seleciona edição e ACTO.
3. Seleciona categoria.
4. Descreve ocorrido.
5. Define severidade.
6. Anexa evidência se necessário.
7. Salva incidente.

### Campos obrigatórios
- edição
- ACTO
- categoria
- severidade
- descrição
- responsável pelo registro
- data/hora

### Severidade
- baixa
- média
- alta
- crítica

### Regras
- incidente crítico exige plano de ação ou observação de tratamento
- incidente crítico pode forçar ACTO a “concluído com ressalva”
- incidente crítico de segurança entra na avaliação de homologação

---

## 7.10 Fluxo 10 - Avaliação de homologação

### Objetivo
Avaliar sede dentro do ciclo de 3 edições.

### Passo a passo
1. Avaliador abre a edição elegível.
2. Preenche scorecard por dimensão.
3. Marca critérios eliminatórios se aplicável.
4. Anexa relatório e evidências.
5. Emite parecer.
6. Direção nacional revisa.
7. Sistema calcula média do ciclo.
8. Direção define resultado final.

### Campos obrigatórios
- edição avaliada
- avaliador
- nota por dimensão
- parecer textual
- evidências mínimas
- indicação de eliminatório sim/não

### Critérios objetivos por ação
- “Salvar avaliação”: todas as dimensões preenchidas
- “Fechar avaliação”: nota total calculada + parecer + evidências mínimas
- “Homologar sede”: 3 edições avaliadas + média >= 85 + sem eliminatório + parecer favorável
- “Reciclar sede”: média < 80 ou eliminatório

---

## 8. Campos obrigatórios por tela do MVP

## 8.1 Tela: Nova Sede
Obrigatórios:
- nome da sede
- país
- estado
- cidade
- diretor local principal
- telefone principal
- e-mail principal
- data prevista da 1ª edição

Somente leitura/calculado pelo sistema:
- status inicial

Ações:
- salvar rascunho
- ativar sede
- cancelar

Validações:
- nome + cidade + estado não duplicados
- diretor local deve existir e estar ativo

---

## 8.2 Tela: Nova Edição
Obrigatórios:
- sede
- nome da edição
- data início
- data término
- local principal
- responsável geral
- template oficial

Ações:
- criar edição
- salvar rascunho
- cancelar

Validações:
- data início <= data término
- template oficial obrigatório
- sede ativa

---

## 8.3 Tela: Cadastro de Casal
Obrigatórios:
- edição
- nome participante A
- nome participante B
- telefone principal
- status inicial

Recomendados:
- e-mail principal

Ações:
- salvar
- salvar e adicionar outro
- cancelar

Validações:
- sem participante duplicado no mesmo casal/edição
- status deve ser válido

---

## 8.4 Tela: Família/Equipe
Obrigatórios:
- edição
- identificador
- guia principal
- ao menos um casal

Ações:
- salvar
- distribuir automaticamente
- remover casal
- fechar distribuição

Validações:
- identificador único por edição
- casal não duplicado em múltiplas famílias

---

## 8.5 Tela: Conteúdo Oficial
Obrigatórios:
- título
- tipo
- escopo
- versão
- descrição
- changelog
- público impactado
- status

Ações:
- salvar rascunho
- enviar revisão
- aprovar
- publicar
- arquivar

Validações:
- changelog obrigatório para publicar
- arquivo ou corpo obrigatório
- fluxo editorial obrigatório para global

---

## 8.6 Tela: ACTO
Obrigatórios para operação:
- responsável principal
- horário previsto
- local/cenário
- versão oficial vinculada
- checklist crítico completo para “pronto”

Blocos da tela:
- cabeçalho
- contexto
- materiais
- guião
- passo a passo
- responsáveis
- anexos
- checklist compras
- checklist execução
- compliance
- evidências
- observações
- incidentes

Ações:
- marcar em preparação
- marcar pronto
- iniciar
- pausar
- encerrar
- registrar incidente
- subir evidência

---

## 8.7 Tela: Avaliação de Homologação
Obrigatórios:
- edição
- avaliador
- notas por dimensão
- parecer
- evidências mínimas
- critérios eliminatórios

Ações:
- salvar parcial
- fechar avaliação
- recomendar homologação
- recomendar reciclagem

Validações:
- todas as dimensões preenchidas
- não permitir fechamento sem parecer e evidência mínima

---

## 8.8 Tela: Dashboard Nacional
KPIs obrigatórios:
- sedes totais
- sedes homologadas
- sedes em reciclagem
- edições futuras
- compliance de leitura
- ACTOS com pendência crítica
- atualizações publicadas

Filtros:
- período
- estado
- sede
- status homologação

Ações:
- ver detalhes da sede
- abrir edição
- abrir relatório
- exportar

---

## 8.9 Tela: Dashboard Local
KPIs obrigatórios:
- edição atual/próxima
- casais confirmados
- famílias montadas
- staff ativo
- ACTOS prontos
- pendências críticas
- materiais faltando
- leitura obrigatória pendente

Ações:
- abrir ACTO
- abrir checklist consolidado
- abrir casais
- abrir famílias
- abrir staff
- exportar relatório

---

## 9. Regras de negócio operacionais consolidadas

1. Todo ACTO do MVP pertence a uma edição.
2. Toda edição do MVP nasce a partir do template oficial de 30 ACTOS.
3. Todo ACTO deve ter uma versão oficial de conteúdo vinculada.
4. Nenhum ACTO crítico pode iniciar sem responsável principal definido.
5. Nenhum ACTO crítico pode iniciar sem checklist crítico concluído.
6. Direção nacional pode bloquear uso de conteúdo superseded como oficial.
7. Leitura obrigatória expira quando uma nova versão obrigatória é publicada.
8. Staff sem compliance crítico pode ser marcado como “bloqueado para execução”.
9. Sede local não pode editar objetivo oficial do ACTO.
10. Evidência de homologação é obrigatória para decisão final.
11. Critério eliminatório sempre se sobrepõe à nota.
12. Penalidade financeira extra só pode ser aplicada após a terceira edição do ciclo.
13. Dados de saúde exigem acesso restrito e trilha de auditoria.
14. Toda ação sensível deve gerar log auditável.
15. O sistema deve mostrar claramente quando o conteúdo local é complementar e não oficial.

---

## 9.1 Regras operacionais de dados sensíveis e LGPD no MVP
- coleta mínima: somente dados estritamente necessários para segurança, operação e contato de emergência
- base legal operacional do MVP: consentimento explícito para dados sensíveis de saúde e uso excepcional por proteção da vida / incolumidade física em contexto emergencial
- retenção padrão: 180 dias após o encerramento da edição
- retenção estendida: permitida quando houver incidente, disputa, exigência legal ou processo de homologação em aberto
- mascaramento padrão: dados sensíveis devem aparecer mascarados para perfis sem autorização plena
- exportação de dados sensíveis: somente para perfis autorizados e com justificativa registrada em log
- exclusão ou anonimização: permitida quando não houver obrigação legal, incidente aberto ou retenção excepcional aplicável
- acesso emergencial: permitido por mecanismo de break-glass com justificativa obrigatória e auditoria reforçada
- toda visualização, edição, exportação e exclusão de dado sensível deve gerar log auditável específico

## 9.2 Regras congeladas de compliance do MVP
Critérios fixos de consumo:
- documento textual obrigatório: confirmação manual + permanência mínima de 45 segundos a cada 500 palavras ou scroll mínimo de 80%
- vídeo obrigatório: mínimo de 80% de reprodução
- checklist de treinamento: 100% dos itens obrigatórios do pacote
- arquivo de impressão obrigatório: download + confirmação manual de ciência

Perfis que exigem leitura obrigatória vigente no MVP quando vinculados à edição:
- diretor local
- coordenador operacional local
- host / mestre de cerimônias
- responsável principal do ACTO
- guias ativos
- preletores ativos
- responsável de mídia / audiovisual quando o ACTO depender de apresentação, vídeo ou telão
- avaliador / homologador para o pacote de avaliação

Faltas de compliance que bloqueiam ACTO:
- responsável principal sem leitura vigente do pacote obrigatório do ACTO
- host sem leitura vigente do guião do ACTO quando atuar como papel principal
- preletor sem leitura vigente do conteúdo do ACTO quando atuar como papel principal
- responsável de mídia sem leitura vigente do pacote audiovisual do ACTO quando houver dependência crítica
- materiais críticos não confirmados como disponíveis

Faltas de compliance que geram apenas alerta:
- staff de apoio não crítico com leitura pendente
- usuário não escalado para o ACTO com leitura pendente
- conteúdo complementar local não lido
- consumo parcial sem papel bloqueante vinculado

## 10. Relatórios mínimos do MVP

### 10.1 Relatórios nacionais
- sedes por status
- ciclo de homologação por sede
- compliance de leitura por sede
- conteúdos oficiais mais acessados
- conteúdos obrigatórios não consumidos
- incidentes por edição
- pendências críticas por ACTO

### 10.2 Relatórios locais
- checklist consolidado da edição
- materiais faltantes
- responsáveis por ACTO
- casais por família/equipe
- presença/no-show
- incidentes da edição
- evidências por ACTO

### 10.3 Exportações mínimas
- CSV de casais
- CSV de checklist por edição
- PDF simples do relatório da edição
- PDF simples da avaliação de homologação

---

## 11. Regras de bloqueio do sistema

O sistema deve bloquear:
- publicação oficial sem changelog
- homologação com menos de 3 edições avaliadas
- início de ACTO sem dependências críticas cumpridas
- uso de conteúdo superseded como padrão oficial
- acesso a dados de saúde sem permissão
- fechamento de avaliação sem parecer
- marcação de edição como pronta sem staff mínimo e ACTOS com responsável

---

## 12. Alertas automáticos mínimos do MVP

1. nova versão obrigatória publicada
2. leitura obrigatória pendente
3. item crítico vencendo em 72h
4. item crítico vencido
5. ACTO sem responsável principal
6. ACTO bloqueado por dependência
7. staff bloqueado por falta de compliance
8. sede com risco de reciclagem
9. incidente crítico registrado
10. avaliação de homologação pendente

---

## 13. Critérios de aceite por módulo do MVP

## 13.1 Gestão de Sedes
Aceito quando:
- cria, edita e altera status corretamente
- vincula diretor local
- registra histórico de estado

## 13.2 Edições
Aceito quando:
- cria edição a partir do template
- replica 30 ACTOS
- muda estados conforme regras

## 13.3 Casais/Famílias/Staff
Aceito quando:
- permite cadastro/importação
- permite alocação sem duplicidade
- gera listas básicas

## 13.4 CMS e Conteúdo
Aceito quando:
- versiona conteúdo
- publica com changelog
- marca superseded corretamente
- exige leitura obrigatória

## 13.5 Trilha por ACTO
Aceito quando:
- cada ACTO mostra campos obrigatórios
- bloqueia início sem dependências
- aceita evidências e incidentes

## 13.6 Auditoria
Aceito quando:
- registra abertura, consumo, confirmação, download e publicação
- diferencia usuário, sede, edição e versão

## 13.7 Homologação
Aceito quando:
- calcula score
- aplica eliminatórios
- gera decisão auditável

---

## 14. Correções obrigatórias incorporadas nesta versão
1. Nome canônico do domínio congelado como **edição / editions**
2. Máquina de estados da sede corrigida com o estado **aguardando nova edição**
3. Status inicial da sede definido pelo sistema
4. Estado **aguardando início** mantido como intermediário obrigatório do ACTO
5. E-mail do casal definido como opcional e recomendado no MVP
6. Staff mínimo congelado com papéis e quantidades bloqueantes
7. Regras operacionais mínimas de LGPD/dados sensíveis explicitadas para build do MVP
8. Compliance do MVP congelado com thresholds, perfis obrigatórios e regras de bloqueio/alerta

## 15. Entregáveis seguintes recomendados

Após esta especificação funcional MVP, os próximos entregáveis ideais são:
1. backlog detalhado por épico/feature/história
2. wireframes das telas críticas
3. modelo lógico do banco
4. contrato de APIs
5. plano de testes funcionais
6. plano de rollout do MVP

---

## 16. Conclusão

Este documento fecha a camada funcional do MVP do REM OS.

A partir daqui, o time não deve mais discutir “o que será o sistema” em nível abstrato. Deve discutir:
- como modelar
- como desenhar
- como implementar
- como testar
- como priorizar

Qualquer interpretação fora destas regras deve ser tratada como decisão de produto formal, e não como improviso de sprint.
