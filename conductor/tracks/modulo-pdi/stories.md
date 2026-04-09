# *stories — Módulo PDI MX 360º (Revisado v2)

---

# Story 01 — Fundação de Domínio, Catálogos, Seeds e RLS

## Objetivo
Criar a camada de dados do PDI refletindo integralmente a metodologia MX, com seeds exatos, contratos estáveis e segurança por papel.

## Escopo
### Catálogos fixos
- `pdi_niveis_cargo`
- `pdi_descritores_escala`
- `pdi_competencias`
- `pdi_indicadores`
- `pdi_acoes_sugeridas`
- `pdi_frases_inspiracionais`
- `pdi_templates_documentais`

### Tabelas transacionais
- `pdi_sessoes`
- `pdi_metas`
- `pdi_avaliacoes_competencia`
- `pdi_top_gaps_snapshot`
- `pdi_plano_acao`
- `pdi_objetivos_pessoais`
- `pdi_acoes_medicao_competencia`
- `pdi_reviews`
- `pdi_evidencias`
- `pdi_aprovacoes`
- `pdi_audit_logs`

### RPCs obrigatórias
- `get_pdi_form_template(cargo_id uuid)`
- `get_pdi_competency_scale(cargo_id uuid)`
- `get_suggested_actions(competencia_id uuid)`
- `create_pdi_session_bundle(payload jsonb)`
- `get_pdi_print_bundle(sessao_id uuid)`
- `approve_pdi_action_evidence(action_id uuid, approval_payload jsonb)`
- `record_pdi_monthly_review(sessao_id uuid, payload jsonb)`

## Seeds obrigatórios
### Níveis
- nível 1 → 1 a 5
- nível 2 → 6 a 10
- nível 3 → 11 a 15
- nível 4 → 16 a 20
- nível 5 → 21 a 25

### Descritores por linha
- Atingiu plenamente
- Demonstra na maioria das vezes
- Demonstra em alguns momentos
- Demonstra raramente
- Nunca demonstrou

### Competências técnicas e indicadores exatos
1. Planejamento — Indicador: Qualitativo
2. Atendimento ao Cliente — Indicadores: Conversão de atendimento em venda / Volume de indicações
3. Agendamento de Visitas — Indicador: Conversão de leads em visitas
4. Fechamento de Venda — Indicador: Conversão de atendimento em venda
5. Carteira de Clientes — Indicador: Volume de vendas na carteira
6. Mídias Sociais — Indicador: Volume de vendas na carteira
7. Prospecção — Indicador: Volume de vendas na carteira
8. Avaliação de Carro — Indicador: Qualitativo
9. Financiamentos — Indicador: Qualitativo
10. Processos — Indicador: Quantidade de erros

### Competências comportamentais
1. Pontualidade — Indicador: Qualitativo
2. Senso de Urgência — Indicador: Qualitativo
3. Iniciativa — Indicador: Qualitativo
4. Organização — Indicador: Qualitativo
5. Liderança — Indicador: Qualitativo
6. Relacionamento Interpessoal — Indicador: Qualitativo
7. Persistência — Indicador: Qualitativo
8. Resiliência — Indicador: Qualitativo

### Ações sugeridas oficiais
Seedar os textos exatos do legado, incluindo:
- Planejamento
- Atendimento ao Cliente
- Agendamento de Visitas
- Fechamento de Venda
- Carteira de Clientes
- Mídias Sociais
- Prospecção
- Avaliação de Carro
- Financiamentos
- Processos
- Pontualidade
- Senso de Urgência
- Iniciativa
- Organização
- Liderança
- Relacionamento Interpessoal
- Persistência
- Resiliência

## Segurança
- vendedor: somente próprios registros
- gerente: subordinados
- dono: leitura executiva nas lojas permitidas
- admin: total + catálogos + auditoria

## Critérios de aceite
- seeds completos e exatos
- constraints:
  - máx 3 metas por prazo
  - mínimo 1 pessoal e 1 profissional por prazo
- RLS comprovado
- RPCs com testes de contrato

## Agentes AIOX
- `@architect`
- `@data-engineer`
- `@qa`

## Definition of Done
- migrations aplicadas
- seeds populados
- testes de contrato e segurança aprovados

---

