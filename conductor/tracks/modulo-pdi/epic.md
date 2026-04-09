# EPIC: Módulo de PDI (Plano de Desenvolvimento Individual) - Sistematização Completa e End-to-End

## 1. Visão Geral e Objetivo
Digitalizar e sistematizar a Fase 2 do PMR (Programa de Maximização de Resultados) - o PDI. O módulo deve ser a representação exata e fiel dos artefatos da MX Escola de Negócios (Planilhas, PDFs, Matrizes de Competência e Ações), garantindo que o gerente conduza a sessão em 45 minutos com altíssima precisão e que o sistema ofereça as diretrizes, textos inspiracionais e as métricas preditivas exatas da metodologia.

## 2. Dicionário de Dados e Parâmetros Fixos da Metodologia (Obrigatório)

### 2.1. Escala de Níveis de Cargo (A matriz de pontuação)
O sistema deve suportar as 5 faixas de avaliação, baseadas no cargo:
*   **Nível 1 (1 a 5 pontos):** Higienizador, Auxiliar de Serviços Gerais, Pré-vendedor
*   **Nível 2 (6 a 10 pontos):** Consultor de Vendas, Administrativo *(Foco Principal)*
*   **Nível 3 (11 a 15 pontos):** Gerente Comercial
*   **Nível 4 (16 a 20 pontos):** Diretor Comercial
*   **Nível 5 (21 a 25 pontos):** CEO

### 2.2. Catálogo de Competências e Indicadores
A avaliação deve trazer obrigatoriamente a *Descrição* e o *Indicador* na tela para orientar o gestor.

**TÉCNICAS (Alvo sempre o máximo da faixa do cargo, ex: 10 para Vendedor)**
1.  **Planejamento:** Ser capaz de chegar na loja e organizar o dia, cumprindo rotina de contatos, prospecção e agendamentos. *(Indicador: Qualitativo)*
2.  **Atendimento ao Cliente:** Gerar conexão (empatia), levantar necessidades, demonstrar produto e escuta ativa. *(Indicador: 1- Conversão atendimento/venda, 2- Volume de indicações)*
3.  **Agendamento de Visitas:** Agendar diariamente com clientes. *(Indicador: Conversão de leads em visitas)*
4.  **Fechamento de Venda:** Leitura do cliente (linguagem corporal), conduzir fechamento e quebrar objeções. *(Indicador: Conversão de atendimento em venda)*
5.  **Carteira de Clientes:** Vender com consistência por meio da carteira. *(Indicador: Volume de vendas na carteira)*
6.  **Mídias Sociais:** Explorar redes sociais para gerar negócios com consistência. *(Indicador: Volume de vendas na carteira)*
7.  **Prospecção:** Cumprir rotina diária (contato ativo, redes sociais, etc). *(Indicador: Volume de vendas na carteira)*
8.  **Avaliação de Carro:** Analisar veículo, verificar condições de mercado e negociar baseado em fatos/dados. *(Indicador: Qualitativo)*
9.  **Financiamentos:** Compreender regras de cada agente, usar dados do mercado para persuadir. *(Indicador: Qualitativo)*
10. **Processos:** Cumprir processos da empresa com margem de erro mínima. *(Indicador: Quantidade de erros)*

**COMPORTAMENTAIS**
1.  **Pontualidade:** Cumprir horário de chegada. *(Indicador: Qualitativo)*
2.  **Senso de Urgência:** Entregar a meta no menor tempo possível. *(Indicador: Qualitativo)*
3.  **Iniciativa:** Ser proativo, cumprir obrigações sem precisar ser orientado. *(Indicador: Qualitativo)*
4.  **Organização:** Demonstra organização suficiente para rotina da empresa. *(Indicador: Qualitativo)*
5.  **Liderança:** Promover ambiente agregador e contribuir fora da função. *(Indicador: Qualitativo)*
6.  **Relacionamento Interpessoal:** Trabalhar em equipe. *(Indicador: Qualitativo)*
7.  **Persistência:** Não desiste facilmente dos clientes. *(Indicador: Qualitativo)*
8.  **Resiliência:** Capacidade de superação. *(Indicador: Qualitativo)*

### 2.3. Catálogo Automático de Ações de Desenvolvimento
Baseado na competência que teve a menor nota, o sistema deve **sugerir** as ações exatas da metodologia MX:
*   *Exemplos:* Para Fechamento de Venda -> "Ler o livro 'A Bíblia de Vendas'"; Para Resiliência -> "Assistir o filme 'A procura da Felicidade' e refletir". (O catálogo completo com as mais de 25 ações predefinidas da planilha deve estar no banco de dados).

## 3. O Fluxo de 45 Minutos do PDI (Pauta Exata)

1.  **PDI – Metas (7 minutos):**
    *   Coletar 3 metas para 6 meses (Curto Prazo). Mínimo 1 pessoal, 1 profissional.
    *   Coletar 3 metas para 12 meses (Médio Prazo). Mínimo 1 pessoal, 1 profissional.
    *   Coletar 3 metas para 24 meses (Longo Prazo). Mínimo 1 pessoal, 1 profissional.
    *   *Na interface:* Frases para inspirar ("Comprometa-se com suas metas...", "Disciplina é a ponte entre metas e realizações.").
2.  **Mapeamento de Capacidade (10 minutos):**
    *   Gestor lê as características (Descrições) e o avaliado dá uma nota (Para Vendedor: 6 a 10).
3.  **Ações de Desenvolvimento (11 minutos):**
    *   Gestor escolhe **exatamente 5 ações** para os próximos 6 meses com base nas maiores lacunas (menores notas do Radar).
    *   Ações devem possuir os atributos da planilha: **Ação, Data de Conclusão, Impacto, Custo, Competência Associada, Status e Evidências**.
4.  **Fechamento & Impressão:**
    *   Explicar próximo passo (acompanhamento mensal).
    *   Exibir a Equação da Motivação: **$ (Remuneração) = QI (Qualificação Individual) + DC (Demanda do Cargo)**.
    *   Sistema deve gerar PDF completo formatado idêntico à planilha para impressão.

## 4. Acompanhamento (Pós-Sessão)
*   **Ações para Alcançar Objetivos Pessoais:** Tabela onde o colaborador mapeia Características, Itens a Desenvolver, Ação, Data, Status e insere as **Evidências** (fotos, arquivos).
*   Dashboard cruzando o Impacto x Custo das ações para priorização.