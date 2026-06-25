import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const checkinContainerSource = readFileSync(new URL('./Checkin.container.tsx', import.meta.url), 'utf8')
const checkinHeaderSource = readFileSync(new URL('./sections/CheckinHeader.tsx', import.meta.url), 'utf8')
const checkinFormSource = readFileSync(new URL('./sections/CheckinForm.tsx', import.meta.url), 'utf8')
const checkinCrmSource = readFileSync(new URL('./sections/CheckinCrmSection.tsx', import.meta.url), 'utf8')
const checkinHookSource = readFileSync(new URL('./hooks/useCheckinPage.ts', import.meta.url), 'utf8')
const sellerShellSource = readFileSync(new URL('../../components/SellerSidebar.tsx', import.meta.url), 'utf8')

describe('Checkin sticky header layout contract', () => {
  test('keeps Fechamento Diario pinned inside the checkin scroll area', () => {
    expect(checkinHeaderSource).toContain('sticky top-0')
    expect(checkinHeaderSource).toContain('FECHAMENTO DIÁRIO')
    expect(checkinContainerSource).toContain('overflow-y-auto overscroll-contain')
    expect(checkinContainerSource).toContain("document.documentElement.style.overflow = 'hidden'")
    expect(checkinContainerSource).toContain("document.body.style.overflow = 'hidden'")
    expect(checkinContainerSource).toContain('keepDocumentScrollPinned')
    expect(checkinContainerSource).toContain("window.addEventListener('scroll', keepDocumentScrollPinned")
  })

  test('prevents the seller shell from scrolling the whole document', () => {
    expect(sellerShellSource).toContain('mx-app-scrollbarless h-screen overflow-hidden')
    expect(sellerShellSource).toContain('h-screen overflow-hidden p-3 pt-[76px]')
  })

  test('uses CRM-derived effective totals instead of showing zero summary values', () => {
    expect(checkinHookSource).toContain('crmDailyCounters')
    expect(checkinHookSource).toContain('effectiveForm')
    expect(checkinHookSource).toContain('effectiveTotals')
    expect(checkinHookSource).toContain('saveCheckin(effectiveForm')
    expect(checkinFormSource).toContain('const display = effectiveTotals')
  })

  test('keeps mobile CRM readable without desktop table overflow', () => {
    expect(checkinCrmSource).toContain('className="md:hidden"')
    expect(checkinCrmSource).toContain('className="hidden max-w-full overflow-x-auto md:block"')
    expect(checkinCrmSource).toContain('Agendamento')
    expect(checkinCrmSource).toContain('Veículo')
  })

  test('uses neutral day terminology and explicit blocked finalize copy', () => {
    expect(checkinFormSource).toContain('LEADS RECEBIDOS DO DIA')
    expect(checkinFormSource).toContain('ATENDIMENTOS DO DIA')
    expect(checkinFormSource).toContain('AGUARDANDO LIBERAÇÃO DO GERENTE')
  })
})
