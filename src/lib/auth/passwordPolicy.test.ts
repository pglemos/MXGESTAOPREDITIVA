import { describe, expect, test } from 'bun:test'
import { generateStrongTemporaryPassword, isStrongPassword } from './passwordPolicy'

describe('password policy helpers', () => {
  test('requires only the minimum password length', () => {
    expect(isStrongPassword('12345')).toBe(false)
    expect(isStrongPassword('123456')).toBe(true)
    expect(isStrongPassword('ABCDEFGH')).toBe(true)
    expect(isStrongPassword('aaaaaa')).toBe(true)
    expect(isStrongPassword('------')).toBe(true)
    expect(isStrongPassword('senha!')).toBe(true)
  })

  test('generates compliant temporary passwords', () => {
    for (let index = 0; index < 20; index += 1) {
      const password = generateStrongTemporaryPassword()
      expect(password.length).toBeGreaterThanOrEqual(6)
      expect(isStrongPassword(password)).toBe(true)
    }
  })
})
