type ErrorWithCode = { code?: unknown }

export function getSafeUserFacingDataError(error: unknown, fallback: string): string {
  const code = error && typeof error === 'object' ? (error as ErrorWithCode).code : undefined
  if (code === 'PGRST116') return 'Não foi possível localizar os dados solicitados.'
  if (code === '42501') return 'Você não tem permissão para consultar estes dados.'
  return fallback
}
