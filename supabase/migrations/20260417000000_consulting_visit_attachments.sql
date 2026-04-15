-- CONS-03 complement: Visit file attachments
-- Adds attachments column to consulting_visits and creates storage bucket.

-- 1. Add attachments jsonb column
ALTER TABLE public.consulting_visits
  ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.consulting_visits.attachments IS 'JSON array of file attachment metadata: [{id, filename, storage_path, content_type, size_bytes, uploaded_at}]';

-- 2. Create storage bucket for visit files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'consulting-visit-files',
  'consulting-visit-files',
  false,
  10485760,
  ARRAY[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'application/vnd.ms-excel'
  ]
) ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS: admins and assigned consultants can upload
CREATE POLICY "visit_files_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'consulting-visit-files'
    AND (is_admin() OR EXISTS (
      SELECT 1 FROM public.consulting_assignments ca
      WHERE ca.client_id::text = (storage.foldername(SPLIT_PART(name, '/', 2)))::text
        AND ca.user_id = auth.uid()
        AND ca.active = true
    ))
  );

-- 4. Storage RLS: read access for admins and assigned consultants
CREATE POLICY "visit_files_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'consulting-visit-files'
    AND (is_admin() OR EXISTS (
      SELECT 1 FROM public.consulting_assignments ca
      WHERE ca.client_id::text = (storage.foldername(SPLIT_PART(name, '/', 2)))::text
        AND ca.user_id = auth.uid()
        AND ca.active = true
    ))
  );

-- 5. Storage RLS: delete for admins only
CREATE POLICY "visit_files_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'consulting-visit-files'
    AND is_admin()
  );
