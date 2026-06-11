import { useState } from 'react'
import { toast } from 'sonner'
import {
  Clock, Flag, GraduationCap, TrendingUp, DollarSign, Target, Briefcase, Mail, Phone, Save, BellRing,
} from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { PageHeader } from '@/components/molecules/PageHeader'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Avatar } from '@/components/atoms/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { useVendedorHomePage } from '@/features/vendedor-home/hooks/useVendedorHomePage'
import { useMeuScore } from '@/features/crm/hooks/useMeuScore'
import { useVendedorPerfil, DIAS_SEMANA, type CarreiraInteresse } from '@/features/crm/hooks/useVendedorPerfil'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

function SectionCard({ icon, title, subtitle, children, action }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-md">
      <div className="flex items-start justify-between gap-mx-sm">
        <div className="flex items-center gap-mx-sm">
          <span className="text-brand-secondary">{icon}</span>
          <div>
            <Typography variant="h3" className="uppercase tracking-tight">{title}</Typography>
            {subtitle && <Typography variant="caption" tone="muted">{subtitle}</Typography>}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-mx-md">{children}</div>
    </Card>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-mx-lg bg-surface-alt p-mx-md text-center">
      <Typography variant="h2" className="text-2xl">{value}</Typography>
      <Typography variant="caption" tone="muted">{label}</Typography>
      {hint && <Typography variant="tiny" tone="muted" className="block">{hint}</Typography>}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-mx-sm">
      <span className="text-text-muted">{icon}</span>
      <Typography variant="caption" tone="muted" className="w-28 shrink-0">{label}</Typography>
      <Typography variant="p" className="font-medium">{value}</Typography>
    </div>
  )
}

