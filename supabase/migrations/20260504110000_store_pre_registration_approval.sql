-- Story OPS-20260504 - Store pre-registration approval, avatar and secure pending login.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pre-cadastro-avatares',
  'pre-cadastro-avatares',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE public.pre_cadastros_loja
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS avatar_storage_path text,
  ADD COLUMN IF NOT EXISTS temporary_password text,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_note text;

CREATE INDEX IF NOT EXISTS pre_cadastros_loja_auth_user_idx
  ON public.pre_cadastros_loja(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS pre_cadastros_loja_pending_idx
  ON public.pre_cadastros_loja(status, submitted_at DESC)
  WHERE status = 'pending';

DROP POLICY IF EXISTS pre_cadastros_loja_select_scoped ON public.pre_cadastros_loja;
CREATE POLICY pre_cadastros_loja_select_scoped
  ON public.pre_cadastros_loja
  FOR SELECT
  TO authenticated
  USING (public.eh_administrador_mx());

DROP POLICY IF EXISTS pre_cadastros_loja_update_scoped ON public.pre_cadastros_loja;
CREATE POLICY pre_cadastros_loja_update_scoped
  ON public.pre_cadastros_loja
  FOR UPDATE
  TO authenticated
  USING (public.eh_administrador_mx())
  WITH CHECK (public.eh_administrador_mx());

GRANT SELECT, UPDATE ON public.pre_cadastros_loja TO authenticated;

COMMENT ON COLUMN public.pre_cadastros_loja.auth_user_id IS 'Usuario Auth/Profile criado em modo inativo ate aprovacao do Admin MX.';
COMMENT ON COLUMN public.pre_cadastros_loja.avatar_url IS 'URL publica da foto enviada no pre-cadastro para compor o avatar do perfil.';
COMMENT ON COLUMN public.pre_cadastros_loja.temporary_password IS 'Senha provisoria criada pelo fluxo de pre-cadastro. A leitura e restrita a Admin MX por RLS.';
