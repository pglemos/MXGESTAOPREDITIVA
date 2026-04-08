# Implementation Plan: Motor de Reprocessamento e Reparo MX (story-purge-04-reprocessamento)

## Objective
Transformar o reprocessamento de base de um registro passivo em uma **Máquina de Reparo Administrativo**, permitindo importação de planilhas, validação rígida de cabeçalhos, reconstrução da base canônica e logs detalhados.

---

## Key Files & Context
- `src/pages/Reprocessamento.tsx`: Terminal de controle administrativo.
- `src/hooks/useData.ts`: Hook para gerenciar operações de reparo.
- `supabase/migrations/20260403000003_epic11_reprocess.sql`: Lógica de banco de dados.
- `src/lib/csv-parser.ts`: Nova utilidade para validação de cabeçalhos.

---

## Implementation Steps

### Phase 1: Database & Intelligence (The Engine)
1. **Schema Update**:
   - Criar tabela `raw_imports` para armazenar o JSON bruto importado.
   - Adicionar coluna `error_log` (JSONB) em `reprocess_logs` para detalhar falhas de validação.
2. **PL/pgSQL Logic**:
   - Implementar `public.process_import_data(p_log_id UUID)`:
     - Valida se as colunas essenciais existem no JSON (DATA, LOJA, VENDEDOR, etc).
     - Limpa registros conflitantes na `daily_checkins` para o período.
     - Insere dados na `daily_checkins` seguindo o modelo canônico.

### Phase 2: Interface de Importação (The Terminal)
1. **Spreadsheet Upload**:
   - Implementar dropzone para arquivos CSV/Excel.
   - Criar modal de **Mapeamento de Cabeçalhos**: Se o CSV vier com "Data da Venda", o admin mapeia para "reference_date".
2. **Header Validation**:
   - Impedir o processamento se colunas mandatórias estiverem faltando.
   - Mostrar preview dos dados antes de confirmar a reconstrução.

### Phase 3: Monitoring & Logging (The Audit)
1. **Detailed Logs**:
   - Exibir no terminal: "150 registros processados, 2 erros de formato, 0 duplicados".
   - Botão para baixar o log de erros em TXT/JSON.
2. **Status Real-time**:
   - Usar Supabase Realtime para atualizar a barra de progresso no frontend enquanto o banco processa.

---

## Verification & Testing
- [ ] **Teste de Importação Suja**: Subir arquivo com cabeçalhos errados e verificar se o sistema bloqueia e pede mapeamento.
- [ ] **Teste de Reconstrução**: Importar 10 registros, alterar manualmente um dado no banco, rodar o reprocessamento e verificar se o dado foi corrigido conforme a planilha.
- [ ] **Auditoria de Log**: Garantir que o `triggered_by` e o `finished_at` estão sendo gravados corretamente.
