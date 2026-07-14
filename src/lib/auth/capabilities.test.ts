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
    expect(canManageTeam('dono')).toBe(false)
    expect(canManageTeam('gerente')).toBe(true)
    expect(canManageTeam('vendedor')).toBe(false)
  })

  it('allows leadership and internal MX roles to manage feedback and PDI', () => {
    expect(canManageFeedback('dono')).toBe(true)
    expect(canManageFeedback('gerente')).toBe(true)
    expect(canManageFeedback('vendedor')).toBe(false)
    expect(canManagePDI('dono')).toBe(true)
    expect(canManagePDI('gerente')).toBe(true)
    expect(canManagePDI('vendedor')).toBe(false)
    expect(canManagePDI('administrador_mx')).toBe(true)
  })

  it('allows technical check-in adjustments from the seller terminal and leadership roles', () => {
    expect(canCreateAdjustment('vendedor')).toBe(true)
    expect(canCreateAdjustment('gerente')).toBe(true)
    expect(canCreateAdjustment('administrador_geral')).toBe(true)
  })

  it('supports public camelCase capability aliases without widening access', () => {
    expect(hasCapability('administrador_mx', 'simulateRole')).toBe(true)
    expect(hasCapability('vendedor', 'simulateRole')).toBe(false)
    expect(hasCapability('gerente', 'viewProducts')).toBe(true)
    expect(hasCapability('vendedor', 'viewProducts')).toBe(false)
    expect(hasCapability('dono', 'viewConfigurations')).toBe(true)
    expect(hasCapability('gerente', 'viewConfigurations')).toBe(true)
    expect(hasCapability('vendedor', 'viewConfigurations')).toBe(false)
  })
})
