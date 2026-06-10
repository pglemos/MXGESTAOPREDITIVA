import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migration = readFileSync(
  'supabase/migrations/20260610180000_mx_aulas_ao_vivo_foundation.sql',
  'utf8',
)

function extractFunction(name: string) {
  const start = migration.indexOf(`CREATE OR REPLACE FUNCTION public.${name}`)
  const end = migration.indexOf('$$;', start)
  expect(start).toBeGreaterThanOrEqual(0)
  expect(end).toBeGreaterThan(start)
  return migration.slice(start, end)
}

describe('aulas ao vivo migration contract', () => {
  test('cria agenda, prova e presença com RLS habilitada', () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.aulas_ao_vivo')
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.aula_provas')
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.aula_presencas')
    expect(migration).toContain('ALTER TABLE public.aulas_ao_vivo  ENABLE ROW LEVEL SECURITY')
    expect(migration).toContain('ALTER TABLE public.aula_provas    ENABLE ROW LEVEL SECURITY')
    expect(migration).toContain('ALTER TABLE public.aula_presencas ENABLE ROW LEVEL SECURITY')
  })

  test('mantém o gabarito fora do RPC consumido pelo aluno', () => {
    const getProva = extractFunction('get_prova_aula')

    expect(getProva).toContain("'pergunta', q->>'pergunta'")
    expect(getProva).toContain("'opcoes', q->'opcoes'")
    expect(getProva).not.toContain("'correta'")
    expect(getProva).not.toContain("q->>'correta'")
  })

  test('corrige a prova server-side e registra presença best-of', () => {
    const submit = extractFunction('submeter_prova_aula')

    expect(submit).toContain("(v_q->>'correta')::integer = p_respostas[v_i]")
    expect(submit).toContain('ON CONFLICT (aula_id, user_id) DO UPDATE SET')
    expect(submit).toContain('GREATEST(public.aula_presencas.nota, EXCLUDED.nota)')
    expect(submit).toContain('GREATEST(public.aula_presencas.pontos, EXCLUDED.pontos)')
  })

  test('documenta rollback manual da fundação', () => {
    expect(migration).toContain('-- DOWN')
    expect(migration).toContain('DROP FUNCTION IF EXISTS public.submeter_prova_aula')
    expect(migration).toContain('DROP TABLE IF EXISTS public.aulas_ao_vivo')
  })
})
