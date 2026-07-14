import { describe, expect, it, mock } from 'bun:test'
import { subscribeToManagerClosingRealtime } from './manager-closing-realtime'

describe('manager closing realtime subscription', () => {
  it('escuta todos os eventos da loja e remove o canal no cleanup', () => {
    const onChange = mock(() => undefined)
    const onStatus = mock(() => undefined)
    const channel = new FakeChannel()
    const client = {
      channel: mock(() => channel),
      removeChannel: mock(() => undefined),
    }

    const cleanup = subscribeToManagerClosingRealtime({
      client,
      storeId: 'store-1',
      onChange,
      onStatus,
    })

    expect(client.channel).toHaveBeenCalledWith('manager-closing-sync-store-1')
    expect(channel.onArgs).toEqual([
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lancamentos_diarios',
        filter: 'store_id=eq.store-1',
      },
      onChange,
    ])
    expect(channel.subscribeCallback).toBeTruthy()

    channel.subscribeCallback?.('SUBSCRIBED')
    expect(onStatus).toHaveBeenCalledWith('SUBSCRIBED')
    channel.changeCallback?.()
    expect(onChange).toHaveBeenCalledTimes(1)

    cleanup()
    expect(client.removeChannel).toHaveBeenCalledWith(channel)
  })
})

class FakeChannel {
  onArgs: unknown[] = []
  subscribeCallback?: (status: string) => void
  changeCallback?: () => void

  on(
    event: 'postgres_changes',
    filter: unknown,
    callback: () => void,
  ) {
    this.onArgs = [event, filter, callback]
    this.changeCallback = callback
    return this
  }

  subscribe(callback: (status: string) => void) {
    this.subscribeCallback = callback
    return this
  }
}
