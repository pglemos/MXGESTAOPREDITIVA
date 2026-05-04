import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Activity, ArrowRight, Building2, CheckCircle2, Clock, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { getSupabaseFunctionUrl } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type PublicStore = {
  id: string
  name: string
  legal_name?: string | null
  cnpj?: string | null
  address?: string | null
}

type FormState = {
  full_name: string
  email: string
  phone: string
  role: 'vendedor' | 'gerente' | 'dono'
  segment: string
  store_tenure: string
  market_experience: string
  notes: string
}

const initialForm: FormState = {
  full_name: '',
  email: '',
  phone: '',
  role: 'vendedor',
  segment: 'Automotivo',
  store_tenure: '',
  market_experience: '',
  notes: '',
}

const roleOptions = [
  { value: 'vendedor', label: 'Vendedor', description: 'Atendimento, prospecção e vendas' },
  { value: 'gerente', label: 'Gerente', description: 'Rotina, metas e acompanhamento' },
  { value: 'dono', label: 'Dono / Sócio', description: 'Governança e decisão da loja' },
] as const

const tenureOptions = ['Menos de 3 meses', '3 a 6 meses', '6 meses a 1 ano', '1 a 2 anos', 'Mais de 2 anos']
const marketOptions = ['Primeira experiência', 'Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', 'Mais de 5 anos']

