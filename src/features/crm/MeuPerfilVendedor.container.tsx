import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Award,
  BellRing,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Flag,
  GraduationCap,
  History,
  Link2,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  PieChart,
  Save,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRound,
} from 'lucide-react'
import { Avatar } from '@/components/atoms/Avatar'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Textarea } from '@/components/atoms/Textarea'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { PageHeading } from '@/components/molecules/PageHeading'
import {
  DIAS_SEMANA,
  MATURIDADE_VENDEDOR_LABEL,
  VENDEDOR_EXPERIENCIA_DECLARADA,
  VENDEDOR_EXPERIENCIA_LABEL,
  derivarNivelMaturidadeVendedor,
  useVendedorPerfil,
  type CarreiraInteresse,
  type VendedorExperienciaDeclarada,
} from '@/features/crm/hooks/useVendedorPerfil'
import { useMeuScore } from '@/features/crm/hooks/useMeuScore'
import { useVendedorHomePage } from '@/features/vendedor-home/hooks/useVendedorHomePage'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

type MixCanalField = 'mix_canal_internet_pct' | 'mix_canal_carteira_pct' | 'mix_canal_porta_pct'
type MetricTone = 'default' | 'success' | 'warning' | 'danger' | 'info'

const BRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const PRODUCT_CATEGORIES = ['Hatch', 'Sedan', 'SUV', 'Pickup', 'Seminovo', 'Premium']
const PRODUCT_TYPES = ['Carro', 'Moto', 'Caminhão', 'Pesado', 'Outro']

