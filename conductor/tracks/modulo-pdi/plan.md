# *plan — Módulo PDI MX 360º (Revisado v2)
## 1. Objetivo do plano
Entregar o módulo de PDI da MX com **paridade metodológica, operacional e documental real** com o legado, transformando o processo atual em um fluxo digital guiado, auditável, multi-perfil e executável pelo framework AIOX.

Este plano revisa a primeira versão porque, apesar de boa, ela ainda deixava ambiguidade em pontos críticos:
- confundia **artefatos de referência interna** com **bundle obrigatório de impressão**
- não congelava de forma explícita o **catálogo exato** de competências, indicadores, escalas e ações
- não separava com nitidez:
  - plano de ação das 5 ações principais
  - tabela de ações para alcançar objetivos pessoais
  - tabela de ações para medição da competência
- não travava o ritual de 45 minutos com o mesmo rigor do material oficial da MX
- não explicitava o pacote final obrigatório: **Capa + Vendedor 1 + PDI** para impressão imediata

## 2. Base metodológica obrigatória
Segundo o documento oficial “Como aplicar o PDI”, a sessão individual deve seguir esta pauta:
1. **Metas**: 7 minutos
2. **Mapeamento da capacidade atual**: 10 minutos
3. **Escolha de 5 ações de desenvolvimento**: 11 minutos
4. **Explicação do próximo passo (revisão mensal)**
5. **Fechamento simbólico do compromisso**
6. **Impressão em PDF de Capa, Vendedor 1 e PDI** para entrega ao vendedor fileciteturn136file3

## 3. Distinção correta dos artefatos do legado
### 3.1 Artefatos internos / bibliotecas metodológicas
Estes **não são necessariamente páginas do PDF final entregue ao vendedor**, mas precisam existir no sistema:
- Critério de Competências
- Ações de Desenvolvimento
- Equação da Motivação no Trabalho
- Biblioteca de frases inspiracionais
- Biblioteca de descritores de escala
- Biblioteca de ações sugeridas por competência

### 3.2 Artefatos obrigatórios de saída para a sessão
Estes precisam ser gerados no bundle final:
- **Capa do PDI**
- **Vendedor 1 / Mapa de Competências**
- **PDI tabular**
- **(Opcional por configuração) Equação da Motivação como apêndice**

Regra principal: o PDF oficial mínimo precisa conter **Capa + Vendedor 1 + PDI**, porque é isso que o material oficial manda imprimir ao final da sessão fileciteturn136file3

## 4. Catálogo canônico da metodologia
### 4.1 Níveis de cargo e escala de nota
O sistema deve suportar exatamente:

| Nível | Faixa | Cargo principal |
|---|---|---|
| 1 | 1–5 | Higienizador, Auxiliar de Serviços Gerais, Pré-vendedor |
| 2 | 6–10 | Consultor de Vendas, Administrativo |
| 3 | 11–15 | Gerente Comercial |
| 4 | 16–20 | Diretor Comercial |
| 5 | 21–25 | CEO |

### 4.2 Matriz de descritores por nível
O sistema deve armazenar e exibir os valores exatos:
- **Nível 1:** 5 / 4 / 3 / 2 / 1
- **Nível 2:** 10 / 9 / 8 / 7 / 6
- **Nível 3:** 15 / 14 / 13 / 12 / 11
- **Nível 4:** 20 / 19 / 18 / 17 / 16
- **Nível 5:** 25 / 24 / 23 / 22 / 21

Ordem fixa dos descritores:
1. Atingiu plenamente
2. Demonstra na maioria das vezes
3. Demonstra em alguns momentos
4. Demonstra raramente
5. Nunca demonstrou

### 4.3 Competências obrigatórias
#### Técnicas (10)
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

#### Comportamentais (8)
- Pontualidade
- Senso de Urgência
- Iniciativa
- Organização
- Liderança
- Relacionamento Interpessoal
- Persistência
- Resiliência

### 4.4 Ações sugeridas
O sistema deve seedar a biblioteca oficial de ações por competência com os textos exatos do material legado, sem reescrita livre. Isso inclui, entre outros:
- “Ler o livro ‘A Bíblia de Vendas’”
- “Assistir o módulo 6 ‘Técnicas de Negociação para Fechamento de Vendas’...”
- “Criar Instagram profissional”
- “Assistir o filme ‘À Procura da Felicidade’...”
- “Definir metas curtas, exemplo: 2 vendas por semana”
- etc.

