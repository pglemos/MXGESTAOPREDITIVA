import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const formSource = readFileSync(new URL('./CheckinForm.tsx', import.meta.url), 'utf8')
const pageHookSource = readFileSync(new URL('../hooks/useCheckinPage.ts', import.meta.url), 'utf8')

describe('CheckinForm draft save contract', () => {
    test('wires Salvar rascunho to a draft-only save flow', () => {
        expect(formSource).toContain('handleSaveDraft')
        expect(formSource).toContain('onClick={() => void handleSaveDraft()}')
        expect(pageHookSource).toContain('const handleSaveDraft = async () =>')
        expect(pageHookSource).toContain('CHECKIN_DRAFT_STORAGE_PREFIX')
        expect(pageHookSource).toContain("toast.success('Rascunho salvo.')")
        expect(pageHookSource).not.toContain('const handleSaveDraft = async () => {\n        await submitCheckin()')
    })
})
