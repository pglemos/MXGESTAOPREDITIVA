# Template — Aprovação Formal DPO para Eliminação de Backup PII

**Aplicação:** Story 1.7 — DB-013 (Sprint 1)
**Base legal:** LGPD Art. 5º X + Art. 16 (eliminação após cumprimento da finalidade)
**Solicitante:** @data-engineer (Dara) + @devops (Gage)
**Responsável aprovação:** DPO / Encarregado de Dados

---

## 1. Identificação dos Dados a Eliminar

| Tabela | Schema | Conteúdo PII | Origem |
|---|---|---|---|
| `migration_backup_vendedores_loja_duplicates_20260503` | public | Nomes completos, e-mails, vínculos de payroll | Backup de migração de duplicatas (2026-05-03) |
| `migration_backup_lancamentos_diarios_duplicates_20260503` | public | Lançamentos financeiros vinculados a vendedores (PII indireta) | Backup de migração de duplicatas (2026-05-03) |

**Volume estimado:** a confirmar via `SELECT count(*)` (registrado em `logs_auditoria.details_json.row_count` no momento da execução)

**Período de coleta dos dados originais:** anteriores a 2026-05-03 (data do backup de migração)

---

## 2. Base Legal para Eliminação

| Dispositivo | Aplicação |
|---|---|
| **LGPD Art. 16** | Os dados pessoais devem ser eliminados após o término de seu tratamento. Backup criado durante migração técnica em 2026-05-03 cumpriu sua finalidade. |
| **LGPD Art. 6º III (necessidade)** | Tratamento limitado ao mínimo necessário. Manter backup sem RLS configurada viola o princípio. |
| **LGPD Art. 6º VII (segurança)** | Tabelas sem RLS expõem dados a queries não autorizadas. Eliminar reduz superfície de ataque. |

---

## 3. Justificativa Técnica

- Tabelas são **snapshots one-off** criados durante migração de remoção de duplicatas em 2026-05-03.
- **Sem RLS habilitada** (identificado em `db-specialist-review.md §DB-013`).
- **Sem propósito ativo:** não são consultadas por nenhuma RPC, view ou aplicação.
- **Sem política de retenção definida** no schema atual.
- Continuar mantendo essas tabelas constitui **risco LGPD direto e imediato**.

---

## 4. Análise de Risco — Não Eliminar (manter status quo)

| Risco | Severidade | Probabilidade |
|---|---|---|
| Vazamento via query não autorizada (sem RLS) | Crítica | Média |
| Auditoria LGPD identifica não-conformidade | Crítica | Alta (em qualquer auditoria) |
| Exposição via incidente de segurança no banco | Crítica | Baixa-Média |
| Custo regulatório (multa LGPD até 2% receita / R$ 50M) | Alta | Condicional a vazamento |
| Manutenção indefinida de dados sem propósito | Alta | Certo (já em andamento) |

---

## 5. Plano de Eliminação (encrypt-then-drop)

1. **Export criptografado offline** AES-256-GCM com KMS key dedicada para bucket S3 privado.
2. **Validação:** row_count export == origem; spot-check 100 linhas; checksum SHA-256.
3. **Retenção do export offline:** 1 ano (padrão LGPD para período razoável pós-eliminação).
4. **Acesso ao export offline:** restrito (IAM role-based, zero acesso público, log de acesso auditado).
5. **DROP TABLE** registrado em `logs_auditoria` com `user_id`, timestamp, row_count, base legal.
6. **Rollback:** PITR Supabase (janela 7 dias) + export offline (RTO ~2h).

Detalhes completos: `docs/runbooks/sprint-1-story-1.7-drop-pii-backups.md`
SQL manual técnico: `supabase/migrations/_archived/20260521120000_drop_migration_backups_pii.sql`

---

## 6. Compromissos do Solicitante

- [ ] Garantir export offline validado ANTES do DROP em produção
- [ ] Aplicar primeiro em staging e validar smoke tests
- [ ] Comunicar DPO post-execution com row_count final e link do audit log
- [ ] Manter export offline pelo período de retenção acordado (default: 1 ano)
- [ ] Notificar DPO em caso de qualquer incidente envolvendo o export offline

---

## 7. Aprovação Formal

```
APROVAÇÃO PARA ELIMINAÇÃO DE BACKUP PII — Story 1.7 / DB-013

Eu, ______________________________________ (nome do DPO/Encarregado),
na qualidade de Responsável pelo Tratamento de Dados,

[  ] APROVO  /  [  ] APROVO COM RESSALVAS  /  [  ] REJEITO

a eliminação das tabelas listadas na Seção 1 deste documento, conforme
plano descrito nas Seções 5 e 6, com base nos dispositivos legais da
Seção 2.

Ressalvas/condições adicionais (se houver):
__________________________________________________________________
__________________________________________________________________
__________________________________________________________________

Período de retenção do export offline aprovado: ______ ano(s)

Data: _____ / _____ / _________

Assinatura:    _____________________________________________________

E-mail formal de confirmação enviado para: _________________________
```

---

## 8. Anexos Esperados ao PR

- Este template assinado (PDF ou e-mail formal)
- Confirmação de snapshot PITR pré-execução
- Checksum SHA-256 do export offline
- Link/identificador do bucket S3 (sem credenciais)

---

## Referências
- LGPD Lei 13.709/2018 — Art. 5º, 6º, 16
- ANPD — Guia de Boas Práticas para Eliminação de Dados Pessoais
- ISO/IEC 27001:2022 — A.8.10 (Information deletion)