export default function StorePreRegistration() {
  const { storeSlug } = useParams()
  const [store, setStore] = useState<PublicStore | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const functionUrl = useMemo(() => getSupabaseFunctionUrl('store-pre-registration'), [])
  const completion = useMemo(() => {
    const fields = [form.full_name, form.email, form.phone, form.role, form.segment, form.store_tenure, form.market_experience]
    const filled = fields.filter(Boolean).length
    return Math.round((filled / fields.length) * 100)
  }, [form])

  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${functionUrl}?store_slug=${encodeURIComponent(storeSlug || '')}`)
        const payload = await response.json()
        if (!response.ok || !payload.success) throw new Error(payload.error || 'Loja não localizada.')
        setStore(payload.store)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível carregar esta loja.')
      } finally {
        setLoading(false)
      }
    }

    fetchStore()
  }, [functionUrl, storeSlug])

  const updateForm = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!store) return

    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: store.id,
          ...form,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Falha ao enviar cadastro.')
      setSuccess(true)
      setForm(initialForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o pré-cadastro.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen mx-pre-bg text-white overflow-hidden relative">
      <div className="absolute inset-0 mx-pre-glow" />
      <div className="absolute inset-0 mx-pre-grid" />

      <section className="relative z-10 w-full max-w-7xl mx-auto px-mx-md sm:px-mx-lg py-mx-lg sm:py-mx-10">
        <header className="flex items-center justify-between gap-mx-sm">
          <div className="flex items-center gap-mx-sm min-w-0">
            <div className="h-mx-11 w-mx-11 rounded-mx-lg border border-white/10 mx-pre-logo-tile flex items-center justify-center shadow-mx-glow-brand">
              <img src="/landing/logo-mx.png" alt="MX" className="h-mx-8 w-mx-8 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black tracking-mx-wider uppercase">MX Performance</p>
              <p className="text-mx-tiny font-black tracking-mx-wide uppercase text-white/40 truncate">Pré-cadastro de equipe</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-mx-xs rounded-full border border-brand-primary/30 bg-brand-primary/10 px-mx-sm py-mx-xs text-mx-tiny font-black tracking-mx-wide uppercase text-brand-primary">
            <span className="h-mx-xs w-mx-xs rounded-full bg-brand-primary shadow-mx-glow-brand" />
            Link oficial
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-mx-lg lg:gap-mx-xl items-start pt-mx-14 lg:pt-mx-20">
          <aside className="lg:sticky lg:top-10">
            <div className="space-y-mx-lg">
              <div className="space-y-mx-md">
                <div className="inline-flex items-center gap-mx-sm text-mx-tiny font-black tracking-mx-wider uppercase text-brand-primary">
                  <span className="block w-mx-12 h-px bg-brand-primary shadow-mx-glow-brand" />
                  Sincronização operacional
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.9]">
                  Cadastro da equipe da loja.
                </h1>
                <p className="max-w-xl text-base sm:text-lg leading-8 text-white/62 font-medium">
                  Preencha seus dados para a MX validar o vínculo da loja, corrigir o escopo de equipe e preparar a sincronização no sistema de performance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-mx-sm">
                {[
                  { icon: Building2, label: 'Loja identificada', value: loading ? 'Carregando' : store?.name || 'Link indisponível' },
                  { icon: ShieldCheck, label: 'Dados protegidos', value: 'Revisão interna MX' },
                  { icon: Clock, label: 'Tempo médio', value: '2 minutos' },
                ].map(item => (
                  <div key={item.label} className="rounded-mx-2xl border border-white/10 mx-pre-info-card p-mx-sm backdrop-blur-xl">
                    <item.icon size={18} className="text-brand-primary mb-mx-sm" />
                    <p className="text-mx-tiny font-black uppercase tracking-mx-wide text-white/35">{item.label}</p>
                    <p className="mt-1 text-sm font-black uppercase tracking-tight text-white truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mx-pre-signal-panel">
                <div className="flex items-center justify-between gap-mx-md">
                  <div>
                    <p className="text-mx-tiny font-black uppercase tracking-mx-wide text-white/35">Progresso do cadastro</p>
                    <p className="mt-1 text-2xl font-black tabular-nums">{completion}%</p>
                  </div>
                  <div className="h-mx-12 w-mx-12 rounded-mx-2xl border border-brand-primary/20 bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                    <Activity size={22} />
                  </div>
                </div>
                <div className="mt-mx-sm h-mx-xs rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-brand-primary rounded-full shadow-mx-glow-brand"
                    initial={false}
                    animate={{ width: `${completion}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  />
                </div>
              </div>
            </div>
          </aside>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
            className="rounded-mx-3xl border border-white/10 bg-white/[0.97] text-text-primary shadow-mx-elite overflow-hidden"
          >
            <div className="border-b border-border-default bg-surface-alt p-mx-md sm:p-mx-lg">
              <div className="flex items-start gap-mx-sm">
                <motion.div
                  whileHover={{ rotate: -2, scale: 1.03 }}
                  className="h-mx-12 w-mx-12 rounded-mx-2xl bg-brand-primary text-white flex items-center justify-center shadow-mx-glow-brand shrink-0"
                >
                  <UserRound size={24} />
                </motion.div>
                <div className="min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Pré-cadastro</h2>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-text-tertiary uppercase tracking-widest">
                    {loading ? 'Validando link da loja' : store ? store.name : 'Loja não encontrada'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-mx-md sm:p-mx-lg">
              {loading ? (
                <div className="min-h-mx-96 flex items-center justify-center">
                  <div className="h-mx-12 w-mx-12 rounded-full border-4 border-brand-primary/10 border-t-brand-primary animate-spin" />
                </div>
              ) : success ? (
                <div className="min-h-mx-96 flex flex-col items-center justify-center text-center gap-mx-md">
                  <div className="h-mx-20 w-mx-20 rounded-mx-3xl bg-status-success-surface text-status-success flex items-center justify-center">
                    <CheckCircle2 size={42} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight">Cadastro recebido</h2>
                    <p className="mt-3 max-w-md text-sm font-bold text-text-tertiary leading-6">
                      Seus dados já entraram na fila da loja {store?.name}. A equipe MX fará a conferência antes de sincronizar no sistema.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuccess(false)}
                    className="h-mx-12 px-mx-md rounded-mx-xl bg-mx-black text-white text-xs font-black uppercase tracking-widest"
                  >
                    Enviar outro cadastro
                  </button>
                </div>
              ) : error && !store ? (
                <div className="min-h-mx-96 flex flex-col items-center justify-center text-center gap-mx-sm">
                  <Building2 size={42} className="text-text-tertiary" />
                  <h2 className="text-2xl font-black uppercase">Link indisponível</h2>
                  <p className="max-w-md text-sm font-bold text-text-tertiary">{error}</p>
                </div>
              ) : (
                <motion.form
                  onSubmit={handleSubmit}
                  className="space-y-mx-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-sm">
                    <Field label="Nome completo" icon={UserRound}>
                      <input required value={form.full_name} onChange={event => updateForm('full_name', event.target.value.toUpperCase())} placeholder="NOME COMPLETO" className="mx-public-input" />
                    </Field>
                    <Field label="Telefone / WhatsApp" icon={Phone}>
                      <input required value={form.phone} onChange={event => updateForm('phone', event.target.value)} placeholder="(00) 00000-0000" className="mx-public-input" />
                    </Field>
                    <Field label="E-mail" icon={Mail}>
                      <input required type="email" value={form.email} onChange={event => updateForm('email', event.target.value)} placeholder="voce@email.com" className="mx-public-input" />
                    </Field>
                    <Field label="Loja" icon={Building2}>
                      <input readOnly value={store?.name || ''} className="mx-public-input bg-surface-alt text-text-tertiary" />
                    </Field>
                    <div>
                      <label className="mx-public-label">Segmento</label>
                      <input required value={form.segment} onChange={event => updateForm('segment', event.target.value)} placeholder="Automotivo" className="mx-public-input mt-2" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mx-public-label">Função</label>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-mx-xs">
                        {roleOptions.map(option => (
                          <motion.button
                            key={option.value}
                            type="button"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => updateForm('role', option.value)}
                            className={cn(
                              'mx-role-option',
                              form.role === option.value && 'mx-role-option-active'
                            )}
                          >
                            <span>{option.label}</span>
                            <small>{option.description}</small>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mx-public-label">Tempo na loja</label>
                      <select required value={form.store_tenure} onChange={event => updateForm('store_tenure', event.target.value)} className="mx-public-input mt-2">
                        <option value="">Selecione</option>
                        {tenureOptions.map(option => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mx-public-label">Experiência de mercado</label>
                      <select required value={form.market_experience} onChange={event => updateForm('market_experience', event.target.value)} className="mx-public-input mt-2">
                        <option value="">Selecione</option>
                        {marketOptions.map(option => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mx-public-label">Observações</label>
                    <textarea value={form.notes} onChange={event => updateForm('notes', event.target.value)} rows={4} placeholder="Alguma informação importante para a MX validar seu cadastro?" className="mx-public-input mt-2 min-h-28 resize-none py-4" />
                  </div>

                  {error && (
                    <div className="rounded-mx-xl border border-status-error/15 bg-status-error-surface p-mx-sm text-sm font-bold text-status-error">
                      {error}
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      'w-full h-mx-16 rounded-mx-2xl bg-brand-primary text-white shadow-mx-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-mx-sm transition-all',
                      'hover:bg-brand-primary-hover active:scale-[0.99] disabled:opacity-60'
                    )}
                  >
                    {submitting ? 'Enviando cadastro...' : 'Enviar pré-cadastro'}
                    <ArrowRight size={18} />
                  </motion.button>
                </motion.form>
              )}
            </div>
          </motion.section>
        </div>
      </section>
    </main>
  )
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <motion.div whileFocus={{ y: -1 }}>
      <label className="mx-public-label">{label}</label>
      <div className="relative mt-2">
        <Icon size={17} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
        <div className="mx-public-field-control">{children}</div>
      </div>
    </motion.div>
  )
}
