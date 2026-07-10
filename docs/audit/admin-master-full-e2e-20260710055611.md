# Validacao E2E Admin Master MX - 20260710055611

- Run ID: `E2E_ADMIN_MASTER_20260710055611`
- Usuario validado: `synvollt@gmail.com`
- Ambiente: `https://mxperformance-9xqlwubmr-synvolt.vercel.app`
- Status geral: `FAIL`
- Senha: nao registrada neste artefato.

## Resumo

| Status | Total |
| --- | ---: |
| PASS | 2 |
| WARN | 0 |
| FAIL | 1 |
| BLOCKED | 0 |

## Resultados

| Secao | Validacao | Status | Detalhes |
| --- | --- | --- | --- |
| Preflight | account, role and password login | FAIL | `{"duration_ms":294,"message":"Login failed for synvollt@gmail.com: Invalid login credentials"}` |
| Limpeza | cleanup registry | PASS | `{"cleanupWarnings":[],"checks":[]}` |
| Limpeza | leftover verification | PASS | `{"leftovers":[],"checks":[]}` |

## Artefatos

- `output/e2e-admin-master-full-20260710055611/cleanup-registry.json`

## Limpeza

- Todos os registros E2E conhecidos foram removidos ou verificados no bloco de limpeza.
- A conta real validada foi preservada: papel, usuario e senha nao foram alterados pelo runner.
