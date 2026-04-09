# Story 03: Dashboard do Colaborador, Evidências e Follow-up

## Descrição
A ferramenta não morre na reunião. O vendedor (colaborador) precisa logar no sistema para acompanhar suas metas, visualizar seu radar de competências, atualizar o status de suas ações e anexar provas (evidências) de que concluiu as tarefas.

## Critérios de Aceite

1. **Dashboard do Vendedor (Painel Principal):**
   *   Visão clara e não-editável do "Mapa de Competências" (Onde estou vs Alvo).
   *   Painel central com as Metas Cadastradas.
   *   Banner motivacional fixo: `$ (Remuneração) = QI (Qualificação Individual) + DC (Demanda do Cargo)`.

2. **Gestão do Plano de Ação (Ações de Desenvolvimento):**
   *   Visualização em tabela/lista (idêntica à planilha de "Ações para alcançar objetivos pessoais").
   *   Colunas: Competência / Item a Desenvolver, Ação, Data Conclusão, Impacto, Custo, Status e Evidências.
   *   O Vendedor pode clicar na linha para alterar o Status (Pendente -> Em Andamento -> Concluído).

3. **Módulo de Upload de Evidências:**
   *   Para aprovar uma ação como concluída, o vendedor **deve** fazer upload de um comprovante (Upload de Imagem/PDF no Supabase Storage) ou colar a URL de um link/documento externo.
   *   Exibição da miniatura/link da evidência na tabela.

4. **Sistema de Alertas e Follow-up do Gerente:**
   *   Dashboard do Gestor com aba "Follow-up de PDI".
   *   Lista de vendedores e percentual de conclusão de seus planos de ação.
   *   Alertas visuais (Tags vermelhas) para ações atrasadas (Data de conclusão < Data Atual).
   *   Fluxo para o gerente validar a evidência e dar um "De Acordo" (Approve) na ação do colaborador.