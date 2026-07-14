import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260714182104_lock_seller_pdi_structural_edits.sql', import.meta.url)
const pagePath = new URL('../base44-reference/pages/PDIPage.jsx', import.meta.url)

describe('seller PDI structural edit lock', () => {
  test('removes seller write paths from legacy and 360 PDI data', () => {
    const sql = readFileSync(migrationPath, 'utf8')

    expect(sql).toContain('CREATE POLICY role_matrix_pdis_update')
    expect(sql).not.toContain('seller_id = auth.uid()')
    expect(sql).toContain('pdi_metas_write_operacional')
    expect(sql).toContain('pdi_plano_write_operacional')
    expect(sql).toContain('REVOKE EXECUTE ON FUNCTION public.vendedor_atualizar_pdi_acao_status')
    expect(sql).toContain('CREATE POLICY planos_update_leadership')
  })

  test('disables the rendered legacy PDI controls for non-managers', () => {
    const source = readFileSync(pagePath, 'utf8')

    expect(source).toContain('const canEdit = canManagePDI(role)')
    expect(source).toContain('disabled={disabled}')
    expect(source).toContain('disabled={!canEdit}')
    expect(source).toContain('{canEdit && <Dialog')
  })
})