## 5. Estrutura funcional do módulo
### 5.1 Sessão do gerente
O gerente precisa:
- abrir uma sessão de PDI
- seguir um wizard rígido
- coletar metas
- aplicar notas por competência
- visualizar radar e top 5 lacunas
- escolher **exatamente 5 ações principais**
- concluir sessão
- gerar bundle documental
- explicar o follow-up mensal

### 5.2 Portal do vendedor
O vendedor precisa:
- visualizar metas e radar em modo leitura
- visualizar o plano tabular
- atualizar status das ações
- subir evidências
- acompanhar aprovações e revisões
- entender a equação motivacional

### 5.3 Camada executiva
- dono acompanha em visão executiva/read-only
- admin administra catálogos, templates, auditoria e relatórios do módulo

## 6. Estratégia AIOX revisada
### Fase A — Parity Audit & Spec Freeze
**Agentes:** `@analyst`, `@pm`, `@architect`, `@ux-expert`, `@po`  
**Objetivo:** congelar a verdade metodológica antes de desenvolver.

**Saídas obrigatórias**
- matriz de paridade legado → sistema
- spec congelada
- checklist do que é:
  - biblioteca interna
  - campo editável
  - campo calculado
  - bundle imprimível
  - follow-up mensal

### Fase B — Domain Foundation & Contracts
**Agentes:** `@architect`, `@data-engineer`, `@qa`  
**Objetivo:** criar o domínio completo, seeds, RLS e RPCs.

### Fase C — Manager Cockpit (45 min)
**Agentes:** `@sm`, `@dev`, `@ux-expert`, `@qa`  
**Objetivo:** construir o cockpit do gerente com wizard, radar, gaps e fechamento.

### Fase D — Print Bundle Fidelity
**Agentes:** `@dev`, `@ux-expert`, `@qa`  
**Objetivo:** gerar Capa, Vendedor 1 e PDI com fidelidade visual, impressão A4 e exportação.

### Fase E — Colaborador, Evidências e Follow-up
**Agentes:** `@dev`, `@data-engineer`, `@ux-expert`, `@qa`  
**Objetivo:** manter o PDI vivo após a sessão.

### Fase F — Governance, QA & Go-Live
**Agentes:** `@qa`, `@po`, `@devops`  
**Objetivo:** validar aderência metodológica, acesso por papel, bundle final e release.

## 7. Dependências e ordem correta
1. Freeze metodológico
2. Catálogos e seeds
3. RLS e contratos RPC
4. Wizard do gerente
5. Engine de critérios e recomendação
6. Bundle documental
7. Portal do vendedor
8. Follow-up mensal e aprovação
9. Observabilidade e auditoria
10. QA metodológico e visual
11. Release

## 8. Criteria of Done do plano
Este plano só pode ser considerado executado quando:
- as 18 competências estiverem seedadas com descrição e indicador exatos
- a matriz de descritores por nível estiver funcionando
- as ações sugeridas oficiais estiverem no banco
- o gerente conseguir concluir uma sessão completa em 45 minutos
- o bundle final mínimo for **Capa + Vendedor 1 + PDI**
- o vendedor conseguir operar o follow-up
- o dono só acompanhar
- o admin conseguir governar catálogo, template e auditoria
- o módulo passar em homologação metodológica MX

## 9. Workflow AIOX recomendado
### Planejamento
- `@analyst *gather-requirements`
- `@analyst *research-deps`
- `@pm *write-spec`
- `@architect *assess-complexity`
- `@qa *critique-spec`
- `@po` congela aceite metodológico

### Preparação técnica
- `@architect *create-plan`
- `@architect *create-context`
- `@architect *map-codebase`

### Execução por stories
- `@sm` quebra stories em subtasks
- `@dev *execute-subtask <story.step>`
- `@data-engineer` executa domínio / seed / RPC
- `@qa *review-build STORY-XX`
- `@dev *apply-qa-fix`
- `@po` valida aceite parcial
- `@devops` controla worktree, merge e push

## 10. Resultado esperado
No final, o PDI deixa de ser:
- um formulário bonito
- um radar superficial
- um PDF improvisado

e passa a ser:
- um **módulo vivo**
- com **método oficial MX**
- **documentação fiel**
- **execução guiada**
- **follow-up mensal**
- **evidência, aprovação e auditoria**
