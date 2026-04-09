# *epic — Módulo PDI MX 360º (Revisado v2)

## 1. Nome do épico
**PDI MX 360º — Sistematização fiel, operacional e auditável do Plano de Desenvolvimento Individual da MX**

## 2. Objetivo do épico
Digitalizar integralmente o PDI legado da MX, com fidelidade metodológica ao workbook e ao documento de aplicação, permitindo:
- condução da sessão em 45 minutos
- avaliação por competências e cargo
- escolha de 5 ações principais
- geração de bundle documental
- acompanhamento mensal
- evidências e aprovação
- governança por papel

## 3. Problema real
A primeira versão do pacote (plan/epic/stories) evoluiu bem, mas ainda deixava lacunas importantes:
- não distinguia com rigor o que é **documento de referência interna** do que é **bundle oficial impresso**
- não travava os **textos exatos** de critérios, indicadores e ações sugeridas
- não explicitava a página “Vendedor 1” como artefato híbrido:
  - tabela de competências
  - radar
  - ação/data/impacto/custo/competência
- não tratava com total clareza a coexistência de:
  - 5 ações principais do plano
  - ações para medição da competência
  - ações para alcançar objetivos pessoais
- não congelava o ritual de 45 minutos como fluxo rigidamente guiado

## 4. Escopo obrigatório
### 4.1 Artefatos de referência interna
Devem existir no sistema como biblioteca metodológica:
- Critério de Competências
- Ações de Desenvolvimento
- Equação da Motivação
- Frases inspiracionais
- Catálogo de descritores por nível
- Catálogo de ações sugeridas por competência

### 4.2 Artefatos obrigatórios do bundle final
Devem ser gerados ao concluir a sessão:
1. **Capa do PDI**
2. **Vendedor 1 / Mapa de Competências**
3. **PDI tabular**
4. **Equação da Motivação (opcional por configuração, mas suportada pelo sistema)**

Importante: o documento de aplicação manda imprimir ao final **Capa, Vendedor 1 e PDI** fileciteturn136file3

### 4.3 Fluxo obrigatório de 45 minutos
1. Metas (7 min)
2. Mapeamento da capacidade (10 min)
3. Escolha de 5 ações (11 min)
4. Fechamento, explicação do próximo passo e impressão do PDI fileciteturn136file3

### 4.4 Perfis obrigatórios
- **Admin**
- **Dono**
- **Gerente**
- **Vendedor**

## 5. Catálogo obrigatório da metodologia
### 5.1 Níveis de cargo
- Nível 1: 1–5
- Nível 2: 6–10
- Nível 3: 11–15
- Nível 4: 16–20
- Nível 5: 21–25

### 5.2 Competências obrigatórias
#### Técnicas
1. Planejamento
2. Atendimento ao Cliente
3. Agendamento de Visitas
4. Fechamento de Venda
5. Carteira de Clientes
6. Mídias Sociais
7. Prospecção
8. Avaliação de Carro
9. Financiamentos
10. Processos

#### Comportamentais
1. Pontualidade
2. Senso de Urgência
3. Iniciativa
4. Organização
5. Liderança
6. Relacionamento Interpessoal
7. Persistência
8. Resiliência

### 5.3 Escala obrigatória
Ordem fixa:
- Atingiu plenamente
- Demonstra na maioria das vezes
- Demonstra em alguns momentos
- Demonstra raramente
- Nunca demonstrou

### 5.4 Ações sugeridas obrigatórias
O sistema deve conter o catálogo oficial com os textos exatos do legado, tanto para competências técnicas quanto comportamentais.

## 6. Regras de negócio obrigatórias
1. Cada prazo (6, 12, 24 meses) deve ter **até 3 metas**
2. Cada prazo exige no mínimo:
   - 1 meta pessoal
   - 1 meta profissional
3. A nota permitida depende do nível/cargo
4. O alvo da competência é sempre o topo da faixa do cargo
5. O gerente precisa escolher **exatamente 5 ações principais**
6. As ações principais precisam registrar:
   - competência associada
   - ação
   - data limite
   - impacto
   - custo
   - status
   - evidência esperada
7. O vendedor não pode alterar:
   - metas
   - notas
   - top gaps
8. O vendedor pode:
   - atualizar status
   - anexar evidência
9. O gerente pode:
   - aprovar ou rejeitar evidência
   - revisar mensalmente
10. O dono acompanha em visão executiva sem operar como gerente
11. O admin governa catálogos, templates, auditoria e métricas

## 7. Entregáveis do épico
- domínio PDI completo
- catálogos oficiais seedados
- cockpit do gerente
- motor de critérios e recomendação
- bundle documental fiel
- portal do vendedor
- follow-up mensal
- workflow de aprovação de evidências
- observabilidade e auditoria
- QA/homologação metodológica

## 8. Histórias do épico
1. Story 01 — Fundação de Domínio, Catálogos, Seeds e RLS
2. Story 02 — Cockpit do Gerente (Wizard 45 min)
3. Story 03 — Vendedor 1 / Radar / Gaps / Ações para Medição
4. Story 04 — Bundle Documental (Capa + Vendedor 1 + PDI)
5. Story 05 — Motor de Critérios, Escalas e Ações Sugeridas
6. Story 06 — Portal do Colaborador e Objetivos Pessoais
7. Story 07 — Follow-up Mensal, Evidências e Aprovação
8. Story 08 — Governança, Observabilidade e QA MX

## 9. Critério de sucesso do épico
O épico só termina quando o sistema:
- reproduzir com fidelidade funcional a metodologia MX
- conduzir o gerente dentro do ritual de 45 minutos
- suportar integralmente os 4 perfis
- imprimir o bundle final correto
- sustentar o acompanhamento pós-sessão
- passar em homologação metodológica e visual

## 10. Não-negociáveis
- nada de “texto aproximado” para competência, indicador e ação sugerida
- nada de PDF parcial sem Capa + Vendedor 1 + PDI
- nada de dono operando como gerente
- nada de vendedor alterando avaliação
- nada de radar sem top 5 lacunas e alvo por cargo
