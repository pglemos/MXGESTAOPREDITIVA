import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260617001000_devolutiva_acoes_central.sql', import.meta.url)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('devolutiva acoes migration contract', () => {
  test('cria tabela rastreavel vinculada a devolutivas', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.devolutiva_acoes')
    expect(sql).toContain('devolutiva_id uuid NOT NULL REFERENCES public.devolutivas(id) ON DELETE CASCADE')
    expect(sql).toContain('CREATE UNIQUE INDEX IF NOT EXISTS ux_devolutiva_acoes_devolutiva')
    expect(sql).toContain('action_text text NOT NULL')
  })

  test('mantem status, recorrencia e data para consumo da Central e Fechamento', () => {
    const sql = readMigration()

    expect(sql).toContain("status text NOT NULL DEFAULT 'pendente'")
    expect(sql).toContain("status IN ('pendente', 'concluida', 'justificada', 'cancelada')")
    expect(sql).toContain("recorrencia text NOT NULL DEFAULT 'diaria'")
    expect(sql).toContain("recorrencia IN ('diaria', 'unica')")
    expect(sql).toContain('obrigatoria_fechamento boolean NOT NULL DEFAULT false')
    expect(sql).toContain('horario_sugerido time NOT NULL DEFAULT')
  })

  test('habilita RLS para vendedor ler e concluir a propria acao', () => {
    const sql = readMigration()

    expect(sql).toContain('ALTER TABLE public.devolutiva_acoes ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('devolutiva_acoes_select_own')
    expect(sql).toContain('seller_id = auth.uid()')
    expect(sql).toContain('devolutiva_acoes_update_own_pending')
    expect(sql).toContain("status = 'pendente'")
  })
})
