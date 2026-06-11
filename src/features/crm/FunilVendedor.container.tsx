import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Calendar, ChevronRight, DoorOpen, Gauge, Globe, Lightbulb, Rocket, Target, Trophy, Users, Wallet } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { useVendedorHomePage } from '@/features/vendedor-home/hooks/useVendedorHomePage'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import { useAgendamentos } from '@/features/crm/hooks/useAgendamentos'
import { useStoreMetaRules } from '@/hooks/useGoals'
import { getDiasInfo } from '@/lib/calculations'
import { CRM_CANAIS, CRM_CANAL_LABEL, type CrmCanal } from '@/lib/schemas/crm.schema'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const PCT = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

export function FunilVendedor() {
  const { metrics, remuneracaoResumo } = useVendedorHomePage()
  const { metaRules } = useStoreMetaRules()
  const { oportunidades } = useOportunidades()
  const { agendamentos } = useAgendamentos()

  const meta = metrics?.meta ?? 0
  const vendasMes = metrics?.vendasMes ?? 0
  const faltaX = Math.max(meta - vendasMes, 0)
  const atingimento = meta > 0 ? Math.min(100, Math.round((vendasMes / meta) * 100)) : 0
  const projecao = metrics?.projecao ?? 0

  // "O que falta" por canal: faltaX convertido em volume usando os benchmarks
  // de conversão configurados da loja (regras_metas_loja).
  const plano = useMemo(() => {
    const benchLeadAgd = metaRules?.bench_lead_agd ?? 20
    const benchAgdVisita = metaRules?.bench_agd_visita ?? 60
    const benchVisitaVnd = metaRules?.bench_visita_vnd ?? 33
    const dias = getDiasInfo(undefined, metaRules?.projection_mode || 'calendar')
    const chainInternet = (benchLeadAgd / 100) * (benchAgdVisita / 100) * (benchVisitaVnd / 100)
    const chainCarteira = (benchAgdVisita / 100) * (benchVisitaVnd / 100)
    const chainPorta = benchVisitaVnd / 100
    const need = (chain: number) => (faltaX > 0 && chain > 0 ? Math.ceil(faltaX / chain) : 0)
    const porDia = (n: number) => (dias.restantes > 0 ? Math.ceil(n / dias.restantes) : n)
    return {
      dias,
      leads: need(chainInternet),
      agds: need(chainCarteira),
      atds: need(chainPorta),
      leadsPorDia: porDia(need(chainInternet)),
      agdsPorDia: porDia(need(chainCarteira)),
      atdsPorDia: porDia(need(chainPorta)),
    }
  }, [faltaX, metaRules])

  // Ritmo real: 1 venda a cada N dias decorridos vs ritmo necessário pela meta.
  const ritmo = useMemo(() => {
    const cicloAtual = vendasMes > 0 ? Math.max(1, Math.round(plano.dias.decorridos / vendasMes)) : null
    const cicloNecessario = meta > 0 ? Math.max(1, Math.floor(plano.dias.total / meta)) : null
    const noRitmo = cicloAtual !== null && cicloNecessario !== null && cicloAtual <= cicloNecessario
    const gaugePct = meta > 0 ? Math.min(100, Math.round((projecao / meta) * 100)) : 0
    return { cicloAtual, cicloNecessario, noRitmo, gaugePct }
  }, [meta, plano.dias.decorridos, plano.dias.total, projecao, vendasMes])

  // Destaques reais: conversão por canal das oportunidades do vendedor.
  const canais = useMemo(() => {
    const rows = CRM_CANAIS.map(canal => {
      const byCanal = oportunidades.filter(item => item.canal === canal)
      const ganhos = byCanal.filter(item => item.etapa === 'ganho').length
      return { canal: canal as CrmCanal, total: byCanal.length, ganhos, conversao: byCanal.length > 0 ? (ganhos / byCanal.length) * 100 : 0 }
    })
    const comGanho = rows.filter(row => row.ganhos > 0).sort((a, b) => b.conversao - a.conversao)
    const melhor = comGanho[0] || null
    const ativos = rows.filter(row => row.total > 0 && row.ganhos === 0).sort((a, b) => b.total - a.total)
    const maiorOportunidade = ativos[0] || null
    return { melhor, maiorOportunidade }
  }, [oportunidades])

  const agendamentosCarteiraFuturos = useMemo(() => {
    const agora = new Date()
    return agendamentos.filter(a => a.canal === 'carteira' && new Date(a.data_hora) >= agora && (a.status === 'aguardando' || a.status === 'confirmado')).length
  }, [agendamentos])

  const comissaoRealizada = remuneracaoResumo?.realizado
  const comissaoProjetada = remuneracaoResumo?.projetado
  const hoje = new Date()
  const hojeLabel = `${hoje.toLocaleDateString('pt-BR')} (${hoje.toLocaleDateString('pt-BR', { weekday: 'long' })})`

  return (
    <main className="h-full w-full overflow-y-auto bg-white p-mx-md md:p-mx-lg no-scrollbar">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-mx-lg pb-20">
        <header className="flex items-center justify-between border-b border-border-subtle pb-mx-md">
          <div className="flex items-center gap-mx-sm">
            <Target size={36} className="text-text-primary" />
            <div>
              <Typography variant="h1" className="text-3xl uppercase leading-tight tracking-normal">Funil de Vendas</Typography>
              <Typography variant="p" tone="muted" className="text-sm">Acompanhe seu desempenho e saiba exatamente o que fazer para bater sua meta.</Typography>
            </div>
          </div>
          <div className="hidden items-center gap-mx-xs text-sm font-black md:flex"><Calendar size={17} /> {hojeLabel}</div>
        </header>

        <section className="grid gap-mx-md xl:grid-cols-[1fr_1.1fr_1.15fr]">
          <GoalSummary meta={meta} vendidos={vendasMes} faltam={faltaX} atingimento={atingimento} />
          <CommissionSummary realizado={comissaoRealizada} projetado={comissaoProjetada} atingimento={atingimento} />
          <PaceSummary ritmo={ritmo} />
        </section>

        <section>
          <div className="text-center">
            <Typography variant="h2" className="text-2xl uppercase tracking-normal">O que você precisa fazer para bater sua meta</Typography>
            <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
              {meta === 0
                ? 'Sua meta mensal ainda não foi cadastrada — fale com seu gerente.'
                : faltaX === 0
                  ? 'Meta do mês batida! 🎉 Tudo daqui em diante é recorde.'
                  : `Faltam ${faltaX} venda${faltaX === 1 ? '' : 's'} para você alcançar sua meta este mês.`}
            </Typography>
          </div>
          {meta > 0 && (
            <div className="mt-mx-md grid gap-mx-lg xl:grid-cols-3">
              <ChannelCard tone="blue" icon={<Globe size={36} />} title="Internet" path="Lead → Agendamento → Visita → Venda" need={plano.leads} unit={plano.leads === 1 ? 'novo lead' : 'novos leads'} porDia={plano.leadsPorDia} faltaX={faltaX} diasRestantes={plano.dias.restantes} />
              <ChannelCard tone="orange" icon={<Users size={36} />} title="Carteira" path="Agendamento → Visita → Venda" need={plano.agds} unit={plano.agds === 1 ? 'novo agendamento' : 'novos agendamentos'} porDia={plano.agdsPorDia} faltaX={faltaX} diasRestantes={plano.dias.restantes} />
              <ChannelCard tone="green" icon={<DoorOpen size={36} />} title="Porta" path="Atendimento → Venda" need={plano.atds} unit={plano.atds === 1 ? 'atendimento' : 'atendimentos'} porDia={plano.atdsPorDia} faltaX={faltaX} diasRestantes={plano.dias.restantes} />
            </div>
          )}
        </section>

        <section className="grid gap-mx-lg xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
          <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
            <Typography variant="h2" className="text-xl uppercase tracking-normal">Destaques do mês</Typography>
            <div className="mt-mx-md grid gap-mx-md md:grid-cols-2">
              {canais.melhor ? (
                <Highlight icon={<Trophy size={34} />} label="Seu melhor canal" value={CRM_CANAL_LABEL[canais.melhor.canal]} detail={`${PCT(canais.melhor.conversao)} de conversão em ${canais.melhor.total} oportunidade${canais.melhor.total === 1 ? '' : 's'}`} badge={`${canais.melhor.ganhos} venda${canais.melhor.ganhos === 1 ? '' : 's'} no canal`} />
              ) : (
                <Highlight icon={<Trophy size={34} />} label="Seu melhor canal" value="—" detail="Feche a primeira venda no funil para revelar seu melhor canal." />
              )}
              {canais.maiorOportunidade ? (
                <Highlight icon={<Rocket size={34} />} label="Maior oportunidade" value={CRM_CANAL_LABEL[canais.maiorOportunidade.canal]} detail={`${canais.maiorOportunidade.total} oportunidade${canais.maiorOportunidade.total === 1 ? '' : 's'} sem venda ainda — avance essas negociações para destravar o canal.`} />
              ) : (
                <Highlight icon={<Rocket size={34} />} label="Maior oportunidade" value="—" detail="Cadastre oportunidades no funil para o assistente apontar onde atacar." />
              )}
            </div>
          </Card>

          <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
            <div className="flex items-center justify-between">
              <Typography variant="h2" className="text-xl uppercase tracking-normal">Assistente Comercial</Typography>
              <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-black text-brand-primary">Insights para você hoje</span>
            </div>
            <div className="mt-mx-md space-y-mx-sm">
              {meta > 0 && faltaX > 0 && plano.leadsPorDia > 0 && (
                <Insight tone="blue" text={`Você precisa de aproximadamente ${plano.leadsPorDia} lead${plano.leadsPorDia === 1 ? '' : 's'} por dia para atingir sua meta pela Internet (${plano.dias.restantes} dia${plano.dias.restantes === 1 ? '' : 's'} restantes).`} />
              )}
              {canais.melhor && (
                <Insight tone="green" text={`Seu melhor resultado está vindo do canal ${CRM_CANAL_LABEL[canais.melhor.canal]} (${PCT(canais.melhor.conversao)} de conversão). Continue priorizando esse canal.`} />
              )}
              {agendamentosCarteiraFuturos === 0 ? (
                <Insight tone="orange" text="Sua carteira está sem agendamentos futuros. Reserve 30 minutos por dia para prospecção e agende mais visitas." />
              ) : (
                <Insight tone="green" text={`Sua carteira tem ${agendamentosCarteiraFuturos} agendamento${agendamentosCarteiraFuturos === 1 ? '' : 's'} futuro${agendamentosCarteiraFuturos === 1 ? '' : 's'}. Confirme cada um no dia anterior.`} />
              )}
              {meta === 0 && (
                <Insight tone="orange" text="Sem meta cadastrada não há plano do dia. Fale com seu gerente para definir sua meta mensal." />
              )}
            </div>
          </Card>
        </section>

        <div className="flex items-center justify-between rounded-mx-md border border-brand-primary/10 bg-brand-primary/5 px-mx-lg py-mx-sm">
          <div className="flex items-center gap-mx-sm">
            <Lightbulb size={22} className="text-brand-primary" />
            <Typography variant="p" className="font-black text-brand-primary">Dica do dia</Typography>
            <Typography variant="p" className="text-sm font-semibold text-text-secondary">Sorria, ouça e faça perguntas. O cliente compra do vendedor em quem confia!</Typography>
          </div>
          <Link to="/treinamentos" className="rounded-mx-md border border-border-subtle bg-white px-mx-md py-mx-xs text-sm font-black text-brand-primary">Ver treinamentos</Link>
        </div>
      </div>
    </main>
  )
}

