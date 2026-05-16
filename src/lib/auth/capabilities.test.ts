import { describe, expect, it } from 'bun:test'
import {
  canCreateAdjustment,
  canManageFeedback,
  canManagePDI,
  canManageStore,
  canManageTeam,
  canSimulateRole,
  hasCapability,
} from './capabilities'

describe('role capabilities', () => {
  it('keeps simulation and store management internal/admin scoped', () => {
    expect(canSimulateRole('administrador_mx')).toBe(true)
    expect(canSimulateRole('dono')).toBe(false)
    expect(canManageStore('administrador_mx')).toBe(true)
    expect(canManageStore('dono')).toBe(false)
    expect(canManageTeam('dono')).toBe(true)
    expect(canManageTeam('gerente')).toBe(true)
    expect(canManageTeam('vendedor')).toBe(false)
  })

  it('allows owner and manager people workflows but blocks seller management actions', () => {
    expect(canManageFeedback('dono')).toBe(true)
    expect(canManageFeedback('gerente')).toBe(true)
    expect(canManageFeedback('vendedor')).toBe(false)
    expect(canManagePDI('dono')).toBe(true)
    expect(canManagePDI('gerente')).toBe(true)
    expect(canManagePDI('vendedor')).toBe(false)
  })

  it('keeps technical check-in adjustments blocked for sellers', () => {
    expect(canCreateAdjustment('vendedor')).toBe(false)
    expect(canCreateAdjustment('gerente')).toBe(true)
    expect(canCreateAdjustment('administrador_geral')).toBe(true)
  })

  it('supports public camelCase capability aliases without widening access', () => {
    expect(hasCapability('administrador_mx', 'simulateRole')).toBe(true)
    expect(hasCapability('vendedor', 'simulateRole')).toBe(false)
    expect(hasCapability('gerente', 'viewProducts')).toBe(true)
    expect(hasCapability('vendedor', 'viewProducts')).toBe(false)
    expect(hasCapability('dono', 'viewConfigurations')).toBe(true)
    expect(hasCapability('gerente', 'viewConfigurations')).toBe(false)
  })
})
