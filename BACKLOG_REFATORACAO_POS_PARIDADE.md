# Backlog de refatoração pós-paridade

Itens registrados durante a reconstrução do Módulo Gerencial. Não executar nesta fase salvo quando um item bloquear diretamente uma tela.

- Consolidar `DashboardLoja` em containers explícitos por rota gerencial, preservando o shell atual.
- Extrair adaptadores de apresentação do dashboard para um serviço único de domínio gerencial.
- Revisar nomes históricos de rotas de vendedor e gerente depois da homologação das rotas canônicas.
- Unificar primitives visuais locais do módulo gerencial sem alterar tokens globais.
- Remover referências históricas do Base44 somente após confirmar que não são usadas como fallback operacional.
- Reduzir duplicação entre `Ranking`, `ManagerRankingReference` e views de ranking por escopo.
- Migrar chamadas de dados gerenciais restantes para hooks tipados por domínio.
- Revisar bundle e lazy loading após a aprovação das dez telas.
