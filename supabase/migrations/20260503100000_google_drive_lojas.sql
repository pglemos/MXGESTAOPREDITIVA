-- Story OPS-20260503: Google Drive central por loja.

BEGIN;

CREATE TABLE IF NOT EXISTS public.pastas_drive_consultoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clientes_consultoria(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.lojas(id) ON DELETE SET NULL,
  parent_folder_id text NOT NULL,
  google_drive_folder_id text NOT NULL,
  google_drive_folder_url text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'error')),
  created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pastas_drive_consultoria_client_unique UNIQUE (client_id),
  CONSTRAINT pastas_drive_consultoria_folder_unique UNIQUE (google_drive_folder_id)
);

CREATE TABLE IF NOT EXISTS public.arquivos_drive_consultoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pasta_id uuid NOT NULL REFERENCES public.pastas_drive_consultoria(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clientes_consultoria(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.lojas(id) ON DELETE SET NULL,
  google_drive_file_id text NOT NULL,
  name text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  size_bytes bigint NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  web_view_link text,
  web_content_link text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trashed', 'deleted', 'error')),
  uploaded_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  deleted_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT arquivos_drive_consultoria_file_unique UNIQUE (google_drive_file_id)
);

CREATE INDEX IF NOT EXISTS pastas_drive_consultoria_store_idx
  ON public.pastas_drive_consultoria (store_id);

CREATE INDEX IF NOT EXISTS arquivos_drive_consultoria_client_status_idx
  ON public.arquivos_drive_consultoria (client_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS arquivos_drive_consultoria_pasta_idx
  ON public.arquivos_drive_consultoria (pasta_id);

DROP TRIGGER IF EXISTS update_pastas_drive_consultoria_updated_at ON public.pastas_drive_consultoria;
CREATE TRIGGER update_pastas_drive_consultoria_updated_at
BEFORE UPDATE ON public.pastas_drive_consultoria
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_arquivos_drive_consultoria_updated_at ON public.arquivos_drive_consultoria;
CREATE TRIGGER update_arquivos_drive_consultoria_updated_at
BEFORE UPDATE ON public.arquivos_drive_consultoria
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

ALTER TABLE public.pastas_drive_consultoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arquivos_drive_consultoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pastas_drive_consultoria_internal_select ON public.pastas_drive_consultoria;
CREATE POLICY pastas_drive_consultoria_internal_select ON public.pastas_drive_consultoria
  FOR SELECT TO authenticated
  USING (public.eh_area_interna_mx());

DROP POLICY IF EXISTS pastas_drive_consultoria_internal_write ON public.pastas_drive_consultoria;
CREATE POLICY pastas_drive_consultoria_internal_write ON public.pastas_drive_consultoria
  FOR ALL TO authenticated
  USING (public.eh_area_interna_mx())
  WITH CHECK (public.eh_area_interna_mx());

DROP POLICY IF EXISTS arquivos_drive_consultoria_internal_select ON public.arquivos_drive_consultoria;
CREATE POLICY arquivos_drive_consultoria_internal_select ON public.arquivos_drive_consultoria
  FOR SELECT TO authenticated
  USING (public.eh_area_interna_mx());

DROP POLICY IF EXISTS arquivos_drive_consultoria_internal_write ON public.arquivos_drive_consultoria;
CREATE POLICY arquivos_drive_consultoria_internal_write ON public.arquivos_drive_consultoria
  FOR ALL TO authenticated
  USING (public.eh_area_interna_mx())
  WITH CHECK (public.eh_area_interna_mx());

COMMENT ON TABLE public.pastas_drive_consultoria
  IS 'Pastas Google Drive criadas pela conta central MX para clientes/lojas da consultoria.';

COMMENT ON TABLE public.arquivos_drive_consultoria
  IS 'Cache e auditoria de arquivos enviados ao Google Drive central por cliente/loja.';

COMMIT;
