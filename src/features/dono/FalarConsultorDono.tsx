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
    <div className="flex flex-col gap-8 p-8 pb-28">
      <header className="flex flex-col gap-6 border-b border-gray-100 pb-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Typography variant="h1" className="text-3xl md:text-4xl">Falar com Consultor</Typography>
          <Typography variant="p" tone="muted" className="mt-2">Acompanhamento consultivo, agendamento de visitas e suporte estratégico.</Typography>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card className="rounded-2xl bg-white p-8 shadow-sm border-none">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full text-white shadow-sm" style={{ background: 'linear-gradient(135deg, var(--color-accent-purple) 0%, var(--color-accent-purple-strong) 100%)' }}>
              <span className="text-2xl font-black tracking-tight">DS</span>
            </div>
            <div className="min-w-0">
              <Typography variant="h3" className="text-xl font-black truncate">{consultorInfo.name}</Typography>
              <Typography variant="p" tone="muted" className="font-bold text-sm">{consultorInfo.role}</Typography>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500">
                <MapPin size={12} aria-hidden="true" />
                <span>{consultorInfo.city}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <a
              href={consultorInfo.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 w-full items-center justify-center gap-4 rounded-2xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-600/90 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30"
            >
              <MessageCircle size={18} /> Abrir WhatsApp
            </a>
            <a
              href={`tel:${consultorInfo.phone.replace(/\D/g, '')}`}
              className="flex h-12 w-full items-center justify-center gap-4 rounded-2xl border border-gray-100 bg-white text-sm font-black text-gray-800 hover:bg-gray-50 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20"
            >
              <Phone size={18} /> Ligar
            </a>
            <button
              type="button"
              className="flex h-12 w-full items-center justify-center gap-4 rounded-2xl bg-blue-600 text-white text-sm font-black hover:bg-blue-600/90 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
            >
              <CalendarPlus size={18} /> Agendar Reunião
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={14} className="text-gray-500" />
              <span className="font-bold">{consultorInfo.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageCircle size={14} className="text-gray-500" />
              <span className="font-bold">{consultorInfo.email}</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl bg-white p-8 shadow-sm border-none">
          <Typography variant="h3" className="text-xl font-black">Últimas conversas</Typography>
          <Typography variant="tiny" tone="muted" className="mt-2 block font-bold normal-case">Histórico de visitas, ligações e ações registradas pelo consultor.</Typography>

          <div className="mt-8 space-y-4">
            {[
              { date: '28/05/2026', type: 'Visita PMR', desc: 'Diagnóstico operacional e plano de ação revisado.' },
              { date: '21/05/2026', type: 'Ligação', desc: 'Acompanhamento de meta e ajustes de funil.' },
              { date: '14/05/2026', type: 'WhatsApp', desc: 'Dúvida sobre lançamento da equipe.' },
              { date: '07/05/2026', type: 'Visita PPA', desc: 'Reunião de planejamento estratégico mensal.' },
            ].map((item) => (
              <div key={item.date} className="flex gap-4 rounded-2xl border border-gray-100 p-4">
                <div className="flex h-11 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-gray-50 text-gray-600">
                  <span className="text-[10px] font-black uppercase tracking-tight">{item.date.slice(0, 5)}</span>
                  <span className="text-[10px] font-bold">{item.date.slice(6)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <Typography variant="p" className="font-black leading-tight">{item.type}</Typography>
                  <Typography variant="tiny" tone="muted" className="mt-1 block font-bold normal-case">{item.desc}</Typography>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}