export function MeuPerfilVendedor() {
  const navigate = useNavigate()
  const { profile, membership } = useAuth()
  const home = useVendedorHomePage()
  const { score: meuScore, bandLabel } = useMeuScore()
  const { perfil, setPerfil, vinculoTipo, loading, savePerfil } = useVendedorPerfil()
  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [usarMixAutomatico, setUsarMixAutomatico] = useState(false)

  const metrics = home.metrics
  const remu = home.remuneracaoEstimada
  const treinamentos = home.treinamentos || []
  const discipline = home.discipline

  const nivelMaturidade = derivarNivelMaturidadeVendedor(perfil)
  const vinculadoLoja = vinculoTipo !== 'autonomo'
  const vinculoLabel = vinculadoLoja ? 'Vendedor de loja' : 'Vendedor autônomo'
  const storeName = vinculadoLoja ? membership?.store?.name || 'Empresa não informada' : 'Atuação autônoma'
  const managerName = vinculadoLoja ? membership?.store?.manager_email || 'Não informado' : 'Autogestão'
  const profileName = profile?.name || 'Vendedor'
  const todayLabel = `${new Date().toLocaleDateString('pt-BR')} (${new Date().toLocaleDateString('pt-BR', { weekday: 'long' })})`

  const canais = useMemo(
    () => [
      { label: 'Internet', value: perfil.mix_canal_internet_pct || 0, field: 'mix_canal_internet_pct' as const },
      { label: 'Carteira', value: perfil.mix_canal_carteira_pct || 0, field: 'mix_canal_carteira_pct' as const },
      { label: 'Porta / Showroom', value: perfil.mix_canal_porta_pct || 0, field: 'mix_canal_porta_pct' as const },
    ],
    [perfil.mix_canal_carteira_pct, perfil.mix_canal_internet_pct, perfil.mix_canal_porta_pct],
  )

  const mixCanaisTotal = canais.reduce((total, canal) => total + canal.value, 0)
  const hasMixManual = canais.some(canal => canal.value > 0)
  const canalPredominante = usarMixAutomatico
    ? 'Automático dos últimos 90 dias'
    : hasMixManual
      ? [...canais].sort((a, b) => b.value - a.value)[0]?.label || 'Não informado'
      : 'Não informado'
  const mixManualInvalido = !usarMixAutomatico && hasMixManual && mixCanaisTotal !== 100

  const treinamentosConcluidos = treinamentos.filter(treinamento => treinamento.watched).length
  const treinamentosDisponiveis = Math.max(treinamentos.length - treinamentosConcluidos, 0)
  const progressoTreinamento = treinamentos.length
    ? Math.round((treinamentosConcluidos / treinamentos.length) * 100)
    : 0

  async function save(section: string) {
    setSavingSection(section)
    const { error } = await savePerfil({})
    setSavingSection(null)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('Perfil atualizado.')
  }

  async function saveMixCanais() {
    if (mixManualInvalido) {
      toast.error('A soma dos canais precisa fechar 100% no preenchimento manual.')
      return
    }

    await save('mix-canais')
  }

  function updateMixCanal(field: MixCanalField, value: string) {
    const numberValue = Number(value)
    setPerfil({
      ...perfil,
      [field]: value === '' || !Number.isFinite(numberValue) ? null : Math.min(100, Math.max(0, numberValue)),
    })
  }

  function updateHoraSaida(value: string) {
    setPerfil({
      ...perfil,
      hora_saida: value,
      fechar_dia_notificacao_hora: perfil.fechar_dia_notificacao_hora || value,
    })
  }

  function toggleDia(code: string) {
    const hasDay = perfil.dias_trabalho.includes(code)
    setPerfil({
      ...perfil,
      dias_trabalho: hasDay ? perfil.dias_trabalho.filter(day => day !== code) : [...perfil.dias_trabalho, code],
    })
  }

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function printProfessionalProfile() {
    toast.success('Perfil profissional pronto para impressão.')
    window.print()
  }

  return (
    <main className="h-full w-full overflow-y-auto bg-surface-alt p-mx-md no-scrollbar md:p-mx-lg">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-mx-lg pb-28">
        <PageHeading
          title="Meu Perfil"
          subtitle="Suas informações, rotina, metas e evolução profissional."
          actions={
            <div className="flex flex-wrap items-center gap-mx-xs">
              <span className="inline-flex items-center gap-mx-xs rounded-mx-md border border-border-subtle bg-white px-mx-md py-mx-sm text-sm font-bold text-text-primary shadow-mx-sm">
                <CalendarDays size={16} />
                {todayLabel}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => scrollToSection('perfil-historico')}
              >
                <History size={15} />
                Histórico de alterações
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-mx-lg xl:grid-cols-12">
          <Card className="rounded-mx-2xl border border-border-subtle bg-white p-mx-lg shadow-mx-md xl:col-span-8">
            <SectionHeading
              number={1}
              icon={<UserRound size={18} />}
              title="Identidade profissional"
              action={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection('perfil-rotina')}
                >
                  <Save size={14} />
                  Editar dados
                </Button>
              }
            />

            <div className="mt-mx-lg grid gap-mx-lg lg:grid-cols-[128px_1fr]">
              <div className="relative h-32 w-32">
                <Avatar
                  src={profile?.avatar_url || undefined}
                  alt={profileName}
                  fallback={profileName}
                  size="lg"
                  className="h-32 w-32 rounded-full border border-brand-primary/10 bg-brand-primary/10 text-4xl font-black text-brand-primary"
                />
                <button
                  type="button"
                  aria-label="Alterar foto"
                  className="absolute bottom-1 right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-white text-brand-primary shadow-mx-sm"
                  onClick={() => toast.info('Foto do perfil pode ser atualizada em Editar dados.')}
                >
                  <Camera size={16} />
                </button>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-mx-md">
                  <div className="min-w-0">
                    <Typography variant="h2" className="break-words text-2xl">
                      {profileName}
                    </Typography>
                    <div className="mt-mx-xs flex flex-wrap gap-mx-xs">
                      <Badge variant="success">Vendedor</Badge>
                      <Badge variant={vinculadoLoja ? 'outline' : 'info'}>{vinculoLabel}</Badge>
                      <Badge variant={vinculadoLoja ? 'success' : 'secondary'}>
                        {vinculadoLoja ? 'Perfil vinculado à loja' : 'Perfil autônomo'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-mx-lg grid grid-cols-1 gap-mx-sm md:grid-cols-2">
                  <InfoRow icon={<Mail size={15} />} label="E-mail" value={profile?.email || 'Não informado'} />
                  <InfoRow icon={<Phone size={15} />} label="Telefone" value={profile?.phone || 'Não informado'} />
                  <InfoRow icon={<MapPin size={15} />} label="Cidade" value="Não informada" />
                  <InfoRow icon={<Building2 size={15} />} label="Empresa vinculada" value={storeName} />
                  <InfoRow icon={<CalendarDays size={15} />} label="Data de admissão" value={formatDate(profile?.created_at)} />
                  <InfoRow icon={<UserRound size={15} />} label="Gestor" value={managerName} />
                </div>
              </div>
            </div>
          </Card>

          <SectionCard
            number={2}
            icon={<Target size={18} />}
            title="Resumo comercial"
            subtitle="Dados que alimentam seu desempenho."
            className="xl:col-span-4"
          >
            <div className="grid grid-cols-1 gap-mx-sm sm:grid-cols-2">
              <MetricBox label="Meta do mês" value={String(metrics?.meta || 0)} hint="veículos" />
              <MetricBox label="Vendas realizadas" value={String(metrics?.vendasMes || 0)} hint="veículos" />
              <MetricBox
                label="Remuneração estimada"
                value={remu?.disponivel ? BRL(remu.total) : 'Não disponível'}
                tone="success"
              />
              <MetricBox
                label="Score atual"
                value={meuScore ? String(meuScore.value) : 'Não informado'}
                hint={meuScore ? `${bandLabel[meuScore.band]} pontos` : undefined}
              />
              <div className="sm:col-span-2">
                <MetricBox label="Trilha sugerida" value={MATURIDADE_VENDEDOR_LABEL[nivelMaturidade]} tone="success" />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 gap-mx-lg xl:grid-cols-2">
          <SectionCard
            id="perfil-rotina"
            number={3}
            icon={<Clock size={18} />}
            title="Minha rotina"
            action={
              <Button type="button" size="sm" onClick={() => save('rotina')} disabled={savingSection === 'rotina' || loading}>
                <Save size={14} />
                Salvar
              </Button>
            }
          >
            <div className="grid grid-cols-2 gap-mx-sm">
              <TimeField label="Entrada" value={perfil.hora_entrada} onChange={value => setPerfil({ ...perfil, hora_entrada: value })} />
              <TimeField label="Almoço início" value={perfil.hora_almoco_inicio} onChange={value => setPerfil({ ...perfil, hora_almoco_inicio: value })} />
              <TimeField label="Almoço fim" value={perfil.hora_almoco_fim} onChange={value => setPerfil({ ...perfil, hora_almoco_fim: value })} />
              <TimeField label="Saída" value={perfil.hora_saida} onChange={updateHoraSaida} />
            </div>

            <Typography variant="caption" tone="muted" className="mt-mx-md block">
              Dias trabalhados
            </Typography>
            <div className="mt-mx-xs flex flex-wrap gap-mx-xs">
              {DIAS_SEMANA.map(day => (
                <button
                  type="button"
                  key={day.code}
                  onClick={() => toggleDia(day.code)}
                  className={cn(
                    'rounded-mx-md border px-3 py-1.5 text-sm font-semibold transition-colors',
                    perfil.dias_trabalho.includes(day.code)
                      ? 'border-brand-primary bg-brand-primary text-white'
                      : 'border-border-subtle bg-surface-alt text-text-secondary hover:bg-surface',
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>

            <div className="mt-mx-md rounded-mx-lg border border-status-info/20 bg-status-info-surface p-mx-sm">
              <label className="flex items-start gap-mx-sm">
                <input
                  type="checkbox"
                  checked={perfil.fechar_dia_notificacao_ativa}
                  onChange={event => setPerfil({ ...perfil, fechar_dia_notificacao_ativa: event.target.checked })}
                  className="mt-1 h-mx-sm w-mx-sm accent-brand-secondary"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-mx-xs text-sm font-bold text-text-primary">
                    <BellRing size={14} />
                    Receber lembrete para Fechar o dia
                  </span>
                  <Typography variant="caption" tone="muted" className="mt-mx-tiny block">
                    Define notificações e o fechamento diário no fim do expediente.
                  </Typography>
                </span>
              </label>
              <div className="mt-mx-sm">
                <TimeField
                  label="Horário do lembrete"
                  value={perfil.fechar_dia_notificacao_hora || perfil.hora_saida}
                  disabled={!perfil.fechar_dia_notificacao_ativa}
                  onChange={value => setPerfil({ ...perfil, fechar_dia_notificacao_hora: value })}
                />
              </div>
            </div>

            <Notice tone="info">
              Esses horários alimentam Central de Execução, notificações e o Fechamento Diário.
            </Notice>
          </SectionCard>

          <SectionCard
            number={4}
            icon={<Flag size={18} />}
            title="Meus objetivos"
            action={
              <div className="flex flex-wrap gap-mx-xs">
                <Button type="button" size="sm" onClick={() => save('objetivos')} disabled={savingSection === 'objetivos' || loading}>
                  <Save size={14} />
                  Salvar
                </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => navigate('/pdi')}>
                Ver no PDI
              </Button>
              </div>
            }
          >
            <div className="space-y-mx-sm">
              <LabeledArea label="Curto prazo (até 1 ano)" value={perfil.objetivo_curto} onChange={value => setPerfil({ ...perfil, objetivo_curto: value })} />
              <LabeledArea label="Médio prazo (até 3 anos)" value={perfil.objetivo_medio} onChange={value => setPerfil({ ...perfil, objetivo_medio: value })} />
              <LabeledArea label="Longo prazo (até 5 anos)" value={perfil.objetivo_longo} onChange={value => setPerfil({ ...perfil, objetivo_longo: value })} />
            </div>
            <div className="mt-mx-md flex items-center gap-mx-xs text-sm font-bold text-status-success">
              <CheckCircle2 size={16} />
              Sincronizado com PDI
            </div>
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 gap-mx-lg xl:grid-cols-2">
          <SectionCard
            number={5}
            icon={<PieChart size={18} />}
            title="Mix de canais"
            action={
              <Button type="button" size="sm" onClick={saveMixCanais} disabled={savingSection === 'mix-canais' || loading}>
                <Save size={14} />
                Salvar
              </Button>
            }
          >
            <div className="space-y-mx-sm">
              {canais.map(canal => (
                <div key={canal.field} className="grid gap-mx-sm sm:grid-cols-[minmax(0,1fr)_112px] sm:items-end">
                  <MixBar label={canal.label} value={usarMixAutomatico ? null : canal.value} />
                  <PercentageField
                    label={`${canal.label} %`}
                    value={perfil[canal.field]}
                    disabled={usarMixAutomatico}
                    onChange={value => updateMixCanal(canal.field, value)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-mx-md grid grid-cols-1 gap-mx-sm sm:grid-cols-2">
              <MetricBox
                label="Total informado"
                value={usarMixAutomatico ? 'Auto' : `${mixCanaisTotal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
                tone={mixManualInvalido ? 'danger' : mixCanaisTotal === 100 ? 'success' : 'default'}
              />
              <MetricBox label="Canal predominante" value={canalPredominante} tone="info" />
            </div>

            <label className="mt-mx-md flex items-start gap-mx-sm rounded-mx-lg border border-border-subtle bg-surface-alt p-mx-sm">
              <input
                type="checkbox"
                checked={usarMixAutomatico}
                onChange={event => setUsarMixAutomatico(event.target.checked)}
                className="mt-1 h-mx-sm w-mx-sm accent-brand-secondary"
              />
              <span>
                <Typography variant="caption" className="font-bold">
                  Usar cálculo automático dos últimos 90 dias
                </Typography>
                <Typography variant="caption" tone="muted" className="mt-mx-tiny block">
                  {usarMixAutomatico
                    ? 'Edição manual bloqueada enquanto o cálculo automático estiver ativo.'
                    : 'O Mix de Canais alimenta o Funil de Vendas.'}
                </Typography>
              </span>
            </label>

            {mixManualInvalido && (
              <Notice tone="warning">A soma dos canais precisa fechar 100% quando o preenchimento for manual.</Notice>
            )}
          </SectionCard>

          <SectionCard number={6} icon={<Package size={18} />} title="Produtos e categorias">
            <div className="space-y-mx-md">
              <div>
                <Typography variant="caption" tone="muted" className="mb-mx-xs block">
                  Tipo principal de venda
                </Typography>
                <div className="flex flex-wrap gap-mx-xs">
                  {PRODUCT_TYPES.map(type => (
                    <Badge key={type} variant={type === 'Carro' ? 'info' : 'outline'}>
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Typography variant="caption" tone="muted" className="mb-mx-xs block">
                  Categorias de atuação
                </Typography>
                <div className="flex flex-wrap gap-mx-xs">
                  {PRODUCT_CATEGORIES.map(category => (
                    <Badge key={category} variant="outline">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Notice tone="info">Essas informações influenciam comissão, funil e histórico profissional.</Notice>
          </SectionCard>
        </div>

        <SectionCard number={7} icon={<DollarSign size={18} />} title="Minha remuneração">
          <div className="grid grid-cols-1 gap-mx-lg xl:grid-cols-[1.4fr_1fr]">
            <div>
              <Typography variant="caption" tone="muted" className="block">
                Modelo de comissionamento
              </Typography>
              <div className="mt-mx-xs flex flex-wrap items-center gap-mx-xs">
                <Badge variant={vinculadoLoja ? 'success' : 'info'}>
                  {vinculadoLoja ? 'Plano herdado da loja' : 'Modelo autônomo'}
                </Badge>
                {vinculadoLoja && <Badge variant="outline">Edição por gestor/RH/dono</Badge>}
              </div>

              <div className="mt-mx-md grid grid-cols-1 gap-mx-sm md:grid-cols-4">
                <MetricBox label="Comissão por venda" value={BRL(remu?.comissaoPorVenda || 0)} />
                <MetricBox label="Bonus por meta" value={BRL(remu?.bonus || 0)} />
                <MetricBox label="Comissão por categoria" value={BRL(remu?.comissaoCategoria || 0)} />
                <MetricBox label="Total estimado" value={remu?.disponivel ? BRL(remu.total) : 'Não cadastrado'} tone="success" />
              </div>
            </div>

            <div className="rounded-mx-lg border border-border-subtle bg-surface-alt p-mx-md">
              <ValueLine label="Comissão estimada" value={BRL(remu?.comissao || 0)} />
              <ValueLine label="Bonus estimado" value={BRL(remu?.bonus || 0)} />
              <ValueLine label="Total estimado" value={remu?.disponivel ? BRL(remu.total) : 'Não disponível'} strong />

              <div className="mt-mx-md flex flex-wrap gap-mx-xs">
                <Button type="button" variant="outline" size="sm" onClick={() => toast.info('Regras de comissão carregadas pelo plano ativo.')}>
                  Ver regras de comissão
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={vinculadoLoja}
                  onClick={() => toast.info('Configuração disponível para vendedor autônomo.')}
                >
                  Configurar modelo
                </Button>
              </div>

              {vinculadoLoja && (
                <Notice tone="info">
                  Como seu perfil está vinculado à loja, regras de comissão são definidas pelo gestor/RH.
                </Notice>
              )}
            </div>
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 gap-mx-lg xl:grid-cols-2">
          <SectionCard number={8} icon={<GraduationCap size={18} />} title="Minha formação">
            <div className="grid grid-cols-2 gap-mx-sm md:grid-cols-5">
              <MetricBox label="Treinamentos concluídos" value={String(treinamentosConcluidos)} />
              <MetricBox label="Treinamentos disponiveis" value={String(treinamentosDisponiveis)} />
              <MetricBox label="Progresso" value={`${progressoTreinamento}%`} />
              <MetricBox label="Certificados" value="0" />
              <MetricBox label="Cursos externos" value="0" />
            </div>
            <div className="mt-mx-md flex flex-wrap items-center gap-mx-xs">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate('/treinamentos')}>
                <BookOpen size={14} />
                Ver treinamentos
              </Button>
              <Typography variant="caption" tone="muted">
                Formação alimenta Treinamentos, PDI, Currículo profissional e Mercado de Trabalho quando habilitado.
              </Typography>
            </div>
          </SectionCard>

          <SectionCard
            number={9}
            icon={<Award size={18} />}
            title="Maturidade comercial"
            action={
              <Button type="button" size="sm" onClick={() => save('maturidade')} disabled={savingSection === 'maturidade' || loading}>
                <Save size={14} />
                Atualizar maturidade
              </Button>
            }
          >
            <div className="grid grid-cols-1 gap-mx-sm md:grid-cols-2">
              <div>
                <Typography variant="caption" tone="muted" className="mb-mx-tiny block">
                  Tempo de mercado (anos)
                </Typography>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={perfil.tempo_mercado_anos ?? ''}
                  onChange={event => setPerfil({ ...perfil, tempo_mercado_anos: numberOrNull(event.target.value) })}
                  placeholder="Ex: 5"
                />
              </div>
              <Select
                label="Experiência declarada"
                value={perfil.experiencia_declarada || ''}
                onChange={event => setPerfil({ ...perfil, experiencia_declarada: (event.target.value || null) as VendedorExperienciaDeclarada | null })}
              >
                <option value="">Selecione</option>
                {VENDEDOR_EXPERIENCIA_DECLARADA.map(experience => (
                  <option key={experience} value={experience}>
                    {VENDEDOR_EXPERIENCIA_LABEL[experience]}
                  </option>
                ))}
              </Select>
              <div>
                <Typography variant="caption" tone="muted" className="mb-mx-tiny block">
                  Cargo atual
                </Typography>
                <Input value={perfil.cargo_atual || ''} onChange={event => setPerfil({ ...perfil, cargo_atual: event.target.value })} placeholder="Ex: Vendedor" />
              </div>
              <div className="rounded-mx-lg border border-brand-primary/15 bg-brand-primary/5 p-mx-sm">
                <Typography variant="caption" tone="muted" className="block">
                  Nível sugerido para trilha
                </Typography>
                <Typography variant="h3" className="text-brand-primary">
                  {MATURIDADE_VENDEDOR_LABEL[nivelMaturidade]}
                </Typography>
                <Typography variant="caption" tone="muted" className="mt-mx-tiny block">
                  Base da trilha N1-N4.
                </Typography>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 gap-mx-lg xl:grid-cols-2">
          <SectionCard id="perfil-historico" number={10} icon={<TrendingUp size={18} />} title="Meu histórico">
            <div className="grid grid-cols-2 gap-mx-sm md:grid-cols-6">
              <MetricBox label="Vendas no mês" value={String(metrics?.vendasMes || 0)} />
              <MetricBox label="Score médio" value={meuScore ? String(meuScore.value) : 'Não informado'} />
              <MetricBox label="Disciplina" value={discipline ? `${discipline.percentage}%` : 'Não informado'} />
              <MetricBox label="Treinamentos concluídos" value={String(treinamentosConcluidos)} />
              <MetricBox label="Média mensal" value={String(metrics?.vendasMes || 0)} />
              <MetricBox label="Melhor mês" value={String(metrics?.vendasMes || 0)} />
            </div>
            <div className="mt-mx-md flex items-center justify-between gap-mx-md">
              <Typography variant="caption" tone="muted">
                Histórico preservado por CPF/e-mail para portabilidade futura.
              </Typography>
              <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/relatorios-vendedor')}>
                Ver histórico completo
              </Button>
            </div>
          </SectionCard>

          <SectionCard id="perfil-curriculo" number={11} icon={<FileText size={18} />} title="Currículo profissional">
            <div className="grid grid-cols-1 gap-mx-sm sm:grid-cols-5">
              <MetricBox label="Tempo de mercado" value={formatYears(perfil.tempo_mercado_anos)} />
              <MetricBox label="Especialidades" value="Não informado" />
              <MetricBox label="Melhor canal" value={canalPredominante} />
              <MetricBox label="Categorias dominadas" value="SUV, Seminovo" />
              <MetricBox label="Score histórico" value={meuScore ? String(meuScore.value) : 'Não informado'} />
            </div>
            <div className="mt-mx-md flex items-center justify-between gap-mx-md">
              <Typography variant="caption" tone="muted">
                Currículo profissional será usado futuramente no Mercado de Trabalho, se permitido.
              </Typography>
              <Button type="button" variant="outline" size="sm" onClick={printProfessionalProfile}>
                Gerar perfil profissional
              </Button>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          number={12}
          icon={<Briefcase size={18} />}
          title="Oportunidades de carreira"
          action={
            <Button
              type="button"
              size="sm"
              disabled={vinculadoLoja || savingSection === 'carreira' || loading}
              onClick={() => save('carreira')}
            >
              <Save size={14} />
              Salvar
            </Button>
          }
        >
          <div className="grid grid-cols-1 gap-mx-lg xl:grid-cols-[1fr_1.2fr]">
            <div className="grid gap-mx-sm md:grid-cols-3">
              <RadioOption
                label="Não tenho interesse"
                checked={perfil.carreira_interesse === 'nao'}
                disabled={vinculadoLoja}
                onChange={() => setPerfil({ ...perfil, carreira_interesse: 'nao' })}
              />
              <RadioOption
                label="Sim, apenas confidencialmente"
                checked={perfil.carreira_interesse === 'confidencial'}
                disabled={vinculadoLoja}
                onChange={() => setPerfil({ ...perfil, carreira_interesse: 'confidencial' })}
              />
              <RadioOption
                label="Sim, estou disponível para o mercado"
                checked={perfil.carreira_interesse === 'disponivel'}
                disabled={vinculadoLoja}
                onChange={() => setPerfil({ ...perfil, carreira_interesse: 'disponivel' })}
              />
            </div>

            <div className="grid grid-cols-1 gap-mx-sm md:grid-cols-3">
              <div>
                <Typography variant="caption" tone="muted" className="mb-mx-tiny block">
                  Pretensão salarial
                </Typography>
                <Input
                  readOnly
                  disabled={vinculadoLoja}
                  value={formatSalaryRange(perfil.pretensao_min, perfil.pretensao_max)}
                  className="opacity-60 cursor-not-allowed"
                  placeholder="R$ 4.000 - R$ 6.000"
                />
              </div>
              <div>
                <Typography variant="caption" tone="muted" className="mb-mx-tiny block">
                  Cargos de interesse
                </Typography>
                <Input
                  disabled={vinculadoLoja}
                  value={perfil.cargos_interesse || ''}
                  onChange={event => setPerfil({ ...perfil, cargos_interesse: event.target.value })}
                  placeholder="Consultor Sênior, Supervisor de Vendas"
                />
              </div>
              <div>
                <Typography variant="caption" tone="muted" className="mb-mx-tiny block">
                  Cidades de interesse
                </Typography>
                <Input
                  disabled={vinculadoLoja}
                  value={perfil.cidades_interesse || ''}
                  onChange={event => setPerfil({ ...perfil, cidades_interesse: event.target.value })}
                  placeholder="Belo Horizonte - MG"
                />
              </div>
            </div>
          </div>

          {vinculadoLoja ? (
            <Notice tone="info" icon={<Lock size={16} />}>
              Seu perfil está vinculado a uma loja. O Mercado de Trabalho não está habilitado para vendedores vinculados a empresas com pacote ativo.
            </Notice>
          ) : (
            <Notice tone="success" icon={<CheckCircle2 size={16} />}>
              Mercado de Trabalho habilitado para perfil autônomo, com modo confidencial e edição de interesses.
            </Notice>
          )}
        </SectionCard>

        <footer className="flex items-center justify-center gap-mx-xs rounded-mx-lg border border-border-subtle bg-white px-mx-md py-mx-sm text-sm font-semibold text-text-secondary shadow-mx-sm">
          <ShieldCheck size={16} aria-hidden="true" />
          Seus dados são protegidos e utilizados apenas dentro da plataforma MX Performance.
        </footer>
      </div>
    </main>
  )
}

function SectionCard({
  id,
  number,
  icon,
  title,
  subtitle,
  action,
  className,
  children,
}: {
  id?: string
  number: number
  icon: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <Card id={id} className={cn('rounded-mx-2xl border border-border-subtle bg-white p-mx-lg shadow-mx-md', className)}>
      <SectionHeading number={number} icon={icon} title={title} subtitle={subtitle} action={action} />
      <div className="mt-mx-md">{children}</div>
    </Card>
  )
}

function SectionHeading({
  number,
  icon,
  title,
  subtitle,
  action,
}: {
  number: number
  icon: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-mx-sm">
      <div className="flex min-w-0 items-start gap-mx-sm">
        <span className="mt-0.5 text-brand-primary">{icon}</span>
        <div className="min-w-0">
          <Typography variant="h3" className="text-base">
            {number}. {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" tone="muted" className="mt-mx-tiny block">
              {subtitle}
            </Typography>
          )}
        </div>
      </div>
      {action}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-mx-sm">
      <span className="text-text-muted">{icon}</span>
      <Typography variant="caption" tone="muted" className="w-32 shrink-0">
        {label}
      </Typography>
      <Typography variant="p" className="min-w-0 truncate font-semibold">
        {value}
      </Typography>
    </div>
  )
}

function MetricBox({ label, value, hint, tone = 'default' }: { label: string; value: string; hint?: string; tone?: MetricTone }) {
  return (
    <div
      className={cn(
        'min-h-20 rounded-mx-lg border border-border-subtle bg-surface-alt p-mx-sm',
        tone === 'success' && 'border-status-success/20 bg-status-success/5',
        tone === 'warning' && 'border-status-warning/20 bg-status-warning/5',
        tone === 'danger' && 'border-status-error/20 bg-status-error/5',
        tone === 'info' && 'border-status-info/20 bg-status-info-surface',
      )}
    >
      <Typography variant="caption" tone="muted" className="block">
        {label}
      </Typography>
      <Typography
        variant="h3"
        className={cn(
          'mt-mx-tiny break-words',
          tone === 'success' && 'text-status-success',
          tone === 'danger' && 'text-status-error',
          tone === 'info' && 'text-brand-primary',
        )}
      >
        {value}
      </Typography>
      {hint && (
        <Typography variant="tiny" tone="muted" className="mt-mx-tiny block">
          {hint}
        </Typography>
      )}
    </div>
  )
}

function TimeField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string
  value: string | null
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div>
      <Typography variant="caption" tone="muted" className="mb-mx-tiny block">
        {label}
      </Typography>
      <Input type="time" value={value ? value.slice(0, 5) : ''} onChange={event => onChange(event.target.value)} disabled={disabled} />
    </div>
  )
}

function PercentageField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string
  value: number | null
  disabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <div>
      <Typography variant="caption" tone="muted" className="mb-mx-tiny block">
        {label}
      </Typography>
      <Input
        type="number"
        min={0}
        max={100}
        step={1}
        value={value ?? ''}
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
        placeholder="0"
      />
    </div>
  )
}

function LabeledArea({ label, value, onChange }: { label: string; value: string | null; onChange: (value: string) => void }) {
  return (
    <div>
      <Typography variant="caption" tone="muted" className="mb-mx-tiny block">
        {label}
      </Typography>
      <Textarea value={value ?? ''} onChange={event => onChange(event.target.value)} placeholder="Descreva seu objetivo..." />
    </div>
  )
}

function MixBar({ label, value }: { label: string; value: number | null }) {
  const percentage = value ?? 0

  return (
    <div>
      <div className="mb-mx-tiny flex items-center justify-between gap-mx-sm">
        <Typography variant="caption" tone="muted">
          {label}
        </Typography>
        <Typography variant="caption" className="font-bold">
          {value === null ? 'Auto' : `${percentage}%`}
        </Typography>
      </div>
      <div className="h-2 rounded-full bg-surface-alt">
        <div className="h-2 rounded-full bg-brand-primary" style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} />
      </div>
    </div>
  )
}

function Notice({ children, tone, icon }: { children: ReactNode; tone: 'info' | 'warning' | 'success'; icon?: ReactNode }) {
  return (
    <div
      className={cn(
        'mt-mx-md flex items-start gap-mx-sm rounded-mx-lg border p-mx-sm text-sm font-semibold',
        tone === 'info' && 'border-status-info/20 bg-status-info-surface text-text-secondary',
        tone === 'warning' && 'border-status-warning/30 bg-status-warning/10 text-text-primary',
        tone === 'success' && 'border-status-success/20 bg-status-success/5 text-status-success',
      )}
    >
      <span className="mt-0.5 shrink-0">{icon || <Link2 size={16} />}</span>
      <span>{children}</span>
    </div>
  )
}

function ValueLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-mx-md border-b border-border-subtle py-mx-xs last:border-b-0">
      <Typography variant="caption" tone="muted">
        {label}
      </Typography>
      <Typography variant="p" className={cn('font-bold', strong && 'text-status-success')}>
        {value}
      </Typography>
    </div>
  )
}

function RadioOption({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string
  checked: boolean
  disabled?: boolean
  onChange: () => void
}) {
  return (
    <label className={cn('flex items-center gap-mx-sm rounded-mx-lg border border-border-subtle bg-surface-alt p-mx-sm text-sm font-semibold', disabled && 'opacity-60')}>
      <input type="radio" name="carreira-interesse" checked={checked} disabled={disabled} onChange={onChange} className="h-mx-sm w-mx-sm accent-brand-secondary" />
      <span>{label}</span>
    </label>
  )
}

function numberOrNull(value: string) {
  const numberValue = Number(value)
  return value === '' || !Number.isFinite(numberValue) ? null : Math.max(0, numberValue)
}

function formatDate(value?: string | null) {
  if (!value) return 'Não informada'
  return new Date(value).toLocaleDateString('pt-BR')
}

function formatYears(value: number | null) {
  if (value === null) return 'Não informado'
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} anos`
}

function formatSalaryRange(min: number | null, max: number | null) {
  if (min === null && max === null) return ''
  if (min !== null && max !== null) return `${BRL(min)} - ${BRL(max)}`
  return BRL(min ?? max ?? 0)
}

export default MeuPerfilVendedor