# Story 02 — Cockpit do Gerente (Wizard 45 min)

## Objetivo
Construir a sessão oficial guiada do gerente, sem permitir fuga da pauta da MX.

## Escopo
### Step 1 — Metas (7 min)
- 3 slots em 6 meses
- 3 slots em 12 meses
- 3 slots em 24 meses
- cada meta com tipo:
  - pessoal
  - profissional
- validação em tempo real por prazo
- bloco “Frases para Inspirar” com frases oficiais

### Step 2 — Mapeamento (10 min)
- lista dividida em:
  - técnicas
  - comportamentais
- descrição exata por competência
- indicador exato por competência
- régua restrita ao cargo
- exibir descritor correspondente ao valor escolhido

### Step 3 — Radar + Top 5 lacunas
- radar com:
  - nota atribuída
  - alvo do cargo
- destacar automaticamente as 5 menores notas
- gerar `top_gaps_snapshot`

### Step 4 — 5 ações principais (11 min)
- exatamente 5 linhas obrigatórias
- cada linha exige:
  - competência
  - ação
  - data limite
  - impacto
  - custo
  - status inicial
  - evidência esperada
- gerente pode:
  - escolher ação sugerida oficial
  - digitar ação customizada

### Step 5 — Fechamento
- mensagem do próximo passo mensal
- equação motivacional
- checklist final do compromisso
- botão “Concluir Sessão”

## Critérios de aceite
- wizard salva draft
- wizard retoma sessão
- top 5 lacunas corretas
- não permite concluir com menos de 5 ações
- bundle completo pode ser gerado ao final

## Agentes AIOX
- `@sm`
- `@dev`
- `@ux-expert`
- `@qa`

## Definition of Done
- fluxo ponta a ponta do gerente validado

---

# Story 03 — Vendedor 1 / Radar / Gaps / Ações para Medição

## Objetivo
Reproduzir digitalmente a página “Vendedor 1”, que mistura competências, radar e ações para medição da competência.

## Escopo
### Bloco superior
- cargo
- nome do colaborador
- tabela:
  - competência
  - nota
  - alvo

### Bloco radar
- radar central
- eixos com as competências
- linha/área de nota
- linha/área de alvo

### Bloco inferior
Tabela “Ações para Medição da Competência” com:
- ação
- data
- impacto
- custo
- competência

Regra:
- este bloco é diferente do plano tabular de objetivos pessoais
- ele serve como desdobramento das lacunas do mapa

## Critérios de aceite
- página reflete a estrutura visual e lógica do legado
- radar não perde legibilidade no print
- tabela inferior suporta múltiplas linhas

## Agentes AIOX
- `@dev`
- `@ux-expert`
- `@qa`

## Definition of Done
- página “Vendedor 1” pronta e integrada ao bundle

---

# Story 04 — Bundle Documental (Capa + Vendedor 1 + PDI)

## Objetivo
Gerar o pacote documental mínimo e oficial da sessão.

## Escopo
### Documento 1 — Capa
- nome
- 3 metas de 6 meses
- 3 metas de 12 meses
- 3 metas de 24 meses
- frases inspiracionais

### Documento 2 — Vendedor 1
- competências
- nota
- alvo
- radar
- ações para medição da competência

### Documento 3 — PDI tabular
Tabela:
- característica
- itens a desenvolver
- ações de desenvolvimento
- data conclusão
- status
- evidências

### Documento opcional
- Equação da Motivação como apêndice configurável

### Requisitos técnicos
- preview em tela
- print-friendly
- exportável em PDF
- paginação consistente
- A4
- branding MX

## Critérios de aceite
- o bundle mínimo gerado é:
  - Capa
  - Vendedor 1
  - PDI
- PDF sem quebra grotesca
- assinatura/compromisso visível

## Agentes AIOX
- `@dev`
- `@ux-expert`
- `@qa`

## Definition of Done
- pacote final pronto para entrega ao vendedor

---

# Story 05 — Motor de Critérios, Escalas e Ações Sugeridas

## Objetivo
Transformar critérios, escala e recomendação em engine reproduzível e auditável.

## Escopo
- resolver alvo por cargo
- devolver faixa de nota permitida
- devolver descritor da escala
- devolver indicador da competência
- sugerir ações oficiais por competência
- ranquear prioridade por:
  - menor nota
  - distância para alvo
  - custo
  - impacto

