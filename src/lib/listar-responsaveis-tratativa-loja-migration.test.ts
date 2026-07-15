import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

// MX-22.4 (AC-1; Spec §9.1 "Responsável pela Tratativa"): a RLS de
// vinculos_loja_select/usuarios_select bloqueia um vendedor comum de ver
// colegas de loja (tem_papel_loja avalia o papel de quem consulta, não de
// quem é lido). Esta RPC segue o precedente de
// contar_vendedores_ativos_loja.sql — sem harness de Postgres real no CI,
// asserções via regex sobre o SQL (memória do time: pgTAP/Supabase Preview
// falham por ausência de secrets, não por código).
const sql = readFileSync(
  new URL('../../supabase/migrations/20260715124852_listar_responsaveis_tratativa_loja.sql', import.meta.url),
  'utf8',
)

describe('listar_responsaveis_tratativa_loja migration', () => {
  test('é SECURITY DEFINER com search_path fixo (mesmo padrão de contar_vendedores_ativos_loja)', () => {
    expect(sql).toContain('SECURITY DEFINER')
    expect(sql).toContain('SET search_path = public')
  })

  test('exige que o chamador seja membro ativo da própria loja (defesa em profundidade, não abre a tabela crua)', () => {
    expect(sql).toContain('auth.uid() IS NOT NULL')
    expect(sql).toContain('self.user_id = auth.uid()')
    expect(sql).toContain('self.is_active = true')
  })

  test('retorna só id/name/role — nunca dados sensíveis adicionais', () => {
    expect(sql).toContain('RETURNS TABLE (id uuid, name text, role text)')
    expect(sql).not.toContain('SELECT *')
  })

  test('filtra por papel elegível (vendedor/gerente/dono) e usuário ativo, igual ao filtro client-side que substitui', () => {
    expect(sql).toContain("v.role IN ('vendedor', 'gerente', 'dono')")
    expect(sql).toContain('coalesce(u.active, true) <> false')
  })

  test('concede EXECUTE para authenticated', () => {
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.listar_responsaveis_tratativa_loja(uuid) TO authenticated')
  })
})
