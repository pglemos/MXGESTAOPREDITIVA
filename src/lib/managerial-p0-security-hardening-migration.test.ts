import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717043000_managerial_p0_security_hardening.sql', import.meta.url),
  'utf8',
)

describe('managerial P0 security hardening', () => {
  test('removes anonymous access from every new exposed RPC', () => {
    for (const signature of [
      'consolidate_d1_snapshot(date,uuid,boolean)',
      'refresh_manager_daily_tasks(uuid,uuid,date)',
      'consolidate_manager_routine_snapshot(uuid,uuid,date)',
      'record_d1_contact_action(uuid,text,text,text,jsonb)',
      'update_d1_confirmation(uuid,text,text)',
    ]) {
      expect(sql).toContain(`REVOKE ALL ON FUNCTION public.${signature} FROM anon`)
    }
  })

  test('keeps trigger and scheduler helpers inaccessible through PostgREST', () => {
    for (const signature of [
      'run_d1_consolidation_clock()',
      'log_agenda_d1_late_change()',
      'bridge_d1_audit_to_canonical()',
    ]) {
      expect(sql).toContain(`REVOKE ALL ON FUNCTION public.${signature} FROM PUBLIC, anon, authenticated`)
    }
  })

  test('grants only the intended authenticated entrypoints', () => {
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.refresh_manager_daily_tasks(uuid,uuid,date) TO authenticated')
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.update_d1_confirmation(uuid,text,text) TO authenticated')
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.record_d1_contact_action(uuid,text,text,text,jsonb) TO authenticated')
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.run_d1_consolidation_clock() TO service_role')
  })
})
