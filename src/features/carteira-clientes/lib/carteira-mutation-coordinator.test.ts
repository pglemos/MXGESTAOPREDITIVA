import { describe, expect, test } from 'bun:test'
import { createCarteiraMutationCoordinator } from './carteira-mutation-coordinator'

describe('carteira mutation coordinator', () => {
  test('coalesces simultaneous equivalent mutations into one request', async () => {
    let calls = 0
    let release!: () => void
    const pending = new Promise<void>(resolve => { release = resolve })
    const coordinator = createCarteiraMutationCoordinator(() => 'fixed-key')

    const execute = (key: string) => {
      calls += 1
      return pending.then(() => ({ key }))
    }

    const first = coordinator.run('client:create', { phone: '31999999999' }, execute)
    const second = coordinator.run('client:create', { phone: '31999999999' }, execute)

    expect(calls).toBe(1)
    release()
    expect(await first).toEqual({ key: 'fixed-key' })
    expect(await second).toEqual({ key: 'fixed-key' })
  })

  test('reuses the logical idempotency key for an immediate retry', async () => {
    let sequence = 0
    const seenKeys: string[] = []
    const coordinator = createCarteiraMutationCoordinator(() => `key-${++sequence}`, 60_000)

    await expect(coordinator.run('mission:start', { clients: ['a', 'b'] }, async key => {
      seenKeys.push(key)
      throw new Error('network')
    })).rejects.toThrow('network')

    await coordinator.run('mission:start', { clients: ['a', 'b'] }, async key => {
      seenKeys.push(key)
      return 'ok'
    })

    expect(seenKeys).toEqual(['key-1', 'key-1'])
  })

  test('preserves the pending mutation key when failure happens after the nominal TTL', async () => {
    let sequence = 0
    const seenKeys: string[] = []
    const coordinator = createCarteiraMutationCoordinator(() => `key-${++sequence}`, 5)

    await expect(coordinator.run('mission:update', { id: 'slow' }, async key => {
      seenKeys.push(key)
      await new Promise(resolve => setTimeout(resolve, 10))
      throw new Error('late network failure')
    })).rejects.toThrow('late network failure')

    await coordinator.run('mission:update', { id: 'slow' }, async key => {
      seenKeys.push(key)
      return 'ok'
    })

    expect(seenKeys).toEqual(['key-1', 'key-1'])
  })

  test('does not coalesce distinct payloads', async () => {
    let sequence = 0
    const coordinator = createCarteiraMutationCoordinator(() => `key-${++sequence}`)

    const [first, second] = await Promise.all([
      coordinator.run('client:update', { id: 'a', status: 'hot' }, async key => key),
      coordinator.run('client:update', { id: 'a', status: 'cold' }, async key => key),
    ])

    expect(first).not.toBe(second)
  })

  test('does not reuse a completed key for a later legitimate mutation', async () => {
    let sequence = 0
    const seenKeys: string[] = []
    const coordinator = createCarteiraMutationCoordinator(() => `key-${++sequence}`)

    await coordinator.run('client:update', { id: 'a', status: 'hot' }, async key => {
      seenKeys.push(key)
    })
    await coordinator.run('client:update', { id: 'a', status: 'hot' }, async key => {
      seenKeys.push(key)
    })

    expect(seenKeys).toEqual(['key-1', 'key-2'])
  })
})
