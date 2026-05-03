-- Config table for central Drive settings (prevents duplicate root folders)
CREATE TABLE IF NOT EXISTS config_drive_central (
  key  TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE config_drive_central ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full" ON config_drive_central
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Per-client document-type subfolders
CREATE TABLE IF NOT EXISTS subpastas_drive_consultoria (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pasta_id                UUID NOT NULL REFERENCES pastas_drive_consultoria(id) ON DELETE CASCADE,
  client_id               UUID NOT NULL REFERENCES clientes_consultoria(id) ON DELETE CASCADE,
  tipo                    TEXT NOT NULL CHECK (tipo IN ('pdi','feedback','relatorios','plano_acao','dre_financeiro','visitas')),
  google_drive_folder_id  TEXT NOT NULL UNIQUE,
  google_drive_folder_url TEXT NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'active',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, tipo)
);

ALTER TABLE subpastas_drive_consultoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "internal_mx_read" ON subpastas_drive_consultoria
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
        AND role IN ('administrador_geral', 'administrador_mx', 'consultor_mx')
    )
  );

CREATE POLICY "service_role_full" ON subpastas_drive_consultoria
  FOR ALL TO service_role USING (true) WITH CHECK (true);
