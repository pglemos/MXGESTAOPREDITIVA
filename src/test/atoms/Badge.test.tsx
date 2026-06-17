import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { Badge } from '@/components/atoms/Badge'

afterEach(() => {
  cleanup()
})

describe('Badge Atom', () => {
  test('uses semibold weight by default instead of heavy black text', () => {
    render(<Badge>Funil</Badge>)

    const badge = screen.getByText('Funil').closest('div')
    expect(badge?.className).toContain('font-semibold')
    expect(badge?.className).not.toContain('font-black')
    expect(screen.getByText('Funil').className).not.toContain('font-black')
  })
})
