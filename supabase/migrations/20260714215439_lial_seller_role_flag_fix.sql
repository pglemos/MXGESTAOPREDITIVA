-- LIAL seller classification fix: these active accounts are real sellers,
-- not the synthetic "Venda Loja" ranking row.
UPDATE public.usuarios u
SET is_venda_loja = false,
    updated_at = now()
WHERE u.email IN (
  'diellelages@gmail.com',
  'gestaobrunosantos@gmail.com',
  'joaodanielvdhf@gmail.com'
)
  AND u.role = 'vendedor'
  AND EXISTS (
    SELECT 1
    FROM public.vendedores_loja vl
    JOIN public.lojas l ON l.id = vl.store_id
    WHERE vl.seller_user_id = u.id
      AND vl.is_active = true
      AND upper(l.name) = 'LIAL'
      AND l.active = true
  );
