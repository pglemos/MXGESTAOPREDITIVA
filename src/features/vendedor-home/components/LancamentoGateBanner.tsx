import { Link } from 'react-router-dom'
import { Lock, ArrowRight } from 'lucide-react'
import { Typography } from '@/components/atoms/Typography'

/**
 * Trava operacional do vendedor (N3 — ata Daniel/José 2026-05-22 §00:48-§00:49).
 *
 * Quando o vendedor não realizou o lançamento diário ainda, esse banner
 * aparece no topo da Home reforçando a regra "sem lançamento → sem leads".
 * A Home mantém o card de fechamento acessível e bloqueia os módulos que
 * dependem da rotina lançada até a regularização.
 */
type Props = {
  isLocked: boolean
  referenceDateLabel: string
}

export function LancamentoGateBanner({ isLocked, referenceDateLabel }: Props) {
  if (!isLocked) return null
  return (
    <aside
      role="alert"
      aria-live="polite"
      className="rounded-mx-2xl border-2 border-status-warning bg-status-warning-surface p-mx-md shadow-mx-md flex flex-col gap-mx-sm md:flex-row md:items-center md:justify-between"
    >
      <div className="flex items-start gap-mx-sm md:items-center">
        <div className="h-mx-12 w-mx-12 shrink-0 rounded-mx-xl bg-status-warning text-pure-white flex items-center justify-center shadow-mx-sm">
          <Lock size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <Typography
            as="span"
            variant="caption"
            className="font-bold uppercase tracking-widest text-status-warning"
          >
            Lançamento diário pendente
          </Typography>
          <Typography variant="p" className="text-sm font-bold text-text-primary leading-tight mt-mx-tiny">
            Registre o seu fechamento referente a {referenceDateLabel} para liberar leads, agenda e ranking.
          </Typography>
        </div>
      </div>
      <Link
        to="/lancamento-diario"
        className="inline-flex items-center justify-center gap-mx-xs rounded-mx-xl bg-status-warning px-mx-md h-mx-12 text-pure-white font-bold uppercase tracking-widest text-sm shadow-mx-sm hover:shadow-mx-md transition-shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-status-warning/40"
      >
        Fazer lançamento agora
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </aside>
  )
}
