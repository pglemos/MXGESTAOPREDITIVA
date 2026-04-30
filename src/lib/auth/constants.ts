/**
 * Senha padrão entregue ao usuário no provisionamento inicial.
 * O backend marca `must_change_password = true` ao criar o usuário, e o
 * componente <ForcePasswordChange /> obriga a troca antes do uso normal.
 */
export const DEFAULT_FIRST_LOGIN_PASSWORD = '123456'

/**
 * Tamanho mínimo aceito pelo formulário de troca de senha.
 * Mantido em 6 para permitir que o default `123456` seja válido apenas
 * como credencial inicial; no momento da troca o usuário pode escolher
 * qualquer senha de 6+ caracteres.
 */
export const MIN_PASSWORD_LENGTH = 6
