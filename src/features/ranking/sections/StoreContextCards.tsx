import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'

type Props = {
  role: string | null | undefined
}

/**
 * Cards de contexto pedagógico do StoreRanking:
 * - Dono: "Ranking como governança"
 * - Vendedor: "Sua leitura individual"
 * (Gerente não exibe — comportamento original preservado).
 */
export function StoreContextCards({ role }: Props) {
  if (role === 'dono') {
    return (
      <Card className="border border-status-info/20 bg-status-info-surface p-mx-md shadow-mx-sm">
        <Typography variant="h3" className="uppercase tracking-tight text-status-info">Ranking como governança</Typography>
        <Typography variant="p" className="mt-mx-xs text-sm text-status-info">
          Use esta classificação para identificar onde pedir plano de ação ao gerente, reconhecer consistência e cruzar performance com meta, funil e DRE. A execução diária continua com gerente e equipe.
        </Typography>
      </Card>
    )
  }

  if (role === 'vendedor') {
    return (
      <Card className="border border-brand-primary/15 bg-white p-mx-md shadow-mx-sm">
        <Typography variant="h3" className="uppercase tracking-tight">Sua leitura individual</Typography>
        <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">
          A classificação mostra vendas, objetivo, ritmo e atingimento para você entender sua distância da própria meta. Use o comparativo para aprender padrões de execução, não como cobrança isolada.
        </Typography>
      </Card>
    )
  }

  return null
}

export default StoreContextCards
