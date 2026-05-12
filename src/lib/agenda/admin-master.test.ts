import { describe, expect, it } from 'bun:test'
import { isAdminMasterMxProfile, parseAdminMasterEmails } from './admin-master'

describe('admin master MX agenda scope', () => {
  it('uses the default Admin Master MX allowlist', () => {
    expect(parseAdminMasterEmails()).toEqual([
      'gestao@mxconsultoria.com.br',
      'joseroberto20161@gmail.com',
      'marianedcs@gmail.com',
      'gedson.freire.localiza@gmail.com',
      'synvollt@gmail.com',
      'camarajoaoaugusto@gmail.com',
    ])
  })

  it('always keeps default Admin Master MX users even when env adds custom emails', () => {
    expect(parseAdminMasterEmails('extra@mx.com')).toEqual([
      'gestao@mxconsultoria.com.br',
      'joseroberto20161@gmail.com',
      'marianedcs@gmail.com',
      'gedson.freire.localiza@gmail.com',
      'synvollt@gmail.com',
      'camarajoaoaugusto@gmail.com',
      'extra@mx.com',
    ])
  })

  it('allows only administrador_geral profiles configured as admin master to see all agendas', () => {
    expect(isAdminMasterMxProfile({
      role: 'administrador_geral',
      email: 'gestao@mxconsultoria.com.br',
      name: 'Daniel',
    })).toBe(true)

    expect(isAdminMasterMxProfile({
      role: 'administrador_geral',
      email: 'joseroberto20161@gmail.com',
      name: 'José Roberto',
    })).toBe(true)

    expect(isAdminMasterMxProfile({
      role: 'administrador_geral',
      email: 'marianedcs@gmail.com',
      name: 'Mariane',
    })).toBe(true)

    expect(isAdminMasterMxProfile({
      role: 'administrador_geral',
      email: 'gedson.freire.localiza@gmail.com',
      name: 'Gedson',
    })).toBe(true)

    expect(isAdminMasterMxProfile({
      role: 'administrador_geral',
      email: 'synvollt@gmail.com',
      name: 'SynVolt',
    })).toBe(true)

    expect(isAdminMasterMxProfile({
      role: 'administrador_geral',
      email: 'camarajoaoaugusto@gmail.com',
      name: 'João',
    })).toBe(true)

    expect(isAdminMasterMxProfile({
      role: 'administrador_geral',
      email: 'administrador.geral@mxgestaopreditiva.com.br',
      name: 'Administrador Geral',
    })).toBe(false)

    expect(isAdminMasterMxProfile({
      role: 'administrador_mx',
      email: 'gestao@mxconsultoria.com.br',
      name: 'Daniel',
    })).toBe(false)
  })
})
