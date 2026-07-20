export declare const MX_INTERACTION_VERSION: '1.1.1'
export type InteractionAdapters = {
  navigate?: (target: string, meta?: Record<string, unknown>) => unknown
  notify?: (message: string, options?: Record<string, unknown>) => unknown
  track?: (event: string, payload?: Record<string, unknown>) => unknown
  can?: (action: string, context?: Record<string, unknown>) => boolean
}
export declare function createInteractionRuntime(adapters?: InteractionAdapters): Readonly<{
  navigate(target: string, meta?: Record<string, unknown>): unknown
  notify(message: string, options?: Record<string, unknown>): unknown
  can(action: string, context?: Record<string, unknown>): boolean
  track(event: string, payload?: Record<string, unknown>): unknown
}>