## Regras
- nenhuma tela pode hardcodar descrição/indicador sem passar por fonte canônica
- admin pode editar catálogo de forma auditável
- mudanças de catálogo não podem quebrar sessões antigas

## Critérios de aceite
- o gerente vê exatamente o que avaliar
- o sistema recomenda ações com base na metodologia
- catálogo é versionável e auditável

## Agentes AIOX
- `@architect`
- `@data-engineer`
- `@dev`
- `@qa`

## Definition of Done
- engine aplicada em wizard, radar e plano

---

# Story 06 — Portal do Colaborador e Objetivos Pessoais

## Objetivo
Permitir que o vendedor acompanhe o plano e gerencie a tabela de ações para alcançar objetivos pessoais.

## Escopo
### Dashboard do vendedor
- metas read-only
- radar read-only
- equação motivacional
- cards de progresso

### Tabela de objetivos pessoais
- característica
- itens a desenvolver
- ações de desenvolvimento
- data conclusão
- status
- evidências

### Tabela de ações principais
- competência
- ação
- data
- impacto
- custo
- status
- evidência

### Evidências
- upload de imagem/PDF
- URL externa
- histórico de uploads

## Critérios de aceite
- vendedor vê só o próprio PDI
- não altera meta nem nota
- opera objetivos pessoais e evidências

## Agentes AIOX
- `@dev`
- `@ux-expert`
- `@data-engineer`
- `@qa`

## Definition of Done
- vendedor consegue tocar o PDI sem intervenção manual contínua

---

# Story 07 — Follow-up Mensal, Evidências e Aprovação

## Objetivo
Tornar o PDI um ciclo vivo, com revisão mensal e validação do gestor.

## Escopo
### Dashboard do gerente
- percentual de conclusão por vendedor
- ações atrasadas
- ações sem evidência
- ações aguardando aprovação
- próximas revisões

### Aprovação
- aprovar evidência
- rejeitar evidência
- exigir complemento
- registrar motivo

### Revisão mensal
- evolução
- dificuldades
- ajustes
- nova data
- snapshot mensal de radar e plano

## Critérios de aceite
- ação concluída sem evidência não fica “100% concluída”
- gerente aprova/rejeita com trilha
- revisão mensal registrada e consultável

## Agentes AIOX
- `@dev`
- `@data-engineer`
- `@qa`

## Definition of Done
- ciclo mensal funcionando para gerente e vendedor

---

# Story 08 — Governança, Observabilidade e QA MX

## Objetivo
Garantir operação segura, auditável e homologada.

## Escopo
### Governança
- admin:
  - catálogos
  - templates
  - auditoria
- dono:
  - visão executiva read-only
- gerente:
  - operação e aprovação
- vendedor:
  - execução e evidência

### Observabilidade
- logs de:
  - criação da sessão
  - mudança de status
  - uploads
  - aprovações
  - geração de PDF
  - revisão mensal

### QA
- E2E por papel
- QA metodológico com checklist MX
- QA visual comparativo com legado
- QA de segurança e RLS

## Critérios de aceite
- `dono` não opera como gerente
- eventos críticos ficam logados
- checklist metodológico 100% verde
- release aprovada por `@po` e `@devops`

## Agentes AIOX
- `@architect`
- `@dev`
- `@qa`
- `@po`
- `@devops`

## Definition of Done
- módulo homologado e liberado

---

# Workflow AIOX recomendado

## 1. Freeze metodológico
- `@analyst *gather-requirements`
- `@pm *write-spec`
- `@architect *assess-complexity`
- `@qa *critique-spec`
- `@po` aprova spec

## 2. Contexto técnico
- `@architect *create-plan`
- `@architect *create-context`
- `@architect *map-codebase`

## 3. Execução por story
- `@sm` quebra subtasks
- `@dev *execute-subtask <story.step>`
- `@data-engineer` cobre domínio / seed / RPC
- `@qa *review-build STORY-XX`
- `@dev *apply-qa-fix`

## 4. Release
- `@devops` cria worktree, valida, mergeia e faz push

## 5. Aceite final
- `@po` valida checklist metodológico MX
