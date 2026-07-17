import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const managerShellSource = readFileSync(
  new URL('./ManagerSidebarShell.tsx', import.meta.url),
  'utf8',
)
const layoutSource = readFileSync(new URL('./Layout.tsx', import.meta.url), 'utf8')

describe('Manager light Base44 sidebar contract', () => {
  test('uses the dedicated light shell only for gerente', () => {
    expect(layoutSource).toContain("role === 'gerente'")
    expect(layoutSource).toContain('<ManagerSidebarShell')
    expect(layoutSource).toContain('<SellerLayoutShell')
  })

  test('keeps the manager shell light and removes the old navy surface', () => {
    expect(managerShellSource).toContain('border-slate-200 bg-white shadow-lg')
    expect(managerShellSource).toContain('bg-emerald-50 text-emerald-800')
    expect(managerShellSource).toContain("collapsed ? 'w-[80px]")
    expect(managerShellSource).toContain("'w-[264px] p-4'")
    expect(managerShellSource).not.toContain('#051923')
    expect(managerShellSource).not.toContain('#102C37')
  })

  test('preserves the profile actions in the required order', () => {
    const profile = managerShellSource.indexOf("label: 'Meu Perfil'")
    const preferences = managerShellSource.indexOf("label: 'Preferências'")
    const notifications = managerShellSource.indexOf("label: 'Notificações'")
    const signOut = managerShellSource.indexOf("label: 'Sair'")

    expect(profile).toBeGreaterThan(-1)
    expect(preferences).toBeGreaterThan(profile)
    expect(notifications).toBeGreaterThan(preferences)
    expect(signOut).toBeGreaterThan(notifications)
  })

  test('keeps avatar, name, role and expandable chevron in the footer card', () => {
    expect(managerShellSource).toContain('renderProfileCard')
    expect(managerShellSource).toContain('fallback={initials}')
    expect(managerShellSource).toContain('{displayName}')
    expect(managerShellSource).toContain('{displayRole}')
    expect(managerShellSource).toContain('<ChevronDown')
    expect(managerShellSource).toContain('aria-expanded={userMenuOpen}')
  })

  test('keeps accessible desktop and mobile navigation', () => {
    expect(managerShellSource).toContain('aria-current={active ? \'page\' : undefined}')
    expect(managerShellSource).toContain('aria-modal="true"')
    expect(managerShellSource).toContain('useFocusTrap(drawerRef, mobileOpen)')
    expect(managerShellSource).toContain("event.key !== 'Escape'")
    expect(managerShellSource).toContain('focus-visible:ring-2')
  })
})
