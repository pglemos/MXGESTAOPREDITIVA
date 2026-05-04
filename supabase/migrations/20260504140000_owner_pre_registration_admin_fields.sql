-- Story OPS-20260504 - Owner pre-registration administrative store fields.

ALTER TABLE public.lojas
  ADD COLUMN IF NOT EXISTS administrative_phone text;

ALTER TABLE public.pre_cadastros_loja
  ADD COLUMN IF NOT EXISTS company_legal_name text,
  ADD COLUMN IF NOT EXISTS company_cnpj text,
  ADD COLUMN IF NOT EXISTS company_address text,
  ADD COLUMN IF NOT EXISTS company_administrative_phone text;

COMMENT ON COLUMN public.lojas.administrative_phone IS 'Telefone administrativo da loja para contato operacional e governanca.';
COMMENT ON COLUMN public.pre_cadastros_loja.company_legal_name IS 'Razao social informada quando o pre-cadastro e feito como dono.';
COMMENT ON COLUMN public.pre_cadastros_loja.company_cnpj IS 'CNPJ informado quando o pre-cadastro e feito como dono.';
COMMENT ON COLUMN public.pre_cadastros_loja.company_address IS 'Endereco completo informado quando o pre-cadastro e feito como dono.';
COMMENT ON COLUMN public.pre_cadastros_loja.company_administrative_phone IS 'Telefone administrativo informado quando o pre-cadastro e feito como dono.';
