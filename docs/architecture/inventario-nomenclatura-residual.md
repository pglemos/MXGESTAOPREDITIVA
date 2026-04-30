# Inventario de nomenclatura residual

**Story:** FUND-02
**Data:** 2026-04-30
**Escopo:** ocorrencias tecnicas em ingles que sobraram apos a FUND-01.

## Resultado resumido

| Area | Ocorrencias aproximadas | Classificacao inicial |
| --- | ---: | --- |
| `supabase/` | 11879 | Majoritariamente historico de migrations, alteracoes de rename, policies antigas e arquivos aplicados. Nao reescrever migrations ja aplicadas. |
| `src/` | 921 | Codigo funcional atual, aliases de relacionamento Supabase, nomes de colunas ainda em ingles e tipos de UI. Requer refatoracao por fatias. |
| `docs/` | 753 | Stories/specs historicas. Manter quando for registro historico; atualizar apenas docs vivas. |
| `scripts/` | 277 | Scripts operacionais e legados. Pode ser renomeado com menor risco se os comandos do `package.json` forem atualizados junto. |
| `e2e/` | 1 | Baixo impacto. |

## Padroes encontrados

| Padrao | Arquivos afetados aproximados | Decisao |
| --- | ---: | --- |
| `consulting_` | 92 | Migrar em codigo funcional e scripts ativos. Manter em migrations historicas e stories antigas com justificativa. |
| `seller_` | 111 | Migrar por camada, pois ainda aparece em nomes de colunas como `seller_user_id`, `seller_id` e aliases de ranking. |
| `store_` | 174 | Migrar por camada, pois ainda aparece em colunas vivas como `store_id`, `store_meta_rules` e `store_delivery_rules`. |
| `user_` | 134 | Migrar com cuidado por depender de `auth.users`, campos de auditoria e aliases de relacionamento. |
| `daily_checkins` | 61 | Em migrations/docs historicas e pontos residuais; tabela principal live ja foi migrada para `lancamentos_diarios`. |
| `trainings` / `training_progress` | 60 | Migrar em scripts/docs/testes e garantir que UI continue em portugues normal. |
| `goals` / `goal_logs` | 46 | Migrar referencias residuais para `metas` e `historico_metas`, exceto historico de migrations. |
| `audit_logs` | 19 | Migrar referencias residuais para `logs_auditoria`, exceto historico de migrations. |
| `memberships` | 53 | Migrar para `vinculos_loja`, exceto registros historicos. |
| `stores` / `users` | 200 | Separar tabela interna de termos externos. `auth.users` e aliases Supabase podem continuar quando forem contrato externo. |

## Regras de decisao

- Migrations ja aplicadas ficam imutaveis para preservar auditoria e historico do banco.
- Migrations novas devem usar portugues sem acento tecnico.
- `auth.users` e contratos externos do Supabase podem manter ingles por serem nomes de fornecedor.
- Aliases de relacionamento Supabase podem ser renomeados quando nao quebrarem tipos, testes ou consultas.
- Campos vivos como `store_id`, `user_id` e `seller_user_id` exigem migration propria se a regra for portugues absoluto.
- UI visivel deve continuar usando portugues normal, sem underscores e sem termos tecnicos.

## Cortes recomendados

1. **FUND-02A - Scripts e comandos**
   - Renomear comandos `consulting:*` no `package.json`.
   - Renomear scripts ativos com nomes em ingles.
   - Atualizar referencias em README/docs vivas.

2. **FUND-02B - Aliases e tipos TypeScript**
   - Trocar aliases como `store`, `users`, `seller` por `loja`, `usuarios`, `vendedor`.
   - Atualizar interfaces em `src/types/database.ts`.
   - Atualizar testes unitarios e E2E relacionados.

3. **FUND-02C - Banco secundario**
   - Planejar migration para tabelas secundarias ainda em ingles, como `store_meta_rules`, `store_delivery_rules`, `store_benchmarks`, `reprocess_logs` e `raw_imports`, se confirmado no live.
   - Criar views de compatibilidade apenas se houver risco operacional.

4. **FUND-02D - Documentacao historica**
   - Atualizar docs vivas.
   - Manter docs historicas com nota de legado quando registrarem estado antigo do sistema.

## Risco

Nao executar rename global automatico. A maior parte dos termos aparece em chaves estrangeiras, aliases de PostgREST, migrations aplicadas, testes visuais e scripts operacionais. A abordagem correta e por fatias pequenas, com teste e deploy apos cada corte.
