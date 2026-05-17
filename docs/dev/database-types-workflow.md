# Database Types Workflow

**Story:** 0.1 — DB-014
**Owner:** @devops + @dev
**Status:** Ativo desde 2026-05-17

## TL;DR

Sempre que alterar schema Supabase (nova migration, RLS, função, tipo), rode:

```bash
npm run gen:db-types
git add src/types/database.generated.ts
git commit -m "chore(types): regenerar database.generated.ts apos migration X"
```

CI bloqueia merge se você esquecer.

## Por que existem dois arquivos?

| Arquivo | Origem | Status | Uso |
|--------|--------|--------|-----|
| `src/types/database.ts` | Escrito à mão (610 LOC) | LEGACY — em deprecação | 58 consumers ainda importam |
| `src/types/database.generated.ts` | `supabase gen types` (6.176 LOC) | OFICIAL — fonte da verdade | Novo código deve usar este |

Migração faseada coberta por **ADR-0041** (`docs/adr/0041-database-types-migration.md`).
Migração dos 58 consumers é Story 1.2+ (não esta).

## Setup local (primeira vez)

1. Instalar Supabase CLI:
   ```bash
   brew install supabase/tap/supabase
   # ou: npm i -g supabase
   ```
2. Login (token pessoal):
   ```bash
   supabase login
   ```
3. Linkar ao projeto (já feito no repo):
   ```bash
   supabase link --project-ref fbhcmzzgwjdgkctlfvbo
   ```
4. Verificar:
   ```bash
   supabase projects list
   # MX GESTAO PREDITIVA deve aparecer com ● na coluna LINKED
   ```

## Comandos

| Comando | Uso |
|---------|-----|
| `npm run gen:db-types` | Regenera `src/types/database.generated.ts` a partir do projeto linked |
| `npm run verify:db-types` | Regenera e falha se houver diff não commitado (espelha o CI) |

## Workflow do dev

```
1. Criar/alterar migration em supabase/migrations/
2. Aplicar localmente: supabase db push (ou MCP apply_migration)
3. npm run gen:db-types
4. git diff src/types/database.generated.ts  # revisar mudanças
5. git add src/types/database.generated.ts
6. git commit -m "feat(db): nova tabela X + regenera types"
7. git push  # CI vai validar
```

## CI Gate

Workflow: `.github/workflows/db-types-diff.yml`

- Dispara em PRs que tocam `supabase/migrations/**` ou `src/types/database.generated.ts`
- Roda `supabase gen types` com secrets `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_ID`
- Compara com arquivo commitado (ignorando o banner de 5 linhas)
- Falha vermelho se houver drift

### Secrets necessários no GitHub

| Secret | Onde obter |
|--------|-----------|
| `SUPABASE_ACCESS_TOKEN` | https://supabase.com/dashboard/account/tokens (Personal Access Token) |
| `SUPABASE_PROJECT_ID` | `fbhcmzzgwjdgkctlfvbo` (project ref MX GESTAO PREDITIVA) |

Configurar em: **Settings → Secrets and variables → Actions → New repository secret**.

## Troubleshooting

| Sintoma | Causa | Fix |
|---------|-------|-----|
| `Cannot find project ref` | Projeto não linkado | `supabase link --project-ref fbhcmzzgwjdgkctlfvbo` |
| `Access token not provided` | Não logou | `supabase login` |
| CI falha mesmo após `npm run gen:db-types` | Versões diferentes da CLI | Alinhar local com versão do workflow (2.75.0) |
| Diff massivo inesperado | Migrations remotas sem pull local | `supabase db pull` antes de regenerar |

## Referências

- ADR-0041 — Migração faseada de database types
- DB-014 (technical-debt-assessment.md)
- Story 0.1 (`docs/stories/sprint-0/story-0.1-generate-database-types.md`)
