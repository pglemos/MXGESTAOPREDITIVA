export const PASSWORD_POLICY_MESSAGE =
  'Senha deve ter no mínimo 10 caracteres, com maiúscula, minúscula, número e símbolo.'

export function isStrongPassword(password: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/.test(password)
}