function GoalSummary({ meta, vendidos, faltam, atingimento }: { meta: number; vendidos: number; faltam: number; atingimento: number }) {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-center gap-mx-sm"><Target size={26} className="text-brand-primary" /><Typography variant="h2" className="text-xl uppercase tracking-normal">Minha meta</Typography></div>
      <div className="mt-mx-lg grid grid-cols-3 text-center">
        <BigStat label="Meta do mês" value={meta > 0 ? String(meta) : '—'} hint="veículos" />
        <BigStat label="Vendidos" value={String(vendidos)} hint="veículos" tone="blue" />
        <BigStat label="Faltam" value={meta > 0 ? String(faltam) : '—'} hint="veículos" tone={faltam === 0 && meta > 0 ? 'green' : 'red'} />
      </div>
      <Bar value={atingimento} tone="blue" />
      <Typography variant="p" className="mt-mx-sm text-center font-black">
        {meta > 0 ? `${atingimento}% da meta alcançada` : 'Meta não cadastrada'}
      </Typography>
    </Card>
  )
}

type ComissaoResumo = { disponivel: boolean; total: number } | undefined

function CommissionSummary({ realizado, projetado, atingimento }: { realizado: ComissaoResumo; projetado: ComissaoResumo; atingimento: number }) {
  const disponivel = Boolean(realizado?.disponivel || projetado?.disponivel)
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-center gap-mx-sm"><Wallet size={26} className="text-status-success" /><Typography variant="h2" className="text-xl uppercase tracking-normal">Minha comissão</Typography></div>
      <div className="mt-mx-lg grid grid-cols-2 text-center">
        <BigStat label="Realizado" value={disponivel && realizado ? BRL(realizado.total) : '—'} tone="green" />
        <BigStat label="Projetado" value={disponivel && projetado ? BRL(projetado.total) : '—'} />
      </div>
      <Bar value={atingimento} tone="green" />
      <Typography variant="p" className="mt-mx-sm text-center font-black">
        {disponivel ? `${atingimento}% da meta de vendas` : 'Plano de remuneração não cadastrado'}
      </Typography>
    </Card>
  )
}

