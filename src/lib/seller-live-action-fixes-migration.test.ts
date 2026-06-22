import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationSql = readFileSync(
  new URL('../../supabase/migrations/20260619093000_seller_live_action_fixes.sql', import.meta.url),
  'utf8',
)

describe('seller live action fixes migration', () => {
  test('keeps vendedor perfil notification columns additive and schema-cache safe', () => {
    expect(migrationSql).toContain('ADD COLUMN IF NOT EXISTS fechar_dia_notificacao_ativa')
    expect(migrationSql).toContain('ADD COLUMN IF NOT EXISTS fechar_dia_notificacao_hora')
    expect(migrationSql).toContain("NOTIFY pgrst, 'reload schema'")
  })

  test('allows seller linked to the store to generate Consultor IA suggestions', () => {
    expect(migrationSql).toContain("public.tem_papel_loja(p_store_id, ARRAY['dono','gerente','vendedor'], auth.uid())")
    expect(migrationSql).toContain('GRANT EXECUTE ON FUNCTION public.consultor_ia_sugerir_acao(uuid, date) TO authenticated')
    expect(migrationSql).toContain("'store'::public.score_scope_type")
    expect(migrationSql).not.toContain("'loja'::public.score_scope_type")
  })
})
