import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'

const layoutUrl = new URL('./Layout.tsx', import.meta.url)
const shellUrl = new URL('./MxSidebarShell.tsx', import.meta.url)
const legacyUrls = [
  new URL('./ManagerSidebarShell.tsx', import.meta.url),
  new URL('./SellerSidebar.tsx', import.meta.url),
  new URL('../design-system/internal-mx/MxInternalShell.tsx', import.meta.url),
]

const layoutSource = readFileSync(layoutUrl, 'utf8')
const shellSource = existsSync(shellUrl) ? readFileSync(shellUrl, 'utf8') : ''

const occurrences = (source: string, pattern: string) =>
  source.split(pattern).length - 1

describe('sidebar universal MX', () => {
  test('renderiza um único shell canônico para todos os perfis autenticados', () => {
    expect(layoutSource).toContain("from './MxSidebarShell'")
    expect(occurrences(layoutSource, '<MxSidebarShell')).toBe(1)
    expect(layoutSource).not.toContain('<ManagerSidebarShell')
    expect(layoutSource).not.toContain('<SellerLayoutShell')
    expect(layoutSource).not.toContain('<MxInternalShell')
  })

  test('remove os shells legados do código executável', () => {
    for (const legacyUrl of legacyUrls) expect(existsSync(legacyUrl)).toBe(false)
  })

  test('mantém o design visual e o comportamento acessível do sidebar gerencial', () => {
    expect(shellSource).toContain('border-slate-200 bg-white shadow-lg')
    expect(shellSource).toContain('bg-emerald-50 text-emerald-800')
    expect(shellSource).toContain("collapsed ? 'w-[80px]")
    expect(shellSource).toContain("'w-[264px] p-4'")
    expect(shellSource).toContain("aria-current={active ? 'page' : undefined}")
    expect(shellSource).toContain('aria-modal="true"')
    expect(shellSource).toContain('useFocusTrap(drawerRef, mobileOpen)')
    expect(shellSource).not.toContain('#051923')
    expect(shellSource).not.toContain('#102C37')
  })

  test('não depende do pacote mxds antigo', () => {
    expect(shellSource).not.toContain('mxds-')
    expect(shellSource).not.toContain('AppShell')
    expect(shellSource).not.toContain('SidebarBrandHeader')
  })

  test('define a identidade correta de módulo para cada perfil', () => {
    for (const label of [
      'Módulo Administrativo',
      'Módulo Admin MX',
      'Módulo Consultoria',
      'Módulo Executivo',
      'Módulo Gerencial',
      'Módulo Comercial',
    ]) {
      expect(layoutSource).toContain(label)
    }
    expect(shellSource).toContain('moduleLabel')
  })

  test('preserva navegação, notificações, perfil e simulação', () => {
    expect(shellSource).toContain('navSections')
    expect(shellSource).toContain('NotificationBellButton')
    expect(shellSource).toContain('renderProfileCard')
    expect(shellSource).toContain('onStopSimulation')
    expect(shellSource).toContain("label: 'Meu Perfil'")
    expect(shellSource).toContain("label: 'Preferências'")
    expect(shellSource).toContain("label: 'Notificações'")
    expect(shellSource).toContain("label: 'Sair'")
  })
})
