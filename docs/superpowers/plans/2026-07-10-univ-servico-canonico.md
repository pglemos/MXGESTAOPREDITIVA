# UNIV-5 — Serviço canônico tipado da Universidade

## Objetivo

Centralizar o acesso de leitura e escrita de `treinamentos`, `progresso_treinamentos` e tarefas sem alterar as permissões nem o comportamento visual atual.

## Plano

1. Criar teste RED para um serviço injetável: transforma linhas reais em conteúdo do vendedor, conserva ausência de progresso e falha quando uma consulta Supabase falha.
2. Criar `src/features/universidade/services/universidade-service.ts`, com tipos de entrada/saída, helpers puros e operações de listagem/progresso/tarefas.
3. Fazer `useVendedorTreinamentos` delegar listagem, tarefas, respostas e conclusão ao serviço; conservar sua API pública.
4. Fazer `useTrainings` delegar listagem e `markWatched` ao mesmo serviço; manter filtros atuais no hook e RLS como limite efetivo.
5. Rodar testes focados, typecheck, lint, suíte e build; atualizar a story e o status vivo.

## Riscos e rollback

- O serviço não cria migration nem muda RLS. Reverter o commit restaura os hooks atuais.
- Chamadas continuam usando o cliente Supabase autenticado; não há credencial ou privilégio novo.