export function MeuPerfilVendedor() {
  const { profile } = useAuth()
  const home = useVendedorHomePage()
  const { score: meuScore, bandLabel } = useMeuScore()
  const { perfil, setPerfil, loading, savePerfil } = useVendedorPerfil()
  const [savingSection, setSavingSection] = useState<string | null>(null)

  const metrics = home.metrics
  const remu = home.remuneracaoEstimada
  const treinos = home.treinamentos || []
  const treinosConcluidos = treinos.filter(t => t.watched).length
  const discipline = home.discipline

  async function save(section: string) {
    setSavingSection(section)
    const { error } = await savePerfil({})
    setSavingSection(null)
    if (error) { toast.error(error); return }
    toast.success('Perfil atualizado.')
  }

  function toggleDia(code: string) {
    const has = perfil.dias_trabalho.includes(code)
    setPerfil({ ...perfil, dias_trabalho: has ? perfil.dias_trabalho.filter(d => d !== code) : [...perfil.dias_trabalho, code] })
  }

  function updateHoraSaida(value: string) {
    setPerfil({
      ...perfil,
      hora_saida: value,
      fechar_dia_notificacao_hora: perfil.fechar_dia_notificacao_hora || value,
    })
  }

  return (
    <main className="w-full h-full overflow-y-auto bg-surface-alt p-mx-md md:p-mx-lg no-scrollbar">
      <div className="flex flex-col gap-mx-lg pb-28">
        <PageHeader title="Meu Perfil" description="Suas informações, metas e desenvolvimento." />

        {/* Cabeçalho + Metas */}
        <div className="grid grid-cols-1 gap-mx-lg xl:grid-cols-3">
          <Card className="border-none bg-white p-mx-lg shadow-mx-md xl:col-span-2">
            <div className="flex flex-col gap-mx-lg sm:flex-row sm:items-center">
              <Avatar src={profile?.avatar_url || undefined} alt={profile?.name || 'Vendedor'} fallback={profile?.name || 'V'} size="lg" className="h-24 w-24 rounded-mx-2xl" />
              <div className="flex-1">
                <Typography variant="h2" className="text-2xl">{profile?.name || 'Vendedor'}</Typography>
                <Badge variant="info" className="mt-mx-xs">Vendedor</Badge>
                <div className="mt-mx-md grid grid-cols-1 gap-mx-xs sm:grid-cols-2">
                  {profile?.email && <InfoRow icon={<Mail size={14} />} label="E-mail" value={profile.email} />}
                  {profile?.phone && <InfoRow icon={<Phone size={14} />} label="Telefone" value={profile.phone} />}
                </div>
              </div>
            </div>
          </Card>

          <SectionCard icon={<Target size={18} />} title="Minhas Metas" subtitle="Acompanhe suas principais metas.">
            <div className="grid grid-cols-2 gap-mx-md">
              <Stat label="meta de vendas (mês)" value={String(metrics?.meta || 0)} hint="veículos" />
              <Stat label="remuneração estimada" value={remu?.disponivel ? BRL(remu.total) : '—'} hint="/ mês" />
            </div>
          </SectionCard>
        </div>

        {/* Rotina + Objetivos + Formação */}
        <div className="grid grid-cols-1 gap-mx-lg xl:grid-cols-3">
          <SectionCard
            icon={<Clock size={18} />} title="Minha Rotina" subtitle="Seu horário de trabalho."
            action={<Button size="sm" onClick={() => save('rotina')} disabled={savingSection === 'rotina' || loading}><Save size={14} /> Salvar</Button>}
          >
            <div className="grid grid-cols-2 gap-mx-sm">
              <TimeField label="Entrada" value={perfil.hora_entrada} onChange={v => setPerfil({ ...perfil, hora_entrada: v })} />
              <TimeField label="Saída" value={perfil.hora_saida} onChange={updateHoraSaida} />
              <TimeField label="Almoço (início)" value={perfil.hora_almoco_inicio} onChange={v => setPerfil({ ...perfil, hora_almoco_inicio: v })} />
              <TimeField label="Almoço (fim)" value={perfil.hora_almoco_fim} onChange={v => setPerfil({ ...perfil, hora_almoco_fim: v })} />
            </div>
            <Typography variant="caption" tone="muted" className="mt-mx-md block">Dias trabalhados</Typography>
            <div className="mt-mx-xs flex flex-wrap gap-mx-xs">
              {DIAS_SEMANA.map(d => (
                <button key={d.code} onClick={() => toggleDia(d.code)}
                  className={`rounded-mx-md px-3 py-1.5 text-sm font-semibold transition-colors ${perfil.dias_trabalho.includes(d.code) ? 'bg-brand-secondary text-white' : 'bg-surface-alt text-text-secondary hover:bg-surface'}`}>
                  {d.label}
                </button>
              ))}
            </div>
            <div className="mt-mx-md rounded-mx-lg border border-status-info/20 bg-status-info-surface p-mx-sm">
              <label className="flex items-start gap-mx-sm">
                <input
                  type="checkbox"
                  checked={perfil.fechar_dia_notificacao_ativa}
                  onChange={e => setPerfil({ ...perfil, fechar_dia_notificacao_ativa: e.target.checked })}
                  className="mt-1 h-mx-sm w-mx-sm accent-brand-secondary"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-mx-xs text-sm font-black text-text-primary">
                    <BellRing size={14} /> Receber lembrete para Fechar o dia
                  </span>
                  <Typography variant="caption" tone="muted" className="mt-mx-tiny block">
                    Agenda a notificação in-app no fim do expediente cadastrado.
                  </Typography>
                </span>
              </label>
              <div className="mt-mx-sm">
                <TimeField
                  label="Horário do lembrete"
                  value={perfil.fechar_dia_notificacao_hora || perfil.hora_saida}
                  disabled={!perfil.fechar_dia_notificacao_ativa}
                  onChange={v => setPerfil({ ...perfil, fechar_dia_notificacao_hora: v })}
                />
              </div>
            </div>
            <div className="mt-mx-md rounded-mx-lg bg-status-info-surface p-mx-sm">
              <Typography variant="caption" tone="muted">Esses horários definem sua Rotina do Dia na Central de Execução e o lembrete para “Fechar o dia”.</Typography>
            </div>
          </SectionCard>

          <SectionCard
            icon={<Flag size={18} />} title="Meus Objetivos" subtitle="Onde quero chegar."
            action={<Button size="sm" onClick={() => save('objetivos')} disabled={savingSection === 'objetivos' || loading}><Save size={14} /> Salvar</Button>}
          >
            <div className="space-y-mx-sm">
              <LabeledArea label="Curto prazo (até 1 ano)" value={perfil.objetivo_curto} onChange={v => setPerfil({ ...perfil, objetivo_curto: v })} />
              <LabeledArea label="Médio prazo (até 3 anos)" value={perfil.objetivo_medio} onChange={v => setPerfil({ ...perfil, objetivo_medio: v })} />
              <LabeledArea label="Longo prazo (até 5 anos)" value={perfil.objetivo_longo} onChange={v => setPerfil({ ...perfil, objetivo_longo: v })} />
            </div>
          </SectionCard>

          <SectionCard icon={<GraduationCap size={18} />} title="Minha Formação" subtitle="Treinamentos e certificações.">
            <div className="space-y-mx-sm">
              <div className="flex items-center justify-between"><Typography variant="p">Treinamentos concluídos</Typography><Typography variant="h3">{treinosConcluidos}</Typography></div>
              <div className="flex items-center justify-between"><Typography variant="p">Treinamentos disponíveis</Typography><Typography variant="h3">{treinos.length}</Typography></div>
              <div className="flex items-center justify-between"><Typography variant="p">Progresso</Typography><Typography variant="h3">{treinos.length > 0 ? Math.round(treinosConcluidos / treinos.length * 100) : 0}%</Typography></div>
            </div>
          </SectionCard>
        </div>

        {/* Histórico + Remuneração + Carreira */}
        <div className="grid grid-cols-1 gap-mx-lg xl:grid-cols-3">
          <SectionCard icon={<TrendingUp size={18} />} title="Meu Histórico" subtitle="Acompanhe sua evolução.">
            <div className="grid grid-cols-3 gap-mx-sm">
              <Stat label="vendas (mês)" value={String(metrics?.vendasMes || 0)} />
              <Stat label="score médio" value={meuScore ? String(meuScore.value) : '—'} hint={meuScore ? bandLabel[meuScore.band] : undefined} />
              <Stat label="disciplina" value={discipline ? `${discipline.percentage}%` : '—'} />
            </div>
          </SectionCard>

          <SectionCard icon={<DollarSign size={18} />} title="Minha Remuneração" subtitle="Entenda sua composição.">
            {remu?.disponivel ? (
              <div className="space-y-mx-sm">
                <div className="flex justify-between"><Typography variant="p" tone="muted">Comissão</Typography><Typography variant="p" className="font-semibold">{BRL(remu.comissao)}</Typography></div>
                <div className="flex justify-between"><Typography variant="p" tone="muted">Bônus</Typography><Typography variant="p" className="font-semibold">{BRL(remu.bonus)}</Typography></div>
                <div className="flex justify-between border-t border-border-subtle pt-mx-xs"><Typography variant="p" className="font-semibold">Total estimado</Typography><Typography variant="p" className="font-black text-status-success">{BRL(remu.total)}</Typography></div>
              </div>
            ) : (
              <Typography variant="p" tone="muted">Plano de remuneração não cadastrado. Procure seu gestor.</Typography>
            )}
          </SectionCard>

          <SectionCard
            icon={<Briefcase size={18} />} title="Oportunidades de Carreira" subtitle="Avance na sua jornada."
            action={<Button size="sm" onClick={() => save('carreira')} disabled={savingSection === 'carreira' || loading}><Save size={14} /> Salvar</Button>}
          >
            <Typography variant="caption" tone="muted">Tenho interesse em receber oportunidades?</Typography>
            <div className="mt-mx-xs space-y-mx-xs">
              {([['nao', 'Não tenho interesse'], ['confidencial', 'Sim, apenas confidencialmente'], ['disponivel', 'Sim, disponível para o mercado']] as [CarreiraInteresse, string][]).map(([val, label]) => (
                <label key={val} className="flex items-center gap-mx-sm cursor-pointer">
                  <input type="radio" name="carreira" checked={perfil.carreira_interesse === val} onChange={() => setPerfil({ ...perfil, carreira_interesse: val })} />
                  <Typography variant="p">{label}</Typography>
                </label>
              ))}
            </div>
            <div className="mt-mx-md grid grid-cols-2 gap-mx-sm">
              <Input type="number" placeholder="Pretensão mín." value={perfil.pretensao_min ?? ''} onChange={e => setPerfil({ ...perfil, pretensao_min: e.target.value ? Number(e.target.value) : null })} />
              <Input type="number" placeholder="Pretensão máx." value={perfil.pretensao_max ?? ''} onChange={e => setPerfil({ ...perfil, pretensao_max: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <Input className="mt-mx-sm" placeholder="Cargos de interesse" value={perfil.cargos_interesse ?? ''} onChange={e => setPerfil({ ...perfil, cargos_interesse: e.target.value })} />
            <Input className="mt-mx-sm" placeholder="Cidades de interesse" value={perfil.cidades_interesse ?? ''} onChange={e => setPerfil({ ...perfil, cidades_interesse: e.target.value })} />
          </SectionCard>
        </div>
      </div>
    </main>
  )
}

function TimeField({ label, value, onChange, disabled = false }: { label: string; value: string | null; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div>
      <Typography variant="caption" tone="muted" className="mb-mx-tiny block">{label}</Typography>
      <Input type="time" value={value ? value.slice(0, 5) : ''} onChange={e => onChange(e.target.value)} disabled={disabled} />
    </div>
  )
}

function LabeledArea({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string) => void }) {
  return (
    <div>
      <Typography variant="caption" tone="muted" className="mb-mx-tiny block">{label}</Typography>
      <Textarea value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder="Descreva seu objetivo..." />
    </div>
  )
}

export default MeuPerfilVendedor
