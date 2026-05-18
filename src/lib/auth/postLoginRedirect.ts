type RedirectLocation = {
  pathname?: unknown
  search?: unknown
  hash?: unknown
}

function safeSearch(value: unknown) {
  return typeof value === 'string' && value.startsWith('?') ? value : ''
}

function safeHash(value: unknown) {
  return typeof value === 'string' && value.startsWith('#') ? value : ''
}

export function resolvePostLoginRedirect(state: unknown) {
  const from = (state as { from?: RedirectLocation } | null)?.from
  const pathname = typeof from?.pathname === 'string' ? from.pathname : '/'

  if (!pathname.startsWith('/') || pathname === '/login') return '/'

  return `${pathname}${safeSearch(from?.search)}${safeHash(from?.hash)}`
}
