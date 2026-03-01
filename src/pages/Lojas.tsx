import { useStores } from '@/hooks/useTeam'
import { useState } from 'react'
import { toast } from 'sonner'
import { Store, Plus, X, Save, Edit2 } from 'lucide-react'
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
        toast.success('Loja criada!')
        setShowForm(false); setName(''); setEmail('')
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 text-sm font-bold tracking-widest uppercase">Carregando lojas...</p>
        </div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative">

            {/* Top Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 w-full shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-[28px] font-extrabold tracking-tight text-[#1A1D20]">Lojas da Rede</h1>
                    <span className="bg-white border border-gray-100 text-xs font-bold px-3 py-1 rounded-full text-gray-500">{stores.length} Unidades</span>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#1A1D20] text-white font-bold hover:bg-black transition-all shadow-md active:scale-95 text-sm"
                    >
                        <Plus size={18} /> Cadastrar Loja
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        className="overflow-hidden shrink-0"
                    >
                        <form onSubmit={handleCreate} className="inner-card p-8 space-y-6 relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl z-0" />

                            <div className="flex items-center justify-between relative z-10 mb-6">
                                <div>
                                    <h3 className="text-xl font-extrabold text-[#1A1D20]">Nova Loja</h3>
                                    <p className="text-gray-500 text-sm font-medium mt-1">Preencha os dados básicos da nova unidade.</p>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 relative z-10">
                                <div>
                                    <label className="block text-sm font-bold text-[#1A1D20] mb-2 ml-1">Nome da unidade</label>
                                    <input
                                        value={name} onChange={e => setName(e.target.value)}
                                        placeholder="Ex: Filial Centro" required autoFocus
                                        className="w-full px-5 py-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl text-base font-medium text-[#1A1D20] placeholder:text-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#1A1D20] mb-2 ml-1">E-mail corporativo (Gerente)</label>
                                    <input
                                        value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="gerente@loja.com" type="email"
                                        className="w-full px-5 py-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl text-base font-medium text-[#1A1D20] placeholder:text-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 relative z-10 flex justify-end">
                                <button
                                    type="submit" disabled={saving}
                                    className="w-full md:w-auto px-8 py-4 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50 active:scale-95"
                                >
                                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> Salvar Cadastro</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 shrink-0 pb-10">
                {stores.map((s, i) => (
                    <motion.div
                        key={s.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-[2rem] p-6 flex flex-col justify-between group h-full relative overflow-hidden"
                    >
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-gray-50 rounded-full blur-2xl group-hover:bg-blue-50/50 transition-colors" />

                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <div className="w-12 h-12 rounded-full bg-[#F8FAFC] flex items-center justify-center group-hover:bg-white border border-gray-100 group-hover:shadow-sm transition-all text-[#1A1D20] font-bold">
                                {s.name.charAt(0)}
                            </div>
                            <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full border ${s.active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                {s.active ? 'Ativa' : 'Inativa'}
                            </span>
                        </div>

                        <div className="relative z-10 flex-1">
                            <h3 className="text-lg font-extrabold text-[#1A1D20] mb-1 leading-tight">{s.name}</h3>
                            {s.manager_email ? (
                                <p className="text-gray-500 text-sm font-medium pr-4 truncate">{s.manager_email}</p>
                            ) : (
                                <p className="text-gray-400 text-xs font-semibold italic">Sem e-mail cadastrado</p>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 relative z-10 flex justify-end">
                            <button className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                                <Edit2 size={14} />
                            </button>
                        </div>
                    </motion.div>
                ))}

                {stores.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center inner-card flex flex-col items-center justify-center border-dashed">
                        <Store size={48} className="text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-[#1A1D20] mb-2">Nenhuma loja cadastrada</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">Cadastre sua primeira loja utilizando o botão no topo da página.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
