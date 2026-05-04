import { describe, expect, test } from 'bun:test'
import { getAvatarDisplayUrl, validateUserAvatarFile, USER_AVATAR_MAX_SIZE_BYTES } from './avatar'

function makeFile(type: string, size: number) {
    return new File([new Uint8Array(size)], 'avatar', { type })
}

describe('avatar helpers', () => {
    test('accepts supported image formats under the size limit', () => {
        expect(validateUserAvatarFile(makeFile('image/jpeg', 1024))).toBeNull()
        expect(validateUserAvatarFile(makeFile('image/png', 1024))).toBeNull()
        expect(validateUserAvatarFile(makeFile('image/webp', 1024))).toBeNull()
    })

    test('rejects unsupported image formats and oversized files', () => {
        expect(validateUserAvatarFile(makeFile('image/gif', 1024))).toContain('JPG')
        expect(validateUserAvatarFile(makeFile('image/png', USER_AVATAR_MAX_SIZE_BYTES + 1))).toContain('5MB')
    })

    test('prefers persisted avatar url over generated fallback', () => {
        expect(getAvatarDisplayUrl('https://example.com/avatar.jpg', 'Maria')).toBe('https://example.com/avatar.jpg')
        expect(getAvatarDisplayUrl(null, 'Maria Silva')).toContain('ui-avatars.com')
    })
})