function PaceSummary({ ritmo }: { ritmo: { cicloAtual: number | null; cicloNecessario: number | null; noRitmo: boolean; gaugePct: number } }) {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-center gap-mx-sm"><Rocket size={26} className="text-brand-primary" /><Typography variant="h2" className="text-xl uppercase tracking-normal">Ritmo atual</Typography></div>
      <div className="mt-mx-lg grid grid-cols-[1fr_160px] items-center gap-mx-md">
        <div className="text-center">
          {ritmo.cicloAtual !== null ? (
            <>
              <Typography variant="p" tone="muted" className="font-black">Você está vendendo</Typography>
              <Typography variant="h1" className="mt-1 text-4xl text-brand-primary">1 carro</Typography>
              <Typography variant="h3" className="text-xl">a cada {ritmo.cicloAtual} dia{ritmo.cicloAtual === 1 ? '' : 's'}</Typography>
            </>
          ) : (
            <>
              <Typography variant="p" tone="muted" className="font-black">Ainda sem vendas</Typography>
              <Typography variant="h1" className="mt-1 text-4xl text-brand-primary">—</Typography>
              <Typography variant="h3" className="text-xl">neste mês</Typography>
            </>
          )}
          {ritmo.cicloNecessario !== null && (
            <span className={`mt-mx-md inline-flex rounded-mx-md px-3 py-1 text-sm font-black ${ritmo.noRitmo ? 'bg-status-success-surface text-status-success' : 'bg-status-warning-surface text-status-warning'}`}>
              {ritmo.noRitmo ? `No ritmo da meta (1 a cada ${ritmo.cicloNecessario} dia${ritmo.cicloNecessario === 1 ? '' : 's'})` : `Meta pede 1 a cada ${ritmo.cicloNecessario} dia${ritmo.cicloNecessario === 1 ? '' : 's'}`}
            </span>
          )}
        </div>
        <div className="grid h-36 w-36 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-status-success) ${ritmo.gaugePct}%, var(--color-status-success-surface) 0)` }}>
          <div className="grid h-24 w-24 place-items-center rounded-full bg-white"><Gauge size={44} /></div>
        </div>
      </div>
    </Card>
  )
}

