import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('./Checkin.container.tsx', import.meta.url), 'utf8')

// MX-22.6 (Spec §13 "sem conexão"): Checkin.container.tsx depende de useAuth/
// useCheckinPage (hooks pesados, ver fragilidade documentada em outros testes
// desta feature) — teste de contrato sobre o arquivo-fonte, mesmo padrão de
// NovoRegistroModal.test.ts, em vez de render completo.
describe('Checkin.container — banner de conexão (MX-22.6)', () => {
  test('usa useOnlineStatus e exibe banner não-bloqueante quando offline', () => {
    expect(source).toContain("import { useOnlineStatus } from '@/hooks/useOnlineStatus'")
    expect(source).toContain('const isOnline = useOnlineStatus()')
    expect(source).toContain('{!isOnline && (')
    expect(source).toContain('Sem conexão. O envio pode falhar até a conexão ser restabelecida.')
  })

  test('banner de offline é role="status" (não bloqueia submissão, só informa)', () => {
    const bannerBlock = source.slice(source.indexOf('{!isOnline && ('))
    expect(bannerBlock).toContain('role="status"')
  })
})
