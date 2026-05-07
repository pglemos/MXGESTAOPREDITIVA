import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

type JsonLikeObject = Record<string, unknown>

function isPlainObject(value: unknown): value is JsonLikeObject {
    return value !== null && typeof value === 'object' && value.constructor === Object
}

export function toCamelCase<T>(obj: T): unknown {
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v))
    } else if (isPlainObject(obj)) {
        return Object.keys(obj).reduce<JsonLikeObject>((result, key) => {
            const camelKey = key.replace(/([-_][a-z])/g, group =>
                group.toUpperCase().replace('-', '').replace('_', '')
            )
            result[camelKey] = toCamelCase(obj[key])
            return result
        }, {})
    }
    return obj
}

export function toSnakeCase<T>(obj: T): unknown {
    if (Array.isArray(obj)) {
        return obj.map(v => toSnakeCase(v))
    } else if (isPlainObject(obj)) {
        return Object.keys(obj).reduce<JsonLikeObject>((result, key) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
            result[snakeKey] = toSnakeCase(obj[key])
            return result
        }, {})
    }
    return obj
}

export function getAvatarUrl(name: string, options?: { size?: number; background?: string; color?: string }): string {
    const params = new URLSearchParams({ name, size: String(options?.size ?? 128) })
    if (options?.background) params.set('background', options.background)
    if (options?.color) params.set('color', options.color)
    return `https://ui-avatars.com/api/?${params.toString()}`
}

export function getPublicAppOrigin(): string {
    const configured = (import.meta.env.VITE_PUBLIC_APP_URL || import.meta.env.VITE_APP_URL || '').trim()
    if (configured) {
        try {
            return new URL(configured).origin
        } catch {
            // Invalid local config should not break rendering public links.
        }
    }

    if (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null') {
        return window.location.origin
    }
    return 'https://mxperformance.vercel.app'
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     
    .replace(/[^\w-]+/g, '') 
    .replace(/\-\-+/g, '-')   
    .replace(/^-+|-+$/g, '')
}

export function getPreRegistrationLink(storeName: string): string {
    return `${getPublicAppOrigin()}/pre-cadastro/${slugify(storeName)}`
}
