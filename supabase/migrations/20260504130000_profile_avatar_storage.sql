-- Story OPS-20260504 - Profile avatar storage for all roles.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'perfis_usuario',
  'perfis_usuario',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS perfis_usuario_select_public ON storage.objects;
CREATE POLICY perfis_usuario_select_public
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'perfis_usuario');

DROP POLICY IF EXISTS perfis_usuario_insert_own ON storage.objects;
CREATE POLICY perfis_usuario_insert_own
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'perfis_usuario'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS perfis_usuario_update_own ON storage.objects;
CREATE POLICY perfis_usuario_update_own
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'perfis_usuario'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'perfis_usuario'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS perfis_usuario_delete_own ON storage.objects;
CREATE POLICY perfis_usuario_delete_own
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'perfis_usuario'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

COMMENT ON COLUMN public.usuarios.avatar_url IS 'URL publica do avatar do perfil. Editavel pelo proprio usuario em /perfil e Configuracoes > Perfil.';
