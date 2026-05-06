import { describe, expect, it } from 'bun:test'
import { isAdminMasterMxProfile, parseAdminMasterEmails } from './admin-master'

describe('admin master MX agenda scope', () => {
  it('uses Daniel as the default admin master', () => {
    expect(parseAdminMasterEmails()).toEqual(['danieljsvendas@gmail.com'])
  })

  it('allows only administrador_geral profiles configured as admin master to see all agendas', () => {
    expect(isAdminMasterMxProfile({
      role: 'administrador_geral',
      email: 'danieljsvendas@gmail.com',
      name: 'Daniel',
    })).toBe(true)

    expect(isAdminMasterMxProfile({
      role: 'administrador_geral',
      email: 'administrador.geral@mxgestaopreditiva.com.br',
      name: 'Administrador Geral',
    })).toBe(false)

    expect(isAdminMasterMxProfile({
      role: 'administrador_mx',
      email: 'danieljsvendas@gmail.com',
      name: 'Daniel',
    })).toBe(false)
  })
})
