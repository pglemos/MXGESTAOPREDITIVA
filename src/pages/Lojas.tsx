import { useStores } from '@/hooks/useTeam'
import { useState } from 'react'
import { toast } from 'sonner'
import { Store, Plus, X, Save, Edit2, Mail, MapPin, Building2, ChevronRight, Globe, Zap, ArrowRight, Activity, ShieldCheck, Database } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export default function Lojas() {
    const { stores, loading, createStore, updateStore } = useStores()
    const [showForm, setShowForm] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [saving, setSaving] = useState(false)

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return
        setSaving(true)
        const { error } = await createStore(name, email)
        setSaving(false)
        if (error) { toast.error(error); return }
        toast.success('Unidade operacional cadastrada com sucesso!')
        setShowForm(false); setName(''); setEmail('')
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Sincronizando Nodes...</p>
        </div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-10 md:gap-14 overflow-y-auto no-scrollbar relative text-[#1A1D20]">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-50 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Unidades Operacionais
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">System Database • {stores.length} Active Nodes</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-4 sm:px-8 py-3 sm:py-5 rounded-[2rem] bg-[#1A1D20] text-white font-black hover:bg-black hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-all active:scale-95 text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Implementar Node
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="shrink-0 z-50 rounded-[3rem] p-1 bg-gradient-to-b from-indigo-50 to-white shadow-2xl shadow-indigo-500/10 mb-6"
                    >
                        <form onSubmit={handleCreate} className="inner-card p-10 md:p-14 space-y-10 relative overflow-hidden bg-white border-none">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(79,70,229,0.03)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />
                            <div className="absolute -right-40 -top-40 w-96 h-96 bg-indigo-50 rounded-full blur-[100px] pointer-events-none" />

                            <div className="flex items-center justify-between relative z-10 border-b border-gray-50 pb-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[1.8rem] bg-[#1A1D20] text-white flex items-center justify-center shadow-2xl shadow-black/20 transform rotate-3">
                                        <Database size={28} className="fill-white/10" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-[#1A1D20] tracking-tighter leading-none mb-2">Novo Node</h3>
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Registro em Cluster</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="w-14 h-14 rounded-full bg-[#F8FAFC] border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-red-500 hover:border-red-100 hover:shadow-xl hover:rotate-90 transition-all active:scale-90">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-10 relative z-10">
                                <div className="space-y-4 group">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 group-focus-within:text-indigo-600 transition-colors">
                                        <Building2 size={12} /> Identificação do Node
                                    </label>
                                    <div className="relative">
                                        <input
                                            value={name} onChange={e => setName(e.target.value)}
                                            placeholder="Ex: Cluster ALFA-01" required autoFocus
                                            className="w-full pl-6 pr-6 py-5 bg-[#F8FAFC] border border-gray-100 rounded-[2rem] text-base font-black text-[#1A1D20] placeholder:text-gray-300 focus:outline-none focus:bg-white focus:border-indigo-400 focus:shadow-2xl focus:shadow-indigo-500/5 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4 group">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 group-focus-within:text-indigo-600 transition-colors">
                                        <ShieldCheck size={12} /> Admin Auth Email
                                    </label>
                                    <div className="relative">
                                        <input
                                            value={email} onChange={e => setEmail(e.target.value)}
                                            placeholder="admin@cluster.io" type="email"
                                            className="w-full pl-6 pr-6 py-5 bg-[#F8FAFC] border border-gray-100 rounded-[2rem] text-base font-black text-[#1A1D20] placeholder:text-gray-300 focus:outline-none focus:bg-white focus:border-indigo-400 focus:shadow-2xl focus:shadow-indigo-500/5 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 relative z-10 flex flex-col-reverse sm:flex-row justify-end gap-4 border-t border-gray-50">
                                <button
                                    type="button" onClick={() => setShowForm(false)}
                                    className="w-full sm:w-auto px-4 sm:px-10 py-3 sm:py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-400 hover:text-[#1A1D20] hover:bg-gray-50 transition-all"
                                >
                                    Abortar Registro
                                </button>
                                <button
                                    type="submit" disabled={saving}
                                    className="w-full sm:w-auto px-4 sm:px-12 py-3 sm:py-5 rounded-[2.5rem] bg-indigo-600 text-white font-black flex items-center justify-center gap-3 hover:bg-indigo-700 hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] transition-all disabled:opacity-50 active:scale-95 text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] group/btn"
                                >
                                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Implantar Node <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" /></>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 shrink-0 pb-20">
                {stores.map((s, i) => (
                    <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white border border-gray-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] rounded-[3rem] p-8 flex flex-col justify-between group h-full relative overflow-hidden hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all cursor-default"
                    >
                        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-gradient-to-br from-indigo-50 to-transparent rounded-full blur-[40px] -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start justify-between mb-10 relative z-10">
                            <div className="w-16 h-16 rounded-[1.8rem] bg-[#F8FAFC] border border-gray-100 flex items-center justify-center group-hover:bg-[#1A1D20] group-hover:text-white shadow-inner group-hover:shadow-xl transition-all text-[#1A1D20] font-black text-2xl group-hover:rotate-12 group-hover:scale-110">
                                {s.name.charAt(0)}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border ${s.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-red-50 text-red-600 border-red-100/50'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                    {s.active ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>

                        <div className="relative z-10 flex-1 mb-10">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 opacity-60">System Node ID</p>
                            <h3 className="text-3xl font-black text-[#1A1D20] mb-4 tracking-tighter leading-none group-hover:text-indigo-600 transition-colors line-clamp-2">{s.name}</h3>

                            <div className="flex flex-col gap-3 mt-6">
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-gray-100 group-hover:bg-white group-hover:border-indigo-100/50 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-indigo-400 shadow-sm">
                                        <Mail size={14} />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">Admin Route</span>
                                        <span className="text-xs font-bold text-[#1A1D20] truncate opacity-80">{s.manager_email || 'Unassigned'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Activity size={16} className="text-indigo-400 mix-blend-multiply" />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Active Monitoring</span>
                            </div>
                            <button className="flex items-center justify-center w-12 h-12 rounded-[1.2rem] bg-[#F8FAFC] border border-gray-100 text-gray-400 hover:text-white hover:bg-[#1A1D20] hover:shadow-xl hover:rotate-12 transition-all">
                                <Edit2 size={16} />
                            </button>
                        </div>
                    </motion.div>
                ))}

                {stores.length === 0 && !loading && (
                    <div className="col-span-full py-40 rounded-[4rem] text-center inner-card flex flex-col items-center justify-center border-dashed border-2 border-gray-200 bg-gray-50/50 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.03)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />
                        <div className="w-32 h-32 rounded-[3rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500">
                            <Database size={56} className="text-gray-200" />
                        </div>
                        <h3 className="text-4xl font-black text-[#1A1D20] mb-4 tracking-tighter">Database Empty</h3>
                        <p className="text-gray-400 text-sm font-bold opacity-80 max-w-md mx-auto">
                            Nenhuma unidade operacional encontrada na rede de cluster atual. Inicialize a rede configurando o primeiro node.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
