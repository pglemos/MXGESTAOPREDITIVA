import { Award, Medal, Star, Target, TrendingUp, Trophy, Zap } from 'lucide-react'
import clsx from 'clsx'

const ranking = [
  { id: 1, name: 'Joao Silva', points: 1250, sales: 12, appointments: 45, trend: 'up', avatar: 'https://picsum.photos/seed/joao/200/200' },
  { id: 2, name: 'Maria Oliveira', points: 1100, sales: 10, appointments: 38, trend: 'up', avatar: 'https://picsum.photos/seed/maria/200/200' },
  { id: 3, name: 'Pedro Santos', points: 950, sales: 8, appointments: 30, trend: 'down', avatar: 'https://picsum.photos/seed/pedro/200/200' },
  { id: 4, name: 'Ana Costa', points: 820, sales: 7, appointments: 25, trend: 'up', avatar: 'https://picsum.photos/seed/ana/200/200' },
  { id: 5, name: 'Lucas Lima', points: 750, sales: 6, appointments: 22, trend: 'down', avatar: 'https://picsum.photos/seed/lucas/200/200' },
]

const challenges = [
  { id: 1, title: 'Mestre dos Agendamentos', description: 'Faça 15 agendamentos esta semana.', target: 15, current: 12, reward: '500 pts + Insignia', icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 2, title: 'Fechador de Ouro', description: 'Conclua 5 vendas no mes.', target: 5, current: 3, reward: '1000 pts + Medalha', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 3, title: 'Flash Follow-up', description: 'Responda 20 leads em menos de 5 minutos.', target: 20, current: 20, reward: '300 pts', icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50', completed: true },
]

const badges = [
  { id: 1, name: 'Top Seller (Jan)', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50', date: 'Jan 2026' },
  { id: 2, name: 'SLA Master', icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50', date: 'Fev 2026' },
  { id: 3, name: '100 Visitas', icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-50', date: 'Dez 2025' },
]

export default function Gamification() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 text-[#1A1D20]">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-gray-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-10 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.35)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Ritmo e Reconhecimento</span>
          </div>
          <h1 className="text-[38px] font-black tracking-tighter leading-none">Gamificacao da Equipe</h1>
          <p className="mt-3 text-sm font-bold text-gray-500 max-w-2xl">
            Ranking, desafios ativos e insignias no padrao visual do cockpit atual.
          </p>
        </div>

        <div className="soft-pill px-2 py-2 flex items-center gap-2 self-start lg:self-auto">
          {['Esta Semana', 'Este Mes', 'Este Ano'].map((label, index) => (
            <button
              key={label}
              className={clsx(
                'rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all',
                index === 0 ? 'bg-[#1A1D20] text-white shadow-lg' : 'text-gray-400 hover:text-[#1A1D20] hover:bg-white'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Pontos totais', value: '4.870', icon: Trophy, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Desafios ativos', value: String(challenges.length), icon: Target, tone: 'bg-indigo-50 text-indigo-600' },
          { label: 'Insignias', value: String(badges.length), icon: Award, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'Tendencia', value: '+12%', icon: TrendingUp, tone: 'bg-orange-50 text-orange-600' },
        ].map((item) => (
          <div key={item.label} className="inner-card p-5">
            <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center mb-4', item.tone)}>
              <item.icon size={20} />
            </div>
            <p className="text-3xl font-black tracking-tighter">{item.value}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="inner-card overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-[#F8FAFC]/70 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Ranking da Equipe</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">Atualizado ha 5 min</p>
                </div>
              </div>
            </div>
            <ul className="divide-y divide-gray-100">
              {ranking.map((user, index) => (
                <li key={user.id} className={clsx('p-5 transition-colors hover:bg-[#F8FAFC]/70', index === 0 && 'bg-amber-50/40')}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 text-center font-black text-gray-400 shrink-0">
                        {index === 0 ? <Medal className="h-6 w-6 text-amber-600 mx-auto" /> : index === 1 ? <Medal className="h-6 w-6 text-slate-400 mx-auto" /> : index === 2 ? <Medal className="h-6 w-6 text-orange-700 mx-auto" /> : `#${index + 1}`}
                      </div>
                      <img src={user.avatar} alt={user.name} className="h-12 w-12 rounded-2xl border border-gray-100 object-cover" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <p className="text-sm font-black truncate">{user.name}</p>
                        <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500 mt-1">
                          <span>{user.sales} vendas</span>
                          <span>{user.appointments} agendamentos</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-xl font-black text-indigo-600 font-mono-numbers">{user.points}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">pontos</p>
                      </div>
                      <TrendingUp className={clsx('h-4 w-4', user.trend === 'up' ? 'text-emerald-500' : 'text-rose-500 rotate-180')} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="inner-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Target size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Desafios Ativos</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">Metas individuais em execucao</p>
              </div>
            </div>
            <div className="space-y-4">
              {challenges.map((challenge) => (
                <div key={challenge.id} className={clsx('rounded-[2rem] border p-5', challenge.completed ? 'border-emerald-100 bg-emerald-50/40' : 'border-gray-100 bg-[#F8FAFC]/60')}>
                  <div className="flex items-start gap-4">
                    <div className={clsx('p-3 rounded-2xl flex-shrink-0', challenge.bg)}>
                      <challenge.icon className={clsx('h-6 w-6', challenge.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-3 mb-2">
                        <h4 className="text-sm font-black">{challenge.title}</h4>
                        <span className={clsx('text-[10px] font-black uppercase tracking-[0.2em]', challenge.completed ? 'text-emerald-600' : 'text-indigo-600')}>
                          {challenge.completed ? 'Concluido' : challenge.reward}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-500 mb-4">{challenge.description}</p>
                      {!challenge.completed && (
                        <>
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                            <span className="text-gray-400">Progresso</span>
                            <span className="text-indigo-600 font-mono-numbers">{challenge.current} / {challenge.target}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(challenge.current / challenge.target) * 100}%` }} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="inner-card p-6 text-center">
            <div className="relative inline-block">
              <img src="https://picsum.photos/seed/joao/200/200" alt="Joao Silva" className="h-24 w-24 rounded-[2rem] border-4 border-white shadow-md mx-auto object-cover" referrerPolicy="no-referrer" />
              <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center">
                <Star className="h-4 w-4 text-white" />
              </div>
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight">Joao Silva</h2>
            <p className="text-sm font-bold text-gray-500">Nivel 12 • Vendedor Elite</p>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
              <div>
                <p className="text-3xl font-black text-indigo-600 font-mono-numbers">1.250</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">Pontos totais</p>
              </div>
              <div>
                <p className="text-3xl font-black text-indigo-600">#1</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">Posicao atual</p>
              </div>
            </div>
          </div>

          <div className="inner-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Award size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Insignias</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">Colecao do consultor</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {badges.map((badge) => (
                <div key={badge.id} className="rounded-[2rem] border border-gray-100 bg-[#F8FAFC]/60 p-4 text-center group cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all">
                  <div className={clsx('h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3', badge.bg)}>
                    <badge.icon className={clsx('h-7 w-7', badge.color)} />
                  </div>
                  <p className="text-xs font-black text-[#1A1D20]">{badge.name}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">{badge.date}</p>
                </div>
              ))}
              <div className="rounded-[2rem] border-2 border-dashed border-gray-200 bg-white p-4 text-center opacity-60">
                <div className="h-14 w-14 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center mx-auto mb-3 bg-gray-50">
                  <Star className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-xs font-black text-gray-500">Bloqueado</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mt-1">Proxima meta</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
