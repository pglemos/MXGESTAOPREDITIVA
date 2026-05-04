import { supabase } from '@/lib/supabase'
import { getAvatarUrl } from '@/lib/utils'

export const USER_AVATAR_BUCKET = 'perfis_usuario'
export const USER_AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024
export const USER_AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

const AVATAR_EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
}

export function validateUserAvatarFile(file: File): string | null {
    if (!USER_AVATAR_ALLOWED_TYPES.includes(file.type as (typeof USER_AVATAR_ALLOWED_TYPES)[number])) {
        return 'Use JPG, PNG ou WEBP.'
    }

    if (file.size > USER_AVATAR_MAX_SIZE_BYTES) {
        return 'Imagem deve ter no máximo 5MB.'
    }

    return null
}

export function getAvatarDisplayUrl(
    avatarUrl: string | null | undefined,
    name: string | null | undefined,
    options?: { size?: number; background?: string; color?: string },
) {
    return avatarUrl || getAvatarUrl(name || 'MX', options)
}

export async function uploadUserAvatar(userId: string, file: File) {
    const validationError = validateUserAvatarFile(file)
    if (validationError) throw new Error(validationError)

    const extension = AVATAR_EXTENSIONS[file.type] || 'jpg'
    const path = `${userId}/avatar-${Date.now()}.${extension}`

    const { error: uploadError } = await supabase.storage
        .from(USER_AVATAR_BUCKET)
        .upload(path, file, {
            contentType: file.type,
            upsert: true,
        })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from(USER_AVATAR_BUCKET).getPublicUrl(path)
    return `${publicUrl}?t=${Date.now()}`
}
