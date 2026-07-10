import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(new URL('../../supabase/migrations/20260710160000_university_and_professional_profile.sql', import.meta.url), 'utf8')

describe('university and professional profile migration', () => {
  test('adds material and flexible content segmentation', () => {
    expect(sql).toContain('material_url text')
    expect(sql).toContain('segmentacao jsonb')
    expect(sql).toContain("target_audience = 'todos'")
    expect(sql).toContain("segmentacao->'lojas' ? vl.store_id::text")
  })

  test('adds professional history fields and immutable audit trail', () => {
    expect(sql).toContain('data_entrada date')
    expect(sql).toContain('formacao_academica text')
    expect(sql).toContain('experiencias_anteriores text')
    expect(sql).toContain('cursos_certificacoes text')
    expect(sql).toContain('vendedor_perfil_historico')
    expect(sql).toContain('to_jsonb(OLD)')
    expect(sql).toContain('proteger_campos_oficiais_vendedor_perfil')
    expect(sql).toContain('NEW.data_entrada := OLD.data_entrada')
  })
})
