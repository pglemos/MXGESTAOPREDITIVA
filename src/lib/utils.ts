import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function toCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v))
    } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const camelKey = key.replace(/([-_][a-z])/g, group =>
                group.toUpperCase().replace('-', '').replace('_', '')
            )
            result[camelKey] = toCamelCase(obj[key])
            return result
        }, {} as any)
    }
    return obj
}

export function toSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(v => toSnakeCase(v))
    } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
            result[snakeKey] = toSnakeCase(obj[key])
            return result
        }, {} as any)
    }
    return obj
}

export function getAvatarUrl(name: string, options?: { size?: number; background?: string; color?: string }): string {
    const params = new URLSearchParams({ name, size: String(options?.size ?? 128) })
    if (options?.background) params.set('background', options.background)
    if (options?.color) params.set('color', options.color)
    return `https://ui-avatars.com/api/?${params.toString()}`
}
