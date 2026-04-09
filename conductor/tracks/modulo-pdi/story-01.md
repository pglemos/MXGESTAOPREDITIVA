# Story 01: Banco de Dados, Catálogos e Regras de Negócio (Backend PDI)

## Descrição
Para que o sistema opere de forma autônoma e guiada, precisamos de uma modelagem de dados cirúrgica no Supabase. O banco deve conter dicionários pré-populados (seeders) com os níveis de cargo, competências (técnicas e comportamentais com suas descrições e indicadores) e a matriz de ações recomendadas da MX.

## Critérios de Aceite

1. **Tabelas de Domínio (Catálogos Fixos - Read Only para usuários):**
   *   `pdi_niveis_cargo`: id, nome (ex: CONSULTOR DE VENDAS), nota_min (6), nota_max (10), peso.
   *   `pdi_competencias`: id, nome, tipo (tecnica, comportamental), descricao_completa, indicador (ex: Qualitativo, Conversão de Leads).
   *   `pdi_acoes_sugeridas`: id, competencia_id, descricao_acao (ex: "Ler o livro A Bíblia de Vendas").

2. **Tabelas Transacionais (Sessão de PDI):**
   *   `pdi_sessoes`: id, colaborador_id, gerente_id, data_realizacao, proxima_revisao_data, status (draft, concluido).
   *   `pdi_metas`: id, sessao_id, prazo (6_meses, 12_meses, 24_meses), descricao, tipo (pessoal, profissional). *Constraint: máx 3 por prazo*.
   *   `pdi_avaliacoes_competencia`: id, sessao_id, competencia_id, nota_atribuida, nivel_cargo_id.
   *   `pdi_plano_acao_detalhado`: id, sessao_id, competencia_id, descricao_acao, data_conclusao, impacto (baixo, medio, alto), custo (financeiro/tempo), status (pendente, concluido), url_evidencia. *Limitar a 5 ações principais na interface do gestor*.
   *   `pdi_objetivos_pessoais` (Ações exclusivas do PDI Pessoal): id, sessao_id, caracteristica, itens_desenvolver, acao, data_conclusao, status, url_evidencia.

3. **Endpoints / RPCs (Supabase):**
   *   `get_pdi_form_template(cargo_id)`: Retorna todas as competências, descrições, indicadores e faixa de notas permitidas para o cargo selecionado para popular o formulário do Front-End.
   *   `get_suggested_actions(competencia_id)`: Retorna as ações pré-cadastradas para facilitar a vida do gerente.

4. **Segurança (RLS):**
   *   Acesso restrito: Vendedores veem apenas seus relatórios. Gerentes veem dos subordinados. Admin gerencia catálogos.