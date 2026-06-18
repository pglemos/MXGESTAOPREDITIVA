import { Link } from 'react-router-dom'
import { Bell, GraduationCap, HelpCircle, ShieldCheck, UserRound } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { PageHeader } from '@/components/molecules/PageHeader'
import { useAuth } from '@/hooks/useAuth'

const SETTINGS = [
  {
    title: 'Conta e perfil',
    description: 'Dados profissionais, rotina, objetivos e remuneração.',
    to: '/perfil',
    cta: 'Abrir perfil',
    icon: UserRound,
  },
  {
    title: 'Notificações',
    description: 'Alertas, comunicados e pendências obrigatórias.',
    to: '/notificacoes',
    cta: 'Ver notificações',
    icon: Bell,
  },
  {
    title: 'Treinamentos',
    description: 'Trilhas, aulas, biblioteca e provas.',
    to: '/treinamentos',
    cta: 'Abrir treinamentos',
    icon: GraduationCap,
  },
  {
    title: 'Ajuda',
    description: 'Suporte operacional para rotina, correções e devolutivas.',
    to: '/ajuda',
    cta: 'Abrir ajuda',
    icon: HelpCircle,
  },
]

export default function VendedorConfiguracoes() {
  const { membership, profile, role } = useAuth()

  return (
    <main className="h-full w-full overflow-y-auto bg-surface-alt p-mx-md no-scrollbar md:p-mx-lg">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-mx-lg pb-28">
        <PageHeader
          title="Configurações"
          description="Preferências e atalhos operacionais do vendedor."
          actions={
            <Badge variant="brand" className="rounded-mx-full px-mx-md py-mx-sm uppercase">
              {role || 'vendedor'}
            </Badge>
          }
        />

        <section className="grid grid-cols-1 gap-mx-lg xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="rounded-mx-2xl border border-border-subtle bg-white p-mx-lg shadow-mx-md">
            <div className="flex items-start gap-mx-md">
              <span className="grid h-mx-14 w-mx-14 shrink-0 place-items-center rounded-mx-2xl bg-brand-primary/10 text-brand-primary">
                <ShieldCheck size={26} />
              </span>
              <div className="min-w-0">
                <Typography variant="h2" className="text-2xl">
                  {profile?.name || 'Vendedor'}
                </Typography>
                <Typography variant="p" tone="muted" className="mt-mx-xs">
                  {membership?.store?.name || 'Loja não vinculada'}
                </Typography>
              </div>
            </div>

            <div className="mt-mx-lg rounded-mx-md border border-border-default bg-surface-alt p-mx-md">
              <Typography variant="caption" className="uppercase tracking-mx-wide text-text-primary">
                Acesso
              </Typography>
              <Typography variant="p" tone="muted" className="mt-mx-xs">
                Configurações administrativas seguem restritas à liderança da loja e equipe MX.
              </Typography>
            </div>
          </Card>

          <section className="grid grid-cols-1 gap-mx-md md:grid-cols-2" aria-label="Configurações do vendedor">
            {SETTINGS.map((item) => (
              <Card key={item.title} className="rounded-mx-2xl border border-border-subtle bg-white p-mx-lg shadow-mx-md">
                <div className="flex h-full flex-col gap-mx-md">
                  <div className="flex items-start gap-mx-md">
                    <span className="grid h-mx-12 w-mx-12 shrink-0 place-items-center rounded-mx-2xl bg-status-success-surface text-mx-green-700">
                      <item.icon size={22} />
                    </span>
                    <div className="min-w-0">
                      <Typography variant="h3" className="uppercase">
                        {item.title}
                      </Typography>
                      <Typography variant="p" tone="muted" className="mt-mx-xs">
                        {item.description}
                      </Typography>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="mt-auto justify-center">
                    <Link to={item.to}>{item.cta}</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </section>
        </section>
      </div>
    </main>
  )
}
