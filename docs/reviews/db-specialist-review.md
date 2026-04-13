## Database Specialist Review

### Débitos Validados
| ID | Débito | Severidade | Horas | Prioridade | Notas |
|----|--------|------------|-------|------------|-------|
| DB-01 | PII Exposure (Plaintext emails) | Média | 8 | Média | O risco é baixo devido ao RLS robusto, mas recomendo a médio prazo mover para pg_crypto. |
| DB-02 | Type Sync Debt (`store_sellers`) | Alta | 1 | Crítica | A falta de tipos causa dívida técnica silenciosa no Typescript. |
| DB-03 | N+1 Queries / Missing Indexes | Alta | 2 | Alta | Criar `CREATE INDEX idx_checkins_store_date ON daily_checkins (store_id, reference_date)`. |
| DB-04 | Legacy Ghost Tables | Média | 1 | Alta | Deve ser limpo imediatamente na próxima sprint para não onerar backups. |
| DB-05 | Service Role Bypass | Média | 4 | Média | Scripts rodando como service_role precisam ter políticas granulares. |
| DB-06 | Large Table Partitioning | Baixa | 16 | Baixíssima | Rebaixado para baixíssima prioridade, volume de dados atual não justifica particionamento. |

### Débitos Adicionados
- **DB-07 (Novo): Falta de Constraint na Tabela de PDI** - Algumas colunas não possuem a flag `NOT NULL` quando deveriam ser obrigatórias.

### Respostas ao Architect
1. **Criptografia de PII:** Como são apenas emails e frequentemente usados para convites/referências, o Supabase Vault não permite buscas e JOINs de forma simples. A abordagem recomendada, caso a empresa decida por conformidade LGPD estrita, é o uso de `pgcrypto` nativo do PostgreSQL na coluna. Por ora, nosso RLS restrito a `(auth.uid() = user_id)` é uma barreira de segurança suficiente para a Fase 1.
2. **Particionamento de Tabelas (DB-06):** No Postgres, o gatilho empírico para particionamento seria ultrapassar a RAM em cache ou atingir a casa de dezenas de milhões de linhas (+10GB). Com 100 vendedores fazendo 1 check-in/dia, temos ~36k linhas/ano. Essa tabela levará décadas para precisar de particionamento físico. A prioridade deste item cai de Baixa para Baixíssima.

### Recomendações
1. **Sprint Imediata:** DB-02 (Types), DB-03 (Indexes), DB-04 (Drops Legacy).
2. **Sprint Futura (Tech Debt):** DB-01 (Encrypt), DB-05 (Cron Service Roles).
