import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { supabase } from '@/lib/supabase'
import { useMeuNivelCarreira } from './useRemuneracao'

afterEach(cleanup)

describe('useMeuNivelCarreira', () => {
  test('finaliza o loading quando o vendedor deixa de estar selecionado', async () => {
    const pending = new Promise(() => {})
    const builder = {
      select: () => builder,
      eq: () => builder,
      maybeSingle: () => pending,
    }
    const fromSpy = spyOn(supabase, 'from').mockImplementation(
      (() => builder) as typeof supabase.from,
    )

    try {
      const { result, rerender } = renderHook(
        ({ sellerId }) => useMeuNivelCarreira(sellerId),
        { initialProps: { sellerId: 'seller-1' as string | null } },
      )

      await waitFor(() => expect(result.current.loading).toBe(true))
      rerender({ sellerId: null })

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.nivel).toBeNull()
    } finally {
      fromSpy.mockRestore()
    }
  })
})
