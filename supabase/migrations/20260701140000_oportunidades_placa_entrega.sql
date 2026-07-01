-- Campos usados pelo formulario "Nova Venda" (NovoRegistroModal, Base44):
-- placa do veiculo vendido e data/hora de entrega prevista (cria atividade
-- de entrega quando preenchida).
alter table public.oportunidades
  add column if not exists placa_veiculo text,
  add column if not exists data_entrega_prevista timestamptz;
