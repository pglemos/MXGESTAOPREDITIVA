import { Phone, MessageCircle, CalendarPlus, MapPin } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'

const consultorInfo = {
  name: 'Daniel Silva',
  role: 'Consultor MX Senior',
  email: 'daniel@mxperformance.com.br',
  phone: '+55 11 9 4444-5555',
  whatsapp: 'https://wa.me/5511944445555',
  city: 'São Paulo, SP',
}

export default function FalarConsultorDono() {
  return (
    <div className="flex flex-col gap-mx-lg p-mx-lg pb-28">
      <header className="flex flex-col gap-mx-md border-b border-border-subtle pb-mx-lg lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Typography variant="h1" className="text-3xl md:text-4xl">Falar com Consultor</Typography>
          <Typography variant="p" tone="muted" className="mt-mx-xs">Acompanhamento consultivo, agendamento de visitas e suporte estratégico.</Typography>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card className="rounded-mx-2xl bg-white p-mx-lg shadow-mx-sm border-none">
          <div className="flex items-center gap-mx-md">
            <div className="flex h-mx-20 w-mx-20 items-center justify-center rounded-mx-full text-white shadow-mx-md" style={{ background: 'linear-gradient(135deg, var(--color-accent-purple) 0%, var(--color-accent-purple-strong) 100%)' }}>
              <span className="text-2xl font-black tracking-tight">DS</span>
            </div>
            <div className="min-w-0">
              <Typography variant="h3" className="text-xl font-black truncate">{consultorInfo.name}</Typography>
              <Typography variant="p" tone="muted" className="font-bold text-sm">{consultorInfo.role}</Typography>
              <div className="mt-mx-tiny flex items-center gap-mx-xs text-mx-tiny text-text-tertiary">
                <MapPin size={12} aria-hidden="true" />
                <span>{consultorInfo.city}</span>
              </div>
            </div>
          </div>

          <div className="mt-mx-lg space-y-mx-sm">
            <a
              href={consultorInfo.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-mx-12 w-full items-center justify-center gap-mx-sm rounded-mx-xl bg-status-success text-white text-sm font-black hover:bg-status-success/90 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-status-success/30"
            >
              <MessageCircle size={18} /> Abrir WhatsApp
            </a>
            <a
              href={`tel:${consultorInfo.phone.replace(/\D/g, '')}`}
              className="flex h-mx-12 w-full items-center justify-center gap-mx-sm rounded-mx-xl border border-border-default bg-white text-sm font-black text-text-primary hover:bg-surface-alt transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20"
            >
              <Phone size={18} /> Ligar
            </a>
            <button
              type="button"
              className="flex h-mx-12 w-full items-center justify-center gap-mx-sm rounded-mx-xl bg-status-info text-white text-sm font-black hover:bg-status-info/90 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-status-info/30"
            >
              <CalendarPlus size={18} /> Agendar Reunião
            </button>
          </div>

          <div className="mt-mx-lg pt-mx-md border-t border-border-subtle space-y-mx-tiny">
            <div className="flex items-center gap-mx-xs text-sm text-text-secondary">
              <Phone size={14} className="text-text-tertiary" />
              <span className="font-bold">{consultorInfo.phone}</span>
            </div>
            <div className="flex items-center gap-mx-xs text-sm text-text-secondary">
              <MessageCircle size={14} className="text-text-tertiary" />
              <span className="font-bold">{consultorInfo.email}</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-mx-2xl bg-white p-mx-lg shadow-mx-sm border-none">
          <Typography variant="h3" className="text-xl font-black">Últimas conversas</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold normal-case">Histórico de visitas, ligações e ações registradas pelo consultor.</Typography>

          <div className="mt-mx-lg space-y-mx-sm">
            {[
              { date: '28/05/2026', type: 'Visita PMR', desc: 'Diagnóstico operacional e plano de ação revisado.' },
              { date: '21/05/2026', type: 'Ligação', desc: 'Acompanhamento de meta e ajustes de funil.' },
              { date: '14/05/2026', type: 'WhatsApp', desc: 'Dúvida sobre lançamento da equipe.' },
              { date: '07/05/2026', type: 'Visita PPA', desc: 'Reunião de planejamento estratégico mensal.' },
            ].map((item) => (
              <div key={item.date} className="flex gap-mx-sm rounded-mx-xl border border-border-default p-mx-sm">
                <div className="flex h-mx-11 w-mx-12 shrink-0 flex-col items-center justify-center rounded-mx-lg bg-surface-alt text-text-secondary">
                  <span className="text-mx-tiny font-black uppercase tracking-tight">{item.date.slice(0, 5)}</span>
                  <span className="text-[10px] font-bold">{item.date.slice(6)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <Typography variant="p" className="font-black leading-tight">{item.type}</Typography>
                  <Typography variant="tiny" tone="muted" className="mt-mx-tiny block font-bold normal-case">{item.desc}</Typography>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}
