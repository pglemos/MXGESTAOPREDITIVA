import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const source = readFileSync('src/test/mx-consultoria-role-smoke.playwright.ts', 'utf8')

describe('smoke autenticado multi-role — contratos de limpeza', () => {
  test('fecha o contexto do perfil mesmo quando login ou validação falham', () => {
    expect(source).toMatch(/try\s*\{[\s\S]*?await login\([\s\S]*?finally\s*\{\s*await context\.close\(\)/)
  })

  test('registra cada identidade imediatamente após a criação', () => {
    expect(source).toMatch(/const trackCreatedUser\s*=\s*async/)
    expect(source).toMatch(/createdUsers\.push\(user\)/)
    expect(source).toMatch(/trackCreatedUser\(\(\)\s*=>\s*createE2EStoreUser/)
    expect(source).toMatch(/trackCreatedUser\(\(\)\s*=>\s*createE2EAdminUser/)
  })
})
