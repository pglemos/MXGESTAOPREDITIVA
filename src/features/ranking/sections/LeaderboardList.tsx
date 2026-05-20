import { AnimatePresence } from 'motion/react'
import { SellerListItem } from '@/features/ranking/components/SellerListItem'
import { RankingPodium } from '@/features/ranking/components/RankingPodium'

type SellerEntry = {
  user_id: string
  user_name: string
  store_name?: string
  avatar_url?: string | null
  position: number
  vnd_total: number
  meta: number
  ritmo: number
  atingimento: number
}

type Props = {
  ranking: SellerEntry[]
  podium: SellerEntry[]
  currentUserId?: string | null
  battleOpponents: string[]
  showStoreName?: boolean
  onSelect: (userId: string) => void
  onToggleOpponent: (userId: string) => void
  /** Slot opcional renderizado antes da lista (e.g. busca interna do StoreRanking). */
  beforeList?: React.ReactNode
}

/**
 * Modo Leaderboard — Pódio + lista de vendedores.
 * Compartilhado entre GlobalRanking e StoreRanking.
 */
export function LeaderboardList({
  ranking, podium, currentUserId, battleOpponents, showStoreName = true,
  onSelect, onToggleOpponent, beforeList,
}: Props) {
  return (
    <div className="space-y-mx-xl animate-slide-up">
      <RankingPodium entries={podium} onSelect={onSelect} />

      {beforeList}

      <ol className="grid gap-mx-lg m-mx-0 p-mx-0 list-none w-full max-w-full">
        <AnimatePresence mode="popLayout">
          {ranking.map((seller, i) => (
            <SellerListItem
              key={seller.user_id}
              seller={seller}
              index={i}
              isMe={seller.user_id === currentUserId}
              isBattleSelected={battleOpponents.includes(seller.user_id)}
              showStoreName={showStoreName}
              onSelect={onSelect}
              onToggleOpponent={onToggleOpponent}
            />
          ))}
        </AnimatePresence>
      </ol>
    </div>
  )
}

export default LeaderboardList
