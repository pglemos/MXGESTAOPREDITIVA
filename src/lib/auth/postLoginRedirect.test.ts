import { describe, expect, it } from 'bun:test'
import { resolvePostLoginRedirect } from './postLoginRedirect'

describe('resolvePostLoginRedirect', () => {
  it('keeps the protected route requested before login', () => {
    expect(resolvePostLoginRedirect({
      from: {
        pathname: '/simulacao/vendedor',
        search: '?tab=demo',
        hash: '#top',
      },
    })).toBe('/simulacao/vendedor?tab=demo#top')
  })

  it('falls back to root without a previous protected route', () => {
    expect(resolvePostLoginRedirect(null)).toBe('/')
    expect(resolvePostLoginRedirect({})).toBe('/')
  })

  it('rejects login loops and external redirect targets', () => {
    expect(resolvePostLoginRedirect({ from: { pathname: '/login' } })).toBe('/')
    expect(resolvePostLoginRedirect({ from: { pathname: 'https://evil.example' } })).toBe('/')
  })
})
