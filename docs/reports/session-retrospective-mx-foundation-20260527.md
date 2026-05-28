# Session Retrospective — MX Performance Foundation (2026-05-27)

**Sessão:** Pipeline AIOX Wave-1 end-to-end orquestrado por Orion (aiox-master).
**Duração:** ~1 sessão de trabalho intensiva.
**Outcome:** Fundação completa entregue + 3 PRs mergeados + 3 migrations em prod.

---

## 1. Trabalho entregue

### 1.1 PRs mergeados em `main`

| PR | Commit final | Conteúdo |
|---|---|---|
| **#69** | `0043786` | Pipeline AIOX completo: PRD-mestre + 3 épicos + 6 stories + 2 migrations + 2 ADRs (14 arquivos, 2120 linhas) |
| **#70** | `aac7b11` | CodeRabbit Major fixes (azul→verde + classifyScore hardening) + correção pós-erro grave |
| **#71** | `980fc65` | CodeRabbit Minor cleanup + MX-2.2 RLS draft + tech debt story mx-indigo |

### 1.2 Aplicado em produção Supabase (`fbhcmzzgwjdgkctlfvbo`)

| Migration | Status | Verificação |
|---|---|---|
| `20260527100000_canonical_roles_schema` | ✅ Applied | 11 roles, 241/241 users mapped |
| `20260527110000_score_engine_schema` | ✅ Applied | 4 tabelas + 11 funções canônicas |
| `20260527120000_role_rls_helpers` | ✅ Applied | 5 helpers RLS (current_user_role_code, user_has_role, etc.) |

### 1.3 Componentes e tokens

- **AlertCard** (`src/components/molecules/AlertCard.tsx`) + 11 testes pass
- **MX-1.1 tokens** (CSS @theme + TS mirror): `--color-alert-consultive` + 5 `--color-score-*`
- **TS types regenerados** com novas tabelas e ENUMs

### 1.4 Decisões arquiteturais (ADRs)

- **ADR-MX-001** Canonical Roles Schema (estratégia aditiva, preserva legado)
- **ADR-MX-002** Branding cor: **Opção B aprovada** (manter verde `#22C55E`)

---

## 2. Pipeline AIOX executado

```
.docx fonte (387 parágrafos)
   ↓ @pm *create-prd
PRD-mestre (18 KB, PO 10/10)
   ↓ @pm *create-epic (Top-3)
3 Épicos: MX-01 (DS), MX-02 (Perfis), MX-07 (Motor Score)
   ↓ @sm *draft batch
6 Stories Wave-1 (validadas 10/10 batch pelo @po)
   ↓ @data-engineer + @dev implementação
2 Migrations + 1 componente + tokens (typecheck/lint/test/build verdes)
   ↓ @devops *push + *create-pr + *merge
3 PRs mergeados em main
```

---

## 3. Decisões pendentes (Wave-3+)

| Item | Status | Quem decide |
|---|---|---|
| **Master-por-loja** A/B/C | 🛑 Bloqueado | Stakeholder (Daniel, José, etc.) — ver `story-MX-02-master-por-loja` |
| **MX-2.2 policies finais em prod** | 🟡 Draft pronto (`.draft_20260527130000_score_rls_final.sql`) | Após validação UI em staging |
| **mx-indigo cleanup** | 🟡 Story pronta | Refactor de 4 consumidores |
| **Refatorar `eh_admin_master_mx()` allowlist** | 🟡 Backlog | Tech debt independente |

---

## 4. Working dir do user — intocado

| Arquivo modificado pré-sessão | Status |
|---|---|
| `docs/stories/story-OPS-20260508-role-ui-responsive-hardening.md` | M (preservado) |
| `src/components/Layout.tsx` | M (preservado) |
| `src/features/dashboard-loja/DashboardLoja.container.tsx` | M (preservado) |
| `src/features/dashboard-loja/sections/KpisSection.tsx` | M (preservado) |
| `src/features/dashboard-loja/sections/OwnerDecisionCards.tsx` | M (preservado) |
| `src/features/dashboard-loja/sections/PerformanceAlerts.tsx` | M (preservado) |
| `src/features/dashboard-loja/sections/PerformanceTab.tsx` | M (preservado) |
| `src/features/vendedor-home/VendedorHome.container.tsx` | M (preservado) |
| `src/features/vendedor-home/hooks/useVendedorHomePage.ts` | M (preservado) |
| `provas-google-meet/`, `provas-google-meet-20260522/` | ?? (preservado) |
| `docs/prd/*` (4 PRDs prévios) | ?? (preservado) |
| `docs/stories/story-OWNER-20260526-cockpit-executivo-dono.md` | ?? (preservado) |
| `src/features/dashboard-loja/sections/{Owner,Manager}*Cockpit.tsx` | ?? (preservado) |

---

## 5. Erros operacionais cometidos + corrigidos

### Erro #1 — `git add -u` com mods misturadas (commit `19ef783`)

**Sintoma:** Commit inadvertidamente incluiu 9 arquivos do working dir do user junto com 5 arquivos meus, publicando trabalho não-finalizado em branch pública.

