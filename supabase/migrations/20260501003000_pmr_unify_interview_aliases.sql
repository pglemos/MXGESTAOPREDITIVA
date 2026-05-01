-- Unifica os modelos duplicados da Visita 1 do PMR.
-- As chaves antigas nasceram antes da nomenclatura final em portugues e
-- faziam a UI exibir oito entrevistas em vez das quatro entrevistas oficiais.

BEGIN;

WITH aliases(alias_key, canonical_key, canonical_role) AS (
  VALUES
    ('owner', 'dono', 'Dono / Sócio'),
    ('manager', 'gerente', 'Gerente'),
    ('process', 'processo', 'Processos'),
    ('seller', 'vendedor', 'Vendedores')
),
template_pairs AS (
  SELECT
    alias_template.id AS alias_template_id,
    canonical_template.id AS canonical_template_id,
    aliases.canonical_role
  FROM aliases
  JOIN public.modelos_formulario_pmr alias_template
    ON alias_template.form_key = aliases.alias_key
  JOIN public.modelos_formulario_pmr canonical_template
    ON canonical_template.form_key = aliases.canonical_key
)
UPDATE public.respostas_formulario_pmr responses
SET
  template_id = template_pairs.canonical_template_id,
  respondent_role = COALESCE(responses.respondent_role, template_pairs.canonical_role)
FROM template_pairs
WHERE responses.template_id = template_pairs.alias_template_id;

UPDATE public.modelos_formulario_pmr
SET active = false
WHERE form_key IN ('owner', 'manager', 'process', 'seller');

UPDATE public.modelos_formulario_pmr
SET active = true
WHERE form_key IN ('dono', 'gerente', 'processo', 'vendedor');

NOTIFY pgrst, 'reload schema';

COMMIT;
