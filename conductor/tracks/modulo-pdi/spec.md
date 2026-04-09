# Spec Congelada: PDI MX 360º (Fase A — Parity Audit & Spec Freeze)

## 1. Objetivo da Especificação
Estabelecer a **verdade metodológica** da MX Escola de Negócios para a digitalização do PDI, congelando os contratos de domínio, as interfaces de usuário e a saída documental (bundle) antes do início do desenvolvimento, garantindo 100% de paridade com o legado.

---

## 2. Matriz de Paridade (Legado → Sistema)

| Artefato Legado (MX) | Representação no Sistema AIOX (PDI MX 360º) | Nível de Fidelidade |
| :--- | :--- | :--- |
| **"Como aplicar o PDI.pdf"** | Wizard do Gerente (Manager Cockpit), com timers visuais e fluxo cravado em 45 minutos (Metas, Mapeamento, Ações e Fechamento). | Exata (Fluxo Rígido) |
| **"Critério de Competências.png"** | Banco de Dados / Seeders. Interface de avaliação com slider travado na escala do cargo (Ex: 6 a 10 para Vendedores). Exibição nativa de Descrição e Indicador na tela de avaliação. | Exata (Textos e Métricas) |
| **"Mapa de Competências.png"** | Gráfico Radar (Recharts) renderizado em tempo real. Identificação automática dos "Top 5 Gaps" (lacunas) com base no Cargo-Alvo (10). | Exata (Visual/Algoritmo) |
| **"Ações de Desenvolvimento.png"** | Motor de recomendação. Quando uma lacuna é selecionada, o sistema sugere a ação oficial do legado para aquela competência específica. | Exata (Catálogo) |
| **"Ações para alcançar os objetivos pessoais.png"** | Portal do Colaborador (Vendedor). Tabela interativa para atualização de status e upload de arquivos (Evidências) no Supabase Storage. | Funcional (Aprimorado com Upload) |
| **"Equação da Motivação no Trabalho.png"** | Banners inspiracionais no Dashboard do Vendedor e no Manager Cockpit, fixando a fórmula `$ = QI + DC`. | Exata (Conceito Visual) |
| **"Capa / Vendedor 1 / PDI" (Planilha/PDF)** | Geração de PDF formatado A4 (Print Bundle) contendo obrigatoriamente a Capa, a página híbrida Vendedor 1 e o PDI Tabular. | Exata (Output Oficial) |

---

## 3. Checklist e Taxonomia de Campos

Para garantir a implementação cirúrgica das *Stories*, congelamos a natureza de cada dado.

### 3.1. Biblioteca Interna (Catálogo Imutável pelo Usuário / Seeded)
- [x] Matriz de Níveis de Cargo (1 a 5) e suas faixas de notas.
- [x] Lista de 10 Competências Técnicas e 8 Comportamentais.
- [x] Textos exatos das Descrições e Indicadores de cada competência.
- [x] Catálogo de Ações Sugeridas associadas às competências.
- [x] Escala de Avaliação (ex: "Demonstra na maioria das vezes").
- [x] Frases Inspiracionais.

### 3.2. Campos Editáveis (Entrada de Dados na Sessão)
- [x] **Metas Pessoais/Profissionais:** 3 campos textuais para cada prazo (6, 12, 24 meses).
- [x] **Notas das Competências:** Seleção numérica feita pelo gerente, restrita à faixa do cargo.
- [x] **Plano de Ação (Gestor):** 5 campos contendo: Ação (texto livre ou selecionado), Data de Conclusão (Data), Impacto (Enum), Custo (Enum).
- [x] **Objetivos Pessoais (Vendedor):** Tabela de ações onde o colaborador cadastra Itens a Desenvolver.
- [x] **Evidências (Vendedor):** Upload de arquivo ou inserção de URL link.
- [x] **Status da Ação (Vendedor/Gerente):** Pendente, Em Andamento, Concluído.

### 3.3. Campos Calculados (Algoritmos do Sistema)
- [x] **Alvo da Competência:** Definido automaticamente pelo limite máximo da faixa do cargo avaliado.
- [x] **Top 5 Lacunas:** Calculado pela diferença entre o "Alvo do Cargo" e a "Nota Atribuída" no radar.
- [x] **Atraso de Ação:** Calculado quando a Data Atual ultrapassa a Data de Conclusão de uma Ação com status Pendente/Em Andamento.

### 3.4. Bundle Imprimível (O PDF Final)
O pacote gerado após a sessão de 45 minutos DEVE compor as seguintes páginas em A4:
- [x] **Documento 1 - Capa:** Nome, Metas (6, 12, 24 meses) e Frases Inspiracionais.
- [x] **Documento 2 - Vendedor 1 (Mapa de Competências):** Notas atribuídas vs Alvo, Gráfico de Radar e Tabela de "Ações para Medição da Competência" (focada nas lacunas do radar).
- [x] **Documento 3 - PDI Tabular:** A tabela de Ações para Alcançar Objetivos Pessoais (com os campos Característica, Ação, Status, etc).
- [x] **Anexo (Opcional):** Equação da Motivação.

### 3.5. Follow-up Mensal (Dashboard e Revisão)
- [x] **Portal do Vendedor:** Acompanhamento do Plano (Kanban/Tabela), submissão de evidências e controle de status.
- [x] **Dashboard do Gerente:** Visão consolidada da loja, percentual de conclusão dos PDIs, aprovação/rejeição de evidências e agendamento/registro da reunião mensal de revisão.
- [x] **Dono (Visão Executiva):** Read-only dashboards de todas as lojas. Admin controla os acessos.

---

## 4. Congelamento da Especiação
Com base nesta Spec Congelada, as *Stories 01 a 08* listadas no Epic V2 estão devidamente lastreadas com seus limites e regras de domínio perfeitamente estipulados. A verdade metodológica MX está preservada no software.

**Status:** CONGELADO ❄️
**Aprovação:** `@po`, `@analyst`, `@architect`