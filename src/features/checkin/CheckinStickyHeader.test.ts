import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const checkinContainerSource = readFileSync(new URL('./Checkin.container.tsx', import.meta.url), 'utf8')
const checkinHeaderSource = readFileSync(new URL('./sections/CheckinHeader.tsx', import.meta.url), 'utf8')
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
})
