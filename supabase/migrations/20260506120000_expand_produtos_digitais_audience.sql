ALTER TABLE public.produtos_digitais
  DROP CONSTRAINT IF EXISTS produtos_digitais_target_roles_check;

ALTER TABLE public.produtos_digitais
  ADD CONSTRAINT produtos_digitais_target_roles_check
  CHECK (
    target_roles <@ ARRAY[
      'administrador_geral',
      'administrador_mx',
      'consultor_mx',
      'dono',
      'gerente',
      'vendedor'
    ]::text[]
    AND array_length(target_roles, 1) IS NOT NULL
  )
  NOT VALID;

NOTIFY pgrst, 'reload schema';
