import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260715130000_agenda_d1_late_change_log.sql', import.meta.url),
  'utf8',
)

// MX-22.5 (AC-7/AC-8; Spec §11.2/§11.3, FEV-DATA-12 "Snapshot D+1"). Sem
// harness de Postgres real no CI (mesmo padrão de definitive-daily-closing-
// migration.test.ts/checkin-regularization-migration.test.ts): asserções via
// regex sobre o SQL da migration.
describe('agenda_d1_late_change_log migration', () => {
  test('cria log append-only, nunca sobrescreve agendamentos', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.agenda_d1_late_changes')
    expect(sql).not.toContain('UPDATE public.agendamentos')
    expect(sql).not.toContain('DELETE FROM public.agendamentos')
  })

  test('marca tardio quando a alteração ocorre depois de 09:30 SP do próprio dia do agendamento', () => {
    expect(sql).toContain("v_appt_date_sp = v_now_sp::date AND v_now_sp::time > time '09:30:00'")
    expect(sql).toContain("timezone('America/Sao_Paulo', NEW.data_hora)")
  })

  test('trigger nunca bloqueia o agendamento em si (RETURN NEW mesmo em erro do log)', () => {
    const fnStart = sql.indexOf('CREATE OR REPLACE FUNCTION public.log_agenda_d1_late_change')
    const fnBody = sql.slice(fnStart)
    expect(fnBody).toContain('EXCEPTION')
    expect(fnBody).toContain('WHEN others THEN')
    // Duas ocorrências de RETURN NEW: fluxo normal e fluxo de erro.
    expect((fnBody.match(/RETURN NEW;/g) || []).length).toBe(2)
  })

  test('trigger roda em AFTER INSERT OR UPDATE em agendamentos', () => {
    expect(sql).toContain('AFTER INSERT OR UPDATE ON public.agendamentos')
  })

  test('RLS: só o próprio vendedor, gestor/dono da loja ou admin MX podem ler o log', () => {
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('seller_user_id = (SELECT auth.uid())')
    expect(sql).toContain('public.is_manager_of(loja_id)')
    expect(sql).toContain('public.is_owner_of(loja_id)')
    // Nenhuma policy de escrita para authenticated — só a função SECURITY DEFINER grava.
    expect(sql).not.toContain('FOR INSERT TO authenticated')
  })
})
