import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { UserPlus, Mail, Lock, User, Shield, Phone, X, RefreshCw, CheckCircle2, Building2, Zap, Sparkles, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface UserCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  registerUser: (data: any) => Promise<{ success?: boolean; error?: string }>
  storeId?: string
  stores?: any[]
}

export function UserCreationModal({ isOpen, onClose, onSuccess, registerUser, storeId: initialStoreId, stores }: UserCreationModalProps) {
  const { role: currentUserRole } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'vendedor',
    store_id: (initialStoreId === 'all' ? '' : initialStoreId) || '',
    phone: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.store_id) return toast.error('Selecione uma unidade operacional')
    
    setLoading(true)
    const { success, error } = await registerUser(formData)
    setLoading(true) // Keep it for a smooth transition if success
    
    if (success) {
      toast.success('NOVO RECRUTA INTEGRADO À TROPA!')
      setTimeout(() => {
        setLoading(false)
        onSuccess()
        onClose()
      }, 1000)
    } else {
      setLoading(false)
      toast.error(error || 'FALHA NA INTEGRAÇÃO DO RECRUTA')
    }
  }

  const allowedRoles = React.useMemo(() => {
    if (currentUserRole === 'admin') return ['admin', 'dono', 'gerente', 'vendedor']
    if (currentUserRole === 'dono') return ['gerente', 'vendedor']
    if (currentUserRole === 'gerente') return ['vendedor']
    return []
  }, [currentUserRole])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 overflow-hidden" role="dialog" aria-modal="true">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
            className="absolute inset-0 bg-[#050A09]/95 backdrop-blur-3xl" 
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 40 }} 
            className="w-full max-w-4xl relative z-10"
          >
            {/* Ambient Background Elements */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-mx-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-mx-elite overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-brand-primary via-mx-emerald-400 to-mx-blue-500 animate-pulse" />
              
              <form onSubmit={handleSubmit} className="flex flex-col md:flex-row min-h-[600px]">
                {/* Sidebar Context */}
                <div className="w-full md:w-80 bg-white/[0.02] border-r border-white/10 p-10 flex flex-col justify-between relative overflow-hidden">
                    <div className="space-y-8 relative z-10">
                        <div className="w-20 h-20 rounded-[30px] bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shadow-[0_0_40px_rgba(34,197,94,0.15)]">
                            <UserPlus size={40} strokeWidth={1.5} />
                        </div>
                        <div className="space-y-2">
                            <Typography variant="h2" className="text-3xl font-black uppercase tracking-tighter text-white">Novo <span className="text-brand-primary">Recruta</span></Typography>
                            <Typography variant="caption" className="text-white/30 uppercase tracking-[0.3em] font-black text-[10px] leading-relaxed">Registro de novo especialista para o ecossistema de performance MX.</Typography>
                        </div>

                        <div className="space-y-6 pt-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-primary"><ShieldCheck size={20} /></div>
                                <Typography variant="caption" className="text-white/60 uppercase font-black tracking-widest text-[9px]">Acesso Instantâneo</Typography>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-mx-blue-400"><Sparkles size={20} /></div>
                                <Typography variant="caption" className="text-white/60 uppercase font-black tracking-widest text-[9px]">Check-in Habilitado</Typography>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-status-warning"><Zap size={20} /></div>
                                <Typography variant="caption" className="text-white/60 uppercase font-black tracking-widest text-[9px]">Forçar Nova Senha</Typography>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 pt-10">
                        <button type="button" onClick={onClose} className="group flex items-center gap-3 text-white/20 hover:text-white transition-colors">
                            <X size={20} />
                            <span className="uppercase font-black tracking-[0.2em] text-[10px]">CANCELAR</span>
                        </button>
                    </div>
                </div>

                {/* Main Form Fields */}
                <div className="flex-1 p-10 space-y-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {/* Nome */}
                        <div className="space-y-3">
                          <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">Identidade do Especialista</label>
                          <div className="relative group">
                            <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                            <input 
                              required placeholder="NOME COMPLETO" 
                              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                              className="w-full h-16 pl-14 pr-6 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-xs focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-white/10"
                            />
                          </div>
                        </div>

                        {/* Telefone */}
                        <div className="space-y-3">
                          <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">Canal de Contato (WhatsApp)</label>
                          <div className="relative group">
                            <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                            <input 
                              required placeholder="(00) 00000-0000" 
                              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                              className="w-full h-16 pl-14 pr-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-white/10"
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-3">
                          <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">Endereço de Acesso (E-mail)</label>
                          <div className="relative group">
                            <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                            <input 
                              required type="email" placeholder="USUARIO@MX PERFORMANCE.COM" 
                              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                              className="w-full h-16 pl-14 pr-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-white/10"
                            />
                          </div>
                        </div>

                        {/* Senha */}
                        <div className="space-y-3">
                          <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">Credencial Provisória</label>
                          <div className="relative group">
                            <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                            <input 
                              type="password" placeholder="MIN. 6 CARACTERES" 
                              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                              className="w-full h-16 pl-14 pr-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-white/10"
                            />
                          </div>
                        </div>

                        {/* Hierarquia */}
                        <div className="space-y-3">
                          <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">Nível de Autoridade</label>
                          <div className="relative group">
                            <Shield size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors z-10 pointer-events-none" />
                            <select 
                              value={formData.role} 
                              onChange={e => setFormData({...formData, role: e.target.value})}
                              className="w-full h-16 pl-14 pr-6 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-[11px] focus:outline-none focus:border-brand-primary/50 transition-all appearance-none cursor-pointer"
                            >
                              {allowedRoles.map(role => (
                                <option key={role} value={role} className="bg-[#0A0A0B] text-white">{role}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Unidade */}
                        <div className="space-y-3">
                          <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">Alocação Operacional</label>
                          <div className="relative group">
                            <Building2 size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors z-10 pointer-events-none" />
                            <select 
                              value={formData.store_id} 
                              onChange={e => setFormData({...formData, store_id: e.target.value})}
                              disabled={(!!initialStoreId && initialStoreId !== 'all') && currentUserRole !== 'admin'}
                              className="w-full h-16 pl-14 pr-6 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-[11px] focus:outline-none focus:border-brand-primary/50 transition-all appearance-none cursor-pointer disabled:opacity-40"
                            >
                              <option value="" className="bg-[#0A0A0B] text-white/40">SELECIONE A UNIDADE</option>
                              {stores?.map(store => (
                                <option key={store.id} value={store.id} className="bg-[#0A0A0B] text-white">{store.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button 
                            type="submit" disabled={loading} 
                            className="w-full h-20 bg-brand-primary hover:bg-brand-primary-hover text-[#0A0A0B] rounded-[24px] font-black uppercase tracking-[0.3em] text-sm shadow-[0_20px_50px_rgba(34,197,94,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-4 relative overflow-hidden group/btn"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                            {loading ? <RefreshCw className="animate-spin" /> : <Zap size={24} className="fill-[#0A0A0B]" />}
                            CONSOLIDAR REGISTRO
                        </button>
                        <p className="mt-6 text-[10px] text-white/20 text-center uppercase font-black tracking-[0.1em]">
                            Ao confirmar, o sistema gerará as chaves de acesso e iniciará o protocolo de segurança.
                        </p>
                    </div>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