function ChannelCard({ tone, icon, title, path, need, unit, porDia, faltaX, diasRestantes }: { tone: 'blue' | 'orange' | 'green'; icon: React.ReactNode; title: string; path: string; need: number; unit: string; porDia: number; faltaX: number; diasRestantes: number }) {
  const toneMap = {
    blue: ['bg-brand-primary/5', 'text-brand-primary', 'bg-brand-primary/10'],
    orange: ['bg-status-warning-surface', 'text-status-warning', 'bg-status-warning/10'],
    green: ['bg-status-success-surface', 'text-status-success', 'bg-status-success/10'],
  }[tone]
  const metaBatida = faltaX === 0
  return (
    <Card className={`rounded-mx-lg border border-border-subtle p-mx-lg shadow-mx-sm ${toneMap[0]}`}>
      <div className="flex items-center gap-mx-sm">
        <span className={`grid h-16 w-16 place-items-center rounded-full ${toneMap[2]} ${toneMap[1]}`}>{icon}</span>
        <div><Typography variant="h2" className={`text-2xl uppercase ${toneMap[1]}`}>{title}</Typography><Typography variant="p" className="font-black">{path}</Typography></div>
      </div>
      <div className="mx-auto mt-mx-lg max-w-[270px] rounded-mx-md border border-border-subtle bg-white p-mx-lg text-center">
        {metaBatida ? (
          <>
            <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Meta batida</Typography>
            <Typography variant="h1" className="mt-1 text-5xl text-status-success">🎉</Typography>
            <Typography variant="h3">parabéns!</Typography>
          </>
        ) : (
          <>
            <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Você precisa de</Typography>
            <Typography variant="h1" className={`mt-1 text-5xl ${toneMap[1]}`}>{need}</Typography>
            <Typography variant="h3">{unit}</Typography>
          </>
        )}
        <div className="mt-mx-md border-t border-border-subtle pt-mx-sm">
          {!metaBatida && (
            <Typography variant="p" className={`inline-flex items-center gap-mx-xs font-black uppercase ${porDia <= 3 ? 'text-status-success' : 'text-status-warning'}`}>
              {porDia <= 3 ? <ChevronRight size={16} /> : <AlertTriangle size={16} />} ≈{porDia} por dia
            </Typography>
          )}
          <Typography variant="caption" tone="muted" className="mt-1 block normal-case tracking-normal">
            {metaBatida
              ? 'Tudo daqui em diante aumenta sua comissão.'
              : `É o que falta para gerar ${faltaX} venda${faltaX === 1 ? '' : 's'} em ${diasRestantes} dia${diasRestantes === 1 ? '' : 's'}.`}
          </Typography>
        </div>
      </div>
      <Link to="/treinamentos" className={`mt-mx-md flex w-full items-center justify-center gap-mx-xs rounded-mx-md border border-border-subtle bg-white py-mx-sm text-sm font-black ${toneMap[1]}`}>Ver dicas para {title}<ChevronRight size={16} /></Link>
    </Card>
  )
}

