import { existsSync, readdirSync } from 'node:fs'

describe('legacy TestSprite quarantine', () => {
  test('keeps generated TestSprite suites out of the repository runtime surface', () => {
    const legacyRoot = new URL('../../testsprite_tests/', import.meta.url)
    const generatedArtifacts = existsSync(legacyRoot)
      ? readdirSync(legacyRoot, { recursive: true }).map(String).filter(file => /\.(?:py|json|ya?ml)$/.test(file))
      : []

    expect(generatedArtifacts).toEqual([])
    expect(existsSync(new URL('../../.testsprite/config.json', import.meta.url))).toBe(false)
    expect(existsSync(new URL('../test/', import.meta.url))).toBe(true)
  })
})
