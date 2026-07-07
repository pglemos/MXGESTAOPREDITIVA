ALTER TABLE public.lancamentos_diarios
  ADD COLUMN IF NOT EXISTS leads_net integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS leads_net_prev_day integer DEFAULT 0 NOT NULL;

COMMENT ON COLUMN public.lancamentos_diarios.leads_net IS 'Leads recebidos via Internet no dia de referência (campo "Internet" do Fechamento Diário).';
COMMENT ON COLUMN public.lancamentos_diarios.leads_net_prev_day IS 'Espelho histórico de leads_net, mesmo padrão usado por leads_prev_day/vnd_net_prev_day.';
