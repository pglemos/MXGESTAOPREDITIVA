import { useStores } from '@/hooks/useTeam'
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Store, Plus, X, Save, Edit2, Mail, MapPin, Building2, ChevronRight, Globe, Zap, ArrowRight, Activity, ShieldCheck, Database, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { z } from 'zod'
import { cn } from '@/lib/utils'

const storeSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('E-mail inválido').or(z.literal(''))
})

export default function Lojas() {
    const { stores, loading, createStore, updateStore } = useStores()
    const [showForm, setShowForm] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [saving, setSaving] = useState(false)
    const [formErrors, setFormErrors] = useState<{name?: string, email?: string}>({})

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormErrors({})
        
        const result = storeSchema.safeParse({ name, email })
        if (!result.success) {
            const errors = result.error.flatten().fieldErrors
            setFormErrors({
                name: errors.name?.[0],
                email: errors.email?.[0]
            })
            return
        }

        setSaving(true)
        const { error } = await createStore(name, email)
        setSaving(false)
        
        if (error) { 
            toast.error(`Erro ao implantar node: ${error}`)
            return 
        }
        
        toast.success('Unidade operacional ativada no cluster!')
        setShowForm(false)
        setName('')
        setEmail('')
    }

    const filteredStores = useMemo(() => {
        return stores.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.manager_email && s.manager_email.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    }, [stores, searchTerm])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-electric-blue/10 border-t-electric-blue rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Escaneando topologia da rede...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-10 md:gap-14 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">
            {/* Header / Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Gestão de Unidades
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">Cluster Status • {stores.length} Nodes Online</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                    <div className="relative w-full sm:w-64 group">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-electric-blue transition-colors" />
                        <input 
                            type="text"
                            placeholder="Buscar Node..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-full pl-11 pr-4 py-3 text-xs font-bold focus:outline-none focus:border-electric-blue/30 focus:shadow-lg transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-pure-black text-white font-black hover:bg-black hover:shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-electric-blue/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Novo Node
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="shrink-0 z-50 rounded-[2.5rem] p-1 bg-gradient-to-b from-indigo-50 to-white shadow-3xl mb-6"
                    >
                        <form onSubmit={handleCreate} className="inner-card p-6 sm:p-8 md:p-12 space-y-10 relative overflow-hidden bg-white border-none">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(79,70,229,0.03)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />

                            <div className="flex items-center justify-between border-b border-gray-50 pb-8 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-pure-black text-white flex items-center justify-center shadow-2xl transform rotate-2">
                                        <Database size={24} className="fill-white/10" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-pure-black tracking-tighter leading-none mb-2">Implantar Novo Node</h3>
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Registro na Topologia da Rede</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 hover:rotate-90 transition-all active:scale-90">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-10 relative z-10">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                                        <Building2 size={12} /> Nome da Unidade
                                    </label>
                                    <input
                                        value={name} onChange={e => setName(e.target.value)}
                                        placeholder="Ex: MX Campinas Sul" required autoFocus
                                        className={cn(
                                            "premium-input !rounded-[1.5rem]",
                                            formErrors.name && "border-red-500 bg-red-50/10"
                                        )}
                                    />
                                    {formErrors.name && <p className="text-[10px] text-red-500 font-bold ml-2 uppercase tracking-wider">{formErrors.name}</p>}
                                </div>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                                        <ShieldCheck size={12} /> E-mail do Administrador
                                    </label>
                                    <input
                                        value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="admin@unidade.mx" type="email"
                                        className={cn(
                                            "premium-input !rounded-[1.5rem]",
                                            formErrors.email && "border-red-500 bg-red-50/10"
                                        )}
                                    />
                                    {formErrors.email && <p className="text-[10px] text-red-500 font-bold ml-2 uppercase tracking-wider">{formErrors.email}</p>}
                                </div>
                            </div>

                            <div className="pt-8 relative z-10 flex justify-end gap-4 border-t border-gray-50">
                                <button
                                    type="submit" disabled={saving}
                                    className="w-full sm:w-auto px-12 py-5 rounded-full bg-electric-blue text-white font-black flex items-center justify-center gap-3 hover:bg-indigo-700 hover:shadow-elevation transition-all disabled:opacity-50 active:scale-95 text-[10px] uppercase tracking-[0.3em] group/btn"
                                >
                                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <>Confirmar Implantação <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" /></>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-6 pb-24 shrink-0 md:grid-cols-2 md:gap-8 xl:grid-cols-3">
                {filteredStores.map((s, i) => (
                    <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white border border-gray-100 shadow-sm rounded-[2.2rem] p-8 flex flex-col justify-between group h-full relative overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all"
                    >
                        <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-gradient-to-br from-indigo-50/50 to-transparent rounded-full blur-[60px] -mr-24 -mt-24 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start justify-between mb-10 relative z-10">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-pure-black group-hover:text-white shadow-inner transition-all text-pure-black font-black text-2xl group-hover:rotate-6 group-hover:scale-110">
                                {s.name.charAt(0)}
                            </div>
                            <span className={cn(
                                "flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full border transition-colors",
                                s.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                            )}>
                                <div className={cn("w-1.5 h-1.5 rounded-full", s.active ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                                {s.active ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>

                        <div className="relative z-10 flex-1 mb-10">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 opacity-60">System Node ID</p>
                            <h3 className="text-2xl font-black text-pure-black tracking-tighter leading-tight group-hover:text-electric-blue transition-colors line-clamp-2">{s.name}</h3>

                            <div className="flex flex-col gap-3 mt-8">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-50 group-hover:bg-white group-hover:border-indigo-100 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-electric-blue shadow-sm">
                                        <Mail size={16} />
                                    </div>
                                    <div className="flex flex-col overflow-hidden min-w-0">
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">Admin Email</span>
                                        <span className="text-xs font-bold text-pure-black truncate">{s.manager_email || 'Não Atribuído'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity size={14} className="text-electric-blue" />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Monitoramento Ativo</span>
                            </div>
                            <Link to={`/loja?id=${s.id}`} className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 hover:text-white hover:bg-pure-black hover:shadow-xl transition-all">
                                <ChevronRight size={20} />
                            </Link>
                        </div>
                    </motion.div>
                ))}

                {filteredStores.length === 0 && !loading && (
                    <div className="col-span-full py-32 rounded-[4rem] text-center border-dashed border-2 border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />
                        <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500">
                            <Building2 size={40} className="text-gray-200" />
                        </div>
                        <h3 className="text-3xl font-black text-pure-black mb-4 tracking-tighter">Nenhuma Unidade Encontrada</h3>
                        <p className="text-gray-400 text-sm font-bold opacity-80 max-w-sm mx-auto mb-8">
                            A busca por "{searchTerm}" não retornou nodes ativos na topologia atual.
                        </p>
                        <button onClick={() => {setSearchTerm(''); setShowForm(true)}} className="px-10 py-4 bg-pure-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:shadow-3xl transition-all active:scale-95">
                            Resetar e Criar Node
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
