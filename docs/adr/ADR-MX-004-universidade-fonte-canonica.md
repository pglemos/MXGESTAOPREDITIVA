# ADR-MX-004 — Fonte canônica de conteúdo da Universidade MX

**Status:** Accepted  
**Date:** 2026-07-10  
**Origem:** `docs/audit/remediacao-vendedor-status-20260710.md` — pendência de arquitetura da Universidade/Perfil  
**Decisor:** @architect (Aria), orquestrado por @aiox-master (Orion)

## Contexto

Há dois modelos de conteúdo ativos e sem contrato de interoperabilidade:

| Modelo | Consumidores atuais | Capacidades relevantes |
|---|---|---|
| `treinamentos` + `progresso_treinamentos` | vendedor, gerente, dono, consultor, Home, Desenvolvimento e Performance | segmentação por papel/loja/produto/plano/cargo, progresso, avaliações, sugestões, publicação, trilhas de desenvolvimento e recomendações de Feedback/PDI |
| `universidade_trilhas` + `universidade_aulas` + `universidade_certificacoes` | biblioteca no cockpit do dono e seção de aulas ao vivo | catálogo hierárquico de trilhas/aulas e certificado por trilha; não possui progresso por aula, curadoria, segmentação de loja nem ligação com recomendações |

O vínculo de `recomendacoes_desenvolvimento.training_id`, as etapas de trilha e o fluxo de publicação já referenciam `treinamentos`. Tornar `universidade_*` a fonte primária exigiria reescrever esses contratos e introduzir progresso por aula, políticas e mapeamentos que já existem no modelo de treinamentos.

## Decisão

`treinamentos` é a **fonte canônica única de conteúdo operacional e recomendado** da Universidade MX. `progresso_treinamentos` é a fonte canônica de progresso individual.

O modelo `universidade_*` permanece disponível em modo compatibilidade durante a migração, mas não receberá novos fluxos de publicação, recomendação ou progresso. Seus dados serão importados para `treinamentos` de forma idempotente e rastreável; as trilhas serão representadas por `trilhas_desenvolvimento` e `etapas_trilha_desenvolvimento` quando houver uma sequência pedagógica real.

Nenhuma tabela será apagada nesta decisão.

## Plano de adoção

1. Criar `UniversidadeService` tipado sobre `treinamentos`, `progresso_treinamentos`, tarefas, avaliações e recomendações; migrar o hook específico do vendedor e os consumidores legados para ele.
2. Criar migration de compatibilidade com uma tabela de mapeamento `universidade_conteudo_migracao` (`trilha_id`, `aula_id`, `training_id`, origem, versão e timestamps), índice único por aula e importação idempotente.
3. Mapear cada `universidade_aulas.tipo` para um tipo suportado de `treinamentos`; preservar conteúdo markdown, vídeo, data ao vivo e metadados de origem no payload rastreável.
4. Converter apenas trilhas que tenham aulas publicadas em `trilhas_desenvolvimento`/etapas. Certificações não serão convertidas em conclusão de aula: permanecem históricas até haver regra explícita de equivalência e auditoria de pontuação.
5. Migrar a biblioteca do cockpit do dono para o serviço canônico e manter uma leitura comparativa até que catálogo, segmentação e progresso coincidam.
6. Após uma janela de estabilidade e validação de paridade, marcar `universidade_*` como descontinuado. Remoção física só entra em story futura, com backup verificado e rollback documentado.

## Alternativas consideradas

| Alternativa | Veredito | Motivo |
|---|---|---|
| Tornar `universidade_*` canônico | Rejeitada | Não atende recomendações, progresso de aula, curadoria e segmentação sem reconstrução ampla. |
| Manter duas fontes indefinidamente | Rejeitada | Mantém conteúdo e métricas divergentes, sem uma trilha auditável de recomendação. |
| Migrar tudo em big bang e remover o legado | Rejeitada | Alto risco de perda de certificados e interrupção de gestor/dono. |
| Canonizar `treinamentos` com adaptação faseada | Escolhida | Reaproveita contratos já consumidos e permite conferência/rollback antes de descontinuar o catálogo paralelo. |

## Critérios de conclusão

- Um conteúdo publicado aparece de forma consistente para todos os papéis autorizados pelo mesmo serviço tipado.
- Toda recomendação de Funil, Feedback ou PDI aponta para conteúdo canônico e explicita a origem.
- Importação de uma mesma aula é idempotente e conserva a proveniência.
- Nenhum certificado histórico é descartado ou convertido sem regra de equivalência auditável.
- Acesso permanece protegido por RLS e pela segmentação do conteúdo.

## Referências

- `supabase/migrations/20260515190000_development_full_completion.sql`
- `supabase/migrations/20260530120000_sprint2_departamentos_universidade_marketing.sql`
- `supabase/migrations/20260710160000_university_and_professional_profile.sql`
- `src/hooks/useTrainings.ts`
- `src/features/vendedor-treinamentos/hooks/useVendedorTreinamentos.ts`
- `src/features/universidade/hooks/useUniversidadeMx.ts`
