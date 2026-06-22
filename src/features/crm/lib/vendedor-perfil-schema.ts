export function isVendedorPerfilNotificationSchemaError(error: { message?: string } | null | undefined) {
  return /fechar_dia_notificacao_(ativa|hora).*schema cache/i.test(error?.message || '')
}
