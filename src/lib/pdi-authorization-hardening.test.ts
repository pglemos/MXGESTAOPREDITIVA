import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717274000_harden_pdi_authorization.sql', import.meta.url),
  'utf8',
)
const compactSql = sql.replace(/\s+/g, ' ').trim()

describe('PDI authorization hardening migration', () => {
  test('backfills only legacy sessions with one shared active store', () => {
    expect(compactSql).toContain('UPDATE public.pdi_sessoes s')
    expect(compactSql).toContain('s.loja_id IS NULL')
    expect(compactSql).toContain('HAVING count(DISTINCT vc.store_id) = 1')
    expect(compactSql).toContain("lower(vg.role) IN ('gerente', 'dono')")
  })

  test('hardens session creation with identity, self-target and store membership checks', () => {
    expect(compactSql).toMatch(/CREATE OR REPLACE FUNCTION public\.create_pdi_session_bundle\(p_payload jsonb\)/)
    expect(compactSql).toContain("RAISE EXCEPTION 'Sessao invalida.' USING ERRCODE = '42501'")
    expect(compactSql).toContain("RAISE EXCEPTION 'Nao e permitido criar o proprio PDI por este fluxo.'")
    expect(compactSql).toContain("public.tem_papel_loja(v_loja_id, ARRAY['vendedor'], v_colaborador_id)")
    expect(compactSql).toContain('public.eh_area_interna_mx(v_caller)')
    expect(compactSql).toContain('public.is_manager_of(v_loja_id)')
    expect(compactSql).toContain('public.is_owner_of(v_loja_id)')
  })

  test('does not silently choose an ambiguous store', () => {
    expect(compactSql).toContain('v_candidate_store_count')
    expect(compactSql).toContain("RAISE EXCEPTION 'Nao foi possivel resolver uma unica loja autorizada para o PDI.'")
  })

  test('loads the PDI action and session before authorizing evidence approval', () => {
    expect(compactSql).toMatch(/CREATE OR REPLACE FUNCTION public\.approve_pdi_action_evidence\(\s*p_action_id uuid, p_approval_payload jsonb\s*\)/)
    expect(compactSql).toContain('FROM public.pdi_plano_acao a JOIN public.pdi_sessoes s ON s.id = a.sessao_id')
    expect(compactSql).toContain('FOR UPDATE OF a')
    expect(compactSql).toContain("RAISE EXCEPTION 'Acao de PDI nao encontrada.'")
  })

  test('denies self-approval and limits approval to assigned management', () => {
    expect(compactSql).toContain('v_session.colaborador_id = v_caller')
    expect(compactSql).toContain("RAISE EXCEPTION 'Autoaprovacao de acao de PDI nao permitida.'")
    expect(compactSql).toContain('v_session.gerente_id = v_caller')
    expect(compactSql).toContain('public.is_owner_of(v_session.loja_id)')
    expect(compactSql).toContain("RAISE EXCEPTION 'Sem permissao para aprovar esta acao de PDI.'")
  })

  test('records an audit event for evidence approval', () => {
    expect(compactSql).toContain('INSERT INTO public.logs_auditoria')
    expect(compactSql).toContain("'approve_pdi_action_evidence'")
    expect(compactSql).toContain("'pdi_plano_acao'")
    expect(compactSql).toContain("'approval_payload', COALESCE(p_approval_payload, '{}'::jsonb)")
  })

  test('fixes search_path and explicit function privileges', () => {
    const searchPathCount = (compactSql.match(/SECURITY DEFINER SET search_path TO 'public'/g) ?? []).length
    expect(searchPathCount).toBe(2)
    expect(compactSql).toContain('REVOKE ALL ON FUNCTION public.create_pdi_session_bundle(jsonb) FROM PUBLIC, anon, authenticated, service_role')
    expect(compactSql).toContain('REVOKE ALL ON FUNCTION public.approve_pdi_action_evidence(uuid,jsonb) FROM PUBLIC, anon, authenticated, service_role')
    expect(compactSql).toContain('GRANT EXECUTE ON FUNCTION public.create_pdi_session_bundle(jsonb) TO authenticated, service_role')
    expect(compactSql).toContain('GRANT EXECUTE ON FUNCTION public.approve_pdi_action_evidence(uuid,jsonb) TO authenticated, service_role')
  })

  test('is transactional and documents rollback', () => {
    expect(compactSql.startsWith('BEGIN;')).toBe(true)
    expect(compactSql).toContain('-- DOWN')
    expect(compactSql).toContain('COMMIT;')
  })
})
