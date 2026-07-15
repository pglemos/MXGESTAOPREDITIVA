import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260710130000_canonical_checkin_regularization.sql', import.meta.url),
  'utf8',
)

describe('canonical checkin regularization migration', () => {
  test('keeps pending requests out of the official checkin', () => {
    const requestStart = sql.indexOf('FUNCTION public.solicitar_regularizacao_fechamento')
    const applyStart = sql.indexOf('FUNCTION public.aplicar_regularizacao_fechamento')
    const requestSql = sql.slice(requestStart, applyStart)
    expect(requestSql).not.toContain('UPDATE public.lancamentos_diarios')
    expect(requestSql).toContain("'indicators', 'pending_excluded'")
  })

  test('applies once under row locks and records original/new audit values', () => {
    expect(sql).toContain('FOR UPDATE;')
    expect(sql).toContain("pg_advisory_xact_lock(hashtextextended('regularizacao:'")
    expect(sql).toContain("v_request.status = 'approved' AND v_request.applied_at IS NOT NULL")
    expect(sql).toContain('INSERT INTO public.checkin_audit_logs')
    expect(sql).toContain("'approved_regularization'")
  })

  test('preserves enum contract, actor and promotes historical placeholder only on approval', () => {
    expect(sql).not.toContain('ALTER COLUMN status TYPE text')
    expect(sql).toContain('requested_by uuid REFERENCES public.usuarios')
    expect(sql).toContain("WHEN metric_scope = 'historical' THEN 'daily'::public.checkin_scope")
    expect(sql).toContain('O fechamento mudou após a solicitação')
  })

  test('provides request, approve, reject and cancel RPCs with notifications', () => {
    expect(sql).toContain('solicitar_regularizacao_fechamento')
    expect(sql).toContain('aplicar_regularizacao_fechamento')
    expect(sql).toContain('rejeitar_regularizacao_fechamento')
    expect(sql).toContain('cancelar_regularizacao_fechamento')
    expect(sql).toContain('INSERT INTO public.notificacoes')
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.solicitar_regularizacao_fechamento')
  })

  // MX-22.3 (AC-4/Spec §8.3): "gera o diff automaticamente" e "bloqueia
  // duplicidade pending" já existem no servidor — testes de regressão
  // explícitos que a story pedia e que não existiam neste arquivo ainda.
  test('calcula o delta automaticamente comparando valores originais vs solicitados', () => {
    expect(sql).toContain('v_delta jsonb')
    expect(sql).toContain("IF v_delta = '{}'::jsonb THEN")
  })

  test('bloqueia uma segunda solicitação enquanto já existe uma pending para o mesmo fechamento', () => {
    expect(sql).toContain("'Já existe uma regularização pendente para este fechamento.'")
  })
})
