import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const shell = readFileSync(new URL('../design-system/internal-mx/internal-mx-shell.css', import.meta.url), 'utf8')
const components = readFileSync(new URL('../design-system/internal-mx/internal-mx-components.css', import.meta.url), 'utf8')
const routes = readFileSync(new URL('../design-system/internal-mx/internal-mx-routes.css', import.meta.url), 'utf8')
const frame = readFileSync(new URL('../design-system/internal-mx/InternalMxPageFrame.tsx', import.meta.url), 'utf8')
const updater = readFileSync(new URL('../components/PWAUpdater.tsx', import.meta.url), 'utf8')

describe('migração visual completa do módulo interno MX', () => {
  test('altera shell, páginas reais e rotas críticas', () => {
    expect(shell).toContain("url('/mx-logo.png')")
    expect(shell).toContain('--mxds-sidebar-width:268px')
    for (const selector of ['table','input:not',"[role='tablist']","[role='dialog']",'recharts-responsive-container']) expect(components).toContain(selector)
    for (const page of ['painel','lojas','agenda','ranking','relatorio-matinal']) expect(routes).toContain(`data-mx-internal-page='${page}'`)
    expect(frame).toContain('mxds-route-bar')
  })
  test('força o PWA a buscar e aplicar a versão nova', () => {
    expect(updater).toContain('updateSW(true)')
    expect(updater).toContain('5 * 60 * 1000')
  })
})
