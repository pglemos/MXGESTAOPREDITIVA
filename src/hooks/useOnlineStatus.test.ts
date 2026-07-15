import { afterEach, describe, expect, test } from 'bun:test'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useOnlineStatus } from './useOnlineStatus'

afterEach(cleanup)

// MX-22.6 (Spec §13 "sem conexão").
describe('useOnlineStatus (MX-22.6)', () => {
  test('reflete navigator.onLine no valor inicial', () => {
    const spy = Object.getOwnPropertyDescriptor(window.navigator, 'onLine')
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true })
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)
    if (spy) Object.defineProperty(window.navigator, 'onLine', spy)
  })

  test("atualiza para false no evento 'offline' e volta a true em 'online'", () => {
    const { result } = renderHook(() => useOnlineStatus())
    act(() => window.dispatchEvent(new Event('offline')))
    expect(result.current).toBe(false)
    act(() => window.dispatchEvent(new Event('online')))
    expect(result.current).toBe(true)
  })
})
