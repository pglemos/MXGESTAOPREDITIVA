export type ManagerClosingRealtimeStatus =
  | 'SUBSCRIBED'
  | 'TIMED_OUT'
  | 'CLOSED'
  | 'CHANNEL_ERROR'
  | string

type ManagerClosingRealtimeChannel = {
  on: (
    event: 'postgres_changes',
    filter: {
      event: '*'
      schema: 'public'
      table: 'lancamentos_diarios'
      filter: string
    },
    callback: () => void,
  ) => ManagerClosingRealtimeChannel
  subscribe: (callback: (status: ManagerClosingRealtimeStatus) => void) => ManagerClosingRealtimeChannel
}

type ManagerClosingRealtimeClient = {
  channel: (name: string) => ManagerClosingRealtimeChannel
  removeChannel: (channel: ManagerClosingRealtimeChannel) => unknown
}

export function subscribeToManagerClosingRealtime({
  client,
  storeId,
  onChange,
  onStatus,
}: {
  client: ManagerClosingRealtimeClient
  storeId: string
  onChange: () => void
  onStatus: (status: ManagerClosingRealtimeStatus) => void
}) {
  const channel = client
    .channel(`manager-closing-sync-${storeId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lancamentos_diarios',
        filter: `store_id=eq.${storeId}`,
      },
      onChange,
    )
    .subscribe(onStatus)

  return () => {
    void client.removeChannel(channel)
  }
}
