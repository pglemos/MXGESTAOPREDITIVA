# Wave 4 Data/RLS Notes

**Destino:** @data-engineer  
**Stories:** DEV-25, DEV-26, DEV-27  
**Status:** Preflight

## Tabelas Envolvidas

- `trainings`
- `training_progress`
- `notificacoes`
- `pdi_sessoes`
- `devolutivas` ou estrutura equivalente de feedback
- `vinculos_loja`
- `usuarios`

## Mudancas Provaveis

### Metadados de conteudo

Se `trainings` ja suportar tipo e publico-alvo, preferir extensao minima. Caso contrario, criar tabela auxiliar para evitar migration invasiva.

Opcoes:

1. Adicionar colunas em `trainings`.
2. Criar `training_metadata` com FK para `trainings`.

Recomendacao inicial: usar tabela auxiliar se houver risco de quebrar seeds ou dados antigos.

### Avaliacoes

Criar tabela de avaliacao por usuario/conteudo.

Constraints recomendadas:

- unique `(training_id, user_id)`
- `rating between 1 and 5`
- FK para usuario e conteudo

### Sugestoes

Criar tabela de sugestoes com status editorial.

Status sugeridos:

- `new`
- `in_review`
- `accepted`
- `rejected`
- `done`

### Trilha de novo colaborador

Modelo minimo:

- `development_trails`
- `development_trail_steps`
- `development_trail_assignments`
- `development_trail_step_progress`

Se o time quiser reduzir escopo, a primeira versao pode mapear trilha como conjunto ordenado de `trainings` com assignment por vendedor.

## RLS

Validar politicas:

- Vendedor:
  - le conteudos liberados para seu perfil/loja;
  - le e escreve seu proprio progresso;
  - le e escreve sua propria avaliacao;
  - cria sugestoes em seu proprio nome;
  - nao le PDI/feedback de outros vendedores.
- Gerente:
  - le progresso e trilha dos vendedores da sua loja;
  - atribui conteudo/trilha para vendedores da sua loja;
  - nao acessa lojas fora do seu vinculo.
- Dono:
  - le visao agregada da loja se produto aprovar;
  - nao altera conteudos MX.
- Admin/admin master MX:
  - administra conteudos, trilhas, sugestoes e auditoria.

## Compatibilidade

- Nao apagar progresso antigo.
- Conteudos pausados devem manter historico.
- Mudanca de nome da area nao deve alterar rotas nem policies.
- Feedback/PDI devem manter isolamento atual.

## Testes Recomendados

- Vendedor avalia conteudo e nao altera avaliacao de outro usuario.
- Gerente atribui trilha apenas a vendedor da propria loja.
- Admin MX enxerga sugestoes agregadas.
- Conteudo personalizado de loja nao aparece para outra loja.
- Conteudo pausado nao quebra progresso historico.