function BigStat({ label, value, hint, tone = 'dark' }: { label: string; value: string; hint?: string; tone?: 'dark' | 'blue' | 'green' | 'red' }) {
  const color = tone === 'blue' ? 'text-brand-primary' : tone === 'green' ? 'text-status-success' : tone === 'red' ? 'text-status-error' : 'text-text-primary'
  return <div className="border-r border-border-subtle last:border-r-0"><Typography variant="caption" tone="muted" className="font-black normal-case tracking-normal">{label}</Typography><Typography variant="h1" className={`mt-2 text-4xl ${color}`}>{value}</Typography>{hint && <Typography variant="p" className="font-black">{hint}</Typography>}</div>
}

function Bar({ value, tone }: { value: number; tone: 'blue' | 'green' }) {
  return <div className="mt-mx-lg h-3 rounded-full bg-surface-alt"><div className={`h-3 rounded-full ${tone === 'blue' ? 'bg-brand-primary' : 'bg-status-success'}`} style={{ width: `${value}%` }} /></div>
}

function Highlight({ icon, label, value, detail, badge }: { icon: React.ReactNode; label: string; value: string; detail: string; badge?: string }) {
  return <div className="rounded-mx-lg bg-surface-alt p-mx-lg"><span className="mb-mx-md grid h-16 w-16 place-items-center rounded-full bg-status-success-surface text-status-success">{icon}</span><Typography variant="tiny" className="font-black uppercase text-status-success">{label}</Typography><Typography variant="h2" className="mt-1 text-3xl">{value}</Typography><Typography variant="p" className="mt-mx-xs text-sm font-semibold text-text-secondary">{detail}</Typography>{badge && <span className="mt-mx-md inline-flex rounded-mx-md bg-status-success-surface px-3 py-1 text-xs font-black text-status-success">{badge}</span>}</div>
}

function Insight({ text, tone }: { text: string; tone: 'blue' | 'green' | 'orange' }) {
  const cls = tone === 'blue' ? 'text-brand-primary bg-brand-primary/10' : tone === 'green' ? 'text-status-success bg-status-success-surface' : 'text-status-warning bg-status-warning-surface'
  return <div className="flex items-center justify-between rounded-mx-md border border-border-subtle p-mx-sm"><div className="flex items-center gap-mx-sm"><span className={`grid h-9 w-9 place-items-center rounded-full ${cls}`}><Lightbulb size={18} /></span><Typography variant="p" className="font-semibold">{text}</Typography></div><ChevronRight size={18} className="text-text-tertiary" /></div>
}

export default FunilVendedor
