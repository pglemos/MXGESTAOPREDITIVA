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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-mx-lg overflow-hidden" role="dialog" aria-modal="true">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
            className="absolute inset-0 bg-surface-alt/80 backdrop-blur-md" 
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 40 }} 
            className="w-full max-w-6xl relative z-10"
          >
            <div className="relative w-full bg-white/90 backdrop-blur-2xl border border-border-default rounded-mx-4xl shadow-mx-elite overflow-hidden">
              <div className="absolute top-mx-0 left-mx-0 w-full h-mx-xs bg-gradient-to-r from-brand-primary/50 via-brand-primary to-brand-primary/50" />
            
              <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row max-h-[85vh] w-full overflow-hidden">
                {/* Sidebar Context */}
                <div className="w-full lg:w-[320px] shrink-0 bg-surface-alt/50 border-b lg:border-b-0 lg:border-r border-border-default p-mx-lg flex flex-col justify-between relative overflow-y-auto lg:overflow-hidden">
                    <div className="space-y-mx-lg relative z-10">
                        <div className="w-mx-20 h-mx-20 rounded-mx-3xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shadow-mx-md">
                            <UserPlus size={40} strokeWidth={1.5} />
                        </div>
                        <div className="space-y-mx-xs">
                            <Typography variant="h2" className="text-3xl font-black uppercase tracking-tighter">Novo <span className="text-brand-primary">Recruta</span></Typography>
                            <Typography variant="tiny" tone="muted" className="uppercase tracking-mx-widest font-black leading-relaxed">Registro de novo especialista para o ecossistema de performance MX.</Typography>
                        </div>

                        <div className="space-y-mx-md pt-mx-lg">
                            <div className="flex items-center gap-mx-sm">
                                <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-brand-primary shadow-mx-sm"><ShieldCheck size={20} /></div>
                                <Typography variant="tiny" tone="muted" className="uppercase font-black tracking-mx-widest text-mx-nano">Acesso Instantâneo</Typography>
                            </div>
                            <div className="flex items-center gap-mx-sm">
                                <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-brand-primary shadow-mx-sm"><Sparkles size={20} /></div>
                                <Typography variant="tiny" tone="muted" className="uppercase font-black tracking-mx-widest text-mx-nano">Lançamento Diário Habilitado</Typography>
                            </div>
                            <div className="flex items-center gap-mx-sm">
                                <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-status-warning shadow-mx-sm"><Zap size={20} /></div>
                                <Typography variant="tiny" tone="muted" className="uppercase font-black tracking-mx-widest text-mx-nano">Forçar Nova Senha</Typography>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 pt-mx-lg">
                        <button type="button" onClick={onClose} className="group flex items-center gap-mx-sm text-text-tertiary hover:text-brand-primary transition-colors">
                            <X size={20} />
                            <Typography variant="tiny" className="font-black tracking-mx-widest">CANCELAR</Typography>
                        </button>
                    </div>
                </div>

                {/* Main Form Fields */}
                <div className="flex-1 p-mx-lg lg:p-mx-xl space-y-mx-xl bg-white overflow-y-auto max-h-[85vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg">
                        {/* Nome */}
                        <div className="space-y-mx-xs">
                          <Typography variant="tiny" tone="muted" className="px-1 font-black uppercase tracking-mx-widest truncate">Identidade do Especialista</Typography>
                          <div className="relative group">
                            <User size={18} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                            <input 
                              required placeholder="NOME COMPLETO" 
                              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                              className="w-full h-mx-14 pl-12 pr-mx-md bg-surface-alt border border-border-default rounded-mx-xl text-text-primary font-black uppercase tracking-mx-widest text-xs focus:outline-none focus:border-brand-primary/50 focus:bg-white transition-all placeholder:text-text-tertiary/50"
                            />
                          </div>
                        </div>

                        {/* Telefone */}
                        <div className="space-y-mx-xs">
                          <Typography variant="tiny" tone="muted" className="px-1 font-black uppercase tracking-mx-widest">Canal de Contato (WhatsApp)</Typography>
                          <div className="relative group">
                            <Phone size={18} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                            <input 
                              required placeholder="(00) 00000-0000" 
                              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                              className="w-full h-mx-14 pl-12 pr-mx-md bg-surface-alt border border-border-default rounded-mx-xl text-text-primary font-bold focus:outline-none focus:border-brand-primary/50 focus:bg-white transition-all placeholder:text-text-tertiary/50"
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-mx-xs">
                          <Typography variant="tiny" tone="muted" className="px-1 font-black uppercase tracking-mx-widest">Endereço de Acesso (E-mail)</Typography>
                          <div className="relative group">
                            <Mail size={18} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                            <input 
                              required type="email" placeholder="USUARIO@MX PERFORMANCE.COM" 
                              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                              className="w-full h-mx-14 pl-12 pr-mx-md bg-surface-alt border border-border-default rounded-mx-xl text-text-primary font-bold focus:outline-none focus:border-brand-primary/50 focus:bg-white transition-all placeholder:text-text-tertiary/50"
                            />
                          </div>
                        </div>

                        {/* Senha */}
                        <div className="space-y-mx-xs">
                          <Typography variant="tiny" tone="muted" className="px-1 font-black uppercase tracking-mx-widest truncate">Credencial Provisória</Typography>
                          <div className="relative group">
                            <Lock size={18} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                            <input 
                              type="password" placeholder="MIN. 6 CARACTERES" 
                              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                              className="w-full h-mx-14 pl-12 pr-mx-md bg-surface-alt border border-border-default rounded-mx-xl text-text-primary font-bold focus:outline-none focus:border-brand-primary/50 focus:bg-white transition-all placeholder:text-text-tertiary/50"
                            />
                          </div>
                        </div>

                        {/* Hierarquia */}
                        <div className="space-y-mx-xs">
                          <Typography variant="tiny" tone="muted" className="px-1 font-black uppercase tracking-mx-widest">Nível de Autoridade</Typography>
                          <div className="relative group">
                            <Shield size={18} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors z-10 pointer-events-none" />
                            <select 
                              value={formData.role} 
                              onChange={e => setFormData({...formData, role: e.target.value})}
                              className="w-full h-mx-14 pl-12 pr-mx-md bg-surface-alt border border-border-default rounded-mx-xl text-text-primary font-black uppercase tracking-mx-widest text-mx-nano focus:outline-none focus:border-brand-primary/50 focus:bg-white transition-all appearance-none cursor-pointer"
                            >
                              {allowedRoles.map(role => (
                                <option key={role} value={role} className="bg-white text-text-primary">{role.toUpperCase()}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Unidade */}
                        <div className="space-y-mx-xs">
                          <Typography variant="tiny" tone="muted" className="px-1 font-black uppercase tracking-mx-widest">Alocação Operacional</Typography>
                          <div className="relative group">
                            <Building2 size={18} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors z-10 pointer-events-none" />
                            <select 
                              value={formData.store_id} 
                              onChange={e => setFormData({...formData, store_id: e.target.value})}
                              disabled={(!!initialStoreId && initialStoreId !== 'all') && currentUserRole !== 'admin'}
                              className="w-full h-mx-14 pl-12 pr-mx-md bg-surface-alt border border-border-default rounded-mx-xl text-text-primary font-black uppercase tracking-mx-widest text-mx-nano focus:outline-none focus:border-brand-primary/50 focus:bg-white transition-all appearance-none cursor-pointer disabled:opacity-40"
                            >
                              <option value="" className="bg-white text-text-tertiary/40">SELECIONE A UNIDADE</option>
                              {stores?.map(store => (
                                <option key={store.id} value={store.id} className="bg-white text-text-primary">{store.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                    </div>

                    <div className="pt-mx-md">
                        <button 
                            type="submit" disabled={loading} 
                            className="w-full h-mx-20 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-mx-3xl font-black uppercase tracking-mx-widest text-sm shadow-mx-lg active:scale-[0.98] transition-all flex items-center justify-center gap-mx-sm relative overflow-hidden group/btn"
                        >
                            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500 skew-x-12" />
                            {loading ? <RefreshCw className="animate-spin" /> : <Zap size={24} className="fill-white" />}
                            CONSOLIDAR REGISTRO
                        </button>
                        <Typography variant="tiny" tone="muted" className="mt-mx-md text-center uppercase font-black tracking-mx-widest opacity-40">
                            Ao confirmar, o sistema gerará as chaves de acesso e iniciará o protocolo de segurança.
                        </Typography>
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
