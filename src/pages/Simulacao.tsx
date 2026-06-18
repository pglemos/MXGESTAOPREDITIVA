import { useEffect, useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Building2, Crown, MonitorPlay, ShieldCheck, Store, UserRound } from 'lucide-react'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { slugify } from '@/lib/utils'
import type { UserRole } from '@/types/database'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Card, CardContent } from '@/components/molecules/Card'

type SimulationRole = Extract<UserRole, 'dono' | 'gerente' | 'vendedor'>

const ROLE_OPTIONS: Array<{
  role: SimulationRole
  title: string
  description: string
  icon: typeof UserRound
  startPath: string
}> = [
  {
    role: 'vendedor',
    title: 'Vendedor',
    description: 'Fechamento Diário, histórico, ranking, devolutivas, PDI, treinamentos e produtos.',
    icon: UserRound,
    startPath: '/terminal-mx',
  },
  {
    role: 'gerente',
    title: 'Gerente',
    description: 'Painel da loja, equipe, rotina diária, classificação, devolutivas, PDI e treinamentos.',
    icon: ShieldCheck,
    startPath: '/rotina',
  },
  {
    role: 'dono',
    title: 'Dono',
    description: 'Visão executiva das lojas, performance, equipe, relatórios, devolutivas e produtos digitais.',
    icon: Crown,
    startPath: '/lojas',
  },
]

function getStartPath(role: SimulationRole, fallbackPath: string, storeName?: string | null) {
  if (role === 'gerente' && storeName) return `/lojas/${slugify(storeName)}`
  return fallbackPath
}

export default function Simulacao() {
  const { simulationRole: requestedRole } = useParams<{ simulationRole?: string }>()
  const {
    baseRole,
    isSimulating,
    simulationRole,
    simulationLoading,
    membership,
    startSimulation,
  } = useAuth()
  const navigate = useNavigate()

  const requestedOption = useMemo(
    () => ROLE_OPTIONS.find(option => option.role === requestedRole),
    [requestedRole],
  )

  useEffect(() => {
    if (!requestedOption) return
    if (isSimulating && simulationRole === requestedOption.role) return
    startSimulation(requestedOption.role)
  }, [isSimulating, requestedOption, simulationRole, startSimulation])

  useEffect(() => {
    if (!requestedOption || !isSimulating || simulationRole !== requestedOption.role || simulationLoading) return
    navigate(getStartPath(requestedOption.role, requestedOption.startPath, membership?.store?.name), { replace: true })
  }, [isSimulating, membership?.store?.name, navigate, requestedOption, simulationLoading, simulationRole])

  if (!isPerfilInternoMx(baseRole) && !isSimulating) return <Navigate to="/" replace />

  if (requestedOption) {
    return (
      <main className="w-full h-full flex items-center justify-center p-mx-xl bg-surface-alt">
        <Card className="max-w-lg w-full rounded-mx-4xl border-border-default shadow-mx-xl">
          <CardContent className="p-mx-xl text-center space-y-mx-lg">
            <div className="w-mx-20 h-mx-20 rounded-mx-3xl bg-brand-primary text-white flex items-center justify-center mx-auto shadow-mx-lg">
              <MonitorPlay size={38} />
            </div>
            <div className="space-y-mx-xs">
              <Badge variant="info" className="uppercase font-black tracking-mx-widest">Simulação MX</Badge>
              <Typography variant="h1" className="uppercase tracking-tight">
                Preparando visão de {requestedOption.title}
              </Typography>
              <Typography variant="p" tone="muted" className="font-bold">
                Carregando a loja sandbox MX e o usuário operacional vinculado.
              </Typography>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
<main className="h-full w-full overflow-y-auto bg-surface-alt p-mx-lg no-scrollbar">
<div className="space-y-mx-xl">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-8">
          <div className="space-y-mx-xs">
            <Badge variant="success" className="uppercase font-black tracking-mx-widest">Admin Master MX</Badge>
            <Typography variant="h1" className="uppercase tracking-tight">Simulação</Typography>
            <Typography variant="p" tone="muted" className="max-w-3xl font-bold">
              Escolha o perfil que será apresentado na consultoria. A experiência usa os módulos reais da aplicação com dados da loja sandbox MX.
            </Typography>
          </div>
          <div className="flex items-center gap-mx-sm bg-white border border-border-default rounded-mx-2xl px-5 py-4 shadow-mx-sm">
            <Store size={20} className="text-brand-primary" />
            <Typography variant="tiny" className="font-black uppercase tracking-mx-widest">Loja sandbox MX</Typography>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-mx-lg" aria-label="Perfis disponíveis para simulação">
          {ROLE_OPTIONS.map(option => {
            const Icon = option.icon
            return (
              <Card key={option.role} className="rounded-mx-3xl border-border-default shadow-mx-sm bg-white">
                <CardContent className="p-mx-xl flex flex-col gap-mx-lg h-full">
                  <div className="w-mx-16 h-mx-16 rounded-mx-2xl bg-surface-alt border border-border-default flex items-center justify-center text-brand-primary">
                    <Icon size={30} />
                  </div>
                  <div className="space-y-mx-xs flex-1">
                    <Typography variant="h2" className="uppercase tracking-tight">{option.title}</Typography>
                    <Typography variant="p" tone="muted" className="font-bold">{option.description}</Typography>
                  </div>
                  <Button asChild size="lg" className="w-full rounded-mx-2xl uppercase font-black">
                    <a href={`/simulacao/${option.role}`}>
                      <Building2 size={18} />
                      Simular {option.title}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </section>
      </div>
    </main>
  )
}
