import { describe, expect, it } from 'bun:test'
import { isAdminMasterMxProfile, parseAdminMasterEmails } from './admin-master'

describe('admin master MX agenda scope', () => {
  it('uses the default Admin Master MX allowlist', () => {
    expect(parseAdminMasterEmails()).toEqual([
      'danieljsvendas@gmail.com',
      'joseroberto20161@gmail.com',
    ])
  })

  it('always keeps default Admin Master MX users even when env adds custom emails', () => {
    expect(parseAdminMasterEmails('extra@mx.com')).toEqual([
      'danieljsvendas@gmail.com',
      'joseroberto20161@gmail.com',
      'extra@mx.com',
    ])
  })

  it('allows only administrador_geral profiles configured as admin master to see all agendas', () => {
    expect(isAdminMasterMxProfile({
      role: 'administrador_geral',
      email: 'danieljsvendas@gmail.com',
      name: 'Daniel',
    })).toBe(true)

    expect(isAdminMasterMxProfile({
      role: 'administrador_geral',
      email: 'joseroberto20161@gmail.com',
      name: 'José Roberto',
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
