# Story: Relatório Mensal de Fechamento (13)

## Descrição
Implementação do fechamento mensal automatizado para as unidades MX, consolidando a performance do mês anterior, gerando ranking consolidado e anexo Excel com memória operacional.

## Regras de Negócio Legadas
- **Janela Temporal**: Processamento sempre referente ao mês civil anterior (ex: no dia 01/05, processa 01/04 a 30/04).
- **Paridade Excel**: Deve gerar um arquivo XLSX com os mesmos campos do legado (Leads, Agendamentos, Visitas, Vendas, Conversão).
- **Idempotência**: Uso de logs (PropertiesService no legado, `logs_reprocessamento` no SaaS) para evitar disparos duplicados para a mesma loja.
- **Acionamento**: Automatizado via `pg_cron` no dia 1 de cada mês às 10:30.

## Implementação Técnica
- **Edge Function**: `supabase/functions/relatorio-mensal/index.ts`
- **Trigger**: `cron.schedule('mensal-reports', '30 10 1 * *', ...)`
- **Notificação**: Envio via Resend API para os destinatários configurados em `regras_entrega_loja.monthly_recipients`.

## Verificação
- [x] Lógica de mês anterior validada.
- [x] Geração de XML Excel base64 validada.
- [x] Registro de logs de execução funcional.
