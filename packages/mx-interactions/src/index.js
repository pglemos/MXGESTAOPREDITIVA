export const MX_INTERACTION_VERSION = '1.1.1'

export function createInteractionRuntime(adapters = {}) {
  const navigate = adapters.navigate ?? (() => {})
  const notify = adapters.notify ?? (() => {})
  const track = adapters.track ?? (() => {})
  const can = adapters.can ?? (() => true)

  return Object.freeze({
    navigate(target, meta) {
      track('navigate', { target, ...meta })
      return navigate(target, meta)
    },
    notify(message, options) {
      track('notify', { message, ...options })
      return notify(message, options)
    },
    can(action, context) {
      return Boolean(can(action, context))
    },
    track(event, payload) {
      return track(event, payload)
    }
  })
}
