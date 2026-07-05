type Props = {
  nome: string
  foto?: string | null
  size?: number
  border?: string
  gradient?: string
}

export function RankingAvatar({ nome, foto, size = 64, border, gradient = 'linear-gradient(135deg, var(--color-brand-primary), var(--color-chart-2))' }: Props) {
  const initials = nome ? nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?'
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: gradient,
        border: border ?? '3px solid var(--color-border-default)',
        fontSize: size * 0.32,
      }}
    >
      {foto ? <img src={foto} alt={nome} className="w-full h-full rounded-full object-cover" /> : initials}
    </div>
  )
}

export default RankingAvatar
