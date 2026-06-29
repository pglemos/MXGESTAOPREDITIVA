import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, History, Search } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Avatar } from '@/components/atoms/Avatar'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/molecules/Card'
import { DataGrid, type Column } from '@/components/organisms/DataGrid'
import { MotionCard, MotionList, MotionRow, duration, easing } from '@/design/motion'
import type { RankingEntry } from '@/types/database'
import type { ViewMode } from '../hooks/useDashboardLojaData'

type StoreRankingEntry = RankingEntry & { id: string }

type RankingSectionProps = {
  viewMode: ViewMode
  ranking: RankingEntry[]
  mixCanais: { label: string; color: string; pct: number; tone: 'success' | 'info' | 'brand' }[]
  diagnostics: { diagnostico: string; sugestao: string }
}

/**
 * Grade Diária / Ranking da Unidade + Mix de Canais + Diagnóstico.
 * Extraído de DashboardLoja.tsx (Story 2.5).
 */
export function RankingSection({ viewMode, ranking, mixCanais, diagnostics }: RankingSectionProps) {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [sellerSearch, setSellerSearch] = useState('')

  const columns = useMemo<Column<StoreRankingEntry>[]>(() => [
    {
      key: 'position',
      header: 'POS',
      width: 'w-16',
      render: (_, i) => (
        <span className="font-black text-sm text-text-label tabular-nums">{(i + 1).toString().padStart(2, '0')}</span>
      ),
    },
    {
      key: 'user_name',
      header: 'ESPECIALISTA',
      render: (r) => (
        <div className="flex items-center gap-mx-sm">
          <Avatar
            src={r.avatar_url || undefined}
            alt={`Avatar de ${r.user_name}`}
            fallback={r.user_name}
            size="md"
            className={cn(
              'w-mx-8 h-mx-8 sm:w-mx-10 sm:h-mx-10 rounded-mx-lg shadow-mx-inner transition-all',
              r.is_venda_loja
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-surface-alt text-text-primary border-border-default group-hover:border-brand-primary'
            )}
          />
          <div className="min-w-0">
            <Typography variant="h3" className="text-sm sm:text-base uppercase tracking-tight group-hover:text-brand-primary transition-colors font-black leading-tight whitespace-normal break-words">
              {r.user_name}
            </Typography>
            {r.is_venda_loja && (
              <span className="text-mx-nano font-black bg-brand-primary text-white px-1 py-0.5 rounded uppercase tracking-widest">
                Venda Loja
              </span>
            )}
          </div>
        </div>
      ),
    },
    { key: 'leads', header: 'LEADS', align: 'center', desktopOnly: true, render: (r) => <span className="opacity-60 tabular-nums">{r.leads}</span> },
    { key: 'agd_total', header: 'AGEND.', align: 'center', desktopOnly: true, render: (r) => <span className="opacity-60 tabular-nums text-status-info">{r.agd_total}</span> },
    { key: 'visitas', header: 'VISITAS', align: 'center', desktopOnly: true, render: (r) => <span className="opacity-60 tabular-nums">{r.visitas}</span> },
    {
      key: 'vnd_total',
      header: 'VENDAS',
      align: 'center',
      render: (r) => <span className="font-black text-xl sm:text-2xl text-brand-primary font-mono-numbers">{r.vnd_total}</span>,
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'right',
      render: (r) => (
        <Badge
          variant={r.vnd_total > 0 ? 'success' : 'outline'}
          className="px-3 py-1 rounded-mx-lg font-black text-mx-tiny tracking-widest shadow-sm uppercase border-none"
        >
          {r.vnd_total > 0 ? 'CONVERSÃO' : 'EM AGUARDO'}
        </Badge>
      ),
    },
  ], [])

  const filteredRanking = useMemo<StoreRankingEntry[]>(() => {
    return ranking
      .map((r): StoreRankingEntry => ({ ...r, id: r.user_id }))
      .filter(r => r.user_name.toLowerCase().includes(sellerSearch.toLowerCase()))
  }, [ranking, sellerSearch])

  return (
    <MotionList className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg pb-32">
      <MotionRow as="section" className="xl:col-span-8 flex flex-col">
        <MotionCard className="flex-1">
          <Card className="border-none shadow-mx-lg bg-white overflow-hidden flex-1">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-mx-md p-mx-lg bg-surface-alt/30 border-b border-border-default">
            <div>
              <CardTitle className="text-xl md:text-2xl">{viewMode === 'day' ? 'Grade Diária' : 'Ranking da Unidade'}</CardTitle>
              <CardDescription className="font-black uppercase tracking-mx-wide mt-1 text-mx-tiny">Performance individual para ação gerencial</CardDescription>
            </div>
            <div className="relative group w-full sm:w-mx-sidebar-expanded">
              <Search size={14} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
              <label htmlFor="dashboard-seller-search" className="sr-only">Buscar especialista</label>
              <Input
                id="dashboard-seller-search"
                name="dashboard-seller-search"
                placeholder="BUSCAR..."
                value={sellerSearch}
                onChange={e => setSellerSearch(e.target.value)}
                className="!pl-10 !h-10 text-mx-tiny font-black uppercase"
              />
            </div>
          </CardHeader>
          <div className="border-b border-border-default bg-white px-mx-lg py-mx-sm">
            <div className="flex flex-col gap-mx-sm lg:flex-row lg:items-center lg:justify-between">
              <Typography variant="p" tone="muted" className="text-sm">
                Use a busca para localizar vendedor e abrir ações de devolutiva, PDI ou rotina sem depender de estética competitiva.
              </Typography>
              {sellerSearch.trim() && filteredRanking.length > 0 && (
                <div className="flex flex-wrap gap-mx-xs">
                  <Button type="button" variant="outline" size="sm" onClick={() => navigate('/devolutivas')} className="h-mx-9 rounded-mx-lg bg-white">Devolutiva</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => navigate('/pdi')} className="h-mx-9 rounded-mx-lg bg-white">PDI</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => navigate('/rotina')} className="h-mx-9 rounded-mx-lg bg-white">Rotina</Button>
                </div>
              )}
            </div>
          </div>
          <DataGrid
            columns={columns}
            data={filteredRanking}
            emptyMessage="Nenhum especialista localizado."
            emptyDescription="Limpe a busca ou confirme se a equipe ativa realizou lançamentos no período selecionado."
          />
          </Card>
        </MotionCard>
      </MotionRow>

      <MotionRow as="aside" className="xl:col-span-4 flex flex-col gap-mx-lg">
        <MotionCard>
          <Card className="p-mx-lg border-none shadow-mx-lg bg-white">
          <header className="flex items-center gap-mx-sm mb-8">
            <div className="w-mx-12 h-mx-12 rounded-mx-xl bg-surface-alt flex items-center justify-center text-brand-primary shadow-mx-inner border border-border-default shrink-0">
              <Globe size={24} />
            </div>
            <Typography variant="h3" className="text-lg uppercase tracking-tight font-black">Mix de Canais</Typography>
          </header>
          <MotionList className="space-y-mx-lg">
            {mixCanais.map(ch => (
              <MotionRow key={ch.label} className="space-y-mx-xs">
                <div className="flex justify-between items-end">
                  <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-mx-tiny">{ch.label}</Typography>
                  <Typography variant="mono" tone={ch.tone} className="text-sm font-black">{ch.pct}%</Typography>
                </div>
                <div className="h-mx-xs w-full bg-surface-alt rounded-mx-full overflow-hidden border border-border-default p-0.5">
                  <motion.div
                    initial={reduceMotion ? false : { width: 0 }}
                    animate={{ width: `${ch.pct}%` }}
                    transition={{ duration: reduceMotion ? 0 : duration.slow, ease: easing.standard as [number, number, number, number] }}
                    className={cn('h-full rounded-full transition-colors duration-150', ch.color)}
                  />
                </div>
              </MotionRow>
            ))}
          </MotionList>
          </Card>
        </MotionCard>

        <MotionCard>
          <Card className="p-mx-lg bg-brand-primary rounded-mx-3xl text-white shadow-mx-xl relative overflow-hidden group border-none">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
          <div className="relative z-10 text-center py-4">
            <History className="mx-auto mb-6 opacity-30 transform group-hover:scale-110 transition-transform" size={40} />
            <Typography variant="h2" tone="white" className="text-lg mb-4 uppercase tracking-tight font-black">Diagnóstico Unidade</Typography>
            <Typography variant="caption" tone="white" className="text-mx-tiny font-black italic opacity-80 leading-relaxed uppercase tracking-widest max-w-xs mx-auto block italic">
              &quot;{diagnostics.diagnostico} {diagnostics.sugestao}&quot;
            </Typography>
          </div>
          </Card>
        </MotionCard>
      </MotionRow>
    </MotionList>
  )
}

export default RankingSection
