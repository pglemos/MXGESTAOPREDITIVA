-- Migration: Adicionar coluna 'slug' em consulting_clients e preencher
ALTER TABLE public.consulting_clients ADD COLUMN IF NOT EXISTS slug TEXT;

-- Atualizar slugs com base no nome
UPDATE public.consulting_clients 
SET slug = lower(regexp_replace(trim(name), '\s+', '-', 'g')) 
WHERE slug IS NULL;

-- Tornar UNIQUE e NOT NULL
ALTER TABLE public.consulting_clients ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.consulting_clients ADD CONSTRAINT consulting_clients_slug_key UNIQUE (slug);

-- Criar trigger para auto-atualizar slug caso o nome mude
CREATE OR REPLACE FUNCTION public.update_client_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name <> OLD.name THEN
    NEW.slug := lower(regexp_replace(trim(NEW.name), '\s+', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_consulting_clients_slug_update
BEFORE UPDATE ON public.consulting_clients
FOR EACH ROW EXECUTE FUNCTION public.update_client_slug();