**Causa raiz:** Uso de `git add -u` que stage TUDO modificado em tracked files, sem discriminar.

**Correção:** Worktree isolado em `/tmp/mx_cleanup`, cherry-pick cirúrgico apenas dos 5 arquivos meus, força-push de novo commit (`7588814`) substituindo `19ef783`.

**Impacto user:** Branch pública teve trabalho user exposto por ~30min; corrigido.

### Erro #2 — `git reset --hard origin/main` apagou tracked mods do user

**Sintoma:** Após merge do PR #71, sincronização do local main descartou 9 modificações tracked do working dir.

**Causa raiz:** `git reset --hard` descarta TODAS as mudanças não-commitadas em tracked files, sem distinguir entre meu trabalho e do user.

**Correção:** Recuperação via `git checkout 19ef783 -- <files>` + `git reset HEAD -- <files>` para restaurar como working dir mods (não staged). 100% recuperável porque commit ainda no reflog.

**Impacto user:** Modificações perdidas localmente por ~5min até recuperação; nenhuma perda permanente.

---

## 6. Lições aprendidas (regras para futuras sessões)

### Regra 1 — Listar arquivos explicitamente em `git add`

❌ **Nunca:**
```bash
git add -u   # stage TUDO modificado
git add .    # stage TUDO no diretório atual
```

✅ **Sempre:**
```bash
git add file1.md file2.ts file3.sql   # explícito, cirúrgico
```

### Regra 2 — Sincronização de branch com mods em working dir

❌ **Nunca:**
```bash
git reset --hard origin/main   # apaga mods tracked não-commitadas
git clean -fd                  # apaga mods untracked
```

✅ **Sempre:** Usar worktree isolado quando há trabalho em progresso:
```bash
git worktree add /tmp/work origin/main
cd /tmp/work
# fazer mudanças aqui, force-push, depois remover worktree
git worktree remove /tmp/work
```

OU stash antes:
```bash
git stash push -u -m "preservar antes de sync"
git pull --rebase
git stash pop
```

### Regra 3 — Aplicação de migrations em projetos críticos

✅ **Sempre verificar antes:**
- Existe tabela/coluna que estou criando? (`information_schema.tables`/`columns`)
- Há FKs externas? (`pg_constraint` joinado com `table_constraints`)
- Há valores em uso que minha migration vai conflitar? (queries de inventário)

✅ **Aplicar via Management API direta** quando há migrations pendentes "perigosas" no histórico:
- Permite skip cirúrgico
- Evita `db push` que aplica tudo em ordem

### Regra 4 — Pré-existing user work é sagrado

- ✅ Working dir do user é INTOCÁVEL
- ✅ Untracked files (`??`) podem ser trabalho em progresso valioso
- ✅ Modified files (`M`) podem ser mudanças sensíveis não revisadas
- ⛔ **Nunca** commitar/pushar arquivos do user sem instrução explícita
- ⛔ **Nunca** rodar destrutivos (`reset --hard`, `clean -fd`) com mods do user pendentes

---

## 7. Comandos úteis para recovery

```bash
# Encontrar trabalho perdido via reflog
git reflog | head -20

# Recuperar arquivo específico de commit antigo (sem fazer checkout do branch)
git checkout <commit-sha> -- path/to/file.ts

# Após git checkout (que stage), restaurar como working dir mod (não staged)
git reset HEAD -- path/to/file.ts

# Inspecionar conteúdo de arquivo em commit sem aplicar
git show <commit-sha>:path/to/file.ts
```

---

## 8. Métricas finais consolidadas

| Categoria | Valor |
|---|---|
| PRs mergeados | 3 |
| Commits em `main` (incluindo merges) | 10 |
| Migrations aplicadas em prod | 3 |
| Roles canônicos catalogados | 11 |
| Usuários mapeados via backfill | 241/241 (100%) |
| Tabelas score criadas | 4 |
| Funções SQL canônicas | 11 |
| Componentes UI novos | 1 (AlertCard + 11 tests) |
| Tokens de design adicionados | 7 (1 alert + 5 score + 1 surface) |
| Documentos novos (PRD/ADR/Story/Epic) | ~25 |
| Linhas adicionadas no codebase | ~4500 |
| Quality gates falhados | 0 |
| Token PAT vazado | 0 |
| Erros operacionais cometidos | 2 |
| Erros corrigidos | 2 |
| Trabalho do user perdido definitivamente | 0 |

---

## 9. Próximos passos sugeridos (em ordem)

1. **Você commita seu trabalho pendente** (9 mods + 2 cockpits untracked + PRDs/story untracked)
2. **Decide Master-por-loja** (Opção A/B/C) — ver `story-MX-02-20260527-master-por-loja.md`
3. **Validate MX-2.2 RLS final** em staging Supabase (renomear `.draft_20260527130000_score_rls_final.sql` → sem prefixo + push)
4. **Wave-3:** implementar EPIC-MX-03 (Home Dono) ou EPIC-MX-04 (Home Gerente) consumindo a fundação
5. **Tech debt cleanup:** mx-indigo aliases + allowlist `eh_admin_master_mx()`

---

**Sessão fechada.** Estado: production-ready, working dir preservado, lições documentadas.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
