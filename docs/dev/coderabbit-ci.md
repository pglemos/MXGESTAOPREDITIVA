# CodeRabbit CI — Runbook

**Story:** 0.10
**Workflow:** `.github/workflows/coderabbit-review.yml`
**Config:** `.coderabbit.yaml`
**Rule:** `.claude/rules/coderabbit-integration.md`

---

## O que é

Gate de CI que roda **CodeRabbit em modo `--prompt-only`** em cada PR para `main`. Falha o check se houver issues `CRITICAL` ou `HIGH` não tratadas.

## Setup inicial (DevOps)

1. Obter API key em https://app.coderabbit.ai/settings → API Keys
2. GitHub repo → Settings → Secrets and variables → Actions → New secret:
   - Nome: `CODERABBIT_API_KEY`
   - Valor: a key obtida
3. Verificar workflow rodando no próximo PR

## Rodar localmente antes de abrir PR

```bash
# Self-healing dev mode (Story 1.5 pattern: 2 iterações max)
coderabbit --severity CRITICAL,HIGH --auto-fix

# Manual review (sem auto-fix)
coderabbit -t uncommitted

# Comparar com main
coderabbit --prompt-only --base main
```

## O que faz check falhar

- Issues `CRITICAL` → falha
- Issues `HIGH` → falha
- Issues `MEDIUM` → documentadas como tech debt (não bloqueiam)
- Issues `LOW` → ignoradas

## Path filters configurados (`.coderabbit.yaml`)

Ignorados automaticamente:
- `*.generated.ts` — gerado, sem review humano
- `*.lock`, `package-lock.json`, `bun.lock`, `deno.lock` — lockfiles
- `supabase/migrations/_archived/**` — histórico
- `coverage/**`, `dist/**`, `node-compile-cache/**` — build artifacts

## Path instructions específicas

| Path | Foco da revisão |
|------|-----------------|
| `supabase/migrations/**` | search_path SECURITY DEFINER, REVOKE explícito, idempotência, FK ON DELETE, índices, **proibido `EXCEPTION WHEN others ... SQLERRM`** (Story 1.5 pattern) |
| `src/types/database.ts` | Manual em deprecation gradual (ADR-0041); prefira `database.generated.ts` |
| `src/hooks/**` | God-hooks >300 LOC, cleanup subscriptions, SRP |
| `src/pages/**` | Monolithic pages >500 LOC, CSS inline, FAQ inline (Lovable smell) |
| `supabase/functions/**` | Deno.env.get, validação inputs, rate limit |

## Resolução de falhas comuns

### "CRITICAL: search_path missing in SECURITY DEFINER function"
Adicionar `SET search_path = public` (ou schema específico) na função.

### "HIGH: SQLERRM leak in RPC"
Substituir por pattern `log_rpc_error(...)` (Story 1.5):
```sql
EXCEPTION WHEN others THEN
  DECLARE v_trace_id uuid;
  BEGIN
    v_trace_id := public.log_rpc_error('rpc_name', SQLSTATE, SQLERRM, auth.uid(), payload);
    RETURN jsonb_build_object('ok', false, 'error', 'Erro interno. trace_id=' || v_trace_id, 'trace_id', v_trace_id);
  END;
END;
```

### "CRITICAL: REVOKE missing after policy hardening"
Adicionar REVOKE explícito após mudança de policy:
```sql
REVOKE INSERT, UPDATE, DELETE ON public.lancamentos_diarios FROM authenticated;
```

### "HIGH: god-hook detected"
Hook >300 LOC. Fatiar em sub-hooks ou postergar com comentário `// TODO: UX-002 split`.

## Bypass excepcional

Comentário inline no PR: `@coderabbit allow CRITICAL: <razão>` (apenas tech lead). Logged para auditoria.

## Referências

- `.claude/rules/coderabbit-integration.md`
- `.coderabbit.yaml`
- `.github/workflows/coderabbit-review.yml`
- Story 0.10: `docs/stories/sprint-0/story-0.10-ci-coderabbit-prompt-only.md`
